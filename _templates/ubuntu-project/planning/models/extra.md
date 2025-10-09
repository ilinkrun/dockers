###  회계 관리

**Billing_Records (청구 관리)**
```sql
- billing_id (PK)
- project_id (FK)
- item_id (FK, nullable: 중간청구 vs 완료청구)
- billing_type ('중간청구', '완료청구', '기성청구')
- billing_amount (청구금액)
- billing_date (청구일)
- due_date (입금예정일)
- payment_date (실제입금일)
- payment_status ('미청구', '청구완료', '입금완료')
- invoice_number (청구서번호)
- notes (비고)
```

### 문서 관리

**Documents (문서 관리)**
```sql
- document_id (PK)
- item_id (FK)
- document_type ('현장조사보고서', '중간보고서', '최종보고서', '현장사진')
- document_name (문서명)
- file_path (파일경로)
- version (버전)
- upload_date (업로드일)
- uploaded_by (업로드자)
- approval_status ('작성중', '검토중', '승인완료')
- file_size, file_type
```

### 사용자 및 권한 관리

**Users (사용자)**
```sql
- user_id (PK)
- username, email, password_hash
- full_name (성명)
- department (부서: '구조팀', '총무팀', '감리팀')
- position (직급)
- phone, mobile
- is_active
```

**User_Roles (사용자 역할)**
```sql
- role_id (PK)
- user_id (FK)
- project_id (FK, nullable: 전사권한 vs 프로젝트권한)
- role_type ('PM', '주담당', '보조담당', '총무', '관리자')
- granted_date, revoked_date
```

### 외부 협력사 관리

**External_Partners (외부 협력사)**
```sql
- partner_id (PK)
- company_name (업체명)
- business_type ('시공사', '감리사', '발주처')
- contact_person (담당자)
- phone, email, address
- is_active
```

**Project_Partners (프로젝트별 협력사)**
```sql
- project_id (FK)
- partner_id (FK)
- partner_role ('발주처', '시공사', '감리사')
- contract_start_date, contract_end_date
```

### 현장 안전 관리
```sql
Safety_Records (안전 관리)
- safety_id (PK)
- item_id (FK)
- safety_check_date (안전점검일)
- safety_status ('양호', '주의', '위험')
- safety_issues (안전사항)
- corrective_actions (조치사항)
```

### 승인 워크플로우
```sql
Approval_Workflows (승인 프로세스)
- workflow_id (PK)
- document_id (FK)
- approver_user_id (FK)
- approval_step (승인단계)
- approval_status ('대기', '승인', '반려')
- approval_date, comments
```