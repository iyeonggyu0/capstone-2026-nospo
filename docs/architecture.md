# 프론트엔드 아키텍처

## 계층과 의존성

```text
pages → features → shared components/hooks/lib/constants
```

- `pages/`는 라우트 연결, 라우트 파라미터 처리, feature 조합만 담당한다.
- `features/{domain}/`은 도메인별 `api/`, `components/`, `hooks/`, `utils.js`, `index.js`를 둔다.
- feature 외부에서는 내부 파일이 아닌 `index.js`로만 import한다.
- 공통 레이어는 feature를 import하지 않는다.

## 데이터 흐름

```text
apiClient → features/{domain}/api → TanStack Query hook → 화면 컴포넌트
```

- 서버 데이터는 TanStack Query가 조회·캐싱한다.
- Zustand는 필터, 모달, 로그인 UI처럼 여러 화면에서 공유하는 클라이언트 상태만 가진다.
- Mutation은 기본적으로 자동 재시도하지 않는다.

## 화면과 스타일

- 모든 화면은 `RootLayout`에서 렌더링한다.
- `480px` 이하는 `w-full`, `min-h-dvh`를 쓰며 전체 뷰포트를 사용한다.
- `481px` 이상은 중앙의 최대 폭 `390px`, 최소 높이 `844px` 미리보기를 유지한다.
- Tailwind CSS와 `src/index.css`의 디자인 토큰을 우선 사용한다.

## 코드·접근성 기준

- 핵심 함수·컴포넌트·hook·API·복잡한 기능에는 한글 `/** */` JSDoc을 작성한다.
- 화살표 함수 선언을 우선한다.
- 이동은 `Link`, 실행은 `button`을 사용한다.
- 아이콘 버튼의 접근 가능한 이름, 44px 이상의 클릭 영역, 로딩·빈·오류 상태, 키보드 focus를 확인한다.
