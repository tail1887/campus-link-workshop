# 03. API Reference

현재 앱은 기본적으로 mock 중심 데모 앱이지만, `RECRUIT_DATA_SOURCE=database`일 때는 PostgreSQL + Prisma를 사용하도록 scaffold가 준비되어 있다. 프론트와 문서 흐름을 맞추기 위해 Next.js Route Handler 형태의 API 계약을 정의한다.

## 1) 공통 규칙

- Base Path: `/api`
- Content-Type: `application/json`
- 시간 포맷: `ISO-8601`
- 키 네이밍: `camelCase`
- 인증 방식: 없음

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
| `201` | mock 생성 성공 |
| `202` | mock 지원 접수 성공 |
| `400` | 입력 오류 |
| `404` | 모집글 없음 |
| `409` | 중복 지원 등 충돌 |

## 3) 엔드포인트 목록

| Method | Endpoint | Auth | 설명 |
| --- | --- | --- | --- |
| `GET` | `/posts` | No | 모집글 목록 조회 |
| `GET` | `/posts/{slug}` | No | 모집글 상세 조회 |
| `POST` | `/posts` | No | 모집글 mock 생성 |
| `POST` | `/posts/{slug}/apply` | No | 지원하기 mock 제출 |

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
    "code": "DUPLICATE_APPLICATION",
    "message": "이미 같은 연락처로 지원한 기록이 있습니다."
  }
}
```

## 5) 오픈 이슈

- [ ] 실제 서비스 전환 시 인증 방식을 어떻게 추가할지
- [ ] localStorage fallback 데이터를 서버 DB로 마이그레이션할 방식
- [ ] 학교 인증, 신고, 관리자 기능을 어떤 API 단위로 확장할지
