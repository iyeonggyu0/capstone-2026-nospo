import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import { Header } from '@/components/layout/Header'
import { InputField } from '@/components/InputField'
import { validateFields } from '@/components/validateFields'
import { TermsView } from '@/components/TermsView'
import { ROUTES } from '@/constants/routes'
import { authApi, authError, confirmSignupEmail, isAuthMock, useAuth } from '@/features/auth'

/** 이메일 인증과 약관 동의를 거쳐 일반 회원으로 가입한다. */
const AuthSignupPage = () => {
  const navigate = useNavigate()
  const setSession = useAuth((state) => state.setSession)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [notice, setNotice] = useState('')
  const [email, setEmail] = useState('')
  const [proof, setProof] = useState(null)
  const [terms, setTerms] = useState([])
  const [consents, setConsents] = useState({})
  const [detail, setDetail] = useState(null)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [resendAt, setResendAt] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [errors, setErrors] = useState({})
  const attempt = useRef(null)
  const callbackToken = useRef(null)
  const [retryVerification, setRetryVerification] = useState(false)
  const mismatch = confirmation.length > 0 && password !== confirmation

  useEffect(() => {
    let active = true
    authApi
      .terms()
      .then((data) => {
        if (active) setTerms(data.items)
      })
      .catch((error) => {
        if (active) setNotice(authError(error))
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!resendAt) return
    const timer = window.setInterval(() => {
      const seconds = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000))
      setRemaining(seconds)
      if (seconds === 0) window.clearInterval(timer)
    }, 250)
    return () => window.clearInterval(timer)
  }, [resendAt])

  const confirmEmail = async (token) => {
    setBusy(true)
    try {
      const result = await confirmSignupEmail(token)
      setEmail(result.email)
      setProof(result)
      setNotice('')
      setRetryVerification(false)
      callbackToken.current = null
    } catch (error) {
      setNotice(authError(error))
      if (callbackToken.current === token) setRetryVerification(true)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token')
    if (!token || callbackToken.current === token) return
    callbackToken.current = token
    Promise.resolve().then(() => confirmEmail(token))
  }, [])

  const sendVerification = async () => {
    if (!email || !document.querySelector('#signup-email').checkValidity()) {
      setErrors((previous) => ({ ...previous, email: '올바른 이메일을 입력해 주세요.' }))
      return
    }
    setBusy(true)
    try {
      const result = await authApi.sendVerification(email.trim().toLowerCase())
      setProof(null)
      setSent(true)
      setRemaining(60)
      setResendAt(Math.max(Date.now() + 60000, Date.parse(result.resendAvailableAt) || 0))
      setNotice('')
    } catch (error) {
      setNotice(authError(error))
    } finally {
      setBusy(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const fieldErrors = validateFields(event.currentTarget, {
      nickname: '닉네임은 한글, 영문, 숫자, 밑줄 2~20자로 입력해 주세요.',
      phone: '연락처를 입력해 주세요.',
      email: '올바른 이메일을 입력해 주세요.',
      password: '비밀번호는 10~16자로 입력해 주세요.',
      confirmation: '비밀번호를 다시 입력해 주세요.',
    })
    if (password !== confirmation) {
      fieldErrors.confirmation = '비밀번호가 일치하지 않습니다.'
    }
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length) return
    if (
      !proof ||
      proof.email !== email.trim().toLowerCase() ||
      Date.parse(proof.expiresAt) <= Date.now()
    ) {
      if (proof && Date.parse(proof.expiresAt) <= Date.now()) {
        setProof(null)
        setSent(false)
      }
      setErrors((previous) => ({ ...previous, email: '이메일 인증을 완료해 주세요.' }))
      return
    }
    if (!terms.length || terms.some((term) => term.required && !consents[term.termVersionId])) {
      setNotice('필수 약관을 확인하고 동의해 주세요.')
      return
    }
    const form = new FormData(event.currentTarget)
    const nickname = String(form.get('nickname')).trim().normalize('NFC')
    const digits = String(form.get('phone')).replace(/[\s()-]/g, '')
    const phoneNumber = digits.startsWith('0') ? `+82${digits.slice(1)}` : digits
    if (!/^\+[1-9]\d{7,14}$/.test(phoneNumber)) {
      setErrors((previous) => ({ ...previous, phone: '올바른 휴대전화번호를 입력해 주세요.' }))
      return
    }
    const data = {
      nickname,
      emailProof: proof.emailProof,
      password,
      phoneNumber,
      consents: terms.map((term) => ({
        termVersionId: term.termVersionId,
        agreed: Boolean(consents[term.termVersionId]),
      })),
    }
    const fingerprint = JSON.stringify(data)
    if (attempt.current?.fingerprint !== fingerprint)
      attempt.current = { fingerprint, key: crypto.randomUUID() }
    setBusy(true)
    try {
      const result = await authApi.signup(data, attempt.current.key)
      setSession(result)
      navigate(ROUTES.AUTH_COMPLETE, {
        replace: true,
        state: { nickname: result.member.nickname, signedUp: true },
      })
    } catch (error) {
      setNotice(authError(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="h-full overflow-y-auto bg-surface">
      <Header variant="back" title="회원가입" onBack={() => navigate(ROUTES.AUTH_LOGIN)} />
      <div className="px-5 pb-6">
        <h2 className="mt-2 text-headline font-bold">내 독서 기준 만들기</h2>
        <p className="mt-1 text-body text-text-secondary">
          계정 정보는 다른 이용자에게 공개되지 않아요.
        </p>
        <form
          className="mt-4 space-y-4"
          onSubmit={handleSubmit}
          noValidate
          onInput={(event) => setErrors((previous) => ({ ...previous, [event.target.name]: '' }))}
        >
          <div className="space-y-[13px]">
            <InputField
              label="닉네임"
              error={errors.nickname}
              name="nickname"
              placeholder="책읽는새"
              autoComplete="nickname"
              required
              minLength={2}
              maxLength={20}
              pattern="[가-힣A-Za-z0-9_]{2,20}"
              title="닉네임은 한글, 영문, 숫자, 밑줄 2~20자로 입력해 주세요."
            />
            <InputField
              label="연락처"
              error={errors.phone}
              name="phone"
              placeholder="010-1234-5678"
              type="tel"
              autoComplete="tel"
              required
            />
            <InputField
              label="이메일"
              error={errors.email}
              id="signup-email"
              name="email"
              placeholder="@email.com"
              type="email"
              autoComplete="email"
              maxLength={254}
              value={email}
              readOnly={Boolean(proof)}
              onChange={(event) => {
                setEmail(event.target.value)
                setProof(null)
                setSent(false)
              }}
              action={
                !proof &&
                (remaining > 0 ? (
                  <span
                    className="text-caption-sm text-teal-strong"
                    aria-label={`재전송까지 ${remaining}초`}
                  >
                    {remaining}초
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={sendVerification}
                    disabled={busy}
                    aria-label="인증 메일 보내기"
                    className="-mr-2 flex size-9 cursor-pointer items-center justify-center pb-0.5 text-teal-strong disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={faPaperPlane} className="text-xs" />
                  </button>
                ))
              }
              required
            />
            {sent && !proof && (
              <div className="-mt-2">
                <p className="text-right text-caption-sm text-text-secondary">
                  메일에 포함된 인증 링크를 눌러주세요.
                </p>
                {isAuthMock && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => confirmEmail('dev-test')}
                    className="mt-1 w-full text-right text-label-sm font-medium text-teal-strong disabled:opacity-50"
                  >
                    테스트 인증 링크 확인
                  </button>
                )}
              </div>
            )}
            {proof && <p className="text-right text-caption-sm text-teal-strong">메일 인증 완료</p>}
            <InputField
              label="비밀번호"
              error={errors.password}
              name="password"
              placeholder="10~16자 비밀번호를 입력해 주세요"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={10}
              maxLength={16}
              title="비밀번호는 10~16자로 입력해 주세요."
              required
            />
            <InputField
              label="비밀번호 확인"
              error={errors.confirmation || (mismatch ? '비밀번호가 일치하지 않습니다.' : '')}
              name="confirmation"
              placeholder="비밀번호를 다시 입력해 주세요"
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              required
            />
          </div>

          <fieldset className="pt-1">
            <legend className="text-body font-medium">필수 약관 동의</legend>
            {terms.map((term) => (
              <div className="flex min-h-9 items-center gap-2" key={term.termVersionId}>
                <label className="flex flex-1 items-center gap-2">
                  <input
                    type="checkbox"
                    className="size-[18px] shrink-0 accent-teal-strong"
                    checked={Boolean(consents[term.termVersionId])}
                    onChange={(event) =>
                      setConsents({ ...consents, [term.termVersionId]: event.target.checked })
                    }
                    required={term.required}
                  />
                  <span className="flex flex-col">
                    <span className="text-label-sm font-medium">
                      {term.title}{' '}
                      <span className="text-caption font-normal text-teal-strong">
                        {term.required ? '필수' : '선택'}
                      </span>
                    </span>
                  </span>
                </label>
                <button
                  type="button"
                  className="min-h-9 text-label-sm font-medium text-teal-strong"
                  aria-label={`${term.title} 보기`}
                  onClick={async () => {
                    try {
                      const version = await authApi.term(term.termVersionId)
                      setDetail({ title: version.title, content: version.content })
                    } catch (error) {
                      setNotice(authError(error))
                    }
                  }}
                >
                  보기
                </button>
              </div>
            ))}
          </fieldset>
          {terms.length === 0 && (
            <p className="text-caption text-red-error">
              약관을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.
            </p>
          )}
          {notice && (
            <p role="status" className="text-caption text-red-error">
              {notice}
            </p>
          )}
          {retryVerification && (
            <button
              type="button"
              disabled={busy}
              onClick={() => confirmEmail(callbackToken.current)}
              className="text-label-sm font-medium text-teal-strong disabled:opacity-50"
            >
              이메일 인증 다시 시도
            </button>
          )}
          <button
            type="submit"
            disabled={busy || !terms.length}
            className="h-12 w-full rounded-lg bg-teal-strong text-body font-medium text-white"
          >
            {busy ? '처리 중...' : '가입하기'}
          </button>
          <p className="text-center text-caption text-text-secondary">
            이미 계정이 있나요?{' '}
            <Link
              className="ml-1 text-label-sm font-medium text-teal-strong"
              to={ROUTES.AUTH_LOGIN}
            >
              로그인
            </Link>
          </p>
        </form>
      </div>
      {detail && <TermsView {...detail} onClose={() => setDetail(null)} />}
    </main>
  )
}

export default AuthSignupPage
