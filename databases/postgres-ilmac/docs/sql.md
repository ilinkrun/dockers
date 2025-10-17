```prompt
postgreSQL에서
- NasData 디비 생성
- Bid 디비에 있는 테이블 전체를, NasData 디비로 이동
을 하려면?
```

PostgreSQL에서 데이터베이스를 생성하고 테이블을 이동하는 방법입니다:

1. NasData 데이터베이스 생성:
```sql
-- 새 데이터베이스 생성
CREATE DATABASE nasdata;
```

2. Bid 데이터베이스의 모든 테이블을 NasData로 복사:
```bash
# 전체 데이터베이스 덤프 생성
pg_dump -h localhost -U postgres bid > bid_backup.sql

# NasData 데이터베이스로 복원
psql -h localhost -U postgres nasdata < bid_backup.sql
```

또는 특정 테이블만 복사하려면:
```sql
-- Bid 데이터베이스에 접속한 상태에서
-- 테이블 목록 확인
\dt

-- NasData 데이터베이스로 테이블 복사
-- 각 테이블마다 실행
CREATE TABLE nasdata.테이블명 AS 
SELECT * FROM bid.테이블명;
```

더 자세한 명령어가 필요하다면:
```bash
# 데이터베이스 목록 확인
\l

# 현재 데이터베이스의 테이블 목록 확인
\dt

# 데이터베이스 전환
\c nasdata

# 테이블 구조 확인
\d 테이블명
```

권한 설정도 필요할 수 있습니다:
```sql
-- NasData 데이터베이스 권한 설정
GRANT ALL PRIVILEGES ON DATABASE nasdata TO 사용자명;

-- 모든 테이블에 대한 권한 설정
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO 사용자명;
```


===

네, TablePlus에서는 한 번에 하나의 데이터베이스에만 연결할 수 있고, 다른 데이터베이스의 테이블을 직접 조회할 수 없습니다.

대신 다음과 같이 작업할 수 있습니다:

1. 두 개의 연결 생성:
   - Bid 데이터베이스 연결
   - NasData 데이터베이스 연결

2. 데이터 복사 방법:
   - Bid 연결에서 테이블 선택
   - 우클릭 > Copy > SQL Create
   - NasData 연결로 전환
   - SQL 편집기에 붙여넣기 및 실행
   - 다시 Bid 연결로 돌아가서
   - 우클릭 > Copy > Insert Statement
   - NasData 연결로 전환하여 실행

또는 터미널에서 직접 복사:
```bash
# Docker 컨테이너 내의 PostgreSQL을 사용하는 경우
docker exec -it [컨테이너이름] pg_dump -U [사용자명] -t [테이블명] bid > table_backup.sql
docker exec -i [컨테이너이름] psql -U [사용자명] nasdata < table_backup.sql
```

예시:
```bash
# PostgreSQL 컨테이너 이름이 postgres인 경우
docker exec -it postgres pg_dump -U postgres -t directories bid > directories_backup.sql
docker exec -i postgres psql -U postgres nasdata < directories_backup.sql
```
