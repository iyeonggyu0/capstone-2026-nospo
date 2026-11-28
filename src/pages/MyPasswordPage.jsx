import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { InputField } from '@/components/InputField'
import { Button } from '@/components/common-ui'
import { ROUTES } from '@/constants/routes'
import { useAuth, useIsLoggedIn } from '@/features/auth'
import { myApi } from '@/features/my'

/** 현재 비밀번호를 확인해 새 비밀번호를 저장하고 다시 로그인하도록 안내한다. */
const MyPasswordPage = () => {
  const loggedIn = useIsLoggedIn({ persistPreview: false })
  const status = useAuth((s) => s.status)
  const restoreSession = useAuth((s) => s.restoreSession)
  const clearSession = useAuth((s) => s.clearSession)
  const navigate = useNavigate()
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    if (!current || password.length < 10 || password.length > 16 || password !== confirmation) {
      setError('현재 비밀번호와 새 비밀번호 10~16자 및 확인란을 확인해 주세요.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await myApi.changePassword(current, password)
      clearSession()
      navigate(ROUTES.AUTH_LOGIN, {
        replace: true,
        state: { message: '비밀번호가 변경되었어요. 다시 로그인해 주세요.' },
      })
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          '비밀번호를 변경하지 못했어요. 현재 비밀번호를 확인해 주세요.',
      )
    } finally {
      setBusy(false)
    }
  }
  if (!loggedIn && (status === 'unknown' || status === 'checking'))
    return <p className="px-5 py-6">로그인 상태를 확인하고 있어요.</p>
  if (!loggedIn && status === 'error')
    return (
      <button className="px-5 py-6 text-teal-strong" onClick={restoreSession}>
        로그인 상태 다시 확인
      </button>
    )
  if (!loggedIn) return <Navigate to={ROUTES.ONBOARDING} replace />
  return (
    <form onSubmit={submit} className="flex min-h-full flex-col gap-4 px-5 py-6">
      <Link to={ROUTES.MY_PROFILE} className="text-label text-teal-strong">
        내 정보로 돌아가기
      </Link>
      <h1 className="text-title font-bold">비밀번호 변경</h1>
      <p className="text-label text-text-secondary">변경 후에는 다시 로그인해야 해요.</p>
      <InputField
        label="현재 비밀번호"
        type="password"
        autoComplete="current-password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        required
      />
      <InputField
        label="새 비밀번호"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={10}
        maxLength={16}
        required
      />
      <InputField
        label="새 비밀번호 확인"
        type="password"
        autoComplete="new-password"
        value={confirmation}
        onChange={(e) => setConfirmation(e.target.value)}
        maxLength={16}
        required
      />
      {error && (
        <p role="alert" className="text-label text-red-error">
          {error}
        </p>
      )}
      <Button
        type="submit"
        text={busy ? '변경 중' : '비밀번호 변경'}
        disabled={busy}
        className="mt-auto"
      />
    </form>
  )
}
export default MyPasswordPage
