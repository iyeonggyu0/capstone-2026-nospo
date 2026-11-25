# 초기 라우트 구조

피그마의 `화면 이동` 페이지에서 확인한 화면을 기준으로 URL을 구성했다. 현재 각 페이지는 구현 전 선언만 되어 있으며, 모두 `RootLayout` 안에서 렌더링된다.

| 피그마 화면                     | URL                           | 페이지                        |
| ------------------------------- | ----------------------------- | ----------------------------- |
| Onboarding                      | `/`                           | `OnboardingPage`              |
| Home                            | `/home`                       | `HomePage`                    |
| 읽기 기록                       | `/reading`                    | `ReadingPage`                 |
| 인증 A · 로그인                 | `/auth/login`                 | `AuthLoginPage`               |
| 인증 B · 회원가입               | `/auth/signup`                | `AuthSignupPage`              |
| 인증 C · 가입 완료              | `/auth/complete`              | `AuthCompletePage`            |
| 위키 도서 목록                  | `/wiki`                       | `WikiListPage`                |
| 이름·저자·ISBN 검색             | `/wiki/search/:searchType`    | `WikiSearchPage`              |
| 위키 정보 없음                  | `/wiki/add/empty`             | `WikiAddEmptyPage`            |
| 위키 내용 개요·인물/단체/관계도 | `/wiki/add/page`              | `WikiAddPage`                 |
| 신규 인물 추가                  | `/wiki/add/person`            | `WikiRegisterPersonPage`      |
| 상세 위키 + 제어                | `/wiki/:wikiId`               | `WikiDetailPage`              |
| 관계도 빈 상태·생성 중·완료     | `/wiki/:wikiId/relations`     | `WikiRelationshipPage`        |
| 기존 위키 수정 진입             | `/wiki/register`              | `WikiRegisterEntryPage`       |
| 기존 위키 인물 수정             | `/wiki/register/person`       | `WikiRegisterPersonPage`      |
| 위키 등록 - 단체                | `/wiki/register/group`        | `WikiRegisterGroupPage`       |
| 위키 등록 - 단체 상세           | `/wiki/register/group/detail` | `WikiRegisterGroupDetailPage` |
| 신청 위키 검수 A · 목록         | `/wiki/reviews`               | `WikiReviewListPage`          |
| 신청 위키 검수 B · 진행         | `/wiki/reviews/:reviewId`     | `WikiReviewProgressPage`      |
| 마이 A · 요약                   | `/my`                         | `MyPage`                      |
| 내 정보 변경                    | `/my/profile`                 | `MyProfilePage`               |
| 비밀번호 변경                   | `/my/password`                | `MyPasswordPage`              |

`searchType`에는 `name`, `author`, `isbn`을 사용한다. 실제 API 명세가 확정되면 동적 파라미터와 URL 이름을 함께 조정한다.

## 위키 작성·수정 흐름

```text
신규 작성: /wiki/add/empty → /wiki/add/page → /wiki/add/person
기존 위키 수정: /wiki/:wikiId → /wiki/register → /wiki/add/page (mode=UPDATE) → /wiki/register/person
```

도서, 읽은 지점, 수정 대상 인물 같은 화면 간 정보는 React Router location state로 전달한다. 따라서 상세 경로를 직접 열면 개발용 기본 도서가 표시되거나, 대상 인물 정보가 없어 위키 개요 화면으로 이동할 수 있다.
