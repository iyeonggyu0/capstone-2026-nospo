import { expect, it, vi } from 'vitest'

vi.mock('@/lib/api-client', () => ({ apiClient: { get: vi.fn() } }))

import { apiClient } from '@/lib/api-client'
import { getShelf } from './api'

it('서재 API는 초기 및 다음 페이지 요청과 응답을 전달한다', async () => {
  const page = { items: [{ bookId: 1 }], hasNext: true, nextCursor: 'next' }
  apiClient.get.mockResolvedValue({ data: { data: page } })
  const { signal } = new AbortController()
  const params = { bookType: 'BOOK', sort: 'TITLE', signal }

  expect(await getShelf(params)).toEqual(page)
  expect(await getShelf({ ...params, cursor: 'next' })).toEqual(page)
  expect(apiClient.get.mock.calls).toEqual([
    [
      '/v1/me/shelf',
      { params: { bookType: 'BOOK', sort: 'TITLE', cursor: undefined, limit: 6 }, signal },
    ],
    [
      '/v1/me/shelf',
      { params: { bookType: 'BOOK', sort: 'TITLE', cursor: 'next', limit: 6 }, signal },
    ],
  ])
})
