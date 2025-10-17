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
  - platform(ubuntu)
  - port
    - 총 500 개
      - 20000 + platform_sn * 500 ~ 20499 + platform_sn * 500
    - 공용: 100개
      - 20000 + platform_sn * 500 ~ 20099 + platform_sn * 500
      - ssh, database, n8n, blog(wordpress, nextjs, ...)
    - project: 10(프로젝트당 port 할당) * 40(최대 프로젝트 갯수)
      - 20100 + platform_sn * 500 + project_sn * 10 ~ 20199 + platform_sn * 500 + project_sn * 10
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