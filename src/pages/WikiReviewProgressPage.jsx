import {
  faCheck,
  faChevronLeft,
  faCircle,
  faCircleExclamation,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useQuery } from '@tanstack/react-query'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { BookContext } from '@/components/BookContext'
import { Button } from '@/components/common-ui'
import { ROUTES } from '@/constants/routes'
import { useAuth, useIsLoggedIn } from '@/features/auth'
import { myApi, previewBook, previewReviews, reviewDate, reviewLabels } from '@/features/my'

/** 위키 검수의 현재 상태와 검수 의견을 보여준다. */
const WikiReviewProgressPage = () => {
  const { reviewId } = useParams()
  const { search } = useLocation()
  const preview = import.meta.env.DEV && new URLSearchParams(search).has('preview')
  const loggedIn = useIsLoggedIn({ persistPreview: false })
  const status = useAuth((state) => state.status)
  const restoreSession = useAuth((state) => state.restoreSession)
  const query = useQuery({
    queryKey: ['wikiReview', reviewId],
    queryFn: ({ signal }) => myApi.submission(reviewId, signal),
    enabled: loggedIn && !preview,
    retry: false,
  })
  const review = preview
    ? previewReviews.find((item) => item.submissionId === reviewId)
    : query.data
  const book = useQuery({
    queryKey: ['book', review?.bookId],
    queryFn: ({ signal }) => myApi.book(review.bookId, signal),
    enabled: loggedIn && !preview && !!review?.bookId,
    retry: false,
  })
  const details = preview ? previewBook : book.data

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

  const done = review?.status === 'APPROVED' || review?.status === 'REJECTED'
  const needsChanges = review?.status === 'CHANGES_REQUESTED'
  const title =
    review?.status === 'APPROVED'
      ? '검수 완료'
      : review?.status === 'REJECTED'
        ? '검수 반려'
        : '검수 진행'
  const steps = [
    { title: '제출', description: '신청한 위키 내용이 접수되었어요.', completed: true },
    {
      title: '검수',
      description: needsChanges ? '검수 의견을 확인해 주세요.' : '제출한 내용을 검토해요.',
      completed: done,
      current: !done,
    },
    {
      title: '완료',
      description:
        review?.status === 'REJECTED' ? '검수 결과가 반려되었어요.' : '승인되면 위키에 반영돼요.',
      completed: done,
      current: done,
    },
  ]
  return (
    <div className="flex flex-col gap-4 px-5 pt-5 pb-8">
      <div className="flex items-center gap-2">
        <Link
          to={`${ROUTES.WIKI_REVIEW_LIST}${preview ? '?preview' : ''}`}
          aria-label="검수 목록으로 돌아가기"
          className="flex size-8 items-center justify-center"
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </Link>
        <div>
          <h1 className="text-title font-bold">{title}</h1>
          <p className="text-caption text-text-secondary">신청한 건의 현재 단계</p>
        </div>
      </div>
      {!preview && query.isPending && (
        <p role="status" className="text-body text-text-secondary">
          검수 내용을 불러오고 있어요.
        </p>
      )}
      {!preview && query.isError && (
        <p role="alert" className="text-body text-text-secondary">
          검수 내용을 불러오지 못했어요.{' '}
          <button type="button" onClick={() => query.refetch()} className="text-teal-strong">
            다시 시도
          </button>
        </p>
      )}
      {preview && !review && (
        <p className="text-body text-text-secondary">해당 검수 내역이 없어요.</p>
      )}
      {review && (
        <>
          <BookContext
            title={
              details?.title ??
              (book.isError ? '도서 정보를 불러오지 못했어요' : '도서 정보를 불러오고 있어요')
            }
            coverImageSrc={details?.coverUrl}
            accentText={reviewLabels[review.status] ?? review.status}
            captionText={`${reviewDate(review.submittedAt)} 제출`}
          />
          <ol aria-label="검수 진행 단계" className="flex flex-col border-y border-border py-4">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <div className="flex w-7 shrink-0 flex-col items-center">
                  <span
                    className={`flex size-7 items-center justify-center rounded-full ${step.completed || step.current ? 'bg-teal-strong text-white' : 'bg-control-neutral text-text-secondary'}`}
                  >
                    <FontAwesomeIcon
                      icon={step.completed ? faCheck : faCircle}
                      className="text-caption"
                    />
                  </span>
                  {index < steps.length - 1 && (
                    <span
                      className={`min-h-12 w-px flex-1 ${step.completed ? 'bg-teal-selected' : 'bg-border'}`}
                    />
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1 pb-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-body font-medium ${step.current ? 'text-teal-strong' : ''}`}
                    >
                      {step.title}
                    </span>
                    {step.current && (
                      <span className="rounded-full bg-teal-strong px-2 py-1 text-caption text-white">
                        현재
                      </span>
                    )}
                    {step.current && needsChanges && (
                      <span className="rounded-full bg-amber-background px-2 py-1 text-caption text-amber-foreground">
                        수정 요청
                      </span>
                    )}
                  </div>
                  <p className="text-caption text-text-secondary">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
          {(needsChanges || review.status === 'REJECTED') && (
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-body font-medium">검수 의견</h2>
                <span className="text-label-sm text-teal-strong">
                  {reviewLabels[review.status]}
                </span>
              </div>
              <div className="rounded-lg bg-amber-background p-4">
                <p className="flex items-center gap-2 text-body font-medium text-amber-foreground">
                  <FontAwesomeIcon icon={faCircleExclamation} />
                  검수 의견
                </p>
                <p className="mt-2 text-body break-words whitespace-pre-wrap">
                  {review.reviewComment || '등록된 검수 의견이 없어요.'}
                </p>
              </div>
              {needsChanges && (
                <>
                  <p className="flex gap-2 rounded-lg bg-teal-subtle p-3 text-caption text-text-secondary">
                    <FontAwesomeIcon icon={faShieldHalved} className="text-teal-strong" />
                    수정 요청 내용을 확인해 주세요.
                  </p>
                  <Button
                    text="수정하고 재제출"
                    disabled
                    title="수정 화면 준비 중"
                    className="opacity-50"
                  />
                  <p className="text-caption text-text-secondary">
                    위키 수정 화면이 준비되면 재제출할 수 있어요.
                  </p>
                </>
              )}
            </section>
          )}
          {review.status === 'APPROVED' && review.rewardAmount != null && (
            <p className="text-body text-teal-strong">
              승인 보상 {review.rewardAmount.toLocaleString('ko-KR')}개
            </p>
          )}
        </>
      )}
    </div>
  )
}
export default WikiReviewProgressPage
