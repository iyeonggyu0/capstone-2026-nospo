import axios from 'axios'
import { afterEach, expect, it, vi } from 'vitest'
import {
  apiClient,
  invalidateSessionRequests,
  refreshAccessToken,
  setAuthenticationExpiredHandler,
} from './api-client'

afterEach(() => {
  invalidateSessionRequests()
  vi.restoreAllMocks()
  delete apiClient.defaults.headers.common.Authorization
  setAuthenticationExpiredHandler(() => {})
})

it('세션 교체 후 이전 토큰 재발급은 새 요청에 공유되지 않는다', async () => {
  let finishOld
  let finishNew
  const post = vi
    .spyOn(axios, 'post')
    .mockReturnValueOnce(
      new Promise((resolve) => {
        finishOld = resolve
      }),
    )
    .mockReturnValueOnce(
      new Promise((resolve) => {
        finishNew = resolve
      }),
    )
  const oldRefresh = refreshAccessToken()
  expect(refreshAccessToken()).toBe(oldRefresh)
  invalidateSessionRequests()
  expect(post.mock.calls[0][2].signal.aborted).toBe(true)
  const newRefresh = refreshAccessToken()
  expect(post).toHaveBeenCalledTimes(2)
  finishOld({ data: { data: { accessToken: 'old' } } })
  await oldRefresh
  expect(refreshAccessToken()).toBe(newRefresh)
  finishNew({ data: { data: { accessToken: 'new' } } })
  await expect(newRefresh).resolves.toBe('new')
})

it('같은 세션의 동시 인증 오류는 재발급을 공유하고 두 요청을 모두 재시도한다', async () => {
  let finishRefresh
  const post = vi.spyOn(axios, 'post').mockReturnValue(
    new Promise((resolve) => {
      finishRefresh = resolve
    }),
  )
  const adapter = vi.fn(async (config) => ({
    data: 'ok',
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  }))
  apiClient.defaults.headers.common.Authorization = 'Bearer old'
  const makeRequest = () =>
    apiClient.interceptors.request.handlers[0].fulfilled({
      url: '/v1/me/reading/current',
      method: 'get',
      headers: { Authorization: 'Bearer old' },
      adapter,
    })
  const retry = apiClient.interceptors.response.handlers[0].rejected
  const first = retry({ response: { status: 401 }, config: makeRequest() })
  const second = retry({ response: { status: 401 }, config: makeRequest() })
  expect(post).toHaveBeenCalledTimes(1)
  finishRefresh({ data: { data: { accessToken: 'renewed' } } })
  await expect(Promise.all([first, second])).resolves.toHaveLength(2)
  expect(adapter).toHaveBeenCalledTimes(2)
  expect(apiClient.defaults.headers.common.Authorization).toBe('Bearer renewed')
})

it('재발급이 401로 거부되면 세션을 정리한다', async () => {
  const onExpired = vi.fn()
  setAuthenticationExpiredHandler(onExpired)
  apiClient.defaults.headers.common.Authorization = 'Bearer current'
  vi.spyOn(axios, 'post').mockRejectedValue({ response: { status: 401 } })
  await expect(
    apiClient.interceptors.response.handlers[0].rejected({
      response: { status: 401 },
      config: { url: '/v1/me/reading/current', headers: { Authorization: 'Bearer current' } },
    }),
  ).rejects.toMatchObject({ response: { status: 401 } })
  expect(onExpired).toHaveBeenCalledOnce()
})

it('재발급한 토큰으로 재시도한 요청이 401이면 세션을 정리한다', async () => {
  const onExpired = vi.fn()
  setAuthenticationExpiredHandler(onExpired)
  await expect(
    apiClient.interceptors.response.handlers[0].rejected({
      response: { status: 401 },
      config: { url: '/v1/me/reading/current', headers: {}, _retried: true },
    }),
  ).rejects.toMatchObject({ response: { status: 401 } })
  expect(onExpired).toHaveBeenCalledOnce()
})

it('재발급 중 네트워크 오류가 나면 현재 세션을 유지한다', async () => {
  const onExpired = vi.fn()
  setAuthenticationExpiredHandler(onExpired)
  apiClient.defaults.headers.common.Authorization = 'Bearer current'
  vi.spyOn(axios, 'post').mockRejectedValue(new Error('network'))
  await expect(
    apiClient.interceptors.response.handlers[0].rejected({
      response: { status: 401 },
      config: { url: '/v1/me/reading/current', headers: { Authorization: 'Bearer current' } },
    }),
  ).rejects.toThrow('network')
  expect(onExpired).not.toHaveBeenCalled()
  expect(apiClient.defaults.headers.common.Authorization).toBe('Bearer current')
})

it('이전 계정의 늦은 인증 실패는 새 계정을 로그아웃하지 않는다', async () => {
  const onExpired = vi.fn()
  setAuthenticationExpiredHandler(onExpired)
  const oldRequest = apiClient.interceptors.request.handlers[0].fulfilled({
    url: '/v1/me/reading/current',
    headers: { Authorization: 'Bearer old' },
  })
  invalidateSessionRequests()
  apiClient.defaults.headers.common.Authorization = 'Bearer new'
  const refresh = vi.spyOn(axios, 'post')
  const error = await apiClient.interceptors.response.handlers[0]
    .rejected({
      response: { status: 401 },
      config: oldRequest,
    })
    .catch((err) => err)
  expect(axios.isCancel(error)).toBe(true)
  expect(refresh).not.toHaveBeenCalled()
  expect(onExpired).not.toHaveBeenCalled()
  expect(apiClient.defaults.headers.common.Authorization).toBe('Bearer new')
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
