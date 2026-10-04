# 개발 품질 및 Git 워크플로

## 로컬 작업

- 브랜치는 `feat/login-page`, `fix/auth-redirect`처럼 type과 kebab-case 설명을 조합한다.
- 커밋은 `feat(scope): 변경 내용` 형식이며 scope는 kebab-case다.
- 허용 type: `feat`, `fix`, `design`, `style`, `refactor`, `perf`, `test`, `docs`, `chore`, `build`, `ci`, `revert`.
- Husky와 lint-staged는 커밋 전에 ESLint·Prettier를, Commitlint는 메시지 형식을 검사한다.

## PR 전 검증

```bash
npm run format:check
npm test
npm run lint
npm run build
```

## CI와 병합

- PR과 `main` push에서 `format`, `test`, `lint`, `build`, `commit-messages` 검사를 실행한다.
- `main-protection` Ruleset은 직접 push, force push, 브랜치 삭제를 막는다.
- 병합 전 모든 PR 대화를 해결하고 필수 status check를 통과한다.
- GitHub Copilot 자동 코드 리뷰는 사용하지 않는다. 리뷰가 필요하면 Codex에 수동으로 요청한다.

## 배포

- feature branch push 또는 PR 생성 시 Vercel Preview를 배포한다.
- `main` 병합 시 Vercel Production을 배포한다.
- GitHub Actions는 품질 검사만 맡으며, 별도 Actions 배포 workflow는 만들지 않는다.
