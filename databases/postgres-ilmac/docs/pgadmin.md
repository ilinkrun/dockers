- `http://1.231.118.217:5050/browser/`
- email: ilmacgogo@gmail.com
- password: "IlmacPost9)"







# PgAdmin에 PostgreSQL 서버 추가하기

PgAdmin에 로그인했을 때 서버가 보이지 않는 것은 정상입니다. PostgreSQL 서버를 PgAdmin에 수동으로 추가해야 합니다. 아래 단계를 따라 서버를 추가할 수 있습니다.

## PgAdmin에 PostgreSQL 서버 추가하는 방법

### 1. 서버 추가 시작

1. PgAdmin에 로그인한 후, 좌측 패널에서 **Servers**를 마우스 오른쪽 버튼으로 클릭합니다.
2. 드롭다운 메뉴에서 **Register** > **Server**를 선택합니다.

또는 상단 메뉴에서:
1. **Object** 메뉴를 클릭합니다.
2. **Register** > **Server**를 선택합니다.

### 2. 서버 정보 입력

**General** 탭에서:
- **Name**: `Membership DB` (또는 원하는 서버 이름)

**Connection** 탭에서:
- **Host name/address**: `membership_postgres` (Docker 네트워크 내부에서 사용) 또는 `localhost` (호스트에서 직접 접속할 경우)
- **Port**: `5432` (PostgreSQL 컨테이너 내부 포트)
- **Maintenance database**: `membership`
- **Username**: `admin` (`.env` 파일에 설정한 `POSTGRES_USER` 값)
- **Password**: `postgres` (`.env` 파일에 설정한 `POSTGRES_PASSWORD` 값)
- **Save password?**: 체크 (선택 사항)

### 3. 접속 문제 해결

만약 `membership_postgres`로 연결이 되지 않는다면, 다음 설정을 시도해 보세요:

1. **Host name/address**를 `localhost`로 변경하고 **Port**를 `5433`으로 설정합니다 (호스트 포트 매핑).

2. 또는 Docker 네트워크 IP 주소를 사용합니다:
   ```bash
   # PostgreSQL 컨테이너 IP 주소 확인
   docker inspect membership_postgres | grep IPAddress
   ```
   확인된 IP 주소를 **Host name/address**에 입력합니다.

### 4. PgAdmin 컨테이너 내에서 연결 문제

PgAdmin 컨테이너와 PostgreSQL 컨테이너가 같은 Docker 네트워크에 있더라도, PgAdmin이 PostgreSQL 서버를 자동으로 인식하지 않습니다. 이 문제를 해결하기 위해 docker-compose.yml 파일을 수정하여 PgAdmin에 서버 설정을 자동으로 추가할 수 있습니다:

```bash
# docker-compose.yml 파일 수정
cat > docker-compose.yml << 'EOF'
version: "3.8"

services:
  postgres:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: membership_postgres
    restart: unless-stopped
    ports:
      - "${POSTGRES_PORT}:5432"
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
      - ./init:/docker-entrypoint-initdb.d
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
      PGDATA: /var/lib/postgresql/data/pgdata
      TZ: "Asia/Seoul"
    security_opt:
      - seccomp:unconfined
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - membership_network

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: membership_pgadmin
    restart: unless-stopped
    ports:
      - "${PGADMIN_PORT}:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_DEFAULT_EMAIL}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_DEFAULT_PASSWORD}
      PGADMIN_SERVER_JSON_FILE: /pgadmin4/servers.json
    volumes:
      - ./data/pgadmin:/var/lib/pgadmin
      - ./pgadmin-servers.json:/pgadmin4/servers.json
    depends_on:
      - postgres
    networks:
      - membership_network

networks:
  membership_network:
    driver: bridge
EOF

# PgAdmin 서버 설정 파일 생성
cat > pgadmin-servers.json << 'EOF'
{
  "Servers": {
    "1": {
      "Name": "Membership DB",
      "Group": "Servers",
      "Host": "membership_postgres",
      "Port": 5432,
      "MaintenanceDB": "membership",
      "Username": "admin",
      "SSLMode": "prefer",
      "PassFile": "/pgpass"
    }
  }
}
EOF

# pgpass 파일 생성 (비밀번호를 저장하는 파일)
echo "membership_postgres:5432:membership:admin:postgres" > pgpass
chmod 600 pgpass

# 컨테이너 재시작
docker-compose down
docker-compose up -d
```

## 서버 추가 후 테이블 보기

서버가 성공적으로 추가되면:

1. 왼쪽 패널에서 서버를 확장합니다.
2. **Databases** > **membership** > **Schemas** > **public** > **Tables**로 이동합니다.
3. 여기서 생성된 모든 테이블을 볼 수 있습니다.

## 서버 연결 테스트

PgAdmin에서 서버에 연결할 수 없는 경우, 다음 명령어로 연결을 테스트해 볼 수 있습니다:

```bash
# PostgreSQL 컨테이너에서 psql 접속 테스트
docker exec -it membership_postgres psql -U admin -d membership -c "SELECT 1;"

# PostgreSQL 컨테이너 상태 확인
docker inspect membership_postgres | grep Status

# PostgreSQL 컨테이너 로그 확인
docker logs membership_postgres
```

## 네트워크 연결 테스트

PgAdmin 컨테이너에서 PostgreSQL 컨테이너로의 네트워크 연결을 테스트합니다:

```bash
# PgAdmin 컨테이너에서 PostgreSQL 컨테이너로 ping 테스트
docker exec -it membership_pgadmin ping membership_postgres

# PgAdmin 컨테이너에서 PostgreSQL 포트 연결 테스트
docker exec -it membership_pgadmin nc -zv membership_postgres 5432
```

## IP 주소로 연결

Docker 네트워크 내에서 컨테이너의 IP 주소를 확인하고 해당 IP를 사용하여 연결할 수도 있습니다:

```bash
# PostgreSQL 컨테이너 IP 주소 확인
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' membership_postgres
```

확인된 IP 주소를 PgAdmin의 서버 설정에서 **Host name/address**에 입력합니다.

이 단계를 따르면 PgAdmin에서 PostgreSQL 서버에 성공적으로 연결하고 데이터베이스 테이블을 볼 수 있습니다.