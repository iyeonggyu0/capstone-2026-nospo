import { apiClient } from '@/lib/api-client'

/** 마이페이지의 회원 정보와 개인 활동을 조회한다. */
export const myApi = {
  member: async (signal) => (await apiClient.get('/v1/me', { signal })).data.data,
  updateNickname: async (nickname) =>
    (await apiClient.patch('/v1/me/nickname', { nickname })).data.data,
  changePassword: async (currentPassword, newPassword) => {
    // 비밀번호 오류와 만료된 토큰이 같은 401 코드이므로 보호 조회로 먼저 세션을 갱신한다.
    await apiClient.get('/v1/me')
    await apiClient.patch(
      '/v1/me/password',
      { currentPassword, newPassword },
      { _skipAuthRefresh: true },
    )
  },
  reauthenticate: async (password) =>
    (
      await apiClient.post(
        '/v1/me/reauth/password',
        { password, purpose: 'CHANGE_EMAIL' },
        { _skipAuthRefresh: true },
      )
    ).data.data,
  sendEmailChange: async (newEmail, reauthProof) =>
    (await apiClient.post('/v1/me/email-changes', { newEmail, reauthProof })).data.data,
  verifyEmailChange: async (verificationId, code) =>
    (await apiClient.post('/v1/me/email-changes/verify', { verificationId, code })).data.data,
  updateEmail: async (emailChangeProof) =>
    (await apiClient.patch('/v1/me/email', { emailChangeProof })).data.data,
  credits: async (signal) => (await apiClient.get('/v1/me/ai/credits', { signal })).data.data,
  reviewSummary: async (signal) =>
    (await apiClient.get('/v1/me/wiki/review-summary', { signal })).data.data,
  transactions: async (cursor, signal) =>
    (
      await apiClient.get('/v1/me/ai/credit-transactions', {
        params: { cursor, limit: 20 },
        signal,
      })
    ).data.data,
  submissions: async (cursor, signal, status) =>
    (
      await apiClient.get('/v1/me/wiki/submissions', {
        params: { status, cursor, limit: 20 },
        signal,
      })
    ).data.data,
  drafts: async (cursor, signal) =>
    (await apiClient.get('/v1/me/wiki/drafts', { params: { cursor, limit: 20 }, signal })).data
      .data,
  submission: async (id, signal) =>
    (await apiClient.get(`/v1/wiki/submissions/${encodeURIComponent(id)}`, { signal })).data.data,
  book: async (id, signal) =>
    (await apiClient.get(`/v1/books/${encodeURIComponent(id)}`, { signal })).data.data,
  terms: async (signal) => (await apiClient.get('/v1/terms', { signal })).data.data,
  term: async (id, signal) =>
    (await apiClient.get(`/v1/terms/${encodeURIComponent(id)}`, { signal })).data.data,
  logout: async () => {
    await apiClient.post('/v1/auth/logout')
  },
}
