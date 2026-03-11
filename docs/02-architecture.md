# 02. Architecture

## 1) 기술 스택 선택 이유

| 영역 | 선택 기술 | 선택 이유 | 대안 |
| --- | --- | --- | --- |
| Frontend | Next.js 16 + React 19 + TypeScript | Vercel 배포가 가장 자연스럽고 App Router로 페이지 구성과 SEO 대응이 쉽다. | Vite + React |
| Styling | Tailwind CSS 4 | 랜딩 페이지와 카드 UI를 빠르게 조합하고 발표용 시각 밀도를 높이기 좋다. | CSS Modules |
| Mock API | Next.js Route Handlers | 별도 서버 없이도 API 형태를 흉내 내며 데모 흐름과 문서 일관성을 맞출 수 있다. | 프론트엔드 전용 상태 관리 |
| Database Layer | Prisma + PostgreSQL | 실제 서비스 전환 시 repository contract를 유지하면서 관계형 데이터 모델을 확장하기 쉽다. | MongoDB |
| Demo Storage | 브라우저 localStorage fallback | DB 환경 변수가 없을 때도 발표용 흐름을 유지할 수 있다. | IndexedDB |
| Infra | Vercel | Next.js 기본 배포 플랫폼이며 워크숍 시연에 적합하다. | Netlify |

## 2) 시스템 구성

```mermaid
flowchart LR
    U["User"] --> FE["Next.js App Router UI"]
    FE --> API["Next.js Route Handlers (/api)"]
    FE --> LS["Browser localStorage (Fallback)"]
    FE --> TEMP["Branch-local Auth Entry Adapter"]
    API --> REPO["Recruit Repository"]
    REPO --> DB["Prisma + PostgreSQL"]
    REPO --> SEED["Seed Mock Data"]
    TEMP --> FE
```

설명:

- 프론트 역할: 랜딩, 목록, 상세, 글쓰기, 지원하기 화면 렌더링과 상호작용 처리
- API 역할: 목록/상세 조회와 생성/지원 응답 제공
- Repository 역할: `RECRUIT_DATA_SOURCE` 값에 따라 PostgreSQL 또는 mock 저장소를 선택
- 데이터 저장 방식: 기본값은 seed 데이터와 localStorage fallback, DB 모드에서는 Prisma를 통해 PostgreSQL 사용
- Phase 1 B 임시 인증 방식: `feature/p1-identity-contracts`가 머지되기 전까지는 branch-local auth entry adapter가 cookie 기반 임시 세션만 관리한다.

## 3) 레이어 구조

- App Router Page: 경로별 화면 구성
- UI Components: 카드, 배지, 헤더, 폼, CTA 등 재사용 컴포넌트
- Feature Layer: 모집글 목록 필터링, 글쓰기, 지원하기 흐름
- Branch-local Auth Entry Adapter: 로그인/회원가입 진입 상태와 보호 라우트 연결을 임시로 처리
- Recruit Repository: Prisma/PostgreSQL과 mock 저장소를 전환하는 유틸
- Route Handlers: `/api/posts`, `/api/posts/[slug]`, `/api/posts/[slug]/apply` 등 API 응답

현재 프로젝트 구조:

```text
prisma/
├─ schema.prisma
src/
├─ app/
│  ├─ api/
│  ├─ login/
│  ├─ recruit/
│  ├─ signup/
│  └─ page.tsx
├─ components/
├─ data/
├─ lib/
│  ├─ auth-entry/
└─ types/
```

## 4) 데이터 모델

### Entity A. RecruitPost

| 필드 | 타입 | 설명 | 필수 여부 |
| --- | --- | --- | --- |
| `id` | `string` | 내부 식별자 | Yes |
| `slug` | `string` | 상세 페이지 경로 식별자 | Yes |
| `title` | `string` | 모집글 제목 | Yes |
| `category` | `"study" | "project" | "hackathon"` | 모집 유형 | Yes |
| `campus` | `string` | 활동 캠퍼스 또는 온라인 여부 | Yes |
| `summary` | `string` | 카드용 요약 문장 | Yes |
| `description` | `string` | 상세 설명 | Yes |
| `roles` | `string[]` | 모집 역할 목록 | Yes |
| `techStack` | `string[]` | 사용 기술 | No |
| `capacity` | `number` | 추가 모집 인원 | Yes |
| `stage` | `string` | 아이디어 단계, 진행 중 등 상태 | Yes |
| `deadline` | `string` | 모집 마감일 | Yes |
| `createdAt` | `string` | 생성 시각 | Yes |
| `highlight` | `boolean` | 메인 강조 노출 여부 | Yes |

### Entity B. RecruitApplication

| 필드 | 타입 | 설명 | 필수 여부 |
| --- | --- | --- | --- |
| `id` | `string` | 내부 식별자 | Yes |
| `postSlug` | `string` | 지원 대상 모집글 slug | Yes |
| `name` | `string` | 지원자 이름 | Yes |
| `contact` | `string` | 이메일 또는 오픈채팅 링크 | Yes |
| `message` | `string` | 자기소개 및 지원 동기 | Yes |
| `createdAt` | `string` | 지원 시각 | Yes |

## 5) 정합성 규칙

- `slug`는 고유해야 한다.
- 글쓰기 폼의 필수 항목이 비어 있으면 게시글을 생성할 수 없다.
- 같은 모집글에 동일 연락처로 중복 지원하면 막아야 한다.
- `/recruit/new`와 `POST /api/posts`는 Phase 1 B의 임시 auth entry session이 있어야 접근할 수 있다.
- 임시 auth entry session의 shape는 shared contract가 아니라 branch-local adapter 내부에만 존재한다.
- `RECRUIT_DATA_SOURCE=database`일 때는 PostgreSQL이 source of truth가 된다.
- `RECRUIT_DATA_SOURCE=mock`일 때는 발표 재현성을 위해 seed 데이터와 localStorage fallback을 유지한다.

## 6) 핵심 시퀀스 다이어그램

### Flow A. 모집글 작성

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Next API
    participant R as Recruit Repository
    participant D as PostgreSQL or Mock

    C->>C: 입력값 검증
    C->>A: POST /api/posts
    A->>R: createRecruitPost()
    R->>D: write
    A-->>C: created payload
    C-->>C: 상세 페이지로 이동
```

### Flow B. 모집글 지원하기

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Next API
    participant R as Recruit Repository
    participant D as PostgreSQL or Mock

    C->>C: 지원 폼 작성
    C->>A: POST /api/posts/{slug}/apply
    A->>R: createRecruitApplication()
    R->>D: write
    A-->>C: accepted response
    C-->>C: 성공 상태 표시
```

## 7) 운영/배포 메모

- 실행 환경: Node.js 24 로컬 개발, Vercel 배포
- 환경 변수: `DATABASE_URL`, `RECRUIT_DATA_SOURCE`
- 임시 auth entry secret: `AUTH_ENTRY_SECRET` (없으면 개발용 기본값 사용)
- 배포 전략: GitHub 연동 후 Vercel에서 Next.js 프로젝트로 Import
- 로깅/모니터링 계획: 워크숍 MVP에서는 브라우저 콘솔과 Vercel 배포 로그 수준으로 제한
