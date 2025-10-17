## old

```sh
cd /volume1/docker/databases/mysql-ilmac && docker-compose up -d
```

## new

```sh
cd /var/services/homes/jungsam/dockers/databases/mysql-ilmac && docker-compose --env-file ../../.env --env-file .env up -d
```

===

`cd /var/services/homes/jungsam/dockers/databases/mysql-ilmac && docker-compose --env-file ../../.env --env-file .env up -d` 를 실행했더니, 아래와 같은 로그가 나왔어요.
- mysql_ilmac_phpmyadmin 컨테이너는 어디에 설정되어 있는건가요?
- '- ./init:/docker-entrypoint-initdb.d' 는 삭제해도 되나요?
- 'volumes:\n   mysql_data:\n    name: ilmac_mysql_data' 는 어떤 기능을 하나요? 삭제해도 되나요?
- 'networks:\n  mysql_network:\n    driver: bridge' 는 어떤 기능을 하나요? 삭제해도 되나요?

===

/var/services/homes/jungsam/dockers/databases/mysql-ilmac/docker-compose.yml 가 아래와 같이 현재 구동중인 mysql_ilmac_db 도커와 충돌이 나고 있는 것 같아요.
mysql_ilmac_db 와 별도로 구동하게 하려면?

sh-4.4$ cd /var/services/homes/jungsam/dockers/databases/mysql-ilmac && docker-compose --env-file ../../.env --env-file .env up -d
[+] Running 3/3
 ✔ Network mysql-ilmac_default  Created                                                                                               0.5s 
 ✔ Container mysql_ilmac_db     Recreated                                                                                             6.4s 
 ✔ Container ilmac_mysql        Started  



현재 별도로 구동 중인 mysql_ilmac_db, mysql_ilmac_phpmyadmin 도커가 있는데, 
/var/services/homes/jungsam/dockers/databases/mysql-ilmac/docker-compose.yml 를 up, down 할 때마다 충돌이 있는 것 같아요.


`docker-compose --env-file ../../.env --env-file .env down` 로 down 해야 하나요?

sh-4.4$ docker-compose down
WARN[0000] The "MYSQL_PORT" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_ROOT_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_USER" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_PASSWORD" variable is not set. Defaulting to a blank string. 
WARN[0000] The "MYSQL_DATABASE" variable is not set. Defaulting to a blank string. 
[+] Running 1/1
 ✔ Container mysql_ilmac_db  Removed


====


### mysql

```sh
# docker-compose up
cd /var/services/homes/jungsam/dockers/databases/mysql-ilmac && docker-compose --env-file ../../.env --env-file .env up -d


# docker-compose down
cd /var/services/homes/jungsam/dockers/databases/mysql-ilmac && docker-compose --env-file ../../.env --env-file .env down

# mysql 접속
mysql -h 1.231.118.217 -P 20201 -u root -p
# 비밀번호: mysqlIlmac1!
```

### postgresql

```sh
# docker-compose up
cd /var/services/homes/jungsam/dockers/databases/postgres-ilmac && docker-compose --env-file ../../.env --env-file .env up -d


# docker-compose down
cd /var/services/homes/jungsam/dockers/databases/postgres-ilmac && docker-compose --env-file ../../.env --env-file .env down
```


===

tableplus에서 mysql 도커를 구동하고, 아래의 설정으로 접속하면, Error 가 발생해요

> 설정
"""
Host: 1.231.118.217
Port: 20201
User: root
Password: ********
Database: Bid
"""


> Error
"""
Driver Error

Lost connection to MySQL server at 'reading initial communication packet', system errror: 0
"""

