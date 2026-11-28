import { expect, it, vi } from 'vitest'
import { apiClient } from '@/lib/api-client'
import { uploadWikiDraftAsset } from './wikiDrafts'

it('공통 JSON 헤더가 있어도 실제 Axios 요청에서 파일은 FormData로 남는다', async () => {
  const originalAdapter = apiClient.defaults.adapter
  const adapter = vi.fn(async (config) => ({
    data: { data: { assetId: 'asset' } },
    status: 201,
    statusText: 'Created',
    headers: { etag: '"2"' },
    config,
  }))
  apiClient.defaults.adapter = adapter
  try {
    const file = new File(['image'], 'image.png', { type: 'image/png' })
    await uploadWikiDraftAsset({ draftId: 'draft', file, etag: '"1"' })
    const request = adapter.mock.calls[0][0]
    expect(request.data).toBeInstanceOf(FormData)
    expect(request.data.get('file').name).toBe('image.png')
    expect(request.headers.get('If-Match')).toBe('"1"')
  } finally {
    apiClient.defaults.adapter = originalAdapter
  }
})
