import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api-client', () => ({
  apiClient: { defaults: { headers: { common: {} } }, get: vi.fn() },
  refreshAccessToken: vi.fn(),
}))

import { apiClient, refreshAccessToken } from '@/lib/api-client'
import { useAuth } from './store'

beforeEach(() => {
  vi.clearAllMocks()
  delete apiClient.defaults.headers.common.Authorization
  useAuth.setState({ member: null, status: 'unknown' })
})

describe('로그인 상태 복원', () => {
  it('쿠키로 토큰과 회원 정보를 복원하고 중복 요청을 막는다', async () => {
    refreshAccessToken.mockResolvedValue('access-token')
    apiClient.get.mockResolvedValue({ data: { data: { memberId: 'member' } } })
    await Promise.all([useAuth.getState().restoreSession(), useAuth.getState().restoreSession()])
    expect(refreshAccessToken).toHaveBeenCalledTimes(1)
    expect(apiClient.get).toHaveBeenCalledWith('/v1/me')
    expect(apiClient.defaults.headers.common.Authorization).toBe('Bearer access-token')
    expect(useAuth.getState()).toMatchObject({
      status: 'authenticated',
      member: { memberId: 'member' },
    })
  })

  it('복원에 실패하면 비로그인 상태가 된다', async () => {
    refreshAccessToken.mockRejectedValue(new Error('no session'))
    await useAuth.getState().restoreSession()
    expect(useAuth.getState()).toMatchObject({ status: 'anonymous', member: null })
  })

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
})
