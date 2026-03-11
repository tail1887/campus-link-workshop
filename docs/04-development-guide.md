# 04. Development Guide

## 1) 브랜치 전략

기본 원칙:

- `main` 브랜치에 직접 push 하지 않는다.
- 모든 작업은 별도 작업 브랜치에서 시작하고 PR로만 `main`에 머지한다.
- 한 브랜치는 하나의 결과물만 다룬다.

권장 브랜치 타입:

- `feature/<name>`
- `fix/<name>`
- `docs/<name>`
- `test/<name>`
- `chore/<name>`

예시 브랜치 분리:

1. `feature/home-landing`
2. `feature/recruit-list-detail`
3. `feature/recruit-create`
4. `feature/mock-apply-flow`
5. `chore/github-actions`
6. `docs/readme-demo-polish`

브랜치 생성 기준:

- 화면 단위
- mock API 단위
- 배포 / CI 단위
- 문서 / 발표 정리 단위
- DB scaffold / repository contract 단위

## 2) 커밋 규칙

커밋 메시지는 루트의 `.gitmessage.txt` 템플릿을 사용한다.

기본 헤더 형식:

```text
<type>: <subject>
```

권장 타입:

- `feat`
- `fix`
- `docs`
- `test`
- `chore`
- `refactor`

예시:

- `feat: add recruit list page`
- `feat: implement mock apply drawer`
- `fix: guard duplicate application in local storage`
- `docs: sync pipeline guide`

## 3) PR 규칙

- PR은 `.github/PULL_REQUEST_TEMPLATE.md`를 따른다.
- 변경 목적, 테스트 결과, 문서 반영 여부를 반드시 적는다.
- UI가 바뀌면 스크린샷 또는 짧은 설명을 넣는다.
- API나 데이터 구조가 바뀌면 관련 docs를 같은 PR에서 업데이트한다.
- 같은 저장소 내부 작업 브랜치의 PR은 열리거나 갱신될 때 `main` 최신 내용을 자동 병합 시도한다.
- 자동 병합 중 충돌이 나면 PR 코멘트 안내에 따라 로컬에서 직접 해결한 뒤 다시 push 한다.
- 팀원별 Codex 작업 시작 프롬프트와 파일 경계는 `docs/05-codex-collaboration-playbook.md`를 따른다.

## 4) CI / CD 규칙

- PR이 `main`으로 들어오면 GitHub Actions가 자동으로 `npm run lint`, `npm run build`를 실행한다.
- PR이 열리거나 갱신되면 GitHub Actions가 해당 브랜치에 `main` 최신 내용을 자동 병합 시도한다.
- `main` 머지 후 push가 발생하면 CI 성공을 확인한 뒤 Vercel 프로덕션 배포를 자동 실행한다.
- 프로덕션 배포 직전에는 `npm run db:deploy`가 실행되어 Prisma migration을 먼저 반영한다.
- 배포 워크플로는 GitHub Secrets의 `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`를 사용한다.

## 5) Codex 기준 구현 순서

1. Next.js 앱 부트스트랩
2. PostgreSQL / Prisma scaffold와 repository contract 추가
3. 공통 레이아웃과 디자인 토큰 구성
4. mock 데이터 모델과 API route 추가
5. 메인 랜딩 페이지 구현
6. 모집글 목록 / 상세 페이지 구현
7. 글쓰기 / 지원하기 플로우 구현
8. localStorage fallback과 DB 전환 경계 보강
9. lint / build 검증
10. Vercel 배포 점검
11. GitHub CI/CD와 협업 규칙 정리
12. README 발표용 정리

## 6) Codex 태스크 요청 방식

좋은 요청 예시:

- `docs/01-product-planning.md와 docs/02-architecture.md를 읽고 메인 랜딩 페이지를 구현해줘.`
- `docs/03-api-reference.md 기준으로 /api/posts와 /api/posts/[slug]를 mock으로 만들어줘.`
- `Prisma와 PostgreSQL scaffold를 추가하고 mock 저장소와 전환 가능한 repository contract를 만들어줘.`
- `글쓰기 페이지와 localStorage 저장 흐름만 먼저 구현해줘.`
- `배포 전에 README를 발표용 데모 시나리오 중심으로 다듬어줘.`
- `CI 실패 원인을 찾아서 고쳐줘.`

피해야 할 요청 예시:

- `전체 서비스 다 완성해줘`
- `DB도 붙이고 인증도 붙이고 디자인도 한 번에 다 해줘`
- `문서 안 보고 알아서 맞춰줘`

## 7) 테스트 전략

- Smoke Test: 메인 > 목록 > 상세 > 지원하기 > 글쓰기 흐름이 브라우저에서 이어지는지 확인
- DB Setup Test: `npm run db:generate`
- Migration Test: `npm run db:deploy`
- Lint Test: `npm run lint`
- Build Test: `npm run build`
- 브랜치별 자동/수동 테스트 분리 원칙은 `docs/06-testing-playbook.md`를 따른다.

최소 체크리스트:

- [ ] 메인 랜딩 페이지가 모바일과 데스크톱에서 깨지지 않는다
- [ ] 목록 필터와 검색이 동작한다
- [ ] 존재하지 않는 slug 접근 시 예외 처리가 된다
- [ ] 글쓰기 필수 항목 검증이 동작한다
- [ ] 동일 모집글에 대한 중복 지원이 막힌다
- [ ] `RECRUIT_DATA_SOURCE=mock`일 때 기존 데모 흐름이 유지된다
- [ ] `DATABASE_URL`과 `RECRUIT_DATA_SOURCE`가 문서에 반영되어 있다
- [ ] README와 docs가 최신 상태다

## 8) PR 체크리스트

- [ ] 한 PR은 한 화면 또는 한 흐름에 집중한다
- [ ] `main`에 직접 push 하지 않았다
- [ ] mock API나 데이터 구조 변경 시 `docs/03-api-reference.md`를 같이 업데이트했다
- [ ] DB schema나 repository contract 변경 시 `docs/02-architecture.md`를 같이 업데이트했다
- [ ] UI 흐름 변경 시 `README.md` 데모 시나리오를 점검했다
- [ ] `npm run lint`와 `npm run build` 결과를 확인했다
- [ ] 자동 테스트와 수동 테스트 범위를 구분해서 기록했다

## 9) 마일스톤 예시

### Milestone 1. 기반 구성

- Next.js / Tailwind 설치
- 문서 초안 확정
- 공통 레이아웃과 헤더 구성

### Milestone 2. 핵심 화면

- 메인 랜딩
- 모집글 목록
- 모집글 상세

### Milestone 3. 상호작용

- 글쓰기 mock
- 지원하기 mock
- localStorage 기반 데모 상태

### Milestone 4. 협업 자동화

- GitHub 저장소 연결
- PR CI 구성
- PR 브랜치 자동 main 동기화 구성
- main 자동 배포 구성
- 브랜치 보호 규칙 적용

## 10) 현재까지 진행 순서

워크숍 기준으로 현재 저장소는 아래 순서로 정리되었다.

1. docs-first 템플릿 복사와 프로젝트 문서 구체화
2. Next.js 앱 부트스트랩과 발표용 UI 구현
3. mock 데이터, 글쓰기, 지원하기, API route 구현
4. Vercel 수동 배포 검증 완료
5. 독립 Git 저장소 초기화
6. 브랜치 규칙, 커밋 템플릿, PR 템플릿 추가
7. PR CI, PR 브랜치 자동 동기화, main 자동 배포 GitHub Actions 추가
8. GitHub 공개 저장소 생성과 Vercel 시크릿 연결
9. main 브랜치 보호 규칙 적용

현재 완료 상태:

- [x] Vercel 프로덕션 수동 배포
- [x] PR용 CI 워크플로 작성
- [x] PR 브랜치 자동 main 동기화 워크플로 작성
- [x] main 자동 배포 워크플로 작성
- [x] 브랜치 / 커밋 / PR 규칙 문서화
- [x] GitHub 저장소 생성 및 첫 push
- [x] GitHub Secrets 등록
- [x] main 브랜치 보호 규칙 적용

## 11) 4인 확장 페이즈 계획

현재 MVP 다음 단계에서 4명이 병렬로 움직이려면, 기능을 한 번에 가로로 나누기보다 아래처럼 Phase 단위로 묶는 것이 안전하다.

주의:

- 이 섹션은 상위 페이즈 순서와 각 페이즈의 목표를 설명하는 개요다.
- 각 Phase 안에서 어떤 4개 브랜치로 나누는지, 무엇을 mock으로 먼저 만들 수 있는지, 어떤 계약을 먼저 고정해야 하는지는 `docs/05-codex-collaboration-playbook.md`를 따른다.

| Phase | 핵심 목표 | 대표 기능 | 다음 Phase의 선행 조건 |
| --- | --- | --- | --- |
| 1 | 계정과 온보딩 기반 고정 | 로그인 / 회원가입, 회원가입 설문, 사용자 기본 프로필, 관리자 기본 프로필 | 사용자 식별, 역할, 세션, 온보딩 상태가 고정되어야 한다 |
| 2 | 프로필 신뢰도와 커뮤니케이션 기반 고정 | 추가 인증, 인증 마크, 이력서 기본 편집, 문의하기, 알림 설정 | 프로필, 인증, 문의, 알림 관련 데이터 계약이 고정되어야 한다 |
| 3 | AI 보조 사용자 생산성 확장 | GitHub 등록, AI 프로젝트 분석, 이력서 AI 자동 완성, 모집글 자동 완성 | AI 입력 데이터와 응답 형식이 고정되어야 한다 |
| 4 | 관리자 운영과 자동화 확장 | 게시글 관리, AI 자동 필터링, 강도 조절, 문의 / 알림 운영 처리 | 운영 권한, moderation 결과, 알림 이벤트 계약이 고정되어야 한다 |

권장 진행 방식:

1. 각 Phase는 4개 작업 브랜치로 나누되, 한 브랜치는 그 Phase의 공통 계약과 데이터 경계를 먼저 고정한다.
2. 나머지 3개 브랜치는 UI shell과 feature-local adapter로 먼저 병렬 개발할 수 있다.
3. 공통 계약 브랜치가 머지되면 나머지 3개 브랜치는 즉시 `main`을 다시 동기화하고 shared contract로 교체한다.
4. 각 Phase의 4개 브랜치가 모두 merge-ready 상태가 되면 그 다음 Phase로 넘어간다.
