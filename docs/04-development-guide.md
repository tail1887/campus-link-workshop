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
- 배포 워크플로는 GitHub Secrets의 `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`를 사용한다.

## 5) Codex 기준 구현 순서

1. Next.js 앱 부트스트랩
2. 공통 레이아웃과 디자인 토큰 구성
3. mock 데이터 모델과 API route 추가
4. 메인 랜딩 페이지 구현
5. 모집글 목록 / 상세 페이지 구현
6. 글쓰기 / 지원하기 mock 플로우 구현
7. localStorage 기반 데모 상태 보강
8. lint / build 검증
9. Vercel 배포 점검
10. GitHub CI/CD와 협업 규칙 정리
11. README 발표용 정리

## 6) Codex 태스크 요청 방식

좋은 요청 예시:

- `docs/01-product-planning.md와 docs/02-architecture.md를 읽고 메인 랜딩 페이지를 구현해줘.`
- `docs/03-api-reference.md 기준으로 /api/posts와 /api/posts/[slug]를 mock으로 만들어줘.`
- `글쓰기 페이지와 localStorage 저장 흐름만 먼저 구현해줘.`
- `배포 전에 README를 발표용 데모 시나리오 중심으로 다듬어줘.`
- `CI 실패 원인을 찾아서 고쳐줘.`

피해야 할 요청 예시:

- `전체 서비스 다 완성해줘`
- `DB도 붙이고 인증도 붙이고 디자인도 한 번에 다 해줘`
- `문서 안 보고 알아서 맞춰줘`

## 7) 테스트 전략

- Smoke Test: 메인 > 목록 > 상세 > 지원하기 > 글쓰기 흐름이 브라우저에서 이어지는지 확인
- Lint Test: `npm run lint`
- Build Test: `npm run build`

최소 체크리스트:

- [ ] 메인 랜딩 페이지가 모바일과 데스크톱에서 깨지지 않는다
- [ ] 목록 필터와 검색이 동작한다
- [ ] 존재하지 않는 slug 접근 시 예외 처리가 된다
- [ ] 글쓰기 필수 항목 검증이 동작한다
- [ ] 동일 모집글에 대한 중복 지원이 막힌다
- [ ] README와 docs가 최신 상태다

## 8) PR 체크리스트

- [ ] 한 PR은 한 화면 또는 한 흐름에 집중한다
- [ ] `main`에 직접 push 하지 않았다
- [ ] mock API나 데이터 구조 변경 시 `docs/03-api-reference.md`를 같이 업데이트했다
- [ ] UI 흐름 변경 시 `README.md` 데모 시나리오를 점검했다
- [ ] `npm run lint`와 `npm run build` 결과를 확인했다

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

## 11) 4인 확장 브랜치 계획

현재 MVP 다음 단계에서 4명이 병렬로 움직이려면 아래 순서가 가장 안전하다.

| 순서 | 브랜치 이름 | 핵심 목표 | 선행 의존성 | 병렬 가능 범위 |
| --- | --- | --- | --- | --- |
| 1 | `feature/data-foundation` | PostgreSQL/Prisma 도입, 실제 `User`, `RecruitPost`, `Application` 스키마와 repository layer 구축 | 없음 | 다른 브랜치는 mock UI 설계까지만 병행 |
| 2 | `feature/auth-campus-session` | 로그인, 세션, 학교 이메일 인증 흐름, 보호 라우트 추가 | `feature/data-foundation` 머지 후 | 로그인 화면/폼 UI는 미리 작업 가능 |
| 3 | `feature/recruit-owner-dashboard` | 내 모집글 관리, 수정/삭제, 지원자 상태 변경, 운영용 대시보드 | `feature/data-foundation`, `feature/auth-campus-session` | 대시보드 레이아웃과 컴포넌트는 mock으로 병행 가능 |
| 4 | `feature/discovery-bookmark-history` | 고급 검색/정렬, 북마크, 지원 내역, 개인화 홈 확장 | `feature/data-foundation` 필수, `feature/auth-campus-session` 권장 | 검색/정렬 UI는 먼저 작업 가능 |

권장 진행 방식:

1. 1번 브랜치를 가장 먼저 시작하고 가장 먼저 머지한다.
2. 2번은 1번의 스키마와 인증 토대가 보이면 바로 이어 붙인다.
3. 3번과 4번은 UI 셸을 현재 main의 mock 데이터로 먼저 만들고, 1번과 2번이 머지된 뒤 실제 API로 교체한다.
4. 각 브랜치 PR은 1개 목표만 다루고, 선행 브랜치가 머지되면 즉시 `main`을 다시 동기화한다.
