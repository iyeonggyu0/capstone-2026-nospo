import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api-client', () => ({
  apiClient: { defaults: { headers: { common: {} } }, get: vi.fn() },
  refreshAccessToken: vi.fn(),
}))

import { apiClient, refreshAccessToken } from '@/lib/api-client'
import { queryClient } from '@/lib/query-client'
import { useAuth } from './store'

beforeEach(() => {
  vi.clearAllMocks()
  queryClient.clear()
  delete apiClient.defaults.headers.common.Authorization
  useAuth.setState({ member: null, status: 'unknown', preview: false })
})

describe('로그인 상태 복원', () => {
  it('세션을 지우면 진행 중인 조회를 취소하고 늦은 응답도 캐시에 남기지 않는다', async () => {
    let resolveRequest
    let requestSignal
    queryClient.setQueryData(['home', 'summary'], { pages: 35 })
    const pending = queryClient
      .fetchQuery({
        queryKey: ['home', 'current'],
        queryFn: ({ signal }) => {
          requestSignal = signal
          return new Promise((resolve) => {
            resolveRequest = resolve
          })
        },
      })
      .catch(() => {})
    useAuth.getState().clearSession()
    expect(requestSignal.aborted).toBe(true)
    expect(queryClient.getQueryData(['home', 'summary'])).toBeUndefined()
    resolveRequest({ item: { title: '이전 계정의 책' } })
    await pending
    expect(queryClient.getQueryData(['home', 'current'])).toBeUndefined()
  })
  it('쿠키로 토큰과 회원 정보를 복원하고 중복 요청을 막는다', async () => {
    refreshAccessToken.mockResolvedValue('access-token')
    apiClient.get.mockResolvedValue({ data: { data: { memberId: 'member' } } })
    await Promise.all([useAuth.getState().restoreSession(), useAuth.getState().restoreSession()])
    expect(refreshAccessToken).toHaveBeenCalledTimes(1)
    expect(apiClient.get).toHaveBeenCalledWith('/v1/me', { signal: expect.any(AbortSignal) })
    expect(apiClient.defaults.headers.common.Authorization).toBe('Bearer access-token')
    expect(useAuth.getState()).toMatchObject({
      status: 'authenticated',
      member: { memberId: 'member' },
    })
  })

  it('인증 실패 시 비로그인 상태가 된다', async () => {
    refreshAccessToken.mockRejectedValue({ response: { status: 401 } })
    await useAuth.getState().restoreSession()
    expect(useAuth.getState()).toMatchObject({ status: 'anonymous', member: null })
  })

  it.each([new Error('network'), { response: { status: 503 } }])(
    '일시적인 복원 오류는 재시도할 수 있다',
    async (error) => {
      refreshAccessToken.mockRejectedValueOnce(error).mockResolvedValueOnce('access-token')
      apiClient.get.mockResolvedValue({ data: { data: { memberId: 'member' } } })
      await useAuth.getState().restoreSession()
      expect(useAuth.getState().status).toBe('error')
      await useAuth.getState().restoreSession()
      expect(useAuth.getState().status).toBe('authenticated')
    },
  )

  it('복원 중 로그아웃하면 늦게 도착한 결과로 다시 로그인하지 않는다', async () => {
    let resolveRefresh
    refreshAccessToken.mockReturnValue(
      new Promise((resolve) => {
        resolveRefresh = resolve
      }),
    )
    const restoring = useAuth.getState().restoreSession()
    useAuth.getState().clearSession()
    resolveRefresh('old-token')
    await restoring
    expect(useAuth.getState().status).toBe('anonymous')
    expect(apiClient.get).not.toHaveBeenCalled()
  })

  it('회원 정보를 조회하는 중 세션을 지우면 조회를 취소한다', async () => {
    refreshAccessToken.mockResolvedValue('old-token')
    let resolveMember
    apiClient.get.mockReturnValue(
      new Promise((resolve) => {
        resolveMember = resolve
      }),
    )
    const restoring = useAuth.getState().restoreSession()
    await Promise.resolve()
    const signal = apiClient.get.mock.calls[0][1].signal
    useAuth.getState().clearSession()
    expect(signal.aborted).toBe(true)
    resolveMember({ data: { data: { memberId: 'old' } } })
    await restoring
    expect(useAuth.getState()).toMatchObject({ status: 'anonymous', member: null })
  })
})
