## root(NAS)
- _manager(docker) 
  - api
    - rest
    - graphql
  - web
  - port
    - 총 20개(29980 ~ 29999)
      - database
        - postgres: 29981
          - root_db(domains, platforms, servers, documents, users, ...)
      - backend
        - rest: 29986
        - graphql: 29987
      - frontend
        - nextjs: 29991

## domain
- 최상위 업무 영역별(사용자별 공적/사적 범위)로 구분(ilmac, jnj, sam, il, ...)
  - domain url(ilmaceng.com, ...)

platform에 할당되는 port
  - 전체 시작 port: 21000

  - platform(ubuntu)
    - platform_sn: 0, 1, 2, 3, ...
    - platform 당 총 200 개
      - 시작 port: 21000 + platform_sn * 200
      - 마지막 port: 21199 + platform_sn * 200

    - platform 공용: 20개
      - 시작 port: 21000 + platform_sn * 200
      - 마지막 port: 21019 + platform_sn * 200

      - ssh: 21000 + platform_sn * 200
      - database
        - mysql: 21000 + platform_sn * 200 + 1
        - postgres: 21000 + platform_sn * 200 + 2
      - backend
        - n8n: 21000 + platform_sn * 200 + 6
      - blog(wordpress): 
         - wp1: 21000 + platform_sn * 200 + 11
         - wp2: 21000 + platform_sn * 200 + 12
         - wp2: 21000 + platform_sn * 200 + 13
      - blog(nextjs): 
         - nx1: 21000 + platform_sn * 200 + 16
         - nx2: 21000 + platform_sn * 200 + 17

    - project: 10(프로젝트당 port 할당) * 18(최대 프로젝트 갯수)
      - project_sn: 0, 1, 2, 3, ...
      - 시작 port: 21020 + platform_sn * 200 + project_sn * 10
      - 마지막 port:  21029 + platform_sn * 200 + project_sn * 10

      - backend
         - nodejs: 시작 port + 0
         - python: 시작 port + 1
         - graphql: 시작 port + 2
         - rest: 시작 port + 3

      - frontend
         - nextjs: 시작 port + 5
         - sveltekit: 시작 port + 6

  - servers
    - database(mysql, postgres)
    - n8n
    - obsidian
    - blog
      - wordpress
      - nextjs
    - docs

## project
- domain 내의 업무 영역별  (ilmac-user, ilmac-bid, ilmac-work, ...)
  - database
    - <platform_name>_<project_name>_db
  - backend
    - graphql
  - frontend
    - nextjs
    - svelte
  - manual


===

```sh
# create ubuntu platform
cd /var/services/homes/jungsam/dockers && ./cu.sh -n ubuntu-jnj -u jnjsoftweb -d "ubuntu docker server for jnjsoft(개발 및 운영)"

# remove ubuntu platform
cd /var/services/homes/jungsam/dockers && ./remove-platform.sh -n ubuntu-jnj

```



```sh
sh-4.4$ cd /var/services/homes/jungsam/dockers && ./cu.sh -n ubuntu-jnj -u jnjsoftweb -d "ubuntu docker server for jnjsoft(개발 및 운영)"
Generating platform settings...
Calculating port allocation...
  ℹ New platform. Assigned SN: 2
  Base Port: 21400
  Port Range: 21400 - 21599
  Platform SN: 2
  Base Port: 21400
Creating new Ubuntu platform: ubuntu-jnj
GitHub user: jnjsoftweb
Description: ubuntu docker server for jnjsoft(개발 및 운영)
Target location: /var/services/homes/jungsam/dockers/platforms
Template directory: /var/services/homes/jungsam/dockers/_templates/docker/docker-ubuntu

Step 0: Creating target directory...
Created directory: /var/services/homes/jungsam/dockers/platforms/ubuntu-jnj

Step 1: Copying template contents...
cp: cannot open '/var/services/homes/jungsam/dockers/_templates/docker/docker-ubuntu/configs/n8n_data/config' for reading: Permission denied
```

```sh
sudo chmod -R 777 /var/services/homes/jungsam/dockers/_templates
```