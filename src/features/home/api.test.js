import { expect, it, vi } from 'vitest'

vi.mock('@/lib/api-client', () => ({ apiClient: { get: vi.fn() } }))

import { apiClient } from '@/lib/api-client'
import { homeApi } from './api'

it('홈 API는 명세의 경로와 독서 기간으로 요청한다', async () => {
  apiClient.get.mockResolvedValue({ data: { data: { items: [] } } })
  const { signal } = new AbortController()
  await homeApi.current(signal)
  await homeApi.summary('2026-11-01', '2026-11-10', signal)
  await homeApi.notices(signal)
  expect(apiClient.get.mock.calls).toEqual([
    ['/v1/me/reading/current', { signal }],
    ['/v1/me/reading/summary', { params: { from: '2026-11-01', to: '2026-11-10' }, signal }],
    ['/v1/notices', { params: { limit: 1 }, signal }],
  ])
})
