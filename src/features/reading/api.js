import { apiClient } from '@/lib/api-client'

/** 선택한 월의 날짜별 독서량을 조회한다. */
export const getCalendar = async (month, signal) =>
  (await apiClient.get('/v1/me/reading/calendar', { params: { month }, signal })).data.data
