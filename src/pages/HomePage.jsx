import { BookContext } from '@/components/BookContext'
import { Notice } from '@/components/Notice'
import { Navigate } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { useAuth, useIsLoggedIn } from '@/features/auth'

/** 공통 컴포넌트를 홈 화면에서 한 번에 확인할 수 있는 테스트 영역이다. */
const HomePage = () => {
  const isLoggedIn = useIsLoggedIn()
  const status = useAuth((state) => state.status)
  const restoreSession = useAuth((state) => state.restoreSession)
  if (!isLoggedIn && (status === 'unknown' || status === 'checking')) {
    return (
      <p className="px-5 text-body text-text-secondary" role="status">
        로그인 상태를 확인하고 있어요.
      </p>
    )
  }
  if (!isLoggedIn && status === 'error') {
    return (
      <div className="space-y-3 px-5" role="alert">
        <p className="text-body text-text-secondary">
          로그인 상태를 확인하지 못했어요. 연결 상태를 확인해 주세요.
        </p>
        <button
          type="button"
          className="text-body font-medium text-teal-strong"
          onClick={restoreSession}
        >
          다시 시도
        </button>
      </div>
    )
  }
  if (!isLoggedIn) return <Navigate to={ROUTES.ONBOARDING} replace />
  return (
    <section className="space-y-6 px-5 pb-8">
      <div>
        <p className="text-label font-medium text-teal-strong">TEST</p>
        <h2 className="mt-1 text-headline font-bold text-text-primary">컴포넌트 테스트</h2>
        <p className="mt-1 text-body text-text-secondary">
          안내 문구와 현재 도서 카드의 상태별 표시를 확인합니다.
        </p>
      </div>

      <section className="space-y-3" aria-labelledby="notice-test-title">
        <h3 id="notice-test-title" className="text-title-sm font-bold text-text-primary">
          Notice 테스트
        </h3>
        <div className="space-y-2">
          <Notice
            theme="amber"
            content="검수 승인 시 AI 토큰 최대 10개를 보상으로 드려요."
            iconType="sparkles"
          />
          <Notice
            theme="teal"
            content="수정한 항목만 다시 제출하면 됩니다. 다른 내용은 그대로 유지돼요."
            iconType="shield-check"
          />
          <Notice
            theme="teal"
            content="제출이 되었어요! 검수가 끝나면 토큰이 지급될 예정입니다."
            iconType="none"
          />
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="book-context-test-title">
        <h3 id="book-context-test-title" className="text-title-sm font-bold text-text-primary">
          BookContext 테스트
        </h3>
        <div className="space-y-3">
          <BookContext
            title="애주가의 절주 일기"
            accentText="32화까지 읽음"
            captionText="스포일러 보호 중"
          />
          <BookContext
            title="애주가의 절주 일기"
            accentText="32화까지 반영"
            captionText="2026.10.01 제출"
          />
        </div>
      </section>
    </section>
  )
}

export default HomePage
