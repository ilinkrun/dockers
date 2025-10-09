# platform

## 플랫폼 생성

```sh
cd /var/services/homes/jungsam/dockers && ./cu.sh -u ilinkrun -n ubuntu-ilmac -d "ubuntu docker for ilmac on ilmac NAS"
```

## 플랫폼 삭제

### 저장소 삭제

```sh
# remote
cd /var/services/homes/jungsam/dockers/platforms && xgit -e del -u ilinkrun -n ubuntu-ilmac

# local
cd /var/services/homes/jungsam/dockers/platforms && rm -rf ubuntu-ilmac
# sudo chmod 777 -R /var/services/homes/jungsam/dockers

# remote, local
cd /var/services/homes/jungsam/dockers/platforms && xgit -e remove -u ilinkrun -n ubuntu-ilmac
```

### data 삭제

`/var/services/homes/jungsam/dockers/_manager/data/platforms.json`


# project

## 프로젝트 생성

```sh
cd /var/services/homes/jungsam/dockers/ubuntu-ilmac/projects && ./cp.sh -p ubuntu-ilmac -u ilinkrun -n ilmac-bid -d "ilmac bid project(입찰 관리 웹) for ilmac on ilmac NAS"
```

## 프로젝트 삭제

### 저장소 삭제

```sh
# remote
cd /var/services/homes/jungsam/dockers/platforms && xgit -e del -u ilinkrun -n ubuntu-ilmac

# local
cd /var/services/homes/jungsam/dockers/platforms && rm -rf ubuntu-ilmac
# sudo chmod 777 -R /var/services/homes/jungsam/dockers

# remote, local
cd /var/services/homes/jungsam/dockers/platforms && xgit -e remove -u ilinkrun -n ubuntu-ilmac
```