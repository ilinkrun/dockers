# PORT 관리시스템 통합 가이드

## 개요

이 문서는 Platform Manager의 API, Web, Data에 PORT 관리시스템이 통합된 내용을 설명합니다.

## 변경 사항 요약

### 1. Data Schema 변경

#### platforms.json
```json
{
  "platforms": {
    "platform-id": {
      "id": "platform-id",
      "sn": 0,                    // ✅ 추가: Platform Serial Number
      "name": "platform-name",
      "basePort": 11000,          // ✅ 변경: 11000 + (sn * 200)
      ...
    }
  }
}
```

#### projects.json
```json
{
  "projects": {
    "project-id": {
      "id": "project-id",
      "sn": 0,                    // ✅ 추가: Project Serial Number
      "platformId": "platform-id",
      "ports": {
        "backend": 11001,         // ✅ 자동 계산됨
        "graphql": 11003,         // ✅ 자동 계산됨
        "frontendNextjs": 11006,  // ✅ 자동 계산됨
        "frontendSveltekit": 11007,
        "reserved": [11002, 11004, 11005, 11008, 11009]
      },
      ...
    }
  }
}
```

### 2. API 서비스 변경

#### 새로운 서비스: portService.ts

**위치**: `/var/services/homes/jungsam/dockers/_manager/api/src/services/portService.ts`

**주요 함수**:
```typescript
// 다음 사용 가능한 Platform SN 조회
getNextPlatformSn(): number

// 다음 사용 가능한 Project SN 조회 (platform별)
getNextProjectSn(platformId: string): number

// Platform port 할당 정보 계산
calculatePlatformPorts(platformSn: number): PlatformPortInfo

// Project port 할당 정보 계산
calculateProjectPorts(platformSn: number, projectSn: number): ProjectPortInfo

// Port 할당 검증
validatePortAllocation(platformSn: number, projectSn: number, offset: number)

// Project ports config 생성 (projects.json 형식으로 변환)
generateProjectPortsConfig(portInfo: ProjectPortInfo)
```

#### platformService.ts 변경

```typescript
// Before
const platform: Platform = {
  id: request.name,
  settings: {
    basePort: 8000,  // 고정값
    ...
  },
  ...
};

// After
const platformSn = getNextPlatformSn();
const portInfo = calculatePlatformPorts(platformSn);

const platform: Platform = {
  id: request.name,
  sn: platformSn,           // ✅ 추가
  settings: {
    basePort: portInfo.basePort,  // ✅ 자동 계산 (11000 + sn*200)
    ...
  },
  ...
};
```

#### projectService.ts 변경

```typescript
// Before
const ports = calculateProjectPorts(
  platform.settings.basePort,
  projectIndex,
  platform.settings.portIncrement
);

// After
const platformSn = platform.sn !== undefined ? platform.sn : 0;
const projectSn = getNextProjectSn(request.platformId);
const portInfo = calculatePortAllocation(platformSn, projectSn);
const ports = generateProjectPortsConfig(portInfo);

const project: Project = {
  id: request.name,
  sn: projectSn,  // ✅ 추가
  ...
};
```

### 3. TypeScript 타입 업데이트

#### API Types (`api/src/types/index.ts`)
```typescript
export interface Platform {
  id: string;
  sn?: number;  // ✅ 추가
  ...
}

export interface Project {
  id: string;
  sn?: number;  // ✅ 추가
  ...
}
```

#### Web Types (`web/src/lib/api.ts`)
```typescript
export interface Platform {
  id: string;
  sn?: number;  // ✅ 추가
  ...
}

export interface Project {
  id: string;
  sn?: number;  // ✅ 추가
  ...
}
```

## Port 할당 규칙

### Platform (200 ports)
- **Base Port**: `11000 + (platform_sn * 200)`
- **Range**: `basePort` ~ `basePort + 199`
- **최대 Platform 수**: 45개

**예시**:
- Platform SN 0: 11000 ~ 11199
- Platform SN 1: 11200 ~ 11399
- Platform SN 2: 11400 ~ 11599

### Project (20 ports)
- **Base Port**: `platform_basePort + (project_sn * 20)`
- **Range**: `basePort` ~ `basePort + 19`
- **최대 Project 수/Platform**: 10개

**Port 구조**:

#### PRODUCTION (Offsets 0-9)
| Offset | Port | 용도 | 변수명 |
|--------|------|------|--------|
| 0 | base+0 | SSH | `SSH_PORT_PROD` |
| 1 | base+1 | Backend (Node.js) | `backend` |
| 2 | base+2 | Backend (Python) | `reserved` |
| 3 | base+3 | API (GraphQL) | `graphql` |
| 4 | base+4 | API (REST) | `reserved` |
| 5 | base+5 | API (Reserved) | `reserved` |
| 6 | base+6 | Frontend (Next.js) | `frontendNextjs` |
| 7 | base+7 | Frontend (SvelteKit) | `frontendSveltekit` |
| 8 | base+8 | Frontend (Reserved) | `reserved` |
| 9 | base+9 | System Reserved | `reserved` |

#### DEVELOPMENT (Offsets 10-19)
- 동일 구조, offset +10

## API 사용 예시

### Platform 생성

**Request**:
```bash
POST /api/platforms
{
  "name": "ubuntu-test",
  "description": "Test Platform",
  "githubUser": "testuser"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "ubuntu-test",
    "sn": 2,
    "name": "ubuntu-test",
    "settings": {
      "basePort": 11400,
      ...
    },
    ...
  }
}
```

### Project 생성

**Request**:
```bash
POST /api/projects
{
  "name": "my-project",
  "platformId": "ubuntu-test",
  "description": "My Project",
  "githubUser": "testuser"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "my-project",
    "sn": 0,
    "platformId": "ubuntu-test",
    "ports": {
      "backend": 11401,
      "graphql": 11403,
      "frontendNextjs": 11406,
      "frontendSveltekit": 11407,
      "reserved": [11402, 11404, 11405, 11408, 11409]
    },
    ...
  }
}
```

## Web UI 표시

### Platform 목록
```tsx
<div>
  <h3>{platform.name}</h3>
  <p>Platform SN: {platform.sn}</p>
  <p>Base Port: {platform.settings.basePort}</p>
  <p>Port Range: {platform.settings.basePort} - {platform.settings.basePort + 199}</p>
</div>
```

### Project 목록
```tsx
<div>
  <h3>{project.name}</h3>
  <p>Project SN: {project.sn}</p>
  <p>Backend: {project.ports.backend}</p>
  <p>GraphQL: {project.ports.graphql}</p>
  <p>Next.js: {project.ports.frontendNextjs}</p>
</div>
```

## 기존 데이터 마이그레이션

### 자동 SN 할당
기존 platforms와 projects에 SN이 없는 경우:

```typescript
// platforms.json 업데이트
{
  "ubuntu-ilmac": {
    "sn": 0,  // 첫 번째 platform
    "basePort": 11000,
    ...
  },
  "ubuntu-jnj": {
    "sn": 1,  // 두 번째 platform
    "basePort": 11200,
    ...
  }
}

// projects.json 업데이트
{
  "ilmac-pro2": {
    "sn": 0,  // ubuntu-ilmac의 첫 번째 project
    "ports": {
      "backend": 11001,
      "graphql": 11003,
      ...
    }
  }
}
```

## 주의사항

1. **SN 필드는 필수**: 새로 생성되는 모든 platform과 project는 자동으로 SN이 할당됩니다.

2. **Port는 자동 계산**: `basePort`와 `ports` 값은 port-allocator.js를 통해 자동 계산되므로 수동으로 설정하지 마세요.

3. **기존 Port와의 충돌**: 기존에 수동으로 할당된 포트가 있다면 마이그레이션 시 충돌 확인이 필요합니다.

4. **Port Allocator 의존성**: API 서버에서 `/var/services/homes/jungsam/dockers/_scripts/port-allocator.js`에 접근 가능해야 합니다.

## 테스트

### Port Allocator 테스트
```bash
# Platform port 계산
node /var/services/homes/jungsam/dockers/_scripts/port-allocator.js platform 0

# Project port 계산
node /var/services/homes/jungsam/dockers/_scripts/port-allocator.js project 0 0

# Next SN 조회
node /var/services/homes/jungsam/dockers/_scripts/port-allocator.js next-platform /var/services/homes/jungsam/dockers/_manager/data/platforms.json
```

### API 테스트
```bash
# Platform 생성
curl -X POST http://localhost:20101/api/platforms \
  -H "Content-Type: application/json" \
  -d '{"name":"test-platform","githubUser":"testuser"}'

# Project 생성
curl -X POST http://localhost:20101/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"test-project","platformId":"test-platform","githubUser":"testuser"}'
```

## 관련 파일

### API
- `/var/services/homes/jungsam/dockers/_manager/api/src/services/portService.ts` - Port 서비스
- `/var/services/homes/jungsam/dockers/_manager/api/src/services/platformService.ts` - Platform 서비스
- `/var/services/homes/jungsam/dockers/_manager/api/src/services/projectService.ts` - Project 서비스
- `/var/services/homes/jungsam/dockers/_manager/api/src/types/index.ts` - TypeScript 타입

### Web
- `/var/services/homes/jungsam/dockers/_manager/web/src/lib/api.ts` - API 클라이언트 & 타입

### Data
- `/var/services/homes/jungsam/dockers/_manager/data/platforms.json` - Platform 데이터
- `/var/services/homes/jungsam/dockers/_manager/data/projects.json` - Project 데이터
- `/var/services/homes/jungsam/dockers/_manager/data/servers.json` - Server 데이터

### Scripts
- `/var/services/homes/jungsam/dockers/_scripts/port-allocator.js` - Port 계산 유틸리티

## 참고 문서

- [PORT 관리시스템.md](/var/services/homes/jungsam/dockers/jnj-ubuntu/projects/jnj-dev/docs/PORT%20관리시스템.md)
- [PORT 관리시스템_2.md](/var/services/homes/jungsam/dockers/jnj-ubuntu/projects/jnj-dev/docs/PORT%20관리시스템_2.md)
- [_scripts/README.md](/var/services/homes/jungsam/dockers/_scripts/README.md)
