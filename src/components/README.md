# 공통 컴포넌트

두 개 이상의 feature에서 사용하는 재사용 UI를 둔다. 컴포넌트는 API 데이터, 인증, 권한, 라우트 정책을 직접 판단하지 않고 필요한 값을 props로 받는다.

## 안내와 도서 맥락 카드

- `Notice`는 `content`, `theme`, `iconType`, `icon`, `className`을 직접 받아 안내를 조합한다. 아이콘 타입은 `sparkles`, `shield-check`, `none`이다.
- `BookContext`는 `title`, `accentText`, `captionText`, `coverImageSrc`, `captionSize`, `className`을 각각 받는다. `coverImageSrc`에는 백엔드 표지 URL을 전달한다.
