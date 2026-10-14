import { useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { BottomNavigation } from './BottomNavigation'
import { Header } from './Header'

const getTodayLabel = () => {
  const today = new Date()
  return `${today.getMonth() + 1}월 ${today.getDate()}일`
}

const getHeaderProps = (pathname) => {
  if (pathname === ROUTES.HOME) {
    return { title: '홈', rightContent: getTodayLabel() }
  }

  if (pathname.startsWith('/wiki')) {
    return {
      title: '위키',
      rightContent: (
        <button className="text-label font-medium text-text-primary" type="button">
          신규 도서 추가
        </button>
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
export const MainLayout = ({ children }) => {
  const { pathname } = useLocation()

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <main className="min-h-0 flex-1 overflow-y-auto">
        <Header {...getHeaderProps(pathname)} />
        {children}
      </main>
      <BottomNavigation />
    </div>
  )
}
