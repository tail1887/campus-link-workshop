# 03. API Reference

현재 앱은 기본적으로 mock 중심 데모 앱이지만, `RECRUIT_DATA_SOURCE=database`일 때는 PostgreSQL + Prisma를 사용하도록 scaffold가 준비되어 있다. Recruit와 Phase 1 Identity 모두 같은 data source 모드를 따르며, 프론트와 문서 흐름을 맞추기 위해 Next.js Route Handler 형태의 API 계약을 정의한다.

## 1) 공통 규칙

- Base Path: `/api`
- Content-Type: `application/json`
- 시간 포맷: `ISO-8601`
- 키 네이밍: `camelCase`
- Recruit API 인증 방식: 없음
- Auth / Onboarding 인증 방식: `campus-link.session` HTTP-only cookie

공통 enum:

- `role`: `student | admin`
- `onboarding.status`: `not_started | in_progress | completed`
- `onboarding.currentStep`: `account | interests | profile | complete`

공통 실패 응답 예시:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "필수 입력값을 확인해주세요."
  }
}
```

## 2) 상태 코드 규칙

| Status | 의미 |
| --- | --- |
| `200` | 조회 성공 |
| `201` | 생성 성공 |
| `202` | mock 지원 접수 성공 |
| `400` | 입력 오류 |
| `401` | 인증 필요 또는 인증 실패 |
| `404` | 모집글 없음 |
| `409` | 중복 지원 등 충돌 |

## 3) 엔드포인트 목록

| Method | Endpoint | Auth | 설명 |
| --- | --- | --- | --- |
| `GET` | `/posts` | No | 모집글 목록 조회 |
| `GET` | `/posts/{slug}` | No | 모집글 상세 조회 |
| `POST` | `/posts` | No | 모집글 mock 생성 |
| `POST` | `/posts/{slug}/apply` | No | 지원하기 mock 제출 |
| `POST` | `/auth/signup` | No | 학생 계정 생성 후 세션 시작 |
| `POST` | `/auth/login` | No | 기존 계정 로그인 후 세션 시작 |
| `GET` | `/auth/session` | Optional Cookie | 현재 세션/사용자/온보딩 컨텍스트 조회 |
| `DELETE` | `/auth/session` | Optional Cookie | 현재 세션 종료 |
| `GET` | `/onboarding/state` | Yes | 현재 사용자 온보딩 상태 조회 |
| `PUT` | `/onboarding/state` | Yes | 온보딩 step/키워드/완료 상태 갱신 |

## 4) 핵심 API 상세

### `GET /api/posts`

Query:

- `category`: `study | project | hackathon`
- `campus`: 문자열
- `q`: 제목/요약 검색어

Success:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "post_1",
        "slug": "ai-study-sprint",
        "title": "AI 논문 스터디 6주 스프린트",
        "category": "study",
        "campus": "서울 캠퍼스",
        "summary": "매주 한 편씩 읽고 발표하는 집중형 스터디",
        "roles": ["발표자", "정리 담당"],
        "capacity": 3,
        "stage": "모집 중",
        "deadline": "2026-03-25",
        "highlight": true
      }
    ]
  }
}
```

### `GET /api/posts/{slug}`

Success:

```json
{
  "success": true,
  "data": {
    "id": "post_1",
    "slug": "ai-study-sprint",
    "title": "AI 논문 스터디 6주 스프린트",
    "category": "study",
    "campus": "서울 캠퍼스",
    "summary": "매주 한 편씩 읽고 발표하는 집중형 스터디",
    "description": "LLM, RAG, 에이전트 관련 최신 논문을 함께 읽습니다.",
    "roles": ["발표자", "정리 담당"],
    "techStack": ["Python", "LLM"],
    "capacity": 3,
    "stage": "모집 중",
    "deadline": "2026-03-25",
    "createdAt": "2026-03-11T09:00:00.000Z",
    "highlight": true
  }
}
```

### `POST /api/posts`

Request:

```json
{
  "title": "캠퍼스 앱 런칭 프로젝트 팀원 구해요",
  "category": "project",
  "campus": "판교 캠퍼스",
  "summary": "3주 안에 데모까지 만드는 집중형 프로젝트",
  "description": "프론트엔드와 백엔드 각 1명씩 추가 모집합니다.",
  "roles": ["Frontend", "Backend"],
  "techStack": ["Next.js", "NestJS"],
  "capacity": 2,
  "stage": "아이디어 검증",
  "deadline": "2026-03-28"
}
```

Success:

```json
{
  "success": true,
  "data": {
    "id": "mock_post_1710150000",
    "slug": "campus-app-launch-project",
    "dataSource": "mock",
    "message": "모집글이 생성되었습니다."
  }
}
```

참고:

- `dataSource`는 현재 저장 모드가 `mock`인지 `database`인지 알려준다.
- `mock` 모드에서는 클라이언트 localStorage fallback과 함께 동작한다.
- `database` 모드에서는 PostgreSQL이 source of truth가 된다.

### `POST /api/posts/{slug}/apply`

Request:

```json
{
  "name": "김정글",
  "contact": "jungle@example.com",
  "message": "프론트엔드 구현 경험이 있어 이번 데모 제작에 바로 기여할 수 있습니다."
}
```

Success:

```json
{
  "success": true,
  "data": {
    "applicationId": "apply_1710151111",
    "postSlug": "ai-study-sprint",
    "dataSource": "mock",
    "message": "지원이 접수되었습니다. 팀장이 확인 후 연락할 예정입니다."
  }
}
```

실패 예시:

```json
{
  "success": false,
  "error": {
    "code": "AUTH_ENTRY_REQUIRED",
    "message": "글쓰기 전에 로그인 또는 회원가입으로 세션을 시작해주세요."
  }
}
```

기존 실패 예시:

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_APPLICATION",
    "message": "이미 같은 연락처로 지원한 기록이 있습니다."
  }
}
```

## 5) Phase 1 Identity API

mock 모드 기준 demo 계정:

- 학생: `student@campus-link.demo` / `jungle1234`
- 관리자: `admin@campus-link.demo` / `admin1234`

### `POST /api/auth/signup`

Request:

```json
{
  "email": "new-user@example.com",
  "password": "jungle1234",
  "displayName": "김정글",
  "campus": "Krafton Jungle"
}
```

Success:

```json
{
  "success": true,
  "data": {
    "authenticated": true,
    "session": {
      "id": "sess_123",
      "userId": "user_123",
      "createdAt": "2026-03-11T09:00:00.000Z",
      "expiresAt": "2026-03-18T09:00:00.000Z"
    },
    "user": {
      "id": "user_123",
      "email": "new-user@example.com",
      "displayName": "김정글",
      "campus": "Krafton Jungle",
      "role": "student",
      "createdAt": "2026-03-11T09:00:00.000Z",
      "updatedAt": "2026-03-11T09:00:00.000Z"
    },
    "onboarding": {
      "userId": "user_123",
      "status": "in_progress",
      "currentStep": "interests",
      "interestKeywords": [],
      "completedAt": null,
      "createdAt": "2026-03-11T09:00:00.000Z",
      "updatedAt": "2026-03-11T09:00:00.000Z"
    },
    "dataSource": "mock"
  }
}
```

실패 예시:

```json
{
  "success": false,
  "error": {
    "code": "EMAIL_ALREADY_IN_USE",
    "message": "이미 사용 중인 이메일입니다."
  }
}
```

노트:

- 성공 시 `campus-link.session` cookie가 설정된다.
- public signup은 기본적으로 `student` role만 생성한다.

### `POST /api/auth/login`

Request:

```json
{
  "email": "student@campus-link.demo",
  "password": "jungle1234"
}
```

Success:

- 응답 shape는 `POST /api/auth/signup`과 동일하다.
- mock 모드에서는 demo student/admin 계정으로 role 분기 시나리오를 바로 테스트할 수 있다.

실패 예시:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "이메일 또는 비밀번호가 올바르지 않습니다."
  }
}
```

### `GET /api/auth/session`

Success when authenticated:

- 응답 shape는 `POST /api/auth/signup`과 동일하다.

Success when unauthenticated:

```json
{
  "success": true,
  "data": {
    "authenticated": false,
    "session": null,
    "user": null,
    "onboarding": null,
    "dataSource": "mock"
  }
}
```

노트:

- cookie가 없거나 만료된 세션이면 `200`으로 anonymous context를 돌려준다.
- downstream 브랜치는 이 endpoint를 bootstrap source of truth로 사용한다.

### `DELETE /api/auth/session`

Success:

```json
{
  "success": true,
  "data": {
    "cleared": true,
    "dataSource": "mock"
  }
}
```

### `GET /api/onboarding/state`

Success:

```json
{
  "success": true,
  "data": {
    "onboarding": {
      "userId": "user_123",
      "status": "in_progress",
      "currentStep": "interests",
      "interestKeywords": ["frontend", "hackathon"],
      "completedAt": null,
      "createdAt": "2026-03-11T09:00:00.000Z",
      "updatedAt": "2026-03-11T09:20:00.000Z"
    },
    "dataSource": "mock"
  }
}
```

실패 예시:

```json
{
  "success": false,
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "온보딩 상태를 조회하려면 로그인해야 합니다."
  }
}
```

### `PUT /api/onboarding/state`

Request:

```json
{
  "currentStep": "profile",
  "status": "in_progress",
  "interestKeywords": ["frontend", "typescript", "hackathon"]
}
```

Success:

- 응답 shape는 `GET /api/onboarding/state`와 동일하다.

노트:

- `currentStep`이 `complete`이면 서버는 `status`를 `completed`로 맞춘다.
- `status`가 `completed`이면 서버는 `currentStep`을 `complete`로 맞춘다.
- keyword 배열은 trim + 중복 제거 후 저장한다.

## 6) 오픈 이슈

- [ ] 실제 서비스 전환 시 인증 방식을 어떻게 추가할지
- [ ] localStorage fallback 데이터를 서버 DB로 마이그레이션할 방식
- [ ] 학교 인증, 신고, 관리자 기능을 어떤 API 단위로 확장할지
