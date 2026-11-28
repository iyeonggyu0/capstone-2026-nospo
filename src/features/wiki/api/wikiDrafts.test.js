import { beforeEach, expect, it, vi } from 'vitest'

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import { apiClient } from '@/lib/api-client'
import { createWikiDraft, submitWikiDraft, uploadWikiDraftAsset } from './wikiDrafts'

beforeEach(() => {
  vi.clearAllMocks()
})

it('createWikiDraft는 초안 생성 응답 데이터와 ETag를 반환한다', async () => {
  apiClient.post.mockResolvedValue({
    data: { data: { draftId: 'draft-1' } },
    headers: { etag: 'W/"1"' },
  })

  const result = await createWikiDraft({
    bookId: 'book-1',
    mode: 'CREATE',
    position: { unit: 'EPISODE', value: 12 },
  })

  expect(result).toEqual({ data: { draftId: 'draft-1' }, etag: 'W/"1"' })
  expect(apiClient.post).toHaveBeenCalledWith('/v1/wiki/drafts', {
    bookId: 'book-1',
    mode: 'CREATE',
    position: { unit: 'EPISODE', value: 12 },
  })
})

it('uploadWikiDraftAsset는 Content-Type을 수동 지정하지 않고 If-Match 헤더만 전달한다', async () => {
  apiClient.post.mockResolvedValue({
    data: { data: { assetId: 'asset-1' } },
    headers: { etag: 'W/"2"' },
  })
  const file = new File(['hello'], 'avatar.png', { type: 'image/png' })

  const result = await uploadWikiDraftAsset({ draftId: 'draft-1', file, etag: 'W/"1"' })

  expect(result).toEqual({ data: { assetId: 'asset-1' }, etag: 'W/"2"' })
  const [url, body, config] = apiClient.post.mock.calls[0]
  expect(url).toBe('/v1/wiki/drafts/draft-1/assets')
  expect(body).toBeInstanceOf(FormData)
  expect(config).toEqual({ headers: { 'If-Match': 'W/"1"', 'Content-Type': undefined } })
})

it('submitWikiDraft는 If-Match와 Idempotency-Key 헤더를 포함해 제출한다', async () => {
  apiClient.post.mockResolvedValue({ data: { data: { submissionId: 'sub-1' } } })

  const result = await submitWikiDraft({
    draftId: 'draft-1',
    etag: 'W/"3"',
    idempotencyKey: 'idem-1',
  })

  expect(result).toEqual({ submissionId: 'sub-1' })
  expect(apiClient.post).toHaveBeenCalledWith(
    '/v1/wiki/drafts/draft-1/submissions',
    {},
    {
      headers: {
        'If-Match': 'W/"3"',
        'Idempotency-Key': 'idem-1',
      },
    },
  )
})
