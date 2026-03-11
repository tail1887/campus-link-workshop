# 06. Testing Playbook

이 문서는 팀원 각자의 Codex가 테스트를 같은 기준으로 만들고, PR 전에 무엇까지 검증해야 하는지 빠르게 이해하도록 돕는 실행 가이드다.

주의:

- 요구사항 기준은 `docs/01` ~ `docs/04`를 따른다.
- 이 문서는 테스트 생성과 검증 실행 방법을 Codex 친화적으로 정리한 보조 문서다.

## 1) 테스트 계층

이 프로젝트는 테스트를 아래 4단계로 나눈다.

1. 정적 검증
   - `npm run lint`
   - `npm run build`
2. 브랜치 단위 자동 테스트
   - 해당 브랜치가 책임지는 로직만 검증하는 unit / integration test
3. 브랜치 단위 수동 스모크 테스트
   - 담당 기능의 핵심 시나리오만 짧게 점검
4. 통합 수동 테스트
   - PR 머지 전 또는 데모 전 주요 흐름 전체 점검

## 2) 브랜치별 테스트 생성 원칙

- 한 브랜치는 자기 책임 범위에 대한 테스트만 추가한다.
- 다른 브랜치의 미완성 기능을 위해 테스트를 억지로 만들지 않는다.
- 공통 유틸을 건드리면 공통 테스트를 보강하고, 화면 브랜치면 해당 화면 시나리오만 보강한다.
- 외부 시스템은 mock 하되, 브랜치 핵심 로직은 가능한 실제 로직으로 검증한다.
- snapshot 테스트보다 입력/출력과 행동 검증을 우선한다.
- 테스트 파일은 기능과 같은 경계에 둔다.

## 3) 4인 브랜치별 테스트 책임

### A. `feature/data-foundation`

자동 테스트 우선순위:

- Prisma schema 검증
- repository layer unit test
- `/api/posts`, `/api/posts/[slug]`, `/api/posts/[slug]/apply` integration test
- migration 또는 seed 로직 검증

수동 스모크 테스트:

- 실제 DB 연결 후 게시글 생성/조회/지원 흐름이 최소 1회 성공하는지
- 잘못된 입력과 없는 리소스 접근이 에러로 처리되는지

### B. `feature/auth-campus-session`

자동 테스트 우선순위:

- 로그인/로그아웃 API integration test
- 세션 생성/만료 unit test
- 보호 라우트 / middleware 동작 테스트
- 인증 실패 / 권한 실패 케이스

수동 스모크 테스트:

- 로그인 성공 후 보호 페이지 진입
- 로그아웃 후 접근 차단
- 학교 이메일 인증 또는 허용 도메인 검증

### C. `feature/recruit-owner-dashboard`

자동 테스트 우선순위:

- 모집글 수정/삭제 API test
- 지원자 상태 변경 test
- 폼 검증 unit test
- owner 권한 체크 test

수동 스모크 테스트:

- 내 모집글 목록 진입
- 모집글 수정/삭제
- 지원자 상태 변경 후 UI 반영

### D. `feature/discovery-bookmark-history`

자동 테스트 우선순위:

- 검색/필터/정렬 로직 unit test
- 북마크 추가/해제 test
- 지원 이력 조회 test
- 개인화 홈 데이터 조합 test

수동 스모크 테스트:

- 검색어, 카테고리, 정렬 조합 확인
- 북마크 저장/해제 확인
- 지원 내역이 사용자 기준으로 올바르게 보이는지 확인

## 4) 분리된 테스트 생성 규칙

Codex가 테스트를 만들 때 아래 순서를 따른다.

1. 현재 브랜치가 책임지는 엔티티/화면/API를 다시 확인한다.
2. 실패했을 때 PR을 막아야 하는 핵심 규칙 3~5개를 먼저 고른다.
3. 그 규칙에 대해 자동 테스트를 먼저 추가한다.
4. 자동화가 어려운 UI/브라우저 상호작용은 수동 체크리스트로 남긴다.
5. 다른 브랜치 의존성이 있는 테스트는 TODO가 아니라 “현재 범위 밖”으로 명시한다.

## 5) Codex가 기본적으로 가능한 수동 테스트 범위

현재 이 저장소와 작업 환경 기준으로 Codex는 아래까지는 기본적으로 진행 가능하다.

- 로컬 서버 실행
- `npm run lint`, `npm run build`
- API route에 대한 HTTP 호출 검증
- 로그/에러 메시지 확인
- 정적 페이지와 라우트 존재 여부 점검
- 문서 체크리스트 기준의 테스트 시나리오 정리

현재 기본 환경만으로는 제한적인 부분:

- 실제 브라우저 클릭 기반 UI 상호작용 검증
- 반응형 레이아웃의 시각 품질 확인
- 애니메이션, hover, focus, drag 같은 인터랙션 체감 검증
- localStorage 기반 흐름의 실제 사용자 시점 점검

즉:

- Codex는 기본적으로 “준수동 smoke test”까지는 가능하다.
- 진짜 사용자 관점의 수동 테스트를 자동화하려면 Playwright 같은 브라우저 도구를 추가하는 것이 좋다.

## 6) 수동 테스트 운영 원칙

- Codex가 자동으로 검증 가능한 것은 먼저 Codex가 수행한다.
- 브라우저 상호작용이 중요한 것은 사람 또는 브라우저 자동화 도구가 확인한다.
- PR 본문에는 “Codex 확인 완료”와 “사람 확인 필요”를 구분해서 적는다.
- 데모 직전에는 전체 흐름을 사람이 한 번 더 확인한다.

## 7) Codex 테스트 프롬프트 예시

### 자동 테스트 생성용

```text
Read AGENTS.md and docs/01 through docs/06.
Work only inside branch <branch-name>.
Generate only the tests that belong to this branch scope.
Prefer blocking business rules and API behavior over broad snapshots.
At the end, summarize what was tested automatically and what still requires manual verification.
```

### PR 직전 검증용

```text
Read AGENTS.md and docs/01 through docs/06.
Review this branch from a testing perspective only.
List missing automated tests first, then list manual smoke checks that still need to be run.
Do not suggest tests outside this branch scope unless they block merge safety.
```

## 8) 추후 권장 확장

다음 단계에서 추가하면 좋은 것:

- Playwright 도입
- API integration test 러너 정착
- branch별 test 폴더 규칙 고정
- 데모 전 체크리스트를 GitHub issue template로 분리
