import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import { Header } from '@/components/layout/Header'
import { InputField } from '@/components/InputField'
import { ROUTES } from '@/constants/routes'
import { authApi, authError, isAuthMock, useAuth } from '@/features/auth'

/** 이메일 인증 후 비밀번호를 재설정한다. */
const AuthPasswordResetPage = () => {
  const navigate = useNavigate()
  const { search } = useLocation()
  const loginPath = `${ROUTES.AUTH_LOGIN}${isAuthMock ? search : ''}`
  const clearSession = useAuth((state) => state.clearSession)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [verification, setVerification] = useState(null)
  const [proof, setProof] = useState(null)
  const [step, setStep] = useState('verify')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [errors, setErrors] = useState({})
  const [resendAt, setResendAt] = useState(0)
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (!resendAt) return
    const update = () => setRemaining(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)))
    update()
    const timer = window.setInterval(() => {
      update()
      if (Date.now() >= resendAt) window.clearInterval(timer)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendAt])

  const send = async () => {
    if (!document.getElementById('reset-email').checkValidity()) {
      setErrors({ email: '올바른 이메일을 입력해 주세요.' })
      return
    }
    setBusy(true)
    setNotice('')
    setErrors({})
    try {
      const result = await authApi.sendPasswordReset(email.trim().toLowerCase())
      setVerification(result)
      setCode('')
      setProof(null)
      setResendAt(Math.max(Date.now() + 60000, Date.parse(result.resendAvailableAt) || 0))
      setRemaining(60)
    } catch (error) {
      setNotice(authError(error))
    } finally {
      setBusy(false)
    }
  }

  const next = async (event) => {
    event.preventDefault()
    setNotice('')
    setErrors({})
    if (step === 'verify') {
      if (!verification || !/^\d{6}$/.test(code)) {
        setErrors({ code: '이메일로 받은 6자리 인증번호를 입력해 주세요.' })
        return
      }
      setBusy(true)
      try {
        const result = await authApi.verifyPasswordReset(verification.verificationId, code)
        setProof(result)
        setStep('password')
      } catch (error) {
        if (error.response?.data?.error?.code === 'INVALID_VERIFICATION_CODE') {
          setErrors({ code: authError(error) })
        } else {
          setNotice(authError(error))
        }
      } finally {
        setBusy(false)
      }
      return
    }
    if (
      password.length < 10 ||
      password.length > 16 ||
      !confirmation ||
      password !== confirmation
    ) {
      setErrors({
        ...(password.length < 10 || password.length > 16
          ? { password: '비밀번호는 10~16자로 입력해 주세요.' }
          : {}),
        ...(!confirmation
          ? { confirmation: '비밀번호를 다시 입력해 주세요.' }
          : password !== confirmation
            ? { confirmation: '비밀번호가 일치하지 않습니다.' }
            : {}),
      })
      return
    }
    if (!proof || Date.parse(proof.expiresAt) <= Date.now()) {
      setNotice('인증이 만료되었습니다. 다시 인증해 주세요.')
      setProof(null)
      setVerification(null)
      setStep('verify')
      return
    }
    setBusy(true)
    try {
      await authApi.completePasswordReset(proof.resetProof, password)
      clearSession()
      window.alert('비밀번호가 변경되었습니다. 다시 로그인해 주세요.')
      navigate(loginPath, { replace: true })
    } catch (error) {
      setNotice(authError(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex h-full flex-col overflow-y-auto bg-surface">
      <Header
        variant="back"
        title="비밀번호 변경"
        onBack={() => (step === 'password' ? setStep('verify') : navigate(loginPath))}
      />
      <form className="flex flex-1 flex-col px-5 pb-5" onSubmit={next} noValidate>
        {step === 'verify' && (
          <div className="mt-3 rounded-xl bg-canvas px-4 py-3">
            <p className="text-label-sm font-medium">
              ● &nbsp;{step === 'verify' ? '본인 확인' : '새 비밀번호 설정'}
            </p>
            <p className="mt-0.5 ml-4 text-caption text-text-secondary">
              {step === 'verify'
                ? verification
                  ? '메일이 발송되었습니다. 인증번호를 입력하세요.'
                  : '가입한 이메일로 인증번호를 받아주세요.'
                : '새로운 비밀번호를 입력해 주세요.'}
            </p>
          </div>
        )}
        {step === 'verify' ? (
          <div className="mt-4 space-y-4">
            <InputField
              label="이메일"
              error={errors.email}
              id="reset-email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setErrors((previous) => ({ ...previous, email: '' }))
                setVerification(null)
                setProof(null)
                setCode('')
              }}
              placeholder="@email.com"
              action={
                remaining > 0 ? (
                  <span
                    className="text-caption-sm text-teal-strong"
                    aria-label={`재전송까지 ${remaining}초`}
                  >
                    {remaining}초
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={send}
                    disabled={busy}
                    aria-label="인증 메일 보내기"
                    className="flex h-9 items-center p-0 text-teal-strong disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={faPaperPlane} className="text-xs" />
                  </button>
                )
              }
            />
            <InputField
              label="인증 번호"
              error={errors.code}
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => {
                setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                setErrors((previous) => ({ ...previous, code: '' }))
              }}
              placeholder="인증번호 6자리"
              disabled={!verification}
            />
            {isAuthMock && verification && (
              <p className="text-caption text-text-secondary">
                미리보기에서는 6자리 숫자를 입력해 주세요.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <InputField
              label="새 비밀번호"
              error={errors.password}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setErrors((previous) => ({ ...previous, password: '', confirmation: '' }))
              }}
              maxLength={16}
              placeholder="10~16자 비밀번호를 입력해 주세요"
            />
            <InputField
              label="새 비밀번호 확인"
              error={errors.confirmation}
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => {
                setConfirmation(event.target.value)
                setErrors((previous) => ({ ...previous, confirmation: '' }))
              }}
              maxLength={16}
              placeholder="비밀번호를 다시 입력해 주세요"
            />
          </div>
        )}
        {notice && (
          <p role="alert" className="mt-3 text-caption text-red-error">
            {notice}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="mt-auto h-12 rounded-xl bg-teal-strong text-body font-medium text-white disabled:opacity-50"
        >
          {busy ? '처리 중...' : step === 'verify' ? '다음' : '완료'}
        </button>
      </form>
    </main>
  )
}

export default AuthPasswordResetPage
