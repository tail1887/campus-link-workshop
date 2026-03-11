# Campus Link

`Campus Link`는 대학생이 스터디와 프로젝트 팀원을 빠르게 찾고 연결할 수 있도록 만든 발표용 웹 플랫폼입니다.

## 프로젝트 소개

- 프로젝트 한 줄 소개: 캠퍼스 스터디/프로젝트 모집과 지원 흐름을 한 번에 보여주는 매칭 서비스
- 해결하려는 문제: 흩어진 모집글과 불명확한 팀 정보 때문에 팀원 탐색과 지원이 번거로운 문제
- 핵심 사용자: 스터디, 공모전, 사이드 프로젝트 팀원을 찾는 대학생
- 핵심 가치: 빠른 탐색, 선명한 정보 구조, 발표 친화적인 화면 구성
- 진행 기간 / 팀 규모: 워크숍 MVP / 3~4명 가정

## 기획 의도

- 기존 방식의 불편함: 모집 공고가 여러 커뮤니티와 채팅방에 흩어져 있다.
- 우리가 해결하려는 핵심 포인트: 모집글 탐색, 상세 확인, 지원하기를 하나의 제품 흐름으로 묶는다.
- 이번 MVP에서 집중한 가치: 배포 가능한 완성도와 발표 임팩트

## 핵심 기능

- 메인 랜딩 페이지
- 모집글 목록과 필터링
- 모집글 상세 보기
- 글쓰기 mock
- 지원하기 mock

## 데모 시나리오

1. 사용자는 메인 화면에서 인기 카테고리와 추천 모집글을 확인한다.
2. 모집글 목록으로 이동해 필터를 적용하고 관심 글을 선택한다.
3. 상세 화면에서 팀 소개와 모집 역할을 확인한 뒤 mock 지원을 완료한다.
4. 이어서 새 모집글을 작성하고 생성된 상세 화면까지 시연한다.

## 주요 화면 / 결과물

- 화면 1: 메인 랜딩과 추천 모집 섹션
- 화면 2: 모집글 목록과 필터 UI
- 화면 3: 모집글 상세와 지원하기 영역
- 화면 4: 글쓰기 폼과 생성 결과

## 아키텍처 요약

- 클라이언트: Next.js App Router
- 서버: Next.js Route Handlers + repository layer
- 데이터 저장소: 기본 mock seed + localStorage, 선택적으로 PostgreSQL + Prisma
- 인증 / 상태 관리: 인증 없음, 클라이언트 상태 중심
- 배포 방식: Vercel

## 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Next.js Route Handlers, Prisma |
| Database | PostgreSQL scaffold + mock seed + localStorage fallback |
| Infra | Vercel |
| Testing | ESLint, Next build smoke check |

## Quick Start

### 1) 로컬 실행

```bash
nvm install 24
nvm use
npm install
npm run dev
```

- App: `http://localhost:3000`
- API: `http://localhost:3000/api`
- macOS/Linux 팀원은 루트의 `.nvmrc` 기준으로 Node.js 24를 맞추면 됩니다.
- `npm install` 뒤에는 `postinstall`로 Prisma Client가 자동 생성되므로, 새 Mac 환경에서도 바로 타입 체크와 빌드가 안정적으로 맞춰집니다.
- 기본 실행 모드는 `RECRUIT_DATA_SOURCE="mock"` 이라서 로컬 PostgreSQL이나 `.env` 없이도 바로 화면 확인이 가능합니다.
- 개발 모드의 mock 회원가입/로그인은 로컬 상태 파일 `.local/mock-identity-state.json`에 유지되어, `npm run dev` 재시작 뒤에도 같은 계정으로 다시 로그인할 수 있습니다.

### 2) PostgreSQL 전환 시작

```bash
npm run db:generate
npm run db:push
```

- 먼저 `.env.example`을 복사해 `.env`를 만든 뒤 값을 채워 주세요.
- 기본값은 `RECRUIT_DATA_SOURCE="mock"` 입니다.
- PostgreSQL을 실제로 쓰려면 `.env`에서 `DATABASE_URL`을 채우고 `RECRUIT_DATA_SOURCE="database"`로 바꿔야 합니다.
- 스키마 변경을 배포 환경에 반영할 때는 `npm run db:deploy`를 사용합니다.

### 3) 검증

```bash
npm run lint
npm run build
```

## 배포 메모

- GitHub 저장소를 Vercel에 Import 하면 바로 배포 가능
- PostgreSQL 모드 배포 시에는 `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `RECRUIT_DATA_SOURCE` 환경 변수가 필요
- 2026-03-11 현재 Vercel 프로젝트는 Neon Postgres가 연결되어 있고, 프로덕션/프리뷰/개발 환경에 DB 연결 값이 등록되어 있다
- `main` 머지 후 GitHub Actions는 Vercel 프로덕션 배포 전에 `npm run db:deploy`로 Prisma migration을 자동 반영한다
- 로컬은 Docker 기반 PostgreSQL을 붙일 수 있고, 배포는 Neon 같은 관리형 PostgreSQL을 별도로 연결하는 구조
- GitHub Repository: [tail1887/campus-link-workshop](https://github.com/tail1887/campus-link-workshop)

## 프로젝트 문서

- [Codex 작업 규칙](AGENTS.md)
- [협업 가이드](CONTRIBUTING.md)
- [기획 문서](docs/01-product-planning.md)
- [아키텍처 문서](docs/02-architecture.md)
- [API 문서](docs/03-api-reference.md)
- [개발 가이드](docs/04-development-guide.md)
- [Codex 협업 플레이북](docs/05-codex-collaboration-playbook.md)
- [테스트 플레이북](docs/06-testing-playbook.md)

## 트러블슈팅 / 배운 점

- mock 데이터만으로도 발표 흐름을 완결하려면 UI와 데이터 계약을 먼저 맞추는 것이 중요하다.
- Vercel 배포를 빠르게 끝내려면 Next.js 기본 구조를 최대한 활용하는 편이 안전하다.

## Known Limitations

- 실제 회원가입, 학교 인증, 실시간 채팅은 아직 없다.
- 현재 기본 동작은 여전히 mock 저장소 기반이며, PostgreSQL 모드는 scaffold만 준비된 상태다.
- localStorage 기반 fallback이라 기기나 브라우저를 바꾸면 작성/지원 내역이 공유되지 않는다.
