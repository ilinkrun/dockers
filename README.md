## migration

### 폴더, 파일 이동

```sh
cp -a /var/services/homes/jungsam/dockers/. /var/services/homes/jungsam/dockers/
```

## port 변경

`/var/services/homes/jungsam/dockers/.env` 사용

3000 => 20100
3001 => 20101

## node_modules 통합

### web, api
```sh
# web
cd /var/services/homes/jungsam/dockers/_manager
npm run dev:web

# api
cd /var/services/homes/jungsam/dockers/_manager
npm run dev:api

# 통합
cd /var/services/homes/jungsam/dockers/_manager
npm run dev
```

/var/services/homes/jungsam/dockers/_scripts 에 있는 내용들을 /var/services/homes/jungsam/dockers/_manager



## platform manager
- platform, project 관리(web)

> web,api: `/var/services/homes/jungsam/dockers/_manager`


### api

> http://1.231.118.217:3001/doc/

```sh
# 개발 모드 (자동 재시작)
cd /var/services/homes/jungsam/dockers/_manager/api && npm run dev

# 프로덕션 모드
cd /var/services/homes/jungsam/dockers/_manager/api && npm run build && npm run start
```

### web

> http://1.231.118.217:3000

```sh
# 개발 모드
cd /var/services/homes/jungsam/dockers/_manager/web && npm run dev

# 프로덕션 모드
cd /var/services/homes/jungsam/dockers/_manager/web && npm run build && npm run start

```

### _scripts

/var/services/homes/jungsam/dockers/_scripts 에 있는 script들을 /var/services/homes/jungsam/dockers/_manager/scripts로 이동하고, node_modules를 공통으로 사용하도록 하는 건 어떤가요?
_scripts에 있는 파일들은 /var/services/homes/jungsam/dockers/cu.sh, /var/services/homes/jungsam/dockers/_templates/docker-ubuntu/projects/cp.sh 에도 사용됩니다.


/var/services/homes/jungsam/dockers/cu.sh, /var/services/homes/jungsam/dockers/_templates/docker-ubuntu/projects/cp.sh 파일에 사용되는 SCRIPTS_DIR 변수만 수정하면 문제 없지 않나요?


/var/services/homes/jungsam/dockers/_manager/scripts/port-allocator.js 에 있는 아래의 const 값들을 /var/services/homes/jungsam/dockers/.env 에서 불러오도록 해주세요

const BASE_PLATFORMS_PORT = 11000;
const PORT_RANGE_END = 19999;
const PORTS_PER_PLATFORM = 200;
const PORTS_PER_PROJECT = 20;
const MAX_PLATFORMS = 45; // (19999 - 11000 + 1) / 200
const MAX_PROJECTS_PER_PLATFORM = 10; // 200 / 20


### _settings 제거 or 통합

/var/services/homes/jungsam/dockers/cu.sh 에 사용되는 SETTINGS_DIR, DOCKERS_SETTINGS_DIR

SETTINGS_DIR="$MY_ROOT_PATH/_settings"
DOCKERS_SETTINGS_DIR="$SETTINGS_DIR/dockers"

```
/var/services/homes/jungsam/dockers/_settings
```


## version 관리

```sh
# create
cd /var/services/homes/jungsam/dockers && xgit -e make -u ilinkrun -n dockers -d "illmac dockers & docker manager in ilmac NAS"
```


## create platform

```sh
# create utuntu platform
cd /var/services/homes/jungsam/dockers && ./cu.sh -n ubuntu-ilmac -u ilinkrun -d "ilmac ubuntu docker server(개발 및 운영)"
```

## create project

```sh
# create project
cd /var/services/homes/jungsam/dockers/ubuntu-ilmac/projects && ./cp.sh -n ilmac-work-web -u ilinkrun -d "ilmac 업무관리 웹앱"
```

===


```sh
mv /var/services/homes/jungsam/dockers/_settings /var/services/homes/jungsam/dockers/_settings
```

## create docker-platforms

```sh
cd /volume1/docker
xgit -e make -n docker-platforms -u ilinkrun -d "docker for platform on ilmac NAS"


```

- /var/services/homes/jungsam/dockers/cu.sh, /var/services/homes/jungsam/dockers/_templates/docker-ubuntu/projects/cp.sh 등에 하드코딩된 '/var/services/homes/jungsam/dockers' 를 /var/services/homes/jungsam/dockers/.env 에 있는 MY_ROOT_PATH 값으로 대체되나요?

- cu.sh, cp.sh에서 .env에서 MY_ROOT_PATH 를 읽어와서 /var/services/homes/jungsam/dockers 부분을 MY_ROOT_PATH 로 치환할 수 없나요?

 /var/services/homes/jungsam/dockers/cu.sh 에서 템플릿 /var/services/homes/jungsam/dockers/_templates/docker-ubuntu 를 복사해서 넣는 디렉토리는 MY_ROOT_PATH 가 아니라 MY_ROOT_PATH/platforms입니다. 해당 내용을 수정해주세요.


 /var/services/homes/jungsam/dockers/_templates/docker-ubuntu/projects/cp.sh 에서도 MY_ROOT_PATH/platforms/<platform_name>/projects

===


