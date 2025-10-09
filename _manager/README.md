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
http://1.231.118.217:20100/platforms
에서 '프로젝트 생성' 버튼을 클릭하면 Create New Project 페이지에서 아래와 같은 에러가 발생해요.

"""
Command failed: cd /var/services/homes/jungsam/dockers/ubuntu-ilmac/projects && ./cp.sh -n ubuntu-prj-1 -u ilinkrun -d "ubuntu project 1" /bin/sh: line 0: cd: /var/services/homes/jungsam/dockers/ubuntu-ilmac/projects: No such file or directory
"""

- 프로젝트 생성시 url은 http://1.231.118.217:20100/platforms/[id]/projects/new 로 이동하는 건 어떤가요.

- 프로젝트 생성시 `cd /var/services/homes/jungsam/dockers/platforms/ubuntu-ilmac/projects` 가 되도록 해주세요. 현재는 '/dockers/ubuntu-ilmac'로 되어 있네요.
- `/var/services/homes/jungsam/dockers/_manager/web/src/app/projects` 페이지는 `/var/services/homes/jungsam/dockers/_manager/web/src/app/platforms/[id]` 하위로 이동하는 건 어떤가요?
 - project는 platform 하위에 있어요.


- 위의 요청을 완료할 때까지, 자동으로 디버깅하고 사용자에게 묻지 말고, 계속 진행해서 완료후 수정 내용을 알려주세요.


Command failed: cd /var/services/homes/jungsam/dockers/ubuntu-ilmac/projects && ./cp.sh -n ubuntu-prj-1 -u ilinkrun -d "ubuntu project 1" /bin/sh: line 0: cd: /var/services/homes/jungsam/dockers/ubuntu-ilmac/projects: No such file or directory

/var/services/homes/jungsam/dockers/platforms/ubuntu-ilmac/projects/cp.sh

/var/services/homes/jungsam/dockers/_manager 의 기능을
platform manager 에서 docker manager로 확장하려고 해요.

- /var/services/homes/jungsam/dockers/_manager/package.json 의 내용을 수정해주세요.
- web (http://1.231.118.217:20100/) 페이지의 메뉴를 아래와 같이 업데이트 해주세요.
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

- 현재 별도로 되어 있는 Projects 메뉴 및 project 목록, 상세 페이지, 프로젝트 생성 등은 Platforms 메뉴의 platform 목록에 'projects' 버튼을 누르면 드롭다운으로 프로로젝트 목록이 보이고 특정 프로젝트를 클릭하면 프로젝트 상세페이지가 나오고, 목록 위의 액션바에 '프로젝트 생성' 버튼이 있도록 해주세요.


===

Command failed: cd "/var/services/homes/jungsam/dockers/platforms/ubuntu-ilmac/projects" && ./cp.sh -n ubuntu-project-1 -u ilinkrun -d "ubuntu project 1"

===

/var/services/homes/jungsam/dockers/platforms/ubuntu-ilmac/projects/cp.sh 파일 수정

- -g 옵션 추가 
  - -g true => xgit 실행
    - /var/services/homes/jungsam/dockers/_manager/data/repositories.json 에서 github 목록에 추가
  - -g false => xgit 실행 안함
    - /var/services/homes/jungsam/dockers/_manager/data/repositories.json 에서 nogit 목록에 추가

- /var/services/homes/jungsam/dockers/_manager/data/projects.json에 아래와 같은 프로젝트 데이터 추가

  "projects": {
    "ubuntu-project-1": {
      "id": "ubuntu-project-1",
      "sn": 0,
      "name": "ubuntu-project-1",
      "platformId": "ubuntu-ilmac",
      "description": "ubuntu project 1",
      "githubUser": "ilinkrun",
      "createdAt": "2025-10-02T15:31:38.742Z",
      "updatedAt": "2025-10-02T15:31:38.742Z",
      "status": "development"
    }