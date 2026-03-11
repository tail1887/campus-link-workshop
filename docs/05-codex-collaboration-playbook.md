# 05. Codex Collaboration Playbook

이 문서는 사람 온보딩용 설명서보다, 팀원 각자의 Codex가 같은 프로젝트 규칙을 빠르게 읽고 같은 방식으로 움직이게 하기 위한 운영 가이드다.

주의:

- 이 문서는 `docs/01` ~ `docs/04`를 보조하는 실행 가이드다.
- 요구사항과 설계 충돌 시에는 항상 `docs/01` ~ `docs/04`를 우선한다.

## 1) Codex 시작 순서

각 팀원은 새 작업을 시작할 때 Codex에게 아래 순서로 읽게 한다.

1. `AGENTS.md`
2. `docs/01-product-planning.md`
3. `docs/02-architecture.md`
4. `docs/03-api-reference.md`
5. `docs/04-development-guide.md`
6. 이 문서의 본인 담당 브랜치 섹션

## 2) 공통 시작 프롬프트

모든 팀원이 공통으로 쓸 수 있는 기본 프롬프트:

```text
Read AGENTS.md and docs/01-product-planning.md through docs/05-codex-collaboration-playbook.md.
Work only inside the scope of branch <branch-name>.
Before coding, summarize the assigned outcome, allowed files, and dependent branches.
Then implement only that branch scope, run lint/build if relevant, and prepare a PR-ready summary.
```

## 3) Codex 작업 원칙

- 한 Codex는 한 브랜치의 한 결과만 다룬다.
- 담당 브랜치 범위를 벗어난 파일은 수정하지 않는다.
- 스키마/API 변경이 있으면 관련 docs를 같은 브랜치에서 업데이트한다.
- PR 전에는 `main` 최신 내용이 반영됐는지 확인한다.
- 충돌이 나면 기능을 더 밀어붙이지 말고 충돌 해결 후 다시 진행한다.

## 4) 4인 브랜치 분해표

| 담당 | 브랜치 이름 | 목표 | 선행 의존성 | Codex가 먼저 읽을 것 |
| --- | --- | --- | --- | --- |
| A | `feature/data-foundation` | Prisma, PostgreSQL, 실제 데이터 모델, repository layer | 없음 | `docs/02`, `docs/03` |
| B | `feature/auth-campus-session` | 로그인, 세션, 학교 이메일 인증, 보호 라우트 | A | `docs/02`, `docs/03`, A 브랜치 PR/머지 내용 |
| C | `feature/recruit-owner-dashboard` | 내 모집글 관리, 지원자 관리, 수정/삭제 | A, B 권장 | `docs/01`, `docs/02`, `docs/03` |
| D | `feature/discovery-bookmark-history` | 검색/정렬 고도화, 북마크, 지원 내역, 개인화 홈 | A 필수, B 권장 | `docs/01`, `docs/02`, `docs/03` |

## 5) 브랜치별 파일 경계

Codex가 충돌을 줄이려면 브랜치마다 우선 수정 영역을 명확히 가져가는 게 좋다.

### A. `feature/data-foundation`

주 수정 영역:

- `prisma/`
- `src/lib/server/`
- `src/types/`
- `src/app/api/`
- `docs/02-architecture.md`
- `docs/03-api-reference.md`

가능하면 건드리지 말 것:

- 메인 랜딩 UI
- 목록/상세 레이아웃 전반

### B. `feature/auth-campus-session`

주 수정 영역:

- `src/app/(auth 관련 경로 추가 시 해당 폴더)`
- `src/lib/auth/`
- `middleware.ts`
- `src/app/api/auth/`
- `docs/02-architecture.md`
- `docs/03-api-reference.md`

가능하면 건드리지 말 것:

- 데이터 스키마 전체 재설계
- 검색/북마크 UI

### C. `feature/recruit-owner-dashboard`

주 수정 영역:

- `src/app/recruit/`
- `src/components/`
- `src/app/api/posts/`
- `docs/03-api-reference.md`

가능하면 건드리지 말 것:

- 인증 핵심 로직
- Prisma schema

### D. `feature/discovery-bookmark-history`

주 수정 영역:

- `src/app/`
- `src/components/`
- `src/lib/`
- `docs/01-product-planning.md`
- `docs/03-api-reference.md`

가능하면 건드리지 말 것:

- 세션/로그인 핵심 로직
- DB migration 파일

## 6) 브랜치별 Codex 프롬프트 예시

### A 담당

```text
Read AGENTS.md, docs/01-product-planning.md, docs/02-architecture.md, docs/03-api-reference.md, docs/04-development-guide.md, and docs/05-codex-collaboration-playbook.md.
Implement only feature/data-foundation.
Focus on Prisma schema, repository layer, and replacing mock API storage boundaries without redesigning the UI.
Update architecture and API docs in the same branch.
```

### B 담당

```text
Read AGENTS.md and docs/01 through docs/05.
Implement only feature/auth-campus-session on top of the merged data foundation.
Add login/session/campus email verification foundations and protected routes.
Do not redesign recruit UI outside auth-related guard changes.
```

### C 담당

```text
Read AGENTS.md and docs/01 through docs/05.
Implement only feature/recruit-owner-dashboard.
Build the owner's recruit management flow and applicant management UI.
If auth or DB pieces are still incomplete, keep the UI shell mock-friendly and document assumptions.
```

### D 담당

```text
Read AGENTS.md and docs/01 through docs/05.
Implement only feature/discovery-bookmark-history.
Focus on advanced discovery, bookmark, and application history UX without changing unrelated admin or auth internals.
Document any temporary mock assumptions clearly.
```

## 7) PR 직전 Codex 체크 프롬프트

PR 올리기 전에 각 팀원은 아래 프롬프트를 한 번 더 쓰는 것이 좋다.

```text
Review this branch only against AGENTS.md and docs/01 through docs/05.
Check whether the changes stayed within the assigned branch scope, whether any required docs are missing, and whether lint/build are needed before PR.
List only blocking findings first.
```

## 8) 팀 운영 팁

- 팀장은 먼저 각 브랜치 담당자에게 브랜치 이름을 고정해서 배정한다.
- Codex에게는 “전체 프로젝트”가 아니라 “지금 네 브랜치”만 맡긴다.
- 브랜치가 커지기 시작하면 다시 더 쪼개고, 이름을 유지한 채 하위 PR로 나눈다.
- 같은 파일을 두 브랜치가 동시에 건드려야 한다면 먼저 파일 경계를 다시 나눈다.
