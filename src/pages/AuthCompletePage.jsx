import { Link, Navigate, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBookmark, faCheck, faShieldHalved } from '@fortawesome/free-solid-svg-icons'
import { ROUTES } from '@/constants/routes'

/** 가입 완료 후 제공되는 서비스 안내를 보여준다. */
const AuthCompletePage = () => {
  const { state } = useLocation()
  const nickname = typeof state?.nickname === 'string' ? state.nickname : ''

  if (!state?.signedUp) return <Navigate to={ROUTES.AUTH_SIGNUP} replace />

  return (
    <main className="h-full overflow-y-auto bg-surface">
      <div className="flex min-h-full flex-col px-5 py-5">
        <div className="flex flex-col items-center pt-[76px] text-center">
          <div
            className="flex size-[72px] items-center justify-center rounded-full bg-teal-subtle text-2xl text-teal-strong"
            aria-hidden="true"
          >
            <FontAwesomeIcon icon={faCheck} />
          </div>
          <h1 className="mt-5 text-headline font-bold">
            {nickname ? `${nickname}님, 환영해요` : '환영해요'}
          </h1>
          <p className="mt-2 text-body text-text-secondary">
            NOSPO에서 읽은 지점을 기준으로
            <br />
            이야기를 안전하게 만나보세요.
          </p>
        </div>
        <div className="mx-auto mt-10 max-w-full px-2">
          {[
            [faBookmark, '읽은 지점을 먼저 기록해요', '그 이후의 정보는 자동으로 가려드려요.'],
            [faShieldHalved, '안전한 위키만 열어봐요', '관계와 답변도 내 진도 안에서 보여요.'],
          ].map(([icon, title, description]) => (
            <div className="flex items-center gap-3.5 py-4" key={title}>
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-teal-subtle text-teal-strong"
                aria-hidden="true"
              >
                <FontAwesomeIcon icon={icon} />
              </div>
              <div>
                <p className="text-body font-medium">{title}</p>
                <p className="mt-0.5 text-caption text-text-secondary">{description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-auto flex flex-col gap-2 pt-10 text-center text-body font-medium">
          <Link
            className="flex h-12 items-center justify-center rounded-lg bg-teal-strong text-white"
            to={ROUTES.HOME}
          >
            내 서재로 가기
          </Link>
          <Link
            className="flex h-12 items-center justify-center text-teal-strong"
            to={ROUTES.AUTH_LOGIN}
          >
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  )
}

export default AuthCompletePage
