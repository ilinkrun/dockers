## docker-compose.yml

```yml
    volumes:
      # n8n 데이터 디렉토리 영구 보존
      - n8n_data:/root/.n8n
      # # Node.js 글로벌 모듈 (선택사항)
      # - node_modules:/root/.nvm/versions/node/v22.19.0/lib/node_modules
```

```sh
cp -r /root/.n8n/. /exposed/configs/n8n_data/
```

## script

> `/root/start-n8n.sh`

```sh
#!/bin/bash

if ! command -v n8n &> /dev/null; then
    echo "Installing n8n..."
    npm install -g n8n
fi

# n8n 시작
echo "Starting n8n..."
cd /root/.n8n
n8n start
EOF

chmod +x /root/start-n8n.sh
```

===

- /var/services/homes/jungsam/dockers/platforms/ubuntu-ilmac/docker-compose.yml 는 우분투 도커이며, /var/services/homes/
  jungsam/dockers/platforms/ubuntu-ilmac/start-n8n.sh 는 도커 구동 이후에 n8n을 사용하기 위한 script입니다.
  그런데 docker-compose up -d 를 실행했을 때, start-n8n.sh 실행에서 에러가 발생하는 것인지 n8n이 설치도 되어 있지 않네요.