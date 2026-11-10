import { apiClient } from '@/lib/api-client'

/** 홈에 필요한 현재 도서, 독서량과 공지사항을 조회한다. */
export const homeApi = {
  current: async (signal) => (await apiClient.get('/v1/me/reading/current', { signal })).data.data,
  summary: async (from, to, signal) =>
    (await apiClient.get('/v1/me/reading/summary', { params: { from, to }, signal })).data.data,
  notices: async (signal) =>
    (await apiClient.get('/v1/notices', { params: { limit: 1 }, signal })).data.data,
}
