import { useReviewProgress } from '../hooks/useReviewQueries'
import { ReviewProgressScreen } from './ReviewProgressScreen'

/**
 * 신청한 위키 하나의 검수 진행 상황을 조회해 화면에 전달한다.
 * 식별자가 없거나 서버에 없는 신청(404)은 "찾을 수 없음"으로 표시하고, 그 외 실패는 오류 상태로 표시한다.
 *
 * @param {object} props 컴포넌트 props
 * @param {string | null} [props.reviewId] 보여줄 검수 신청의 식별자
 * @param {string} props.backTo `돌아가기`를 눌렀을 때 이동할 주소
 */
export const ReviewProgressContainer = ({ reviewId, backTo }) => {
  const query = useReviewProgress(reviewId)
  const isNotFound = query.error?.response?.status === 404

  let status = 'ready'
  if (reviewId && query.isPending) status = 'loading'
  else if (query.isError && !isNotFound) status = 'error'

  return (
    <ReviewProgressScreen
      backTo={backTo}
      onRetry={() => query.refetch()}
      review={query.data}
      status={status}
    />
  )
}
