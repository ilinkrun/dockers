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

/var/services/homes/jungsam/dockers/cu.sh 에 사용되는 SETTINGS_DIR, DOCKERS_SETTINGS_DIR 를 제거해도 ubuntu platform 을 생성하는데 문제가 없으면, 관련 내용들을 제거해주세요.

SETTINGS_DIR="$DOCKER_ROOT_PATH/_settings"
DOCKERS_SETTINGS_DIR="$SETTINGS_DIR/dockers"

```
/var/services/homes/jungsam/dockers/_settings
```


## version 관리

```sh
# create
cd /var/services/homes/jungsam/dockers && xgit -e make -u ilinkrun -n dockers -d "illmac dockers & docker manager in ilmac NAS"
```


```sh
# 원격 저장소 삭제
xgit -e del -u ilinkrun -n ubuntu-kmc

# 원격 & 로컬 저장소 삭제
cd /var/services/homes/jungsam/dockers/platforms && xgit -e remove -u ilinkrun -n ubuntu-kmc
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

- /var/services/homes/jungsam/dockers/cu.sh, /var/services/homes/jungsam/dockers/_templates/docker-ubuntu/projects/cp.sh 등에 하드코딩된 '/var/services/homes/jungsam/dockers' 를 /var/services/homes/jungsam/dockers/.env 에 있는 DOCKER_ROOT_PATH 값으로 대체되나요?

- cu.sh, cp.sh에서 .env에서 DOCKER_ROOT_PATH 를 읽어와서 /var/services/homes/jungsam/dockers 부분을 DOCKER_ROOT_PATH 로 치환할 수 없나요?

 /var/services/homes/jungsam/dockers/cu.sh 에서 템플릿 /var/services/homes/jungsam/dockers/_templates/docker-ubuntu 를 복사해서 넣는 디렉토리는 DOCKER_ROOT_PATH 가 아니라 DOCKER_ROOT_PATH/platforms입니다. 해당 내용을 수정해주세요.


 /var/services/homes/jungsam/dockers/_templates/docker-ubuntu/projects/cp.sh 에서도 DOCKER_ROOT_PATH/platforms/<platform_name>/projects

===


`cd /var/services/homes/jungsam/dockers && ./cu.sh -n ubuntu-ilmac -u ilinkrun -d "ilmac ubuntu docker server(개발 및 운영)"` 를 실행했을 때, github 저장소 정보를 `/var/services/homes/jungsam/dockers/_manager/data/repositories.json` 와 같이 추가하도록 ./cu.sh 또는 /var/services/homes/jungsam/dockers/_manager/scripts 폴더에 create-platform.js 를 생성하여 적용해주세요.


  작업 내용:

  1. ✅ /var/services/homes/jungsam/dockers/_manager/scripts/update-repositories.js 생성
    - GitHub 저장소 추가/제거 기능
    - Non-git 저장소 추가/제거 기능
    - repositories.json 자동 업데이트
  2. ✅ cu.sh에 통합
    - Step 6으로 update-repositories.js 호출 추가
    - Platform 생성 시 자동으로 repositories.json에 등록

  사용 예시:
  # Platform 생성 시 자동 등록됨
  cd /var/services/homes/jungsam/dockers
  ./cu.sh -n ubuntu-ilmac -u ilinkrun -d "ilmac ubuntu docker server(개발 및 운영)"

  결과:
  repositories.json에 자동으로 추가됩니다:
  {
    "github": {
      "ubuntu-ilmac": {
        "name": "ubuntu-ilmac",
        "scope": "platform",
        "user": "ilinkrun",
        "path": {
          "remote": "https://github.com/ilinkrun/ubuntu-ilmac",
          "local": "platforms/ubuntu-ilmac"
        },
        "description": "ilmac ubuntu docker server(개발 및 운영)",
        "temp": false
      }
    }
  }

  수동 사용:
  # GitHub 저장소 추가
  node _manager/scripts/update-repositories.js add-github ubuntu-test platform testuser "Description"
  platforms/ubuntu-test

  # 저장소 제거
  node _manager/scripts/update-repositories.js remove ubuntu-test

===

/var/services/homes/jungsam/dockers/remove-platform.sh 파일을 실행하면 생성된 플랫폼을 제거하도록 하는 스크립트을 만들어주세요.

syntax: ./remove-platform.sh -n [platform-name](예:ubuntu-ilmac) -r remote|local|all(default:remote)


0. platform data
- /var/services/homes/jungsam/dockers/_manager/data/repositories.json 에서 
  - [github-user]: github[platform-name][user]


1. 저장소 삭제
1-1. remote 저장소 삭제(-r 옵션: remote or all)
xgit -e del -n [platform-name] -u [github-user]

1-2. local 저장소 삭제(-r 옵션: local or all)
rm -rf /var/services/homes/jungsam/dockers/platforms/[platform-name]


2. data(json) 업데이트
- 저장소 데이터 삭제: /var/services/homes/jungsam/dockers/_manager/data/repositories.json
- platform 데어터 삭제: /var/services/homes/jungsam/dockers/_manager/data/platforms.json


## 사용례

```
cd /var/services/homes/jungsam/dockers && ./remove-platform.sh -n ubuntu-ilmac -r all
```

===

## docs
- 개발
  - github issue
Code
Issues
Pull requests
Actions
Projects
Wiki
Security
Insights
Settings

## 템플릿
_templates
  - ui
    - shadcn
      - page
      - template
      - component


===

### remove-project.sh

/var/services/homes/jungsam/dockers/remove-platform.sh 파일을 참고하여 /var/services/homes/jungsam/dockers/remove-project.sh 를 만들어주세요.

syntax: ./remove-project.sh -n [project-name](예:ubuntu-project-2) -r remote|local|all(default:remote)


0. platform data
- /var/services/homes/jungsam/dockers/_manager/data/repositories.json 에서 
  - [github-user]: github[project-name][user]
  - [local-path]: github[path][local]


1. 저장소 삭제
1-1. remote 저장소 삭제(-r 옵션: remote or all)
xgit -e del -n [project-name] -u [github-user]

1-2. local 저장소 삭제(-r 옵션: local or all)
rm -rf /var/services/homes/jungsam/dockers/[local-path]


2. data(json) 업데이트
- 저장소 데이터 삭제: /var/services/homes/jungsam/dockers/_manager/data/repositories.json
- project 데이터 삭제: /var/services/homes/jungsam/dockers/_manager/data/projects.json


### 사용례

```sh
cd /var/services/homes/jungsam/dockers && ./remove-project.sh -n ubuntu-project-2 -r all
```

===

### cp.sh


```sh
cd /var/services/homes/jungsam/dockers/platforms/ubuntu-ilmac/projects && ./cp.sh -p ubuntu-ilmac -n ubuntu-project-2 -u ilinkrun -d "ubuntu project 2"
```

`cd /var/services/homes/jungsam/dockers/platforms/ubuntu-ilmac/projects && ./cp.sh -p ubuntu-ilmac -n ubuntu-project-2 -u ilinkrun -d "ubuntu project 2"` 를 실행하였더니, 다른 기능들은 다 잘 되는데, /var/services/homes/jungsam/dockers/_manager/data/projects.json 에 프로젝트 정보가 추가되지 않아요.

===

## remove

```sh
# platform
cd /var/services/homes/jungsam/dockers && ./remove-platform.sh -n ubuntu-ilmac -r all

# project
cd /var/services/homes/jungsam/dockers && ./remove-project.sh -n ubuntu-project-2 -r all
cd /var/services/homes/jungsam/dockers && ./remove-project.sh -n ilmac-work-web -r all
```

===

## create platform & project
```sh
# platform
cd /var/services/homes/jungsam/dockers && ./cu.sh -n ubuntu-ilmac -u ilinkrun -d "ilmac ubuntu docker server(개발 및 운영)"

# project
cd /var/services/homes/jungsam/dockers/platforms/ubuntu-ilmac/projects && ./cp.sh -p ubuntu-ilmac -n ubuntu-project-1 -u ilinkrun -d "ilmac ubuntu project 1"

# 
cd /var/services/homes/jungsam/dockers/platforms/ubuntu-ilmac && docker-compose up -d

```