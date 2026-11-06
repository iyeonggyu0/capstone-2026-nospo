import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api-client', () => ({ apiClient: { request: vi.fn() } }))

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
  vi.clearAllMocks()
})

describe('인증 API', () => {
  it('명세에 맞는 가입 요청과 중복 방지 키를 전달한다', async () => {
    vi.stubEnv('DEV', false)
    const { apiClient } = await import('@/lib/api-client')
    apiClient.request.mockResolvedValue({ data: { data: { accessToken: 'token' } } })
    const { authApi } = await import('./auth')
    const payload = {
      nickname: '독자',
      emailProof: 'proof',
      password: 'password123',
      phoneNumber: '+821012345678',
      consents: [],
    }
    await expect(authApi.signup(payload, 'test-key')).resolves.toEqual({ accessToken: 'token' })
    expect(apiClient.request).toHaveBeenCalledWith({
      method: 'post',
      url: '/v1/auth/signup',
      data: payload,
      headers: { 'Idempotency-Key': 'test-key' },
    })
  })

  it('개발 모드에서 이메일 인증 후 가입과 로그인을 모의 실행한다', async () => {
    vi.stubEnv('DEV', true)
    const { authApi, isAuthMock } = await import('./auth')
    expect(isAuthMock).toBe(true)
    await authApi.sendVerification('reader@example.com')
    const proof = await authApi.confirmEmail('dev-test')
    const terms = await authApi.terms()
    const result = await authApi.signup(
      {
        nickname: '독자',
        emailProof: proof.emailProof,
        password: 'password123',
        phoneNumber: '+821012345678',
        consents: terms.items.map(({ termVersionId }) => ({ termVersionId, agreed: true })),
      },
      'key',
    )
    expect(result.member.email).toBe('reader@example.com')
    await expect(authApi.login('reader@example.com', 'password123')).resolves.toMatchObject({
      member: { nickname: '독자' },
    })
    await expect(authApi.login('reader@example.com', 'wrong')).rejects.toBeDefined()
  })
})
