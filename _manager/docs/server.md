
## docker manager
- docker(platforms, servers, networks) 관리

> web, api: `/var/services/homes/jungsam/dockers/_manager`


### api

> http://1.231.118.217:20101/doc/

```sh
# 개발 모드 (자동 재시작)
cd /var/services/homes/jungsam/dockers/_manager && npm run dev:api

# 프로덕션 모드
cd /var/services/homes/jungsam/dockers/_manager && npm run build && npm run start:api
```

### web

> http://1.231.118.217:20100

```sh
# 개발 모드
cd /var/services/homes/jungsam/dockers/_manager && npm run dev:web

# 프로덕션 모드
cd /var/services/homes/jungsam/dockers/_manager && npm run build && npm run start:web

```
