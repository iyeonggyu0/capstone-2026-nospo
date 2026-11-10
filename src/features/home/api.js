import { apiClient } from '@/lib/api-client'

/** 홈에 필요한 현재 도서, 독서량과 공지사항을 조회한다. */
export const homeApi = {
  current: async () => (await apiClient.get('/v1/me/reading/current')).data.data,
  summary: async (from, to) =>
    (await apiClient.get('/v1/me/reading/summary', { params: { from, to } })).data.data,
  notices: async () => (await apiClient.get('/v1/notices', { params: { limit: 1 } })).data.data,
}
