import { Suspense, lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from '@/components/layout/RootLayout'
import { ROUTES } from '@/constants/routes'

const AuthCompletePage = lazy(() => import('@/pages/AuthCompletePage'))
const AuthLoginPage = lazy(() => import('@/pages/AuthLoginPage'))
const AuthSignupPage = lazy(() => import('@/pages/AuthSignupPage'))
const HomePage = lazy(() => import('@/pages/HomePage'))
const MyPage = lazy(() => import('@/pages/MyPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'))
const WikiAddEmptyPage = lazy(() => import('@/pages/WikiAddEmptyPage'))
const WikiAddPagePage = lazy(() => import('@/pages/WikiAddPagePage'))
const WikiDetailPage = lazy(() => import('@/pages/WikiDetailPage'))
const WikiRegisterEntryPage = lazy(() => import('@/pages/WikiRegisterEntryPage'))
const WikiRegisterGroupDetailPage = lazy(() => import('@/pages/WikiRegisterGroupDetailPage'))
const WikiRegisterGroupPage = lazy(() => import('@/pages/WikiRegisterGroupPage'))
const WikiRegisterPersonPage = lazy(() => import('@/pages/WikiRegisterPersonPage'))
const WikiRelationshipPage = lazy(() => import('@/pages/WikiRelationshipPage'))
const WikiReviewListPage = lazy(() => import('@/pages/WikiReviewListPage'))
const WikiReviewProgressPage = lazy(() => import('@/pages/WikiReviewProgressPage'))
const WikiSearchPage = lazy(() => import('@/pages/WikiSearchPage'))

/** lazy page가 로드되는 동안 빈 상태를 렌더링한다. */
const renderPage = (Page) => (
  <Suspense fallback={null}>
    <Page />
  </Suspense>
)

/** 피그마 화면 이동 흐름을 기준으로 구성한 애플리케이션 라우터다. */
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: ROUTES.ONBOARDING, element: renderPage(OnboardingPage) },
      { path: ROUTES.HOME, element: renderPage(HomePage) },
      { path: ROUTES.AUTH_LOGIN, element: renderPage(AuthLoginPage) },
      { path: ROUTES.AUTH_SIGNUP, element: renderPage(AuthSignupPage) },
      { path: ROUTES.AUTH_COMPLETE, element: renderPage(AuthCompletePage) },
      { path: ROUTES.WIKI_SEARCH, element: renderPage(WikiSearchPage) },
      { path: ROUTES.WIKI_ADD_EMPTY, element: renderPage(WikiAddEmptyPage) },
      { path: ROUTES.WIKI_ADD_PAGE, element: renderPage(WikiAddPagePage) },
      { path: ROUTES.WIKI_DETAIL, element: renderPage(WikiDetailPage) },
      { path: ROUTES.WIKI_RELATION, element: renderPage(WikiRelationshipPage) },
      { path: ROUTES.WIKI_REGISTER, element: renderPage(WikiRegisterEntryPage) },
      { path: ROUTES.WIKI_REGISTER_PERSON, element: renderPage(WikiRegisterPersonPage) },
      { path: ROUTES.WIKI_REGISTER_GROUP, element: renderPage(WikiRegisterGroupPage) },
      {
        path: ROUTES.WIKI_REGISTER_GROUP_DETAIL,
        element: renderPage(WikiRegisterGroupDetailPage),
      },
      { path: ROUTES.WIKI_REVIEW_LIST, element: renderPage(WikiReviewListPage) },
      { path: ROUTES.WIKI_REVIEW_PROGRESS, element: renderPage(WikiReviewProgressPage) },
      { path: ROUTES.MY, element: renderPage(MyPage) },
      { path: '*', element: renderPage(NotFoundPage) },
    ],
  },
])
