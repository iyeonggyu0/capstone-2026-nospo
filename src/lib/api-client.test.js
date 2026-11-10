import axios from 'axios'
import { afterEach, expect, it, vi } from 'vitest'
import { apiClient } from './api-client'

afterEach(() => {
  vi.restoreAllMocks()
  delete apiClient.defaults.headers.common.Authorization
})

it('취소된 요청의 늦은 토큰 재발급 결과는 새 세션을 변경하지 않는다', async () => {
  let resolveRefresh
  vi.spyOn(axios, 'post').mockReturnValue(
    new Promise((resolve) => {
      resolveRefresh = resolve
    }),
  )
  const controller = new AbortController()
  const retry = apiClient.interceptors.response.handlers[0].rejected({
    response: { status: 401 },
    config: { url: '/v1/me/reading/current', headers: {}, signal: controller.signal },
  })
  const result = retry.catch((error) => error)
  controller.abort()
  apiClient.defaults.headers.common.Authorization = 'Bearer new-session'
  resolveRefresh({ data: { data: { accessToken: 'old-session' } } })
  expect(axios.isCancel(await result)).toBe(true)
  expect(apiClient.defaults.headers.common.Authorization).toBe('Bearer new-session')
})
