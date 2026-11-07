import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faKakaoTalk } from '@fortawesome/free-brands-svg-icons'
import { faAt } from '@fortawesome/free-solid-svg-icons'
import logo from '@/assets/logo.svg'
import logoText from '@/assets/logo-text.svg'
import { InputField } from '@/components/InputField'
import { validateFields } from '@/components/validateFields'
import { ROUTES } from '@/constants/routes'
import { authApi, authError, useAuth } from '@/features/auth'

/** 로그인 입력과 인증 수단을 안내한다. */
const AuthLoginPage = () => {
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()
  const setSession = useAuth((state) => state.setSession)

  const handleLogin = async (event) => {
    event.preventDefault()
    const fieldErrors = validateFields(event.currentTarget, {
      email: '올바른 이메일을 입력해 주세요.',
      password: '비밀번호를 입력해 주세요.',
    })
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length) return
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setNotice('')
    try {
      const result = await authApi.login(
        String(form.get('email')).trim().toLowerCase(),
        String(form.get('password')),
      )
      setSession(result)
      navigate(ROUTES.HOME, { replace: true })
    } catch (error) {
      setNotice(authError(error))
    } finally {
      setBusy(false)
    }
  }

  const showUnavailable = (event) => {
    event.preventDefault()
    setNotice('해당 기능은 준비 중입니다.')
  }

  return (
    <main className="h-full overflow-y-auto bg-surface">
      <div className="flex min-h-full flex-col px-5 py-5">
        <header className="pt-12">
          <div className="flex h-10 items-center gap-2" aria-label="NOSPO">
            <img src={logo} alt="" className="size-10" />
            <span
              aria-hidden="true"
              className="h-[19px] w-[84px] bg-teal-strong mask-contain mask-center mask-no-repeat"
              style={{ maskImage: `url(${logoText})` }}
            />
          </div>
          <h1 className="mt-2 text-headline font-bold">다시 만나 반가워요</h1>
          <p className="mt-2 text-body text-text-secondary">
            읽은 곳까지만 안전하게, 내 서재를 이어서 둘러보세요.
          </p>
        </header>

        <form
          className="mt-[52px] flex flex-col gap-4"
          onSubmit={handleLogin}
          noValidate
          onInput={(event) => setErrors((previous) => ({ ...previous, [event.target.name]: '' }))}
        >
          <InputField
            label="이메일"
            error={errors.email}
            type="email"
            name="email"
            placeholder="@email.com"
            autoComplete="email"
            required
          />
          <InputField
            label="비밀번호"
            error={errors.password}
            type="password"
            name="password"
            placeholder="비밀번호를 입력해 주세요"
            autoComplete="current-password"
            required
          />
          <button
            className="self-end text-label-sm font-medium text-teal-strong"
            type="button"
            onClick={showUnavailable}
          >
            비밀번호를 잊으셨나요?
          </button>
          <button
            className="h-12 cursor-pointer rounded-lg bg-teal-strong text-body font-medium text-white disabled:cursor-not-allowed"
            type="submit"
            disabled={busy}
          >
            {busy ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="mt-4 border-t border-border pt-4">
          <div className="flex justify-center gap-6">
            <button
              className="flex size-12 items-center justify-center rounded-full bg-[#fbe300] text-text-primary shadow-[0_0_4px_rgba(0,0,0,0.1)]"
              type="button"
              aria-label="카카오 로그인"
              onClick={showUnavailable}
            >
              <FontAwesomeIcon icon={faKakaoTalk} className="text-xl" />
            </button>
            <Link
              className="flex size-12 items-center justify-center rounded-full bg-surface text-text-muted shadow-[0_0_4px_rgba(0,0,0,0.1)]"
              to={ROUTES.AUTH_SIGNUP}
              aria-label="이메일로 회원가입"
            >
              <FontAwesomeIcon icon={faAt} />
            </Link>
          </div>
          <p className="mt-3 text-center text-caption text-text-secondary" role="status">
            {notice}
          </p>
        </div>
      </div>
    </main>
  )
}

export default AuthLoginPage
