import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useInfiniteQuery, useQueries, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { Button, ReviewTabs } from '@/components/common-ui'
import { ROUTES } from '@/constants/routes'
import { useAuth, useIsLoggedIn } from '@/features/auth'
import { myApi, previewBook, previewReviews, reviewDate, reviewLabels } from '@/features/my'

const tabs = [
  { value: 'all', label: '전체' },
  { value: 'PENDING', label: '검수 중' },
  { value: 'CHANGES_REQUESTED', label: '수정 요청' },
  { value: 'APPROVED', label: '승인' },
  { value: 'REJECTED', label: '반려' },
]
const badgeClasses = {
  PENDING: 'bg-teal-strong text-white',
  CHANGES_REQUESTED: 'bg-amber-background text-amber-foreground',
  APPROVED: 'bg-control-neutral text-text-secondary',
  REJECTED: 'bg-control-neutral text-red-destructive',
}

/** 신청한 위키의 상태별 목록을 조회한다. */
const WikiReviewListPage = () => {
  const { search } = useLocation()
  const preview = import.meta.env.DEV && new URLSearchParams(search).has('preview')
  const loggedIn = useIsLoggedIn({ persistPreview: false })
  const status = useAuth((state) => state.status)
  const restoreSession = useAuth((state) => state.restoreSession)
  const [selected, setSelected] = useState('all')
  const query = useInfiniteQuery({
    queryKey: ['wikiReviews', selected],
    queryFn: ({ pageParam, signal }) =>
      myApi.submissions(pageParam, signal, selected === 'all' ? undefined : selected),
    initialPageParam: undefined,
    getNextPageParam: (page) => (page.hasNext ? page.nextCursor : undefined),
    enabled: loggedIn && !preview,
    retry: false,
  })
  const summary = useQuery({
    queryKey: ['my', 'reviewSummary'],
    queryFn: ({ signal }) => myApi.reviewSummary(signal),
    enabled: loggedIn && !preview,
    retry: false,
  })
  const items = preview
    ? previewReviews.filter((item) => selected === 'all' || item.status === selected)
    : (query.data?.pages.flatMap((page) => page.items) ?? [])
  const bookIds = [...new Set(items.map((item) => item.bookId).filter(Boolean))]
  const books = useQueries({
    queries: bookIds.map((id) => ({
      queryKey: ['book', id],
      queryFn: ({ signal }) => myApi.book(id, signal),
      enabled: loggedIn && !preview,
      retry: false,
    })),
  })
  const counts = preview
    ? { pending: 2, changesRequested: 1, approved: 1, rejected: 1 }
    : summary.data
  const countsByStatus = counts && {
    all: counts.pending + counts.changesRequested + counts.approved + counts.rejected,
    PENDING: counts.pending,
    CHANGES_REQUESTED: counts.changesRequested,
    APPROVED: counts.approved,
    REJECTED: counts.rejected,
  }

  if (!loggedIn && (status === 'unknown' || status === 'checking'))
    return <p className="px-5 pt-5 text-body text-text-secondary">로그인 상태를 확인하고 있어요.</p>
  if (!loggedIn && status === 'error')
    return (
      <div className="px-5 pt-5 text-body text-text-secondary">
        로그인 상태를 확인하지 못했어요.{' '}
        <button type="button" className="text-teal-strong" onClick={restoreSession}>
          다시 시도
        </button>
      </div>
    )
  if (!loggedIn) return <Navigate to={ROUTES.ONBOARDING} replace />

  return (
    <div className="flex flex-col gap-4 px-5 pt-5 pb-8">
      <div className="flex items-center gap-2">
        <Link
          to={`${ROUTES.MY}${preview ? '?preview' : ''}`}
          aria-label="마이페이지로 돌아가기"
          className="flex size-8 items-center justify-center"
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </Link>
        <h1 className="text-title font-bold">신청한 위키 검수</h1>
      </div>
      <div className="overflow-x-auto">
        <ReviewTabs
          options={tabs.map((tab) => ({ ...tab, count: countsByStatus?.[tab.value] }))}
          value={selected}
          onChange={setSelected}
        />
      </div>
      <div className="flex justify-between text-caption text-text-secondary">
        <span>작품 · 제출일</span>
        <span>현 상태</span>
      </div>
      {!preview && query.isPending && (
        <p role="status" className="py-6 text-body text-text-secondary">
          검수 내역을 불러오고 있어요.
        </p>
      )}
      {!preview && query.isError && !query.data && (
        <p role="alert" className="py-6 text-body text-text-secondary">
          검수 내역을 불러오지 못했어요.{' '}
          <button type="button" onClick={() => query.refetch()} className="text-teal-strong">
            다시 시도
          </button>
        </p>
      )}
      {(preview || query.data) && items.length === 0 && (
        <p className="py-6 text-body text-text-secondary">해당하는 검수 내역이 없어요.</p>
      )}
      <ul className="divide-y divide-border">
        {items.map((item) => {
          const bookQuery = books[bookIds.indexOf(item.bookId)]
          const book = preview ? previewBook : bookQuery?.data
          return (
            <li key={item.submissionId}>
              <Link
                to={`${ROUTES.WIKI_REVIEW_LIST}/${encodeURIComponent(item.submissionId)}${preview ? '?preview' : ''}`}
                className="flex min-h-20 items-center gap-3 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-medium">
                    {book?.title ??
                      (bookQuery?.isError ? '도서 정보를 불러오지 못했어요' : '도서 정보 확인 중')}
                  </p>
                  <p className="mt-1 text-caption text-text-secondary">
                    제출 {reviewDate(item.submittedAt)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-2 text-label-sm ${badgeClasses[item.status] ?? 'bg-control-neutral text-text-secondary'}`}
                >
                  {reviewLabels[item.status] ?? item.status}
                </span>
                <FontAwesomeIcon icon={faChevronRight} className="text-text-secondary" />
              </Link>
            </li>
          )
        })}
      </ul>
      {!preview && query.hasNextPage && (
        <Button
          text={
            query.isFetchingNextPage
              ? '불러오는 중'
              : query.isFetchNextPageError
                ? '다시 불러오기'
                : '더 보기'
          }
          height="38px"
          color="neutral"
          disabled={query.isFetchingNextPage}
          onClick={() => query.fetchNextPage()}
        />
      )}
    </div>
  )
}
export default WikiReviewListPage
