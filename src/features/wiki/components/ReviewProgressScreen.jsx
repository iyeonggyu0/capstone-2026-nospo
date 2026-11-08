import { Link } from 'react-router-dom'
import { BookContext } from '@/components/BookContext'
import { Notice } from '@/components/Notice'
import { Button } from '@/components/common-ui'
import { REVIEW_STEPS, REVIEW_SUBMITTED_NOTICE } from '../constants'
import { formatSubmittedLabel, getReflectedLabel, getReviewStepId } from '../utils'
import { ReviewStepper } from './ReviewStepper'

const BACK_LINK_CLASS =
  'flex h-12 w-full items-center justify-center rounded-lg bg-teal-strong px-4 text-body leading-5 font-medium text-white transition-colors hover:bg-teal-strong/90'

/** 영역을 나누는 얇은 구분선이다. */
const Divider = () => <hr className="h-px w-full border-0 bg-border" />

/** 검수 진행 상황을 불러오는 동안 도서 카드와 단계 모양의 자리표시를 보여준다. */
const ReviewProgressSkeleton = () => (
  <div className="flex animate-pulse flex-col gap-4" role="status" aria-busy="true">
    <span className="sr-only">검수 진행 상황을 불러오는 중이에요.</span>
    <div aria-hidden="true" className="h-[118px] rounded-xl bg-canvas" />
    <div aria-hidden="true" className="h-9 rounded-lg bg-canvas" />
    <div aria-hidden="true" className="h-56 rounded-lg bg-canvas" />
  </div>
)

/** 검수 진행 상황을 불러오지 못했을 때 안내하고 다시 시도할 수 있게 한다. */
const ReviewProgressError = ({ onRetry }) => (
  <div className="flex flex-col items-center gap-3 py-10 text-center" role="alert">
    <p className="text-body text-text-secondary">검수 진행 상황을 불러오지 못했어요.</p>
    <Button
      className="max-w-40"
      color="secondary"
      height="38px"
      onClick={onRetry}
      text="다시 시도"
    />
  </div>
)

/**
 * 신청한 위키의 검수 진행 상황 화면이다. 도서 카드, 제출 안내, 진행 흐름, `돌아가기`를 조합한다.
 * 데이터는 직접 가져오지 않고 부모가 전달하며, 로딩·신청 없음·오류 상태를 모두 표시한다.
 *
 * @param {object} props 컴포넌트 props
 * @param {{ status: string, submittedAt?: string, book?: { title: string, coverImageSrc?: string, reflectedEpisode?: number, episodeUnit?: string } }} [props.review] 검수 신청 정보
 * @param {'ready' | 'loading' | 'error'} [props.status='ready'] 화면 상태
 * @param {() => void} [props.onRetry] 오류 상태에서 `다시 시도`를 눌렀을 때 실행
 * @param {string} props.backTo `돌아가기`를 눌렀을 때 이동할 주소. 이동 대상은 부모(페이지)가 정한다.
 */
export const ReviewProgressScreen = ({ review, status = 'ready', onRetry, backTo }) => {
  const currentStepId = getReviewStepId(review?.status)

  return (
    <section className="flex flex-col gap-4 px-5 pt-4 pb-6" aria-labelledby="review-progress-title">
      <h1 className="sr-only" id="review-progress-title">
        신청 위키 검수 진행 상황
      </h1>
      {status === 'loading' && <ReviewProgressSkeleton />}
      {status === 'error' && <ReviewProgressError onRetry={onRetry} />}
      {status === 'ready' && !review && (
        <>
          <p className="py-10 text-center text-body text-text-secondary">
            신청 내역을 찾을 수 없어요.
          </p>
          <Link className={BACK_LINK_CLASS} to={backTo}>
            돌아가기
          </Link>
        </>
      )}
      {status === 'ready' && review && (
        <>
          {review.book && (
            <BookContext
              accentText={getReflectedLabel(review.book)}
              captionText={formatSubmittedLabel(review.submittedAt)}
              coverImageSrc={review.book.coverImageSrc}
              title={review.book.title}
            />
          )}
          {currentStepId === 'submit' && <Notice content={REVIEW_SUBMITTED_NOTICE} theme="teal" />}
          <Divider />
          <ReviewStepper currentStepId={currentStepId} steps={REVIEW_STEPS} />
          <Divider />
          <Link className={BACK_LINK_CLASS} to={backTo}>
            돌아가기
          </Link>
        </>
      )}
    </section>
  )
}
