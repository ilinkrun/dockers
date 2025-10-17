# MySQL 도커 설정 파일 변환

PostgreSQL 설정 파일들을 MySQL로 변환했습니다. 아래에 각 파일의 변환 내용을 제공합니다.

## `.env` 파일 (MySQL용)

```
# Docker 설정
MYSQL_CONTAINER_NAME=mysql_db
PHPMYADMIN_CONTAINER_NAME=mysql_phpmyadmin
BASE_IP=1.231.118.217

# MySQL 설정
MYSQL_USER=admin
MYSQL_PASSWORD=mysql
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=membership
MYSQL_PORT=3306
MYSQL_DATA_DIR=/volume1/homes/jungsam/Databases/mysql/data

# phpMyAdmin 설정
PHPMYADMIN_PORT=8080

# 애플리케이션 데이터베이스 URL (Prisma용)
DATABASE_URL=mysql://${MYSQL_USER}:${MYSQL_PASSWORD}@${BASE_IP}:${MYSQL_PORT}/${MYSQL_DATABASE}
```

## `init-mysql.sh` 스크립트

```bash
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
    MYSQL_CONTAINER_NAME="mysql_db"
    PHPMYADMIN_CONTAINER_NAME="mysql_phpmyadmin"
    BASE_IP="localhost"
    MYSQL_USER="admin"
    MYSQL_PASSWORD="mysql"
    MYSQL_ROOT_PASSWORD="rootpassword"
    MYSQL_DATABASE="membership"
    MYSQL_PORT="3306"
    PHPMYADMIN_PORT="8080"
fi

echo -e "${YELLOW}MySQL 데이터베이스 설정을 시작합니다...${NC}"
echo -e "${YELLOW}컨테이너 이름: ${MYSQL_CONTAINER_NAME}${NC}"

# 필요한 디렉토리 확인 및 생성
echo -e "${YELLOW}필요한 디렉토리를 확인하고 생성합니다...${NC}"
mkdir -p ${MYSQL_DATA_DIR}/mysql
mkdir -p ./init

# 권한 설정
echo -e "${YELLOW}디렉토리 권한을 설정합니다...${NC}"
chmod -R 777 ${MYSQL_DATA_DIR}
chmod -R 777 ${MYSQL_DATA_DIR}/mysql
chmod -R 777 ./init

# 초기화 스크립트 생성
echo -e "${YELLOW}초기화 스크립트를 생성합니다...${NC}"

# 초기화 SQL 스크립트 생성
cat > ./init/00-init-charset.sql << 'EOF'
-- 문자셋 설정
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
ALTER DATABASE /*!32312 IF NOT EXISTS*/ `membership` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 권한 설정
GRANT ALL PRIVILEGES ON *.* TO 'admin'@'%';
FLUSH PRIVILEGES;
EOF

# 스크립트 파일 권한 설정
chmod 644 ./init/*.sql

# Dockerfile 생성
echo -e "${YELLOW}Dockerfile을 생성합니다...${NC}"
cat > Dockerfile << 'EOF'
FROM mysql:8.0

# 기본 설정 최적화
COPY ./my.cnf /etc/mysql/conf.d/my.cnf

# 타임존 설정
ENV TZ=Asia/Seoul
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

CMD ["mysqld"]
EOF

# MySQL 설정 파일 생성
if [ ! -f "my.cnf" ]; then
    echo -e "${YELLOW}my.cnf 파일을 생성합니다.${NC}"
    cat > my.cnf << 'EOF'
[mysqld]
# 기본 MySQL 설정 파일

# 연결 설정
bind-address = 0.0.0.0
max_connections = 100

# 문자셋 설정
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# 메모리 설정
innodb_buffer_pool_size = 128M
join_buffer_size = 4M
sort_buffer_size = 4M

# 로깅 설정
log_error = /var/log/mysql/error.log
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2

# 성능 설정
innodb_flush_log_at_trx_commit = 2
innodb_log_buffer_size = 16M
innodb_log_file_size = 64M

# 자동 증가 설정
innodb_autoinc_lock_mode = 2

[client]
default-character-set = utf8mb4

[mysql]
default-character-set = utf8mb4
EOF
fi

# docker-compose.yml 파일 생성
echo -e "${YELLOW}docker-compose.yml 파일을 생성합니다...${NC}"
cat > docker-compose.yml << EOF
version: "3.8"

services:
  mysql:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ${MYSQL_CONTAINER_NAME}
    restart: unless-stopped
    ports:
      - "${MYSQL_PORT}:3306"
    volumes:
      - ${MYSQL_DATA_DIR}/mysql:/var/lib/mysql
      - ./init:/docker-entrypoint-initdb.d
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      TZ: "Asia/Seoul"
    networks:
      - mysql_network

  phpmyadmin:
    image: phpmyadmin/phpmyadmin:latest
    container_name: ${PHPMYADMIN_CONTAINER_NAME}
    restart: unless-stopped
    ports:
      - "${PHPMYADMIN_PORT}:80"
    environment:
      PMA_HOST: mysql
      PMA_PORT: 3306
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      UPLOAD_LIMIT: 300M
    depends_on:
      - mysql
    networks:
      - mysql_network

networks:
  mysql_network:
    driver: bridge
EOF

# 기존 컨테이너 및 볼륨 제거
echo -e "${YELLOW}기존 컨테이너 및 볼륨을 제거합니다...${NC}"
docker-compose down -v

# Docker 볼륨 확인 및 제거
echo -e "${YELLOW}기존 Docker 볼륨을 확인하고 제거합니다...${NC}"
if docker volume ls -q | grep -q mysql; then
    docker volume rm $(docker volume ls -q | grep mysql) 2>/dev/null || true
fi

# 컨테이너 빌드 및 시작
echo -e "${YELLOW}Docker 컨테이너를 빌드하고 시작합니다...${NC}"
docker-compose up -d --build

# 상태 확인
echo -e "${YELLOW}컨테이너 상태를 확인합니다...${NC}"
docker-compose ps

# 데이터베이스 연결 확인
echo -e "${YELLOW}데이터베이스 연결을 확인합니다...${NC}"
echo -e "${YELLOW}30초 동안 기다립니다...${NC}"
sleep 30 # 데이터베이스가 시작될 때까지 충분히 대기

# 컨테이너 ID로 접근
CONTAINER_ID=$(docker ps -qf "name=${MYSQL_CONTAINER_NAME}")
if [ -z "$CONTAINER_ID" ]; then
    echo -e "${RED}컨테이너를 찾을 수 없습니다.${NC}"
    docker ps
    echo -e "${RED}컨테이너 로그를 확인합니다:${NC}"
    docker-compose logs mysql
    exit 1
fi

echo -e "${YELLOW}컨테이너 ID: ${CONTAINER_ID}${NC}"

# 컨테이너 ID를 사용하여 연결 확인
if docker exec "$CONTAINER_ID" mysqladmin -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" ping -h localhost | grep -q 'mysqld is alive'; then
    echo -e "${GREEN}데이터베이스가 성공적으로 설정되었습니다!${NC}"
    
    echo -e "${GREEN}phpMyAdmin에 접속하려면 http://${BASE_IP}:${PHPMYADMIN_PORT} 를 방문하세요.${NC}"
    echo -e "${GREEN}사용자: ${MYSQL_USER} 또는 root${NC}"
    echo -e "${GREEN}비밀번호: ${MYSQL_PASSWORD} 또는 ${MYSQL_ROOT_PASSWORD}${NC}"
    
    echo -e "${YELLOW}데이터베이스 연결 정보:${NC}"
    echo -e "${GREEN}호스트: ${BASE_IP}${NC}"
    echo -e "${GREEN}포트: ${MYSQL_PORT}${NC}"
    echo -e "${GREEN}사용자: ${MYSQL_USER}${NC}"
    echo -e "${GREEN}비밀번호: ${MYSQL_PASSWORD}${NC}"
    echo -e "${GREEN}데이터베이스: ${MYSQL_DATABASE}${NC}"
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
    if docker exec "$CONTAINER_ID" mysqladmin -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" ping -h localhost | grep -q 'mysqld is alive'; then
        echo -e "${GREEN}재시작 후 데이터베이스가 성공적으로 연결되었습니다!${NC}"
    else
        echo -e "${RED}재시작 후에도 데이터베이스 연결에 실패했습니다.${NC}"
    fi
fi

echo -e "${GREEN}설정이 완료되었습니다!${NC}"
```

## **주요 변경사항:**

1. **환경 변수 및 컨테이너 이름**:
   - PostgreSQL 관련 이름과 변수를 MySQL 관련 이름으로 변경
   - `POSTGRES_USER` → `MYSQL_USER`
   - `PGADMIN` → `PHPMYADMIN`
   - 루트 비밀번호 추가 (`MYSQL_ROOT_PASSWORD`)

2. **포트 설정**:
   - MySQL 기본 포트 3306으로 변경
   - phpMyAdmin 포트 8080으로 설정

3. **초기화 스크립트**:
   - PostgreSQL 확장 모듈 대신 MySQL 문자셋 설정 스크립트 추가
   - UTF-8 문자셋 및 사용자 권한 설정 추가

4. **설정 파일**:
   - `postgresql.conf` 대신 `my.cnf` 파일 생성
   - MySQL에 맞는 최적화 설정으로 변경

5. **관리 도구**:
   - PgAdmin 대신 phpMyAdmin으로 변경
   - 연결 확인 방법을 MySQL 명령어(`mysqladmin`)로 변경

6. **Dockerfile**:
   - MySQL 8.0 이미지 사용
   - 타임존 설정 추가

이 파일들을 사용하여 MySQL 도커 환경을 설정하고 실행할 수 있습니다. 스크립트를 실행하면 MySQL 서버와 phpMyAdmin이 설치되고 구성됩니다.