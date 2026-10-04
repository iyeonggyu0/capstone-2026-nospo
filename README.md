# Frontend Architecture Guide

## 문서 안내

- [에이전트 작업 지침](AGENTS.md)
- [아키텍처 상세](docs/architecture.md)
- [개발 품질 및 Git 워크플로 상세](docs/development-workflow.md)
- [피그마 화면 기반 라우트 구조](docs/routes.md)

## 기술 스택

- React, JavaScript (`.js`, `.jsx`), Vite
- Tailwind CSS, React Router
- TanStack Query, Zustand, Axios

### 설치된 주요 패키지

- `react-router-dom`: 페이지 라우팅과 lazy loading
- `@tanstack/react-query`: 서버 데이터 조회·캐싱
- `zustand`: 공유 클라이언트 상태
- `axios`: 공통 API 클라이언트
- `tailwindcss`, `@tailwindcss/vite`: Tailwind CSS v4와 Vite 연동

## 폴더 구조

```text
src/
├─ components/              # 여러 기능에서 공유하는 UI
│  └─ layout/               # RootLayout, PageHeader, BottomNavigation
├─ constants/               # routes.js 등 상수
├─ features/                # 도메인별 기능
│  └─ {domain}/
│     ├─ api/               # API 요청 함수
│     ├─ components/        # 기능 전용 UI
│     ├─ hooks/             # Query, Mutation, 화면 제어 훅
│     ├─ utils.js           # 기능 전용 순수 함수
│     └─ index.js           # 외부 공개 API
├─ hooks/                   # 공통 훅
├─ lib/                     # api-client, query-client
├─ pages/                   # 라우트 연결과 feature 조합
├─ routes/                  # 도메인별 라우트 정의
└─ index.css                # 디자인 토큰 및 전역 스타일
```

## 아키텍처 규칙

- 모든 화면은 `RootLayout` 안에서 렌더링한다. `480px` 이하는 전체 모바일 뷰포트(`w-full`, `min-h-dvh`)를 사용하고, 그 이상은 최대 `390px`, 최소 높이 `844px`의 중앙 iPhone 프리뷰를 사용한다.
- `src/pages`는 라우트 파라미터, feature 조합, 페이지 단위 이동만 담당한다. API 요청, 재사용 UI, 복잡한 상태, 비즈니스 로직은 작성하지 않는다.
- 도메인 구현은 `src/features/{domain}`에 둔다. feature 외부에서는 반드시 해당 feature의 `index.js`만 import하며, 내부 파일을 직접 import하지 않는다.
- 두 개 이상의 feature에서 쓰는 코드는 `components`, `hooks`, `lib`, `constants`로 이동한다. 공통 레이어는 feature를 import하지 않는다.
- URL 문자열은 `src/constants/routes.js`에서 한 번만 정의하고, `src/routes`에서는 lazy loading을 적용한다.

## 서버 상태와 전역 상태

```text
API 호출 함수 → TanStack Query hook → 화면 컴포넌트
```

- HTTP 요청은 feature의 `api/`에 두고 공통 `apiClient`만 사용한다.
- 서버 데이터 조회·캐싱은 TanStack Query를 사용하며 Zustand에 중복 저장하지 않는다.
- Zustand는 로그인 UI, 필터, 모달처럼 여러 화면에서 공유하는 클라이언트 상태에만 사용한다.
- Mutation은 기본적으로 자동 재시도하지 않는다.

## 라우트 구조

피그마의 `화면 이동` 흐름을 기준으로 인증, 홈, 위키 검색·추가·상세·관계도·등록, 검수, 마이 화면의 초기 라우트를 구성했다. URL과 페이지의 전체 매핑은 [docs/routes.md](docs/routes.md)를 확인한다.

```text
/                           온보딩
/home                       홈
/auth/login                 로그인
/auth/signup                회원가입
/wiki/search/:searchType    이름·저자·ISBN 검색
/wiki/:wikiId               위키 상세
/wiki/:wikiId/relations     관계도
/wiki/register/*            위키 등록
/wiki/reviews/*             신청 위키 검수
/my                         마이 요약
```

## API 환경 설정

Axios는 개발 모드에서 `/api` 요청을 Vite 프록시로 전달하며, 기본 대상은 `http://localhost:8080`이다. 실제 개발·임시 API 또는 배포 API 주소는 `.env.example`을 복사한 뒤 로컬 환경 파일에 설정한다.

```bash
# 개발·임시 백엔드 주소
VITE_API_DEVELOPMENT_URL=http://localhost:8080

# 배포 백엔드 주소
VITE_API_PRODUCTION_URL=https://api.example.com
```

- 개발 서버에서는 브라우저가 `/api/*`로 요청하고 Vite가 `VITE_API_DEVELOPMENT_URL`로 전달한다.
- 프로덕션 빌드에서는 `VITE_API_PRODUCTION_URL`을 사용한다. 값이 없으면 같은 도메인의 `/api`를 사용한다.
- `.env.*` 파일은 Git에 포함하지 않는다. 배포 주소는 Vercel 환경 변수에도 `VITE_API_PRODUCTION_URL`로 등록한다.

## 스타일·UI·접근성 규칙

- Tailwind CSS와 기존 디자인 토큰을 우선 사용한다. 전역 색상·폰트·focus 스타일은 `src/index.css`에서 관리한다.
- 모바일 높이는 `h-screen`보다 `min-h-dvh`를 우선하며, 화면 크기에 따라 달라지는 요소는 고정 폭보다 `w-full`, `max-w-*`, `clamp()`를 사용한다.
- 공통 UI는 데이터나 정책을 소유하지 않는다. 필요한 값은 feature 또는 페이지가 props로 전달한다.
- 페이지 이동에는 `Link`, 동작 실행에는 `button`을 사용한다. 아이콘 버튼에는 접근 가능한 이름을 제공하고, 현재 링크에는 `aria-current="page"`를 준다.
- 클릭 요소는 약 `44px × 44px` 이상으로 유지한다. 로딩·빈·오류·재시도 상태를 구현하고 키보드 focus를 제거하지 않는다.

## 주석 및 함수 선언 규칙

- **중요한 핵심 함수, 컴포넌트, custom hook, API 함수, 복잡한 비즈니스 기능에는 한글 JSDoc 주석을 반드시 작성한다.**
- 주석은 대상 바로 위에 `/** ... */` 형식으로 작성하며, 기능의 역할과 필요 시 중요한 이유 또는 제약을 설명한다.
- 단순한 JSX, 자명한 변수, 한 줄짜리 표현식에는 불필요한 주석을 작성하지 않는다.
- 함수와 컴포넌트는 `function Func() {}`보다 화살표 함수인 `const Func = () => {}` 선언 방식을 우선 권장한다.
- hoisting이 필요하거나 함수 선언식이 더 명확한 경우에만 `function`을 사용한다.

```jsx
/** 선택한 부스를 관심 목록에 추가하거나 이미 추가된 경우 제거한다. */
const toggleFavoriteBooth = (boothId) => {
  // 상태 변경 로직
}

/** 공지 목록 서버 상태를 조회하고 캐싱한다. */
const useNotices = (page = 0) => {
  return useQuery({
    queryKey: ['notices', page],
    queryFn: () => getNotices(page),
  })
}

/** 공지 상세 내용을 표시하고 이전 화면으로 돌아갈 수 있게 한다. */
const NoticeDetailScreen = () => <section>{/* 화면 UI */}</section>
```

## 코드 품질

PR을 열기 전에 다음을 실행한다.

```bash
npm run format
npm test
npm run lint
npm run build
```

## 커밋 및 Pull Request 규칙

- Conventional Commits 형식을 사용한다. 예: `feat(booths): 부스 필터 추가`
- 커밋 전 변경 파일의 포맷과 린트를 실행한다.
- `main` 브랜치는 PR 없이 push하지 않는다. 승인 1명 이상, 모든 PR 대화 해결, CI 통과를 요구하며 force push와 브랜치 삭제를 금지한다.

PR 리뷰 체크:

- [ ] 페이지에 도메인 로직을 넣지 않았습니다.
- [ ] feature 내부 파일을 외부에서 직접 import하지 않았습니다.
- [ ] API 요청은 `apiClient`와 TanStack Query를 사용합니다.
- [ ] 중요한 함수·컴포넌트·기능에 한글 JSDoc(`/** */`) 주석을 작성했습니다.
- [ ] 함수와 컴포넌트는 화살표 함수 선언을 우선 적용했습니다.
- [ ] 로딩, 빈 상태, 오류 상태와 접근성을 확인했습니다.
- [ ] 480px 이하 모바일 화면과 데스크톱 프리뷰를 확인했습니다.

## 개발 품질 및 Git 워크플로

### 브랜치 운영

브랜치 이름은 아래 형식을 권장한다.

```text
feat/login-page
fix/auth-redirect
design/home-banner
refactor/api-client
```

현재 GitHub 저장소에서는 브랜치 이름을 자동으로 강제하지 않는다. 팀원은 권장 형식을 따른다.

### 커밋 메시지

커밋은 Conventional Commits 형식을 사용한다.

```text
feat(scope): 변경 내용
```

허용하는 type은 `feat`, `fix`, `design`, `style`, `refactor`, `perf`, `test`, `docs`, `chore`, `build`, `ci`, `revert`다. `scope`는 kebab-case로 작성한다.

```text
feat(auth): 로그인 화면 추가
fix(api-client): API 오류 처리 수정
design(home): 메인 배너 여백 조정
refactor(components): 공통 버튼 구조 정리
docs(readme): 개발 규칙 문서화
```

### 로컬 커밋 검사

커밋 전 Husky와 lint-staged가 자동으로 다음을 실행한다.

```text
git commit
  ├─ 변경된 JS/JSX 파일 ESLint 검사 및 자동 수정
  ├─ 변경된 파일 Prettier 포맷
  └─ Commitlint 커밋 메시지 형식 검사
```

PR 전에는 다음을 실행한다.

```bash
npm run format
npm test
npm run lint
npm run build
```

### GitHub Actions

PR과 `main` 브랜치 push 시 `format`, `test`, `lint`, `build` 검사를 실행한다. PR의 커밋 메시지가 Conventional Commits 형식을 따르는지 `commit-messages` 검사도 실행한다.

GitHub Actions workflow를 저장소에 push한 뒤, 해당 검사는 `main` 병합의 필수 조건으로 설정한다.

```text
format · test · lint · build
commit-messages
```

### main 브랜치 보호

`main` 브랜치에는 GitHub Ruleset `main-protection`을 적용한다.

- `main`에 직접 push하지 않는다. 모든 변경은 Pull Request로 병합한다.
- PR의 모든 대화를 해결한 뒤에만 병합한다.
- force push와 브랜치 삭제를 차단한다.
- Copilot 자동 코드 리뷰 ruleset은 사용하지 않는다.
- CI workflow가 한 번 실행된 후 `format · test · lint · build`, `commit-messages`를 merge 필수 status check로 추가한다.

### AI 코드 리뷰

GitHub Copilot 자동 코드 리뷰는 사용하지 않는다. 코드 리뷰가 필요하면 Codex에게 수동으로 요청한다.

```text
현재 변경사항을 main 브랜치 기준으로 코드리뷰해줘.
버그, React 구조 위반, API/상태 관리 문제, 접근성, 모바일 UI 회귀를 확인해줘.
수정은 하지 말고 리뷰만 해줘.
```

PR 생성 후에는 아래처럼 요청할 수 있다.

```text
PR 코드리뷰해줘.
필수 수정 사항만 우선순위와 파일/라인 기준으로 알려줘.
```

### Vercel 배포

Vercel과 GitHub 저장소를 연결해 배포한다.

```text
feature branch push 또는 PR 생성 → Vercel Preview 배포
main 브랜치 병합 → Vercel Production 배포
```

GitHub Actions는 코드 품질 검사만 담당하며, 별도의 GitHub Actions 배포 workflow는 사용하지 않는다.
