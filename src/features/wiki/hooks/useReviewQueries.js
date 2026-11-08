import { useQuery } from '@tanstack/react-query'
import { reviewApi } from '../api/wiki'

/** 검수 진행 상황을 캐시에 저장할 때 쓰는 키 모음이다. */
export const reviewQueryKeys = {
  progress: (reviewId) => ['wiki', 'review', reviewId ?? null],
}

/** 신청한 위키 하나의 검수 진행 상황을 조회하고 캐싱한다. 식별자가 없으면 조회하지 않고, 없는 신청(404)은 다시 시도하지 않는다. */
export const useReviewProgress = (reviewId) =>
  useQuery({
    queryKey: reviewQueryKeys.progress(reviewId),
    queryFn: () => reviewApi.progress(reviewId),
    enabled: Boolean(reviewId),
    retry: (failureCount, error) => error?.response?.status !== 404 && failureCount < 1,
  })
