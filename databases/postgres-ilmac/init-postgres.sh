#!/bin/bash

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# .env 파일이 존재하는지 확인하고 변수 설정
if [ -f ".env" ]; then
    echo -e "${YELLOW}.env 파일을 로드합니다...${NC}"
    set -a
    source .env
    set +a
else
    echo -e "${RED}.env 파일이 없습니다. 기본값을 사용합니다.${NC}"
    # 기본값 설정
    POSTGRES_CONTAINER_NAME="postgres_db"
    PGADMIN_CONTAINER_NAME="postgres_pgadmin"
    BASE_IP="localhost"
    POSTGRES_USER="admin"
    POSTGRES_PASSWORD="postgres"
    POSTGRES_DB="membership"
    POSTGRES_PORT="5433"
    PGADMIN_DEFAULT_EMAIL="admin@example.com"
    PGADMIN_DEFAULT_PASSWORD="admin"
    PGADMIN_PORT="5050"
fi

echo -e "${YELLOW}PostgreSQL 데이터베이스 설정을 시작합니다...${NC}"
echo -e "${YELLOW}컨테이너 이름: ${POSTGRES_CONTAINER_NAME}${NC}"

# 필요한 디렉토리 확인 및 생성
echo -e "${YELLOW}필요한 디렉토리를 확인하고 생성합니다...${NC}"
mkdir -p ${POSTGRES_DATA_DIR}
mkdir -p ${POSTGRES_DATA_DIR}/postgres/pgdata
mkdir -p ${POSTGRES_DATA_DIR}/pgadmin
mkdir -p ./init

# 권한 설정
echo -e "${YELLOW}디렉토리 권한을 설정합니다...${NC}"
chmod -R 777 ${POSTGRES_DATA_DIR}
chmod -R 777 ${POSTGRES_DATA_DIR}/postgres
chmod -R 777 ${POSTGRES_DATA_DIR}/postgres/pgdata
chmod -R 777 ./init

# 초기화 스크립트 생성
echo -e "${YELLOW}초기화 스크립트를 생성합니다...${NC}"

# UUID 확장 모듈 초기화 스크립트
cat > ./init/00-init-extensions.sql << 'EOF'
-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 전체 텍스트 검색 확장
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 인터네셔널라이제이션 설정
SET client_encoding = 'UTF8';
EOF

# 스크립트 파일 권한 설정
chmod 644 ./init/*.sql

# Dockerfile 생성 - seccomp 문제를 피하기 위해 단순화
echo -e "${YELLOW}Dockerfile을 생성합니다...${NC}"
cat > Dockerfile << 'EOF'
FROM postgres:14-alpine

# 기본 설정 최적화
COPY ./postgresql.conf /etc/postgresql/postgresql.conf

CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]
EOF

# PostgreSQL 설정 파일 생성
if [ ! -f "postgresql.conf" ]; then
    echo -e "${YELLOW}postgresql.conf 파일을 생성합니다.${NC}"
    cat > postgresql.conf << 'EOF'
# 기본 PostgreSQL 설정 파일

# 연결 설정
listen_addresses = '*'
max_connections = 100

# 메모리 설정
shared_buffers = 128MB
work_mem = 4MB
maintenance_work_mem = 64MB

# 로깅 설정
log_destination = 'stderr'
logging_collector = on
log_directory = 'pg_log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_statement = 'none'
log_min_error_statement = 'error'

# 성능 설정
effective_cache_size = 4GB
random_page_cost = 1.1
checkpoint_timeout = 5min
max_wal_size = 1GB
min_wal_size = 80MB

# 자동 VACUUM 설정
autovacuum = on
EOF
fi

# docker-compose.yml 파일 생성
echo -e "${YELLOW}docker-compose.yml 파일을 생성합니다...${NC}"
cat > docker-compose.yml << EOF
version: "3.8"

services:
  postgres:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ${POSTGRES_CONTAINER_NAME}
    restart: unless-stopped
    ports:
      - "${POSTGRES_PORT}:5432"
    volumes:
      - ${POSTGRES_DATA_DIR}/postgres:/var/lib/postgresql/data
      - ./init:/docker-entrypoint-initdb.d
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
      PGDATA: /var/lib/postgresql/data/pgdata
      TZ: "Asia/Seoul"
    # seccomp 설정 제거
    networks:
      - postgres_network

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: ${PGADMIN_CONTAINER_NAME}
    restart: unless-stopped
    ports:
      - "${PGADMIN_PORT}:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_DEFAULT_EMAIL}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_DEFAULT_PASSWORD}
    volumes:
      - ${POSTGRES_DATA_DIR}/pgadmin:/var/lib/pgadmin
    depends_on:
      - postgres
    networks:
      - postgres_network

networks:
  postgres_network:
    driver: bridge
EOF

# 기존 컨테이너 및 볼륨 제거
echo -e "${YELLOW}기존 컨테이너 및 볼륨을 제거합니다...${NC}"
docker-compose down -v

# Docker 볼륨 확인 및 제거
echo -e "${YELLOW}기존 Docker 볼륨을 확인하고 제거합니다...${NC}"
if docker volume ls -q | grep -q postgres; then
    docker volume rm $(docker volume ls -q | grep postgres) 2>/dev/null || true
fi

# 컨테이너 빌드 및 시작
echo -e "${YELLOW}Docker 컨테이너를 빌드하고 시작합니다...${NC}"
docker-compose up -d --build

# 상태 확인
echo -e "${YELLOW}컨테이너 상태를 확인합니다...${NC}"
docker-compose ps

# 데이터베이스 연결 확인
echo -e "${YELLOW}데이터베이스 연결을 확인합니다...${NC}"
echo -e "${YELLOW}${POSTGRES_WAIT_TIME}초 동안 기다립니다...${NC}"
sleep ${POSTGRES_WAIT_TIME} # 데이터베이스가 시작될 때까지 충분히 대기

# 컨테이너 ID로 접근
CONTAINER_ID=$(docker ps -qf "name=${POSTGRES_CONTAINER_NAME}")
if [ -z "$CONTAINER_ID" ]; then
    echo -e "${RED}컨테이너를 찾을 수 없습니다.${NC}"
    docker ps
    echo -e "${RED}컨테이너 로그를 확인합니다:${NC}"
    docker-compose logs postgres
    exit 1
fi

echo -e "${YELLOW}컨테이너 ID: ${CONTAINER_ID}${NC}"

# 컨테이너 ID를 사용하여 연결 확인
if docker exec "$CONTAINER_ID" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"; then
    echo -e "${GREEN}데이터베이스가 성공적으로 설정되었습니다!${NC}"
    
    echo -e "${GREEN}PgAdmin에 접속하려면 http://${BASE_IP}:${PGADMIN_PORT} 를 방문하세요.${NC}"
    echo -e "${GREEN}이메일: ${PGADMIN_DEFAULT_EMAIL}${NC}"
    echo -e "${GREEN}비밀번호: ${PGADMIN_DEFAULT_PASSWORD}${NC}"
    
    echo -e "${YELLOW}데이터베이스 연결 정보:${NC}"
    echo -e "${GREEN}호스트: ${BASE_IP}${NC}"
    echo -e "${GREEN}포트: ${POSTGRES_PORT}${NC}"
    echo -e "${GREEN}사용자: ${POSTGRES_USER}${NC}"
    echo -e "${GREEN}비밀번호: ${POSTGRES_PASSWORD}${NC}"
    echo -e "${GREEN}데이터베이스: ${POSTGRES_DB}${NC}"
else
    echo -e "${RED}데이터베이스 연결에 실패했습니다. 컨테이너 로그를 확인하세요:${NC}"
    docker logs "$CONTAINER_ID"
    
    # 컨테이너 상태 확인
    echo -e "${YELLOW}컨테이너 상태를 확인합니다:${NC}"
    docker inspect --format='{{.State.Status}}' "$CONTAINER_ID"
    
    # 재시작 시도
    echo -e "${YELLOW}컨테이너를 재시작합니다...${NC}"
    docker restart "$CONTAINER_ID"
    sleep 10
    
    # 재시작 후 연결 재시도
    if docker exec "$CONTAINER_ID" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"; then
        echo -e "${GREEN}재시작 후 데이터베이스가 성공적으로 연결되었습니다!${NC}"
    else
        echo -e "${RED}재시작 후에도 데이터베이스 연결에 실패했습니다.${NC}"
    fi
fi

echo -e "${GREEN}설정이 완료되었습니다!${NC}"
