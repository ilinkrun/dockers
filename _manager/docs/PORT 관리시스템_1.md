# 보완된 Port 할당 규칙

## 1. 전체 Port 범위

- **총 9000개 port** (기존 8000개 → 9000개로 확대)
  - **11000 ~ 19999**
  - `BASE_PLATFORMS_PORT`: 11000
  - 최대 platform 수: 45개 (9000 / 200 = 45)

## 2. Platform 당 할당 (200개)

- Platform 생성 시 base_port 200씩 증가
  - Platform 0: 11000
  - Platform n: 11000 + (n × 200)
- 환경변수: `BASE_PLATFORM_PORT_<sn>`
- **platforms.json에 추가 필요 필드:**

```json
{
  "sn": 0,
  "basePort": 11000,
  "portRange": {
    "start": 11000,
    "end": 11199
  }
}
```

## 3. Project 당 할당 (20개)

- Project 생성 시 base_port 20씩 증가
  - Project 0: platform_base_port
  - Project n: platform_base_port + (n × 20)
- 환경변수: `BASE_PROJECT_PORT_<sn1>_<sn2>`
- 최대 project 수/platform: 10개 (200 / 20 = 10)
- **projects.json에 추가 필요 필드:**

```json
{
  "sn": 0,
  "platformSn": 3,
  "basePort": 11600,
  "portRange": {
    "start": 11600,
    "end": 11619
  }
}
```

## 4. Project 내 Port 할당 상세

### PRODUCTION 환경 (0-9) ⭐️ 우선순위

| Offset | Port 번호 | 용도 | 환경변수 |
|--------|----------|------|----------|
| +0 | base+0 | SSH | `SSH_PORT_<sn1>_<sn2>_PROD` |
| +1 | base+1 | Backend (Node.js) | `BE_NODEJS_PORT_<sn1>_<sn2>_PROD` |
| +2 | base+2 | Backend (Python) | `BE_PYTHON_PORT_<sn1>_<sn2>_PROD` |
| +3 | base+3 | API (GraphQL) | `API_GRAPHQL_PORT_<sn1>_<sn2>_PROD` |
| +4 | base+4 | API (REST) | `API_REST_PORT_<sn1>_<sn2>_PROD` |
| +5 | base+5 | API (예비) | `API_RESERVED_PORT_<sn1>_<sn2>_PROD` |
| +6 | base+6 | Frontend (Next.js) | `FE_NEXTJS_PORT_<sn1>_<sn2>_PROD` |
| +7 | base+7 | Frontend (SvelteKit) | `FE_SVELTE_PORT_<sn1>_<sn2>_PROD` |
| +8 | base+8 | Frontend (예비) | `FE_RESERVED_PORT_<sn1>_<sn2>_PROD` |
| +9 | base+9 | 시스템 예비 | `SYS_RESERVED_PORT_<sn1>_<sn2>_PROD` |

### DEVELOPMENT 환경 (10-19)

| Offset | Port 번호 | 용도 | 환경변수 |
|--------|----------|------|----------|
| +10 | base+10 | SSH | `SSH_PORT_<sn1>_<sn2>_DEV` |
| +11 | base+11 | Backend (Node.js) | `BE_NODEJS_PORT_<sn1>_<sn2>_DEV` |
| +12 | base+12 | Backend (Python) | `BE_PYTHON_PORT_<sn1>_<sn2>_DEV` |
| +13 | base+13 | API (GraphQL) | `API_GRAPHQL_PORT_<sn1>_<sn2>_DEV` |
| +14 | base+14 | API (REST) | `API_REST_PORT_<sn1>_<sn2>_DEV` |
| +15 | base+15 | API (예비) | `API_RESERVED_PORT_<sn1>_<sn2>_DEV` |
| +16 | base+16 | Frontend (Next.js) | `FE_NEXTJS_PORT_<sn1>_<sn2>_DEV` |
| +17 | base+17 | Frontend (SvelteKit) | `FE_SVELTE_PORT_<sn1>_<sn2>_DEV` |
| +18 | base+18 | Frontend (예비) | `FE_RESERVED_PORT_<sn1>_<sn2>_DEV` |
| +19 | base+19 | 시스템 예비 | `SYS_RESERVED_PORT_<sn1>_<sn2>_DEV` |

## 5. 추가 보완 사항

### A. Port 충돌 방지 규칙

```javascript
// 예시: Platform sn=3, Project sn=2
const platformSn = 3;
const projectSn = 2;
const basePort = 11000 + (platformSn * 200) + (projectSn * 20);
// basePort = 11640

// Production GraphQL API
const prodGraphQL = basePort + 3; // 11643

// Development Next.js
const devNextJS = basePort + 16; // 11656
```

### B. servers.json 구조 개선

```json
{
  "projectServers": {
    "project-id": {
      "projectId": "project-id",
      "platformId": "platform-id",
      "platformSn": 3,
      "projectSn": 2,
      "basePort": 11640,
      "servers": [
        {
          "id": "backend_nodejs_prod",
          "type": "backend",
          "subType": "nodejs",
          "environment": "production",
          "port": 11641,
          "offset": 1,
          "envVar": "BE_NODEJS_PORT_3_2_PROD"
        },
        {
          "id": "frontend_nextjs_dev",
          "type": "frontend",
          "subType": "nextjs",
          "environment": "development",
          "port": 11656,
          "offset": 16,
          "envVar": "FE_NEXTJS_PORT_3_2_DEV"
        }
      ]
    }
  }
}
```

### C. 환경변수 명명 규칙 개선

기존보다 명확한 규칙:

```
{TYPE}_{SUBTYPE}_PORT_{PLATFORM_SN}_{PROJECT_SN}_{ENV}
```

예시:
- `BE_NODEJS_PORT_3_2_PROD`
- `API_GRAPHQL_PORT_3_2_DEV`

### D. Port 할당 검증 로직

```typescript
interface PortAllocation {
  isValid: boolean;
  error?: string;
  conflicts?: string[];
}

function validatePortAllocation(
  platformSn: number,
  projectSn: number,
  offset: number
): PortAllocation {
  const basePort = 11000 + (platformSn * 200) + (projectSn * 20);
  const port = basePort + offset;

  // Check range
  if (port < 11000 || port > 19999) {
    return { isValid: false, error: 'Port out of range' };
  }

  // Check offset
  if (offset < 0 || offset > 19) {
    return { isValid: false, error: 'Invalid offset' };
  }

  return { isValid: true };
}
```

### E. 추가 고려사항

1. **Port 9번, 19번을 시스템 예비로 명시** - 향후 확장성
2. **환경변수에 ENV(PROD/DEV) 명시** - 더 명확한 구분
3. **servers.json에 offset 정보 저장** - 디버깅 용이
4. **Port 할당 시 자동 검증** - 중복 방지
5. **Reserved ports 문서화** - 관리 용이성

---

이렇게 보완하면 더 체계적이고 확장 가능한 port 관리 시스템이 됩니다.

