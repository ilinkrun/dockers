## _manager api

> http://1.231.118.217:20101/docs/

```sh
# 개발 모드 (자동 재시작)
cd /var/services/homes/jungsam/dockers/_manager && npm run dev:api

# 프로덕션 모드
cd /var/services/homes/jungsam/dockers/_manager && npm run build && npm run start:api
```

## _manager frontend

> http://1.231.118.217:20100

```sh
# 개발 모드
cd /var/services/homes/jungsam/dockers/_manager && npm run dev:web

# 프로덕션 모드
cd /var/services/homes/jungsam/dockers/_manager && npm run build && npm run start:web

```

===


/var/services/homes/jungsam/dockers/_manager 의 기능을
platform manager 에서 docker manager로 확장하려고 해요.
- /var/services/homes/jungsam/dockers/_manager/package.json 의 내용을 수정해주세요.
- web (http://1.231.118.217:20100/) 페이지의 메뉴를
  - Dashboard
  - Platforms
  - Networks
    - nginx
    - certbot
  - Servers
    - n8n
    - database
    - obsidian
    - wordpress
  - Repositories
    - github
    - local
  - Settings
    - Envs
    - Databases
    - Githubs
    - Templates
  - API Docs