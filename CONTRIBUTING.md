# Contributing Guide

## 기본 원칙

- `main` 브랜치에 직접 push 하지 않습니다.
- 모든 작업은 새 브랜치에서 시작하고 PR로만 `main`에 반영합니다.
- 한 브랜치에는 하나의 결과물만 담습니다.

## 브랜치 네이밍

- `feature/<name>`: 사용자 기능 추가
- `fix/<name>`: 버그 수정
- `docs/<name>`: 문서 작업
- `test/<name>`: 테스트 추가/개선
- `chore/<name>`: 설정, CI, 리포지토리 관리

예시:

- `feature/recruit-detail`
- `fix/apply-duplicate-guard`
- `chore/github-actions`

## 커밋 템플릿

이 저장소는 루트의 `.gitmessage.txt`를 커밋 템플릿으로 사용합니다.

로컬 설정:

```bash
git config commit.template .gitmessage.txt
```

## PR 규칙

- `.github/PULL_REQUEST_TEMPLATE.md`를 따라 작성합니다.
- 변경 목적, 테스트 결과, 문서 반영 여부를 꼭 적습니다.
- UI 변경이 있으면 스크린샷 또는 동작 설명을 남깁니다.
- API/데이터 구조 변경은 관련 docs와 함께 올립니다.
- 같은 저장소 내부 브랜치 PR은 열리거나 업데이트될 때 `main` 최신 내용을 자동 병합합니다.
- 자동 병합 중 충돌이 나면 PR 코멘트를 확인하고 로컬에서 직접 충돌을 해결합니다.

## CI / CD

- PR to `main`: `npm run lint`, `npm run build`
- Push to `main`: CI 통과 후 Vercel 프로덕션 자동 배포
- PR opened / synchronized to `main`: `main` 최신 커밋 자동 동기화 시도

## 테스트 원칙

- 브랜치별 테스트 책임과 수동 테스트 범위는 `docs/06-testing-playbook.md`를 따릅니다.
- PR 본문에는 자동 테스트와 수동 테스트를 구분해서 적습니다.
- Codex가 직접 가능한 검증과 사람이 확인해야 하는 검증을 분리합니다.

GitHub Secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
