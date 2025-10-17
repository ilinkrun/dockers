#!/bin/bash

set -e

# 스크립트 실행 디렉토리
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORKS_DIR="${SCRIPT_DIR}/networks"

# 환경 변수 로드
ENV_FILE="${SCRIPT_DIR}/.env"
if [ -f "$ENV_FILE" ]; then
    echo "Loading environment variables from ${ENV_FILE}"
    export $(grep -v '^#' "$ENV_FILE" | xargs)
else
    echo "Error: .env file not found at ${ENV_FILE}"
    exit 1
fi

# 필수 환경 변수 확인
required_vars=("NGINX_ROOT_PATH" "ADMIN_EMAIL" "BASE_IP")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: Required environment variable $var is not set"
        exit 1
    fi
done

# 설정 파일 경로
SUB_URLS_FILE="${NETWORKS_DIR}/settings/sub-urls.csv"
NGINX_CONF_DIR="${NGINX_ROOT_PATH}/conf.d"

echo "=== Domain Management Script ==="
echo "Sub URLs File: ${SUB_URLS_FILE}"
echo "Nginx Config Dir: ${NGINX_CONF_DIR}"
echo "Base IP: ${BASE_IP}"
echo "Admin Email: ${ADMIN_EMAIL}"
echo ""

# nginx 설정 파일 생성 함수
generate_nginx_config() {
    local domain="$1"
    local port="$2"
    local config_file="${NGINX_CONF_DIR}/${domain%.*}.conf"
    
    echo "Generating nginx config for ${domain}:${port} -> ${config_file}"
    
    cat > "$config_file" << EOF
# HTTP -> HTTPS 리다이렉트
server {
    listen 80;
    server_name ${domain};
    return 301 https://\$server_name\$request_uri;
}

# HTTPS 설정
server {
    listen 443 ssl;
    server_name ${domain};

    # SSL 인증서
    ssl_certificate /etc/nginx/ssl/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/live/${domain}/privkey.pem;

    # SSL 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS 설정
    add_header Strict-Transport-Security "max-age=31536000" always;

    # 프록시 설정
    location / {
        proxy_pass http://${BASE_IP}:${port};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_cache_bypass \$http_upgrade;
        
        # WebSocket 지원을 위한 타임아웃 설정
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        proxy_connect_timeout 86400;
    }
}
EOF
    
    echo "Generated: ${config_file}"
}

# SSL 인증서 생성 함수
create_ssl_certificate() {
    local domain="$1"
    
    echo "Checking SSL certificate for ${domain}..."
    
    # 인증서가 이미 존재하고 유효한지 확인
    if [ -f "${NGINX_ROOT_PATH}/ssl/live/${domain}/fullchain.pem" ]; then
        # 인증서 만료일 확인 (30일 이내면 갱신)
        expiry_date=$(openssl x509 -enddate -noout -in "${NGINX_ROOT_PATH}/ssl/live/${domain}/fullchain.pem" | cut -d= -f2)
        expiry_timestamp=$(date -d "$expiry_date" +%s)
        current_timestamp=$(date +%s)
        days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        if [ $days_until_expiry -gt 30 ]; then
            echo "SSL certificate for ${domain} is valid for ${days_until_expiry} days. Skipping."
            return 0
        else
            echo "SSL certificate for ${domain} expires in ${days_until_expiry} days. Renewing..."
        fi
    fi
    
    echo "Creating/renewing SSL certificate for ${domain}..."
    
    # nginx 컨테이너 임시 중지
    echo "Stopping nginx container..."
    docker stop nginx-proxy || true
    sleep 3
    
    # SSL 인증서 생성/갱신
    docker run --rm \
        -p 80:80 \
        -v "${NGINX_ROOT_PATH}/ssl:/etc/letsencrypt" \
        -v "${NGINX_ROOT_PATH}/ssl:/var/lib/letsencrypt" \
        certbot/certbot certonly \
        --standalone \
        --preferred-challenges http \
        --email "${ADMIN_EMAIL}" \
        --agree-tos \
        --no-eff-email \
        -d "${domain}" \
        --keep-until-expiring \
        --non-interactive
    
    if [ $? -eq 0 ]; then
        echo "SSL certificate successfully created/renewed for ${domain}"
    else
        echo "Failed to create SSL certificate for ${domain}"
        return 1
    fi
}

# 메인 로직
main() {
    if [ ! -f "$SUB_URLS_FILE" ]; then
        echo "Error: Sub URLs file not found: ${SUB_URLS_FILE}"
        exit 1
    fi
    
    echo "Processing domains from ${SUB_URLS_FILE}..."
    echo ""
    
    # 도메인별로 처리
    while IFS=',' read -r domain port || [[ -n "$domain" ]]; do
        # 주석이나 빈 줄 건너뛰기
        [[ "$domain" =~ ^#.*$ || -z "$domain" ]] && continue
        
        # 공백 제거
        domain=$(echo "$domain" | tr -d ' ')
        port=$(echo "$port" | tr -d ' ')
        
        if [ -z "$port" ]; then
            echo "Warning: No port specified for ${domain}. Skipping."
            continue
        fi
        
        echo "=== Processing ${domain}:${port} ==="
        
        # nginx 설정 파일 생성
        generate_nginx_config "$domain" "$port"
        
        # SSL 인증서 생성/갱신
        create_ssl_certificate "$domain"
        
        echo ""
    done < "$SUB_URLS_FILE"
    
    # nginx 설정 검증
    echo "Validating nginx configuration..."
    docker run --rm \
        -v "${NGINX_ROOT_PATH}/conf.d:/etc/nginx/conf.d:ro" \
        -v "${NGINX_ROOT_PATH}/ssl:/etc/nginx/ssl:ro" \
        nginx:latest nginx -t
    
    if [ $? -ne 0 ]; then
        echo "Error: nginx configuration validation failed!"
        exit 1
    fi
    
    # nginx 컨테이너 시작
    echo "Starting nginx container..."
    docker start nginx-proxy
    
    # 컨테이너 상태 확인
    sleep 5
    if docker ps | grep -q nginx-proxy; then
        echo "✅ nginx container is running successfully"
    else
        echo "❌ nginx container failed to start"
        docker logs nginx-proxy --tail 20
        exit 1
    fi
    
    echo ""
    echo "=== Domain Management Completed Successfully ==="
    echo "Processed domains:"
    while IFS=',' read -r domain port; do
        [[ "$domain" =~ ^#.*$ || -z "$domain" ]] && continue
        domain=$(echo "$domain" | tr -d ' ')
        port=$(echo "$port" | tr -d ' ')
        echo "  - https://${domain} -> ${BASE_IP}:${port}"
    done < "$SUB_URLS_FILE"
    
    echo ""
    echo "Next renewal check recommended in 60 days."
    echo "To run this script automatically, add it to cron:"
    echo "0 2 1 * * ${SCRIPT_DIR}/restart-domains.sh >> ${SCRIPT_DIR}/_logs/domain-management.log 2>&1"
}

# 스크립트 실행
main "$@"