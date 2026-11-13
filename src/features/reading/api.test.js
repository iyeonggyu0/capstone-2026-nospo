import { expect, it, vi } from 'vitest'

vi.mock('@/lib/api-client', () => ({ apiClient: { get: vi.fn() } }))

import { apiClient } from '@/lib/api-client'
import { getCalendar } from './api'

it('달력 API는 조회 월과 취소 신호를 전달하고 응답 데이터를 반환한다', async () => {
  const calendar = { month: '2026-11', days: [] }
  const { signal } = new AbortController()
  apiClient.get.mockResolvedValue({ data: { data: calendar } })

  expect(await getCalendar('2026-11', signal)).toEqual(calendar)
  expect(apiClient.get).toHaveBeenCalledWith('/v1/me/reading/calendar', {
    params: { month: '2026-11' },
    signal,
  })
})
