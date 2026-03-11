# 03. API Reference

현재 앱은 기본적으로 mock 중심 데모 앱이지만, `RECRUIT_DATA_SOURCE=database`일 때는 PostgreSQL + Prisma를 사용하도록 scaffold가 준비되어 있다. Recruit, Phase 1 Identity, Phase 2 Profile Communication, Phase 3 AI Platform 모두 같은 data source 모드를 따르며, 프론트와 문서 흐름을 맞추기 위해 Next.js Route Handler 형태의 API 계약을 정의한다.

## 1) 공통 규칙

- Base Path: `/api`
- Content-Type: `application/json`
- 시간 포맷: `ISO-8601`
- 키 네이밍: `camelCase`
- Recruit API 인증 방식: 없음
- Auth / Onboarding / Phase 2 Profile Communication / Phase 3 AI Platform 인증 방식: `campus-link.session` HTTP-only cookie

공통 enum:

- `role`: `student | admin`
- `onboarding.status`: `not_started | in_progress | completed`
- `onboarding.currentStep`: `account | interests | profile | complete`
- `profile.collaborationStyle`: `async_first | hybrid | live_sprint | flexible`
- `profile.weeklyHours`: `under_3 | three_to_six | six_to_ten | ten_plus | flexible`
- `externalLink.type`: `portfolio | github | linkedin | blog | other`
- `resume.visibility`: `private | shared`
- `verification.status`: `unverified | pending | verified | rejected`
- `verification.badge`: `none | pending | verified`
- `verification.method`: `campus_email | student_card | manual_review`
- `inquiry.category`: `general | account | verification | resume | report`
- `inquiry.status`: `open | in_review | resolved`
- `alertPreference.digestFrequency`: `off | daily | weekly`
- `githubConnection.status`: `not_connected | connected | error`
- `githubAnalysis.focus`: `portfolio_overview | team_fit | resume_enrichment`
- `aiJob.kind`: `github_analysis | ai_suggestion`
- `aiJob.status`: `queued | running | succeeded | failed`

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
| `200` | 조회 또는 수정 성공 |
| `201` | 생성 성공 |
| `202` | 검토/비동기 처리가 시작된 요청 성공 |
| `400` | 입력 오류 |
| `401` | 인증 필요 또는 인증 실패 |
| `404` | 모집글 없음 |
| `409` | 중복 지원 또는 상태 충돌 |

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
| `GET` | `/profile` | Yes | 현재 사용자 identity-linked 프로필 조회 |
| `PUT` | `/profile` | Yes | 현재 사용자 프로필 수정 |
| `GET` | `/resume` | Yes | 현재 사용자 이력서와 completeness 조회 |
| `PUT` | `/resume` | Yes | 현재 사용자 이력서 수정 |
| `GET` | `/verification` | Yes | 현재 사용자 인증 상태 조회 |
| `POST` | `/verification` | Yes | 인증 요청 제출 또는 재제출 |
| `GET` | `/inquiries` | Yes | 현재 사용자 문의 내역 조회 |
| `POST` | `/inquiries` | Yes | 새 문의 제출 |
| `GET` | `/alert-preferences` | Yes | 현재 사용자 알림 설정 조회 |
| `PUT` | `/alert-preferences` | Yes | 현재 사용자 알림 설정 수정 |
| `GET` | `/github/connection` | Yes | 현재 사용자 GitHub 연결 상태 조회 |
| `PUT` | `/github/connection` | Yes | 현재 사용자 GitHub 연결 저장/갱신 |
| `DELETE` | `/github/connection` | Yes | 현재 사용자 GitHub 연결 해제 |
| `POST` | `/github/analysis/jobs` | Yes | GitHub 분석 job 생성 |
| `GET` | `/github/analysis/jobs/{jobId}` | Yes | GitHub 분석 job polling 조회 |
| `POST` | `/ai/suggestions/jobs` | Yes | resume 또는 recruit-post suggestion job 생성 |
| `GET` | `/ai/suggestions/jobs/{jobId}` | Yes | suggestion job polling 조회 |

## 4) 핵심 Recruit API

### `GET /api/posts`

Query:

- `category`: `study | project | hackathon`
- `campus`: 문자열
- `q`: 제목/요약 검색어

노트:

- 서버는 깨진 텍스트, 비정상 마감일, 중복 seed 성격 게시글을 목록에서 자동으로 제외한다.
- canonical demo seed와 slug가 같은 게시글이 깨진 상태로 저장돼 있으면 서버가 읽기 시점에 seed 본문으로 복구한다.

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

노트:

- 목록 정제 규칙에서 제외된 게시글 slug는 `404`로 응답할 수 있다.

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

노트:

- `title`, `campus`, `summary`, `description`, `roles`, `deadline`은 필수다.
- `capacity`는 `1` 이상 `20` 이하 정수여야 한다.
- 서버는 trim 이후 내용 기준으로 테스트용/반복 입력/깨진 텍스트를 거부한다.

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

노트:

- `dataSource`는 현재 저장 모드가 `mock`인지 `database`인지 알려준다.
- `mock` 모드에서는 클라이언트 localStorage fallback과 함께 동작한다.
- `database` 모드에서는 PostgreSQL이 source of truth가 된다.

실패 예시:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "테스트용 또는 품질이 낮은 입력은 등록할 수 없습니다."
  }
}
```

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

## 6) Phase 2 Profile / Communication API

공통 노트:

- `GET /api/profile`, `GET /api/resume`, `GET /api/verification`, `GET /api/alert-preferences`는 저장 레코드가 없더라도 identity 기반 default contract를 반환한다.
- 위 1:1 레코드는 첫 수정 또는 제출 시 저장소에 upsert 된다.
- 모든 Phase 2 endpoint는 현재 로그인한 사용자의 own record만 다룬다.

### `GET /api/profile`

Success:

```json
{
  "success": true,
  "data": {
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
      "currentStep": "profile",
      "interestKeywords": ["frontend", "typescript"],
      "completedAt": null,
      "createdAt": "2026-03-11T09:00:00.000Z",
      "updatedAt": "2026-03-11T09:20:00.000Z"
    },
    "profile": {
      "userId": "user_123",
      "headline": "Frontend builder for sprint-paced campus projects",
      "intro": "짧은 주기의 데모 제작과 협업 문서화를 좋아합니다.",
      "collaborationStyle": "hybrid",
      "weeklyHours": "six_to_ten",
      "contactEmail": "new-user@example.com",
      "openToRoles": ["frontend", "product"],
      "links": [
        {
          "label": "GitHub",
          "url": "https://github.com/campus-link-demo",
          "type": "github"
        }
      ],
      "createdAt": "2026-03-11T09:00:00.000Z",
      "updatedAt": "2026-03-11T09:20:00.000Z"
    },
    "dataSource": "mock"
  }
}
```

노트:

- Phase 1 survey의 `intro`, `collaborationStyle`, `weeklyHours` placeholder는 이 endpoint의 `profile` payload로 치환한다.
- `displayName`, `campus`, `role`은 `profile`이 아니라 `user` contract를 source of truth로 유지한다.

### `PUT /api/profile`

Request:

```json
{
  "headline": "Frontend builder for sprint-paced campus projects",
  "intro": "짧은 주기의 데모 제작과 협업 문서화를 좋아합니다.",
  "collaborationStyle": "hybrid",
  "weeklyHours": "six_to_ten",
  "contactEmail": "new-user@example.com",
  "openToRoles": ["frontend", "product"],
  "links": [
    {
      "label": "GitHub",
      "url": "https://github.com/campus-link-demo",
      "type": "github"
    }
  ]
}
```

Success:

- 응답 shape는 `GET /api/profile`과 동일하다.

### `GET /api/resume`

Success:

```json
{
  "success": true,
  "data": {
    "resume": {
      "userId": "user_123",
      "title": "Kim Jungle Resume",
      "summary": "Frontend-focused collaborator for product demos and hackathon prototypes.",
      "skills": ["Next.js", "TypeScript", "UI Prototyping"],
      "education": "Krafton Jungle",
      "experience": [
        {
          "organization": "Campus Sprint Team",
          "role": "Frontend Lead",
          "description": "Built landing, detail, and application flows for workshop demos.",
          "startDate": "2025-12",
          "endDate": null
        }
      ],
      "projects": [
        {
          "title": "Campus Link",
          "description": "Recruiting demo platform for campus teams.",
          "techStack": ["Next.js", "Prisma"],
          "linkUrl": "https://example.com/campus-link"
        }
      ],
      "links": [
        {
          "label": "Portfolio",
          "url": "https://example.com/portfolio",
          "type": "portfolio"
        }
      ],
      "visibility": "shared",
      "createdAt": "2026-03-11T09:00:00.000Z",
      "updatedAt": "2026-03-11T09:20:00.000Z"
    },
    "completeness": {
      "score": 100,
      "completedSections": [
        "summary",
        "skills",
        "education",
        "experience",
        "projects",
        "links"
      ],
      "missingSections": []
    },
    "dataSource": "mock"
  }
}
```

노트:

- completeness는 저장소에 별도 보관하지 않고 `summary`, `skills`, `education`, `experience`, `projects`, `links` 6개 구간에서 계산한다.
- Phase 3 resume AI assist 브랜치는 이 payload를 source of truth로 사용한다.

### `PUT /api/resume`

Request:

```json
{
  "title": "Kim Jungle Resume",
  "summary": "Frontend-focused collaborator for product demos and hackathon prototypes.",
  "skills": ["Next.js", "TypeScript", "UI Prototyping"],
  "education": "Krafton Jungle",
  "experience": [
    {
      "organization": "Campus Sprint Team",
      "role": "Frontend Lead",
      "description": "Built landing, detail, and application flows for workshop demos.",
      "startDate": "2025-12",
      "endDate": null
    }
  ],
  "projects": [
    {
      "title": "Campus Link",
      "description": "Recruiting demo platform for campus teams.",
      "techStack": ["Next.js", "Prisma"],
      "linkUrl": "https://example.com/campus-link"
    }
  ],
  "links": [
    {
      "label": "Portfolio",
      "url": "https://example.com/portfolio",
      "type": "portfolio"
    }
  ],
  "visibility": "shared"
}
```

Success:

- 응답 shape는 `GET /api/resume`과 동일하다.

### `GET /api/verification`

Success:

```json
{
  "success": true,
  "data": {
    "verification": {
      "userId": "user_123",
      "status": "unverified",
      "badge": "none",
      "method": null,
      "evidenceLabel": null,
      "evidenceUrl": null,
      "note": null,
      "submittedAt": null,
      "reviewedAt": null,
      "verifiedAt": null,
      "rejectionReason": null,
      "createdAt": "2026-03-11T09:00:00.000Z",
      "updatedAt": "2026-03-11T09:00:00.000Z"
    },
    "dataSource": "mock"
  }
}
```

### `POST /api/verification`

Request:

```json
{
  "method": "student_card",
  "evidenceLabel": "학생증 앞면",
  "evidenceUrl": "https://example.com/student-card",
  "note": "학과와 학번이 보이는 버전으로 제출합니다."
}
```

Success:

```json
{
  "success": true,
  "data": {
    "verification": {
      "userId": "user_123",
      "status": "pending",
      "badge": "pending",
      "method": "student_card",
      "evidenceLabel": "학생증 앞면",
      "evidenceUrl": "https://example.com/student-card",
      "note": "학과와 학번이 보이는 버전으로 제출합니다.",
      "submittedAt": "2026-03-11T10:00:00.000Z",
      "reviewedAt": null,
      "verifiedAt": null,
      "rejectionReason": null,
      "createdAt": "2026-03-11T09:00:00.000Z",
      "updatedAt": "2026-03-11T10:00:00.000Z"
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
    "code": "VERIFICATION_ALREADY_PENDING",
    "message": "이미 검토 중인 인증 요청이 있습니다."
  }
}
```

재제출 실패 예시:

```json
{
  "success": false,
  "error": {
    "code": "VERIFICATION_ALREADY_COMPLETED",
    "message": "이미 인증이 완료된 계정입니다."
  }
}
```

노트:

- 성공 status code는 `202`이며, 검토 시작 상태를 의미한다.
- `pending` 또는 `verified` 상태에서는 새 인증 요청을 다시 제출할 수 없다.
- 운영자 승인/반려 액션 endpoint는 Phase 4 ops 계약에서 추가한다.

### `GET /api/inquiries`

Success:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "inq_demo_student_1",
        "userId": "user_123",
        "category": "general",
        "subject": "Demo support timeline",
        "message": "When will support replies show up in the communication center?",
        "contactEmail": "new-user@example.com",
        "status": "resolved",
        "resolutionSummary": "Replies will appear after the Phase 4 operations inbox lands.",
        "createdAt": "2026-03-11T09:00:00.000Z",
        "updatedAt": "2026-03-11T09:00:00.000Z",
        "resolvedAt": "2026-03-11T09:00:00.000Z"
      }
    ],
    "dataSource": "mock"
  }
}
```

### `POST /api/inquiries`

Request:

```json
{
  "category": "verification",
  "subject": "인증 배지 상태 확인",
  "message": "제출한 학생증 인증이 언제 검토되는지 알고 싶습니다.",
  "contactEmail": "new-user@example.com"
}
```

Success:

```json
{
  "success": true,
  "data": {
    "inquiry": {
      "id": "inq_1710152222",
      "userId": "user_123",
      "category": "verification",
      "subject": "인증 배지 상태 확인",
      "message": "제출한 학생증 인증이 언제 검토되는지 알고 싶습니다.",
      "contactEmail": "new-user@example.com",
      "status": "open",
      "resolutionSummary": null,
      "createdAt": "2026-03-11T10:20:00.000Z",
      "updatedAt": "2026-03-11T10:20:00.000Z",
      "resolvedAt": null
    },
    "dataSource": "mock"
  }
}
```

### `GET /api/alert-preferences`

Success:

```json
{
  "success": true,
  "data": {
    "alertPreference": {
      "userId": "user_123",
      "emailEnabled": true,
      "inAppEnabled": true,
      "applicationUpdates": true,
      "verificationUpdates": true,
      "inquiryReplies": true,
      "marketingEnabled": false,
      "digestFrequency": "weekly",
      "quietHours": {
        "start": "23:00",
        "end": "08:00",
        "timezone": "Asia/Seoul"
      },
      "createdAt": "2026-03-11T09:00:00.000Z",
      "updatedAt": "2026-03-11T09:00:00.000Z"
    },
    "dataSource": "mock"
  }
}
```

### `PUT /api/alert-preferences`

Request:

```json
{
  "emailEnabled": true,
  "inAppEnabled": true,
  "applicationUpdates": true,
  "verificationUpdates": true,
  "inquiryReplies": true,
  "marketingEnabled": false,
  "digestFrequency": "daily",
  "quietHours": {
    "start": "23:00",
    "end": "08:00",
    "timezone": "Asia/Seoul"
  }
}
```

Success:

- 응답 shape는 `GET /api/alert-preferences`와 동일하다.

실패 노트:

- `quietHours.start`와 `quietHours.end`는 `HH:MM` 24시간 형식을 따라야 한다.

## 7) Phase 3 AI Platform API

공통 노트:

- `GET /api/github/connection`은 저장 레코드가 없더라도 `status=not_connected` 기본 계약을 반환한다.
- `POST /api/github/analysis/jobs`, `POST /api/ai/suggestions/jobs`는 모두 `202 Accepted`와 함께 `queued` job payload를 반환한다.
- Phase 3 job endpoint는 poll 기반으로 동작한다. mock provider 기준으로 첫 `GET`은 보통 `running`, 다음 `GET`은 `succeeded`를 반환한다.
- 모든 Phase 3 응답은 현재 provider catalog와 `dataSource`를 함께 돌려준다.

### `GET /api/github/connection`

Success:

```json
{
  "success": true,
  "data": {
    "connection": {
      "userId": "user_123",
      "username": "campus-link-demo",
      "profileUrl": "https://github.com/campus-link-demo",
      "provider": "mock_github",
      "status": "connected",
      "connectedAt": "2026-03-11T09:00:00.000Z",
      "lastValidatedAt": "2026-03-11T09:00:00.000Z",
      "lastAnalysisJobId": "job_gh_123",
      "createdAt": "2026-03-11T09:00:00.000Z",
      "updatedAt": "2026-03-11T09:00:00.000Z"
    },
    "providers": {
      "githubConnection": {
        "provider": "mock_github",
        "label": "Mock GitHub Connector"
      },
      "githubAnalysis": {
        "provider": "mock_analysis",
        "label": "Mock GitHub Analyzer"
      },
      "aiSuggestion": {
        "provider": "mock_suggestions",
        "label": "Mock Suggestion Engine"
      }
    },
    "dataSource": "mock"
  }
}
```

노트:

- Phase 3 B 브랜치는 이 endpoint를 GitHub 연결/상태 관리의 source of truth로 사용한다.

### `PUT /api/github/connection`

Request:

```json
{
  "username": "campus-link-demo"
}
```

Success:

- 응답 shape는 `GET /api/github/connection`과 동일하다.

노트:

- `profileUrl`은 생략 가능하며, 생략하면 서버가 `https://github.com/{username}`으로 채운다.
- `username`에는 `@campus-link-demo` 또는 전체 GitHub 프로필 URL을 넣어도 서버가 정규화한다.

### `DELETE /api/github/connection`

Success:

```json
{
  "success": true,
  "data": {
    "connection": {
      "userId": "user_123",
      "username": null,
      "profileUrl": null,
      "provider": "mock_github",
      "status": "not_connected",
      "connectedAt": null,
      "lastValidatedAt": null,
      "lastAnalysisJobId": null,
      "createdAt": "2026-03-11T09:00:00.000Z",
      "updatedAt": "2026-03-11T10:40:00.000Z"
    },
    "providers": {
      "githubConnection": {
        "provider": "mock_github",
        "label": "Mock GitHub Connector"
      },
      "githubAnalysis": {
        "provider": "mock_analysis",
        "label": "Mock GitHub Analyzer"
      },
      "aiSuggestion": {
        "provider": "mock_suggestions",
        "label": "Mock Suggestion Engine"
      }
    },
    "dataSource": "mock"
  }
}
```

### `POST /api/github/analysis/jobs`

Request:

```json
{
  "focus": "portfolio_overview",
  "maxRepositories": 3,
  "preferredLanguages": ["TypeScript", "Prisma"]
}
```

Success:

```json
{
  "success": true,
  "data": {
    "job": {
      "id": "job_gh_123",
      "userId": "user_123",
      "kind": "github_analysis",
      "status": "queued",
      "provider": "mock_analysis",
      "request": {
        "focus": "portfolio_overview",
        "maxRepositories": 3,
        "preferredLanguages": ["TypeScript", "Prisma"]
      },
      "result": null,
      "error": null,
      "requestedAt": "2026-03-11T10:45:00.000Z",
      "startedAt": null,
      "completedAt": null,
      "updatedAt": "2026-03-11T10:45:00.000Z"
    },
    "providers": {
      "githubConnection": {
        "provider": "mock_github",
        "label": "Mock GitHub Connector"
      },
      "githubAnalysis": {
        "provider": "mock_analysis",
        "label": "Mock GitHub Analyzer"
      },
      "aiSuggestion": {
        "provider": "mock_suggestions",
        "label": "Mock Suggestion Engine"
      }
    },
    "dataSource": "mock"
  }
}
```

연결 누락 실패 예시:

```json
{
  "success": false,
  "error": {
    "code": "GITHUB_CONNECTION_REQUIRED",
    "message": "분석을 시작하기 전에 GitHub 계정을 먼저 연결해주세요."
  }
}
```

### `GET /api/github/analysis/jobs/{jobId}`

Success:

```json
{
  "success": true,
  "data": {
    "job": {
      "id": "job_gh_123",
      "userId": "user_123",
      "kind": "github_analysis",
      "status": "succeeded",
      "provider": "mock_analysis",
      "request": {
        "focus": "portfolio_overview",
        "maxRepositories": 3,
        "preferredLanguages": ["TypeScript", "Prisma"]
      },
      "result": {
        "username": "campus-link-demo",
        "profileUrl": "https://github.com/campus-link-demo",
        "analyzedAt": "2026-03-11T10:45:05.000Z",
        "focus": "portfolio_overview",
        "summary": "campus-link-demo의 GitHub는 TypeScript 중심 포트폴리오와 데모 성격 레포가 분명해 Phase 3 분석 카드의 기본 스토리라인으로 쓰기 좋습니다.",
        "strengths": [
          "TypeScript 중심의 작업 흔적이 뚜렷합니다.",
          "짧은 스프린트 데모에 맞는 레포 분리가 잘 드러납니다.",
          "협업형 프로젝트 설명과 역할 힌트가 UI/문서 중심 포지션에 잘 맞습니다."
        ],
        "recommendedRoles": ["frontend", "prototype_builder", "product"],
        "topLanguages": [
          {
            "name": "TypeScript",
            "share": 48
          },
          {
            "name": "Prisma",
            "share": 32
          }
        ],
        "repositories": [
          {
            "name": "campus-link-demo-project-1",
            "description": "캠퍼스 데모 흐름과 협업 문서를 함께 다루는 대표 레포지토리",
            "repoUrl": "https://github.com/campus-link-demo/campus-link-demo-project-1",
            "primaryLanguage": "TypeScript",
            "stars": 12,
            "topics": ["typescript", "campus-link", "prototype"],
            "roleHint": "frontend",
            "lastUpdatedAt": "2026-03-11T10:45:05.000Z"
          }
        ]
      },
      "error": null,
      "requestedAt": "2026-03-11T10:45:00.000Z",
      "startedAt": "2026-03-11T10:45:02.000Z",
      "completedAt": "2026-03-11T10:45:05.000Z",
      "updatedAt": "2026-03-11T10:45:05.000Z"
    },
    "providers": {
      "githubConnection": {
        "provider": "mock_github",
        "label": "Mock GitHub Connector"
      },
      "githubAnalysis": {
        "provider": "mock_analysis",
        "label": "Mock GitHub Analyzer"
      },
      "aiSuggestion": {
        "provider": "mock_suggestions",
        "label": "Mock Suggestion Engine"
      }
    },
    "dataSource": "mock"
  }
}
```

노트:

- `status=running`인 중간 응답에서는 `result`가 `null`이다.
- Phase 3 B 브랜치는 `job.status`만 보고 loading / success / failure UX를 구성한다.

### `POST /api/ai/suggestions/jobs`

Resume request 예시:

```json
{
  "feature": "resume",
  "target": "resume_summary",
  "instruction": "캠퍼스 프로젝트 협업 경험을 강조해줘.",
  "locale": "ko-KR",
  "sourceText": "Frontend-focused collaborator for product demos and hackathon prototypes.",
  "resume": {
    "userId": "user_123",
    "title": "Kim Jungle Resume",
    "summary": "Frontend-focused collaborator for product demos and hackathon prototypes.",
    "skills": ["Next.js", "TypeScript", "UI Prototyping"],
    "education": "Krafton Jungle",
    "experience": [],
    "projects": [],
    "links": [],
    "visibility": "shared",
    "createdAt": "2026-03-11T09:00:00.000Z",
    "updatedAt": "2026-03-11T09:20:00.000Z"
  },
  "profileSnapshot": {
    "headline": "Frontend builder for sprint-paced campus projects",
    "intro": "짧은 주기의 데모 제작과 협업 문서화를 좋아합니다.",
    "openToRoles": ["frontend", "product"],
    "links": []
  },
  "onboardingKeywords": ["frontend", "hackathon"]
}
```

Recruit-post request 예시:

```json
{
  "feature": "recruit_post",
  "target": "recruit_title",
  "instruction": "짧고 팀 성격이 잘 드러나게 써줘.",
  "locale": "ko-KR",
  "sourceText": "2주 안에 온보딩부터 데모까지 완성할 집중형 프로젝트입니다.",
  "draft": {
    "category": "project",
    "campus": "판교 캠퍼스",
    "title": "",
    "summary": "2주 안에 온보딩부터 데모까지 완성할 집중형 프로젝트입니다.",
    "description": "",
    "roles": ["Frontend", "Backend", "Product Designer"],
    "techStack": ["Next.js", "TypeScript", "Tailwind CSS"],
    "capacity": 3,
    "stage": "MVP 제작 중",
    "deadline": "2026-03-27",
    "ownerRole": "PM / Frontend",
    "meetingStyle": "오프라인 중심",
    "schedule": "평일 저녁 3회 + 주말 스프린트 1회",
    "goal": "Vercel 배포까지 마친 발표용 서비스 완성"
  }
}
```

Success:

```json
{
  "success": true,
  "data": {
    "job": {
      "id": "job_ai_123",
      "userId": "user_123",
      "kind": "ai_suggestion",
      "status": "queued",
      "provider": "mock_suggestions",
      "request": {
        "feature": "resume",
        "target": "resume_summary",
        "instruction": "캠퍼스 프로젝트 협업 경험을 강조해줘.",
        "locale": "ko-KR",
        "sourceText": "Frontend-focused collaborator for product demos and hackathon prototypes.",
        "resume": {
          "userId": "user_123",
          "title": "Kim Jungle Resume",
          "summary": "Frontend-focused collaborator for product demos and hackathon prototypes.",
          "skills": ["Next.js", "TypeScript", "UI Prototyping"],
          "education": "Krafton Jungle",
          "experience": [],
          "projects": [],
          "links": [],
          "visibility": "shared",
          "createdAt": "2026-03-11T09:00:00.000Z",
          "updatedAt": "2026-03-11T09:20:00.000Z"
        },
        "profileSnapshot": {
          "headline": "Frontend builder for sprint-paced campus projects",
          "intro": "짧은 주기의 데모 제작과 협업 문서화를 좋아합니다.",
          "openToRoles": ["frontend", "product"],
          "links": []
        },
        "onboardingKeywords": ["frontend", "hackathon"]
      },
      "result": null,
      "error": null,
      "requestedAt": "2026-03-11T10:50:00.000Z",
      "startedAt": null,
      "completedAt": null,
      "updatedAt": "2026-03-11T10:50:00.000Z"
    },
    "providers": {
      "githubConnection": {
        "provider": "mock_github",
        "label": "Mock GitHub Connector"
      },
      "githubAnalysis": {
        "provider": "mock_analysis",
        "label": "Mock GitHub Analyzer"
      },
      "aiSuggestion": {
        "provider": "mock_suggestions",
        "label": "Mock Suggestion Engine"
      }
    },
    "dataSource": "mock"
  }
}
```

### `GET /api/ai/suggestions/jobs/{jobId}`

Success:

```json
{
  "success": true,
  "data": {
    "job": {
      "id": "job_ai_123",
      "userId": "user_123",
      "kind": "ai_suggestion",
      "status": "succeeded",
      "provider": "mock_suggestions",
      "request": {
        "feature": "resume",
        "target": "resume_summary",
        "instruction": "캠퍼스 프로젝트 협업 경험을 강조해줘.",
        "locale": "ko-KR",
        "sourceText": "Frontend-focused collaborator for product demos and hackathon prototypes.",
        "resume": {
          "userId": "user_123",
          "title": "Kim Jungle Resume",
          "summary": "Frontend-focused collaborator for product demos and hackathon prototypes.",
          "skills": ["Next.js", "TypeScript", "UI Prototyping"],
          "education": "Krafton Jungle",
          "experience": [],
          "projects": [],
          "links": [],
          "visibility": "shared",
          "createdAt": "2026-03-11T09:00:00.000Z",
          "updatedAt": "2026-03-11T09:20:00.000Z"
        },
        "profileSnapshot": {
          "headline": "Frontend builder for sprint-paced campus projects",
          "intro": "짧은 주기의 데모 제작과 협업 문서화를 좋아합니다.",
          "openToRoles": ["frontend", "product"],
          "links": []
        },
        "onboardingKeywords": ["frontend", "hackathon"]
      },
      "result": {
        "feature": "resume",
        "target": "resume_summary",
        "generatedAt": "2026-03-11T10:50:04.000Z",
        "summaryNote": "2개의 제안을 현재 초안 기준으로 생성했습니다.",
        "suggestions": [
          {
            "id": "resume-summary-profile",
            "target": "resume_summary",
            "label": "프로필 연동형 요약",
            "rationale": "프로필 헤드라인과 온보딩 키워드를 요약 소개에 직접 반영했습니다.",
            "action": "replace",
            "confidence": "high",
            "valueType": "text",
            "value": "Frontend builder for sprint-paced campus projects. frontend, hackathon 주제에 강한 캠퍼스 프로젝트에서 빠르게 MVP를 정리하고 문서화하는 협업자입니다."
          },
          {
            "id": "resume-summary-impact",
            "target": "resume_summary",
            "label": "기여 강조형 요약",
            "rationale": "현재 초안의 톤을 유지하면서 실질적인 기여 포인트가 먼저 보이도록 바꿨습니다.",
            "action": "replace",
            "confidence": "medium",
            "valueType": "text",
            "value": "Frontend-focused collaborator for product demos and hackathon prototypes. 요구사항 정리부터 UI 구현, 발표용 polish까지 이어지는 end-to-end 기여를 강점으로 드러내 보세요."
          }
        ]
      },
      "error": null,
      "requestedAt": "2026-03-11T10:50:00.000Z",
      "startedAt": "2026-03-11T10:50:02.000Z",
      "completedAt": "2026-03-11T10:50:04.000Z",
      "updatedAt": "2026-03-11T10:50:04.000Z"
    },
    "providers": {
      "githubConnection": {
        "provider": "mock_github",
        "label": "Mock GitHub Connector"
      },
      "githubAnalysis": {
        "provider": "mock_analysis",
        "label": "Mock GitHub Analyzer"
      },
      "aiSuggestion": {
        "provider": "mock_suggestions",
        "label": "Mock Suggestion Engine"
      }
    },
    "dataSource": "mock"
  }
}
```

노트:

- recruit-post flow도 같은 job envelope를 사용하고, `target`만 `recruit_title | recruit_summary | recruit_description`로 바뀐다.
- Phase 3 C/D 브랜치는 `job.result.suggestions[]`의 `action`, `valueType`, `value`를 그대로 재사용해 preview/apply UX를 구성한다.

## 8) 오픈 이슈

- [ ] 실제 서비스 전환 시 인증 방식을 어떻게 추가할지
- [ ] localStorage fallback 데이터를 서버 DB로 마이그레이션할 방식
- [ ] 학교 인증, 신고, 관리자 기능을 어떤 API 단위로 확장할지
- [ ] 실제 GitHub OAuth/App 연결과 `openai` provider key를 어떤 시점에 mock provider에서 교체할지
