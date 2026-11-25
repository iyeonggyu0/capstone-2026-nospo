# 라우트

도메인별 라우트 정의를 둔다. 경로 값은 `src/constants/routes.js`에서 단일 관리하고, `router.jsx`는 페이지를 lazy loading으로 불러온다.

## 초기 화면 흐름

```text
온보딩 → 홈
인증: 로그인 → 회원가입 → 가입 완료
위키 추가: 검색 결과 없음 → 위키 내용 개요 → 신규 인물(`/wiki/add/person`)
위키 수정: 상세 → 수정 진입(`/wiki/register`) → 개요 → 기존 인물(`/wiki/register/person`)
등록: 등록 진입 → 인물 또는 단체 → 단체 상세
검수: 목록 → 진행
마이: 활동 요약
```

피그마 화면과 URL의 전체 매핑은 [문서](../../docs/routes.md)를 확인한다.
