import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { BottomNavigation } from './BottomNavigation'
import { Header } from './Header'

const getTodayLabel = () => {
  const today = new Date()
  return `${today.getMonth() + 1}월 ${today.getDate()}일`
}

const getHeaderProps = (pathname, search, navigate) => {
  if (pathname.startsWith('/wiki/search/')) {
    const type = pathname.split('/').at(-1)
    return {
      variant: 'back',
      hideLogo: true,
      onBack: () =>
        navigate(
          `${ROUTES.WIKI}${import.meta.env.DEV && new URLSearchParams(search).has('preview') ? '?preview' : ''}`,
        ),
      rightContent: { title: '도서 탐색', author: '저자 탐색', isbn: 'ISBN 검색' }[type],
    }
  }
  if (pathname === ROUTES.HOME) {
    return { title: '홈', rightContent: getTodayLabel(), compact: true }
  }

  if (pathname === ROUTES.WIKI) {
    return {
      title: '위키',
      rightContent: (
        <Link
          className="text-label font-medium text-text-primary"
          to={`${ROUTES.WIKI_SEARCH.replace(':searchType', 'title')}${import.meta.env.DEV && new URLSearchParams(search).has('preview') ? '?preview' : ''}`}
        >
          신규 도서 추가
        </Link>
      ),
    }
  }

  if (pathname === ROUTES.READING) {
    return {
      title: '기록',
      rightContent: (
        <button className="text-label font-medium text-text-primary" type="button">
          공유하기
        </button>
      ),
    }
  }

  if (pathname.startsWith(ROUTES.MY)) {
    return { title: 'MY' }
  }

  return {}
}

/** 헤더와 페이지 콘텐츠를 스크롤하고, 푸터는 프레임 하단에 고정한다. */
export const MainLayout = () => {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const usePageHeader =
    pathname.startsWith(ROUTES.WIKI_REVIEW_LIST) ||
    pathname === ROUTES.MY_PROFILE ||
    (pathname === ROUTES.MY && new URLSearchParams(search).get('view') === 'transactions')

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <main
        className={`min-h-0 flex-1 overflow-y-auto ${pathname.startsWith('/wiki/search/') ? 'bg-canvas' : 'bg-surface'}`}
      >
        {!usePageHeader && <Header {...getHeaderProps(pathname, search, navigate)} />}
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  )
}
