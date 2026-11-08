import { useParams } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { ReviewProgressContainer } from '@/features/wiki'

/** 주소의 검수 신청 식별자(reviewId)를 읽어 검수 진행 상황 화면에 전달하고, `돌아가기` 이동 대상을 정한다. */
const WikiReviewProgressPage = () => {
  const { reviewId } = useParams()

  return <ReviewProgressContainer backTo={ROUTES.WIKI_REVIEW_LIST} reviewId={reviewId} />
}

export default WikiReviewProgressPage
