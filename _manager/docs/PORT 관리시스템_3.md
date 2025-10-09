# PORT 관리시스템 _manager 통합 완료

## 📋 완성된 통합 항목

### ✅ 1. Data Schema 업데이트

#### platforms.json
- ✅ `sn` 필드 추가 (ubuntu-ilmac: 0, ubuntu-jnj: 1)
- ✅ `basePort` 자동 계산 (11000, 11200)

#### projects.json
- ✅ `sn` 필드 추가 (ilmac-pro2: 0)
- ✅ `ports` 자동 계산 (11001, 11003, 11006, 11007)

### ✅ 2. API 서비스 통합

#### 새로운 서비스 생성

**📄 portService.ts**
- `getNextPlatformSn()` - 다음 Platform SN 조회
- `getNextProjectSn()` - 다음 Project SN 조회
- `calculatePlatformPorts()` - Platform port 계산
- `calculateProjectPorts()` - Project port 계산
- `generateProjectPortsConfig()` - Port 정보 변환

#### 업데이트된 서비스

**📄 platformService.ts**
- Platform 생성 시 SN 자동 할당
- basePort 자동 계산

**📄 projectService.ts**
- Project 생성 시 SN 자동 할당
- Port allocator 사용하여 ports 계산

### ✅ 3. TypeScript 타입 업데이트

#### API Types
**📄 api/src/types/index.ts**
- `Platform.sn?: number` 추가
- `Project.sn?: number` 추가

#### Web Types
**📄 web/src/lib/api.ts**
- `Platform.sn?: number` 추가
- `Project.sn?: number` 추가

### ✅ 4. 문서화

#### 통합 가이드
**📄 PORT_INTEGRATION.md**
- 변경 사항 요약
- Port 할당 규칙
- API 사용 예시
- 마이그레이션 가이드
- 테스트 방법

---

## 🔄 작동 방식

### Platform 생성 시

```typescript
// 1. 다음 SN 조회
const platformSn = getNextPlatformSn(); // 2

// 2. Port 정보 계산
const portInfo = calculatePlatformPorts(platformSn);
// { basePort: 11400, portRange: { start: 11400, end: 11599 } }

// 3. Platform 생성
const platform = {
  id: "ubuntu-test",
  sn: 2,
  settings: {
    basePort: 11400,
    ...
  }
};
```

### Project 생성 시

```typescript
// 1. Platform SN 조회
const platformSn = platform.sn; // 0

// 2. 다음 Project SN 조회
const projectSn = getNextProjectSn("ubuntu-ilmac"); // 1

// 3. Port 정보 계산
const portInfo = calculateProjectPorts(0, 1);
// basePort: 11020, ports: { backend: 11021, graphql: 11023, ... }

// 4. Project 생성
const project = {
  id: "my-project",
  sn: 1,
  ports: {
    backend: 11021,
    graphql: 11023,
    frontendNextjs: 11026,
    frontendSveltekit: 11027,
    reserved: [11022, 11024, 11025, 11028, 11029]
  }
};
```

---

## 📊 Port 할당 예시

| Platform | SN | Base Port | Range | Project SN | Project Base | Ports |
|----------|----|-----------| ------|------------|--------------|-------|
| ubuntu-ilmac | 0 | 11000 | 11000-11199 | 0 | 11000 | 11001, 11003, 11006... |
| ubuntu-ilmac | 0 | 11000 | 11000-11199 | 1 | 11020 | 11021, 11023, 11026... |
| ubuntu-jnj | 1 | 11200 | 11200-11399 | 0 | 11200 | 11201, 11203, 11206... |

---

## 🎯 특징

1. **최소 변경**: 기존 schema에 `sn` 필드만 추가
2. **자동 계산**: Port는 JS 스크립트로 자동 계산
3. **하위 호환성**: `sn` 필드는 optional로 기존 데이터와 호환
4. **중앙 관리**: port-allocator.js 하나로 모든 port 관리
5. **충돌 방지**: SN 기반으로 고유한 port 할당 보장

---

PORT 관리시스템이 _manager에 완전히 통합되었습니다! 🚀