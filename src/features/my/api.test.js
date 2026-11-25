import { expect, it, vi } from 'vitest'

vi.mock('@/lib/api-client', () => ({ apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }))

import { apiClient } from '@/lib/api-client'
import { myApi } from './api'
import { maskEmail } from './maskEmail'

it('회원 요약과 내역을 명세의 경로와 커서로 조회한다', async () => {
  const data = { items: [], nextCursor: null, hasNext: false }
  const { signal } = new AbortController()
  apiClient.get.mockResolvedValue({ data: { data } })
  expect(await myApi.reviewSummary(signal)).toBe(data)
  expect(await myApi.transactions('next', signal)).toBe(data)
  expect(apiClient.get.mock.calls).toEqual([
    ['/v1/me/wiki/review-summary', { signal }],
    ['/v1/me/ai/credit-transactions', { params: { cursor: 'next', limit: 20 }, signal }],
  ])
})

it('이메일 아이디의 일부를 가린다', () => {
  expect(maskEmail('yeowoo@mail.com')).toBe('yeo***@mail.com')
  expect(maskEmail('ab@mail.com')).toBe('a***@mail.com')
  expect(maskEmail(null)).toBe('이메일 정보 없음')
})

it('검수 상태별 목록과 제출 상세를 명세의 주소로 조회한다', async () => {
  apiClient.get.mockClear()
  const { signal } = new AbortController()
  apiClient.get.mockResolvedValue({ data: { data: { status: 'PENDING' } } })
  await myApi.submissions('next', signal, 'PENDING')
  expect(await myApi.submission('review-id', signal)).toEqual({ status: 'PENDING' })
  expect(apiClient.get.mock.calls).toEqual([
    [
      '/v1/me/wiki/submissions',
      { params: { status: 'PENDING', cursor: 'next', limit: 20 }, signal },
    ],
    ['/v1/wiki/submissions/review-id', { signal }],
  ])
})

it('이메일 변경은 재인증과 인증번호 확인 후 증명을 전달한다', async () => {
  apiClient.post.mockClear()
  apiClient.patch.mockClear()
  apiClient.post.mockResolvedValue({ data: { data: { reauthProof: 'proof' } } })
  apiClient.patch.mockResolvedValue({ data: { data: { email: 'new@example.com' } } })
  await myApi.reauthenticate('password')
  await myApi.sendEmailChange('new@example.com', 'proof')
  await myApi.verifyEmailChange('verification-id', '123456')
  await myApi.updateEmail('email-proof')
  expect(apiClient.post.mock.calls).toEqual([
    [
      '/v1/me/reauth/password',
      { password: 'password', purpose: 'CHANGE_EMAIL' },
      { _skipAuthRefresh: true },
    ],
    ['/v1/me/email-changes', { newEmail: 'new@example.com', reauthProof: 'proof' }],
    ['/v1/me/email-changes/verify', { verificationId: 'verification-id', code: '123456' }],
  ])
  expect(apiClient.patch).toHaveBeenCalledWith('/v1/me/email', { emailChangeProof: 'email-proof' })
})
