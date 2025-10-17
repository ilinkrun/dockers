
해결 방법:

방법 1: 심볼릭 링크 (완전히 루트 .env 사용)

루트 .env의 값을 그대로 사용하려면:

```sh
cd /var/services/homes/jungsam/dockers/databases/mysql-ilmac
rm .env
ln -s ../../.env .env
```

하지만 이 경우 mysql-ilmac 전용 설정(MYSQL_CONTAINER_NAME, PHPMYADMIN_CONTAINER_NAME 등)이 사라집니다.

방법 2: 로컬 .env에서 루트 변수만 참조 (권장)

mysql-ilmac .env 파일에서 중복 변수를 제거하고, Docker Compose에서 루트 .env를 함께 로드:


```sh
docker-compose --env-file ../../.env --env-file .env up -d
```

## symbolic link
```sh
cd /var/services/homes/jungsam/dockers/_templates/docker/docker-ubuntu && ln -s /var/services/homes/jungsam/dockers/.env .env
```