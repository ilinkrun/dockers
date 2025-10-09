# PORT 관리시스템 구현 완료

## ✅ 1. Port Allocator 유틸리티 생성

**파일**: `_scripts/port-allocator.js`

### 기능
- Platform 및 Project port 자동 계산
- 다음 사용 가능한 SN 조회
- .env 파일 자동 생성
- Port 할당 검증

## ✅ 2. cu.sh 스크립트 통합

**수정된 파일**: `cu.sh`

### 변경사항
- `get_platform_port_allocation()` 함수 추가
- 자동으로 다음 platform SN 계산
- Base port 자동 계산 (11000 + SN * 200)
- 환경변수에 `PLATFORM_SN`, `BASE_PLATFORM_PORT` 추가

## ✅ 3. .env.sample 템플릿 업데이트

**파일**: `_templates/docker/docker-ubuntu/.env.sample`

### 추가된 내용
- Port 할당 시스템 설명
- Platform base port 변수
- Project port 생성 가이드
- Legacy port 변수 주석 처리

## ✅ 4. 사용 가이드 문서

**파일**: `_scripts/README.md`

### 내용
- Port 할당 규칙 설명
- 모든 명령어 예제
- cu.sh 통합 방법
- 환경변수 명명 규칙
- 트러블슈팅 가이드

---

## 🔧 사용 방법

### Platform 생성 시 자동 적용

```bash
./cu.sh -n my-platform -u myuser -d "Platform Description"
```

### 자동으로 처리되는 사항

1. 다음 사용 가능한 Platform SN 조회 (예: 2)
2. Base port 계산 (예: 11400 = 11000 + 2*200)
3. .env 파일에 port 정보 자동 주입
4. 모든 템플릿 파일에 변수 치환

### Project Port 생성

```bash
# Project에 대한 port .env 생성
node _scripts/port-allocator.js generate-env 0 0 ubuntu-ilmac my-project > project.env
```

---

## 📊 Port 할당 예시

| Platform SN | Platform Base Port | Port Range | Projects |
|-------------|-------------------|------------|----------|
| 0 | 11000 | 11000-11199 | 0-9 (각 20 ports) |
| 1 | 11200 | 11200-11399 | 0-9 (각 20 ports) |
| 2 | 11400 | 11400-11599 | 0-9 (각 20 ports) |

### Project Port 구조 (20 ports)

- **PROD (0-9)**: SSH(0), BE-Node(1), BE-Python(2), API-GraphQL(3), API-REST(4), Reserved(5), FE-Next(6), FE-Svelte(7), Reserved(8-9)
- **DEV (10-19)**: 동일 구조 (+10 offset)

---

## 🎯 다음 단계 제안

1. **cp.sh 스크립트 업데이트** - Project 생성 시에도 port allocator 통합
2. **Manager API 연동** - platforms.json/projects.json에 sn 필드 자동 추가
3. **Docker Compose 템플릿 업데이트** - Port 변수 사용하도록 수정
4. **Port 사용 현황 모니터링** - 할당된 port 추적 기능