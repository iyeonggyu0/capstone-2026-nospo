import { faArrowLeft, faChevronRight, faUser } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/common-ui'
import { ROUTES } from '@/constants/routes'
import { useAuth, useIsLoggedIn } from '@/features/auth'
import { maskEmail, myApi, PrivacyPolicy, TokenHistory } from '@/features/my'

const previewData = {
  member: { nickname: '책갈피여우', email: 'yeowoo@mail.com', profileImageUrl: null },
  credits: { balance: 12, reserved: 0, available: 12 },
  summary: { pending: 2, draftCount: 1, changesRequested: 0, approved: 0, rejected: 0 },
  transactions: [
    {
      transactionId: '2',
      type: 'USE',
      amount: -1,
      balanceAfter: 12,
      reason: 'AI 질문',
      createdAt: '2026-11-03T05:00:00Z',
    },
    {
      transactionId: '3',
      type: 'USE',
      amount: -1,
      balanceAfter: 13,
      reason: 'AI 관계도 생성',
      createdAt: '2026-11-02T05:00:00Z',
    },
    {
      transactionId: '1',
      type: 'GRANT',
      amount: 9,
      balanceAfter: 14,
      reason: '위키 기여도 보상',
      createdAt: '2026-11-01T02:00:00Z',
    },
    {
      transactionId: '4',
      type: 'GRANT',
      amount: 5,
      balanceAfter: 5,
      reason: '가입 보상',
      createdAt: '2026-10-30T05:00:00Z',
    },
  ],
  reviews: [
    { submissionId: 'preview-review', status: 'PENDING', submittedAt: '2026-11-04T02:00:00Z' },
    { submissionId: 'preview-review-2', status: 'PENDING', submittedAt: '2026-11-02T02:00:00Z' },
  ],
  drafts: [{ draftId: 'preview-draft', status: 'DRAFT', updatedAt: '2026-11-05T02:00:00Z' }],
}
const viewTitles = {
  privacy: '개인정보 처리방침',
  transactions: 'AI 토큰 내역',
  reviews: '검수 중인 위키',
  drafts: '임시 저장',
}
const statusLabels = {
  PENDING: '검수 중',
  APPROVED: '승인',
  CHANGES_REQUESTED: '수정 요청',
  REJECTED: '반려',
  DRAFT: '임시 저장',
  SUBMITTED: '제출됨',
}
const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(value))
    : '날짜 정보 없음'

/** 마이페이지의 프로필, 토큰 및 위키 활동을 표시한다. */
const MyPage = () => {
  const { search } = useLocation()
  const navigate = useNavigate()
  const preview = import.meta.env.DEV && new URLSearchParams(search).has('preview')
  const loggedIn = useIsLoggedIn({ persistPreview: false })
  const status = useAuth((state) => state.status)
  const restoreSession = useAuth((state) => state.restoreSession)
  const clearSession = useAuth((state) => state.clearSession)
  const [logoutPrompt, setLogoutPrompt] = useState(false)
  const [logoutBusy, setLogoutBusy] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const viewParam = new URLSearchParams(search).get('view')
  const view = Object.hasOwn(viewTitles, viewParam) ? viewParam : ''
  const viewLink = (name) =>
    `${ROUTES.MY}?${new URLSearchParams({ ...(name ? { view: name } : {}), ...(preview ? { preview: '' } : {}) })}`
  const enabled = loggedIn && !preview

  const member = useQuery({
    queryKey: ['my', 'member'],
    queryFn: ({ signal }) => myApi.member(signal),
    enabled,
    retry: false,
  })
  const credits = useQuery({
    queryKey: ['my', 'credits'],
    queryFn: ({ signal }) => myApi.credits(signal),
    enabled,
    retry: false,
  })
  const summary = useQuery({
    queryKey: ['my', 'reviewSummary'],
    queryFn: ({ signal }) => myApi.reviewSummary(signal),
    enabled,
    retry: false,
  })
  const terms = useQuery({
    queryKey: ['my', 'privacyTerms'],
    queryFn: ({ signal }) => myApi.terms(signal),
    enabled: enabled && view === 'privacy',
    retry: false,
  })
  const privacyId = terms.data?.items?.find((item) => item.type === 'PRIVACY')?.termVersionId
  const privacy = useQuery({
    queryKey: ['my', 'privacyTerm', privacyId],
    queryFn: ({ signal }) => myApi.term(privacyId, signal),
    enabled: enabled && view === 'privacy' && !!privacyId,
    retry: false,
  })
  const list = useInfiniteQuery({
    queryKey: ['my', view],
    queryFn: ({ pageParam, signal }) =>
      myApi[view === 'reviews' ? 'submissions' : view](pageParam, signal),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : undefined),
    enabled: enabled && ['transactions', 'reviews', 'drafts'].includes(view),
    retry: false,
  })

  const logout = async () => {
    setLogoutBusy(true)
    setLogoutError('')
    try {
      if (!preview) {
        await myApi.logout()
        clearSession()
      }
      useAuth.setState({ preview: false })
      navigate(ROUTES.ONBOARDING, { replace: true })
    } catch {
      setLogoutError('로그아웃하지 못했어요. 연결 상태를 확인하고 다시 시도해 주세요.')
    } finally {
      setLogoutBusy(false)
    }
  }

  if (!loggedIn && (status === 'unknown' || status === 'checking'))
    return (
      <p className="px-5 text-body text-text-secondary" role="status">
        로그인 상태를 확인하고 있어요.
      </p>
    )
  if (!loggedIn && status === 'error')
    return (
      <div className="space-y-3 px-5" role="alert">
        <p className="text-body text-text-secondary">로그인 상태를 확인하지 못했어요.</p>
        <button
          type="button"
          className="text-body font-medium text-teal-strong"
          onClick={restoreSession}
        >
          다시 시도
        </button>
      </div>
    )
  if (!loggedIn) return <Navigate to={ROUTES.ONBOARDING} replace />

  const profile = preview ? previewData.member : member.data
  const balance = preview ? previewData.credits : credits.data
  const reviews = preview ? previewData.summary : summary.data
  const allItems = preview
    ? (previewData[view] ?? [])
    : (list.data?.pages.flatMap((page) => page.items) ?? [])
  const items = view === 'drafts' ? allItems.filter((item) => item.status === 'DRAFT') : allItems

  return (
    <div className={`flex flex-col gap-4 px-5 pb-8 ${view === 'transactions' ? 'pt-5' : ''}`}>
      {view ? (
        <>
          <div className="flex items-center gap-3">
            <Link
              to={viewLink('')}
              aria-label="마이페이지로 돌아가기"
              className="flex size-10 items-center justify-center text-text-secondary"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </Link>
            <h2 className="text-title font-bold">{viewTitles[view]}</h2>
          </div>
          {view === 'privacy' ? (
            preview ? (
              <PrivacyPolicy preview />
            ) : terms.isPending || (!!privacyId && privacy.isPending) ? (
              <p role="status" className="text-body text-text-secondary">
                개인정보 처리방침을 불러오고 있어요.
              </p>
            ) : terms.isError || privacy.isError ? (
              <div role="alert" className="text-body text-text-secondary">
                개인정보 처리방침을 불러오지 못했어요.{' '}
                <button
                  type="button"
                  className="text-teal-strong"
                  onClick={() => (terms.isError ? terms.refetch() : privacy.refetch())}
                >
                  다시 시도
                </button>
              </div>
            ) : !privacyId ? (
              <p className="text-body text-text-secondary">등록된 개인정보 처리방침이 없어요.</p>
            ) : (
              <PrivacyPolicy policy={privacy.data} />
            )
          ) : view === 'transactions' ? (
            <TokenHistory
              profile={profile}
              balance={balance}
              member={member}
              credits={credits}
              list={list}
              items={items}
              preview={preview}
            />
          ) : (
            <>
              {!preview && list.isPending && (
                <p role="status" className="text-body text-text-secondary">
                  목록을 불러오고 있어요.
                </p>
              )}
              {!preview && list.isError && !list.data && (
                <div role="alert" className="text-body text-text-secondary">
                  목록을 불러오지 못했어요.{' '}
                  <button type="button" className="text-teal-strong" onClick={() => list.refetch()}>
                    다시 시도
                  </button>
                </div>
              )}
              {(preview || list.isSuccess || list.data) && items.length === 0 && (
                <p className="text-body text-text-secondary">표시할 내역이 없어요.</p>
              )}
              <ul className="divide-y divide-border">
                {items.map((item) => (
                  <li
                    key={item.transactionId ?? item.submissionId ?? item.draftId}
                    className="flex items-center justify-between gap-4 py-4"
                  >
                    <div className="min-w-0">
                      <p className="text-body font-medium">
                        {view === 'transactions'
                          ? item.reason || '토큰 내역'
                          : (statusLabels[item.status] ?? item.status)}
                      </p>
                      <p className="mt-1 text-caption text-text-secondary">
                        {formatDate(item.createdAt ?? item.submittedAt ?? item.updatedAt)}
                      </p>
                    </div>
                    {view === 'transactions' && (
                      <span className="shrink-0 text-body font-bold text-teal-strong">
                        {item.amount > 0 ? '+' : ''}
                        {item.amount}개
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {!preview && list.hasNextPage && (
                <Button
                  text={
                    list.isFetchingNextPage
                      ? '불러오는 중'
                      : list.isFetchNextPageError
                        ? '다시 불러오기'
                        : '더 보기'
                  }
                  color="neutral"
                  height="38px"
                  disabled={list.isFetchingNextPage}
                  onClick={() => list.fetchNextPage()}
                />
              )}
            </>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-subtle text-teal-strong">
              {profile?.profileImageUrl ? (
                <img src={profile.profileImageUrl} alt="" className="size-full object-cover" />
              ) : (
                <FontAwesomeIcon icon={faUser} aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              {!preview && member.isPending ? (
                <p className="text-body text-text-secondary" role="status">
                  회원 정보를 불러오고 있어요.
                </p>
              ) : !preview && member.isError ? (
                <p className="text-body text-text-secondary" role="alert">
                  회원 정보를 불러오지 못했어요.{' '}
                  <button
                    type="button"
                    className="text-teal-strong"
                    onClick={() => member.refetch()}
                  >
                    다시 시도
                  </button>
                </p>
              ) : (
                <Link
                  to={`${ROUTES.MY_PROFILE}${preview ? '?preview' : ''}`}
                  aria-label="내 정보 보기"
                  className="block"
                >
                  <p className="truncate text-title font-bold">{profile?.nickname ?? '회원'}</p>
                  <p className="truncate text-caption text-text-secondary">
                    {maskEmail(profile?.email)}
                  </p>
                </Link>
              )}
            </div>
          </div>
          <section
            className="flex items-center justify-between gap-3 rounded-xl bg-teal-subtle p-4"
            aria-label="보유 AI 토큰"
          >
            <span className="text-body font-medium">보유 AI 토큰</span>
            {!preview && credits.isPending ? (
              <span role="status" className="text-label text-text-secondary">
                불러오는 중
              </span>
            ) : !preview && credits.isError ? (
              <button
                type="button"
                className="text-label text-teal-strong"
                onClick={() => credits.refetch()}
              >
                다시 시도
              </button>
            ) : (
              <strong className="text-title text-teal-strong">
                {balance?.balance?.toLocaleString('ko-KR')}개
              </strong>
            )}
          </section>
          <section aria-label="신청한 위키 검수" className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-body font-medium">신청한 위키 검수</h2>
              {reviews && (
                <span className="text-label-sm font-medium text-teal-strong">
                  {(reviews.pending + reviews.draftCount).toLocaleString('ko-KR')}건
                </span>
              )}
            </div>
            {!preview && summary.isPending ? (
              <p role="status" className="text-label text-text-secondary">
                검수 현황을 불러오고 있어요.
              </p>
            ) : !preview && summary.isError ? (
              <p role="alert" className="text-label text-text-secondary">
                검수 현황을 불러오지 못했어요.{' '}
                <button
                  type="button"
                  className="text-teal-strong"
                  onClick={() => summary.refetch()}
                >
                  다시 시도
                </button>
              </p>
            ) : (
              <div className="flex gap-2">
                <Link
                  to={`${ROUTES.WIKI_REVIEW_LIST}${preview ? '?preview' : ''}`}
                  className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border border-teal-selected p-3"
                >
                  <span className="text-body font-medium">검수 중</span>
                  <strong className="text-title text-teal-strong">{reviews?.pending}</strong>
                </Link>
                <Link
                  to={viewLink('drafts')}
                  className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border border-border p-3"
                >
                  <span className="text-body font-medium">임시 저장</span>
                  <strong className="text-title">{reviews?.draftCount}</strong>
                </Link>
              </div>
            )}
          </section>
          <nav aria-label="마이 메뉴" className="divide-y divide-border">
            {[
              ['privacy', '개인정보 처리방침'],
              ['transactions', 'AI 토큰 내역'],
            ].map(([name, label]) => (
              <Link
                key={name}
                to={viewLink(name)}
                className="flex min-h-[52px] items-center justify-between gap-3 py-2.5 text-body"
              >
                <span>{label}</span>
                <FontAwesomeIcon icon={faChevronRight} className="text-text-secondary" />
              </Link>
            ))}
            <button
              type="button"
              className="flex min-h-[52px] w-full items-center py-2.5 text-left text-body font-medium text-red-destructive"
              onClick={() => {
                setLogoutError('')
                setLogoutPrompt(true)
              }}
            >
              로그아웃
            </button>
          </nav>
          {logoutPrompt && (
            <div
              className="rounded-xl border border-border bg-surface p-4"
              role="alertdialog"
              aria-labelledby="logout-title"
              aria-describedby="logout-description"
            >
              <p id="logout-title" className="text-body font-medium">
                로그아웃할까요?
              </p>
              <p id="logout-description" className="mt-1 text-caption text-text-secondary">
                {preview ? '미리보기를 종료해요.' : '다시 이용하려면 로그인해야 해요.'}
              </p>
              {logoutError && (
                <p role="alert" className="mt-2 text-caption text-red-error">
                  {logoutError}
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <Button
                  text="취소"
                  color="neutral"
                  height="38px"
                  disabled={logoutBusy}
                  onClick={() => setLogoutPrompt(false)}
                />
                <Button
                  text={logoutBusy ? '처리 중' : '로그아웃'}
                  height="38px"
                  disabled={logoutBusy}
                  onClick={logout}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default MyPage
