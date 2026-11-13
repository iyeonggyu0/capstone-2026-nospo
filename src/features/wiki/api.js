import { apiClient } from '@/lib/api-client'

/** 서재의 도서 유형별 목록을 조회한다. */
export const getShelf = async ({ bookType, sort, cursor, signal }) =>
  (await apiClient.get('/v1/me/shelf', { params: { bookType, sort, cursor, limit: 6 }, signal }))
    .data.data
