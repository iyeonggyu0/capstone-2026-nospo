import { expect, it, vi } from 'vitest'

vi.mock('@/lib/api-client', () => ({ apiClient: { get: vi.fn(), patch: vi.fn() } }))

import { apiClient } from '@/lib/api-client'
import { changeShelfProgress, getShelf } from './api'

it('진도 변경에는 최신 ETag를 전송하고 ETag가 없으면 변경하지 않는다', async () => {
  apiClient.get.mockResolvedValueOnce({ headers: { etag: '"3"' } })
  apiClient.patch.mockResolvedValueOnce({ data: { data: { changed: true } } })
  await expect(changeShelfProgress('book', { unit: 'PAGE', value: 20 })).resolves.toEqual({
    changed: true,
  })
  expect(apiClient.patch).toHaveBeenCalledWith(
    '/v1/me/shelf/book/progress',
    { position: { unit: 'PAGE', value: 20 } },
    { headers: { 'If-Match': '"3"' } },
  )
  apiClient.patch.mockClear()
  apiClient.get.mockResolvedValueOnce({ headers: {} })
  await expect(changeShelfProgress('book', { unit: 'PAGE', value: 21 })).rejects.toThrow()
  expect(apiClient.patch).not.toHaveBeenCalled()
})

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
