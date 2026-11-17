import { faChevronLeft, faUser } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { InputField } from '@/components/InputField'
import { Button } from '@/components/common-ui'
import { ROUTES } from '@/constants/routes'
import { useAuth, useIsLoggedIn } from '@/features/auth'
import { maskEmail, myApi } from '@/features/my'

const mockMember = {
  nickname: '책갈피여우',
  email: 'yeowoo@mail.com',
  loginMethods: ['EMAIL'],
  profileImageUrl: null,
}

/** 회원 정보를 조회하고 닉네임과 이메일 변경을 처리한다. */
const MyProfilePage = () => {
  const { search } = useLocation()
  const preview = import.meta.env.DEV && new URLSearchParams(search).has('preview')
  const loggedIn = useIsLoggedIn({ persistPreview: false })
  const status = useAuth((state) => state.status)
  const restoreSession = useAuth((state) => state.restoreSession)
  const queryClient = useQueryClient()
  const memberQuery = useQuery({
    queryKey: ['my', 'member'],
    queryFn: ({ signal }) => myApi.member(signal),
    enabled: loggedIn && !preview,
    retry: false,
  })
  const [mockProfile, setMockProfile] = useState(mockMember)
  const [editing, setEditing] = useState(false)
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [verification, setVerification] = useState(null)
  const [proof, setProof] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const profile = preview ? mockProfile : memberQuery.data
  const emailChanged = email.trim().toLowerCase() !== (profile?.email ?? '').trim().toLowerCase()
  const emailLogin = preview || profile?.loginMethods?.includes('EMAIL')
  const myPath = `${ROUTES.MY}${preview ? '?preview' : ''}`

  const beginEdit = () => {
    setNickname(profile?.nickname ?? '')
    setEmail(profile?.email ?? '')
    setEditing(true)
    setError('')
    setNotice('')
    setProof(null)
    setVerification(null)
    setPassword('')
    setCode('')
  }
  const sendVerification = async () => {
    if (!emailChanged || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('변경할 이메일을 확인해 주세요.')
      return
    }
    if (!preview && !password) {
      setError('현재 비밀번호를 입력해 주세요.')
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    setProof(null)
    setVerification(null)
    try {
      if (preview) setVerification({ verificationId: 'preview' })
      else {
        const auth = await myApi.reauthenticate(password)
        setPassword('')
        setVerification(await myApi.sendEmailChange(email.trim().toLowerCase(), auth.reauthProof))
      }
      setNotice(
        preview
          ? '미리보기에서는 6자리 숫자를 입력해 주세요.'
          : '변경할 이메일로 인증번호를 보냈어요.',
      )
    } catch {
      setError('재인증 또는 인증번호 발송에 실패했어요. 입력 정보를 확인해 주세요.')
    } finally {
      setPassword('')
      setBusy(false)
    }
  }
  const verify = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError('인증번호 6자리를 입력해 주세요.')
      return
    }
    setBusy(true)
    setError('')
    try {
      setProof(
        preview
          ? { emailChangeProof: 'preview', expiresAt: new Date(Date.now() + 600000).toISOString() }
          : await myApi.verifyEmailChange(verification.verificationId, code),
      )
      setNotice('이메일 인증이 완료되었어요. 변경 사항을 저장해 주세요.')
    } catch {
      setError('인증번호를 확인해 주세요.')
    } finally {
      setBusy(false)
    }
  }
  const save = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    const normalized = nickname.trim().normalize('NFC')
    if (!/^[가-힣a-zA-Z0-9_]{2,20}$/.test(normalized)) {
      setError('닉네임은 한글·영문·숫자·밑줄 2~20자로 입력해 주세요.')
      return
    }
    if (emailChanged && (!proof || Date.parse(proof.expiresAt) <= Date.now())) {
      setError('이메일 변경을 위해 인증을 완료해 주세요.')
      return
    }
    setBusy(true)
    let saved = { ...profile }
    try {
      if (normalized !== profile.nickname) {
        const result = preview ? { nickname: normalized } : await myApi.updateNickname(normalized)
        saved = { ...saved, nickname: result.nickname }
        if (preview) setMockProfile(saved)
        else queryClient.setQueryData(['my', 'member'], saved)
      }
      if (emailChanged) {
        const result = preview
          ? { email: email.trim().toLowerCase() }
          : await myApi.updateEmail(proof.emailChangeProof)
        saved = { ...saved, email: result.email }
        if (preview) setMockProfile(saved)
        else queryClient.setQueryData(['my', 'member'], saved)
      }
      setEditing(false)
      setNotice('변경 사항을 저장했어요.')
      setProof(null)
      setVerification(null)
    } catch {
      setError('일부 변경 사항을 저장하지 못했어요. 저장된 항목을 확인하고 다시 시도해 주세요.')
    } finally {
      setBusy(false)
    }
  }
  if (!loggedIn && (status === 'unknown' || status === 'checking'))
    return (
      <p className="px-5 pt-5 text-body text-text-secondary" role="status">
        로그인 상태를 확인하고 있어요.
      </p>
    )
  if (!loggedIn && status === 'error')
    return (
      <div className="px-5 pt-5 text-body text-text-secondary" role="alert">
        로그인 상태를 확인하지 못했어요.{' '}
        <button type="button" onClick={restoreSession} className="text-teal-strong">
          다시 시도
        </button>
      </div>
    )
  if (!loggedIn) return <Navigate to={ROUTES.ONBOARDING} replace />

  return (
    <div className="flex min-h-full flex-col gap-4 px-5 pt-6 pb-6">
      <div className="flex items-center gap-2">
        <Link
          to={myPath}
          aria-label="마이페이지로 돌아가기"
          className="flex size-8 items-center justify-center"
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </Link>
        <div>
          <h1 className="text-title font-bold">{editing ? '내 정보 수정' : '내 정보'}</h1>
          <p className="text-caption text-text-secondary">
            {editing
              ? '변경할 내용을 입력한 뒤 저장해 주세요.'
              : '내 계정 정보를 확인하고 필요한 항목을 수정할 수 있어요.'}
          </p>
        </div>
      </div>
      {!preview && memberQuery.isPending ? (
        <p role="status" className="text-body text-text-secondary">
          회원 정보를 불러오고 있어요.
        </p>
      ) : !preview && memberQuery.isError ? (
        <div role="alert" className="text-body text-text-secondary">
          회원 정보를 불러오지 못했어요.{' '}
          <button type="button" onClick={() => memberQuery.refetch()} className="text-teal-strong">
            다시 시도
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 rounded-xl p-3.5">
            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-subtle text-teal-strong">
              {profile?.profileImageUrl ? (
                <img src={profile.profileImageUrl} alt="" className="size-full object-cover" />
              ) : (
                <FontAwesomeIcon icon={faUser} />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-body font-medium">{profile?.nickname}</p>
              <p className="mt-1 truncate text-caption text-text-secondary">
                {maskEmail(profile?.email)}
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-control-neutral p-4">
            <p className="text-label-sm font-medium">
              <span className="mr-2 text-teal-strong">●</span>
              {editing ? '변경 사항 안내' : '계정 정보'}
            </p>
            <p className="mt-1 pl-4 text-caption text-text-secondary">
              {editing ? '이메일 변경 시 재인증이 필요해요.' : '계정 정보를 확인할 수 있어요.'}
            </p>
          </div>
          {editing ? (
            <form className="flex flex-1 flex-col gap-4" onSubmit={save}>
              <InputField
                label="닉네임"
                value={nickname}
                maxLength={20}
                onChange={(e) => setNickname(e.target.value)}
                required
              />
              <InputField
                label="이메일"
                type="email"
                value={email}
                disabled={!emailLogin || busy}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setProof(null)
                  setVerification(null)
                  setCode('')
                  setNotice('')
                }}
              />
              {!emailLogin && (
                <p className="text-caption text-text-secondary">
                  카카오 전용 계정의 이메일 변경은 카카오 재인증 연결 후 사용할 수 있어요.
                </p>
              )}
              {emailChanged && emailLogin && (
                <div className="flex flex-col gap-3">
                  {!preview && (
                    <InputField
                      label="현재 비밀번호"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  )}
                  <Button
                    text={verification ? '인증번호 다시 받기' : '인증번호 받기'}
                    color="secondary"
                    height="38px"
                    disabled={busy}
                    onClick={sendVerification}
                  />
                  {verification && (
                    <>
                      <InputField
                        label="인증 번호"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={code}
                        onChange={(e) => {
                          setCode(e.target.value.replace(/\D/g, ''))
                          setProof(null)
                        }}
                        hint={proof ? '이메일 인증 완료' : undefined}
                      />
                      <Button
                        text="인증번호 확인"
                        color="neutral"
                        height="38px"
                        disabled={busy || !!proof}
                        onClick={verify}
                      />
                    </>
                  )}
                </div>
              )}
              {error && (
                <p role="alert" className="text-caption text-red-error">
                  {error}
                </p>
              )}
              {notice && (
                <p role="status" className="text-caption text-teal-strong">
                  {notice}
                </p>
              )}
              <div className="mt-auto flex gap-2 pt-4">
                <Button
                  text="취소"
                  color="neutral"
                  disabled={busy}
                  onClick={() => {
                    setEditing(false)
                    setError('')
                    setNotice('')
                    setPassword('')
                    setProof(null)
                    setVerification(null)
                  }}
                />
                <Button type="submit" text={busy ? '처리 중' : '변경 사항 저장'} disabled={busy} />
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-4">
              <InputField label="닉네임" value={profile?.nickname ?? ''} readOnly />
              <InputField label="이메일" value={profile?.email ?? ''} readOnly />
              {notice && (
                <p role="status" className="text-caption text-teal-strong">
                  {notice}
                </p>
              )}
              <div className="flex items-center justify-between text-body">
                <span>닉네임 · 이메일</span>
                <button
                  type="button"
                  className="text-label-sm font-medium text-teal-strong"
                  onClick={beginEdit}
                >
                  편집
                </button>
              </div>
              <div className="flex items-center justify-between gap-3 text-body">
                <span>비밀번호 수정</span>
                <Link
                  to={`${ROUTES.AUTH_PASSWORD_RESET}?from=profile${preview ? '&preview' : ''}`}
                  reloadDocument={preview}
                  className="text-label-sm font-medium text-teal-strong"
                >
                  편집
                </Link>
              </div>
              <p className="text-caption text-text-secondary">
                비밀번호는 이메일 인증을 통해 재설정해요.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
export default MyProfilePage
