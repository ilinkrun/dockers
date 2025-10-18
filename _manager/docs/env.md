우분투 platform을 생성하는 ./cu.sh 파일에서 
템플릿 /var/services/homes/jungsam/dockers/_templates/docker/docker-ubuntu 를 복사하여, .env를 생성할 때, /var/services/homes/jungsam/dockers/_templates/docker/docker-ubuntu/.env.sample 를 복사하고,
- ${DEV_ROOT_PATH}, ${BASE_IP}, ... 와 같이 /var/services/homes/jungsam/dockers/.env 에 있는 값은 그 값으로 대체하고, 
- ${PLATFORM_PORT_START}, ${PLATFORM_PORT_END}, ${PLATFORM_SSH_PORT}, ... 와 같이 해당 플랫폼의 platform_sn 에 따라 /var/services/homes/jungsam/dockers/_manager/scripts/port-allocator.js 에서 변경되는 값들은 그에 해당하는 값들로 대체해주세요.