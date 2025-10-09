> http://1.231.118.217:20100/platforms

Command failed: cd /var/services/homes/jungsam/dockers && ./cu.sh -n ubuntu-ilmac -u ilinkrun -d "ilmac ubuntu docker server(개발 및 운영)" /var/services/homes/jungsam/dockers/_settings/dockers/.env.ubuntu-ilmac: line 3: syntax error near unexpected token `(' /var/services/homes/jungsam/dockers/_settings/dockers/.env.ubuntu-ilmac: line 3: `PLATFORM_DESCRIPTION=ilmac ubuntu docker server(개발 및 운영)'

"""
Name *
ubuntu-ilmac
Description
ilmac ubuntu docker server(개발 및 운영)
GitHub User *

ilinkrun
Default Database Type *

PostgreSQL
PostgreSQL Database *

PostgreSQL Ilmac NAS
Host:1.231.118.217
Port:5433
Description:PostgreSQL on Ilmac NAS (Docker)
"""



 /var/services/homes/jungsam/dockers/cu.sh 를 실행했더니

Command failed: cd /var/services/homes/jungsam/dockers && ./cu.sh -n ubuntu-ilmac -u ilinkrun -d "ilmac ubuntu docker server(개발 및 운영)" /var/services/homes/jungsam/dockers/_settings/dockers/.env.ubuntu-ilmac: line 3: syntax error near unexpected token `(' /var/services/homes/jungsam/dockers/_settings/dockers/.env.ubuntu-ilmac: line 3: `PLATFORM_DESCRIPTION=ilmac ubuntu docker server(개발 및 운영)'

- /var/services/homes/jungsam/dockers 내에 있는 파일에 대해서만 오류를 수정해주세요

===
