import { apiClient } from '@/lib/api-client'

const mockEnabled =
  import.meta.env.DEV && new URLSearchParams(window.location.search).has('preview')
const mock = mockEnabled ? import('./mock-auth') : null

const request = async (method, path, data, config = {}) => {
  if (mock) return (await mock).request(method, path, data, config)
  const response = await apiClient.request({ method, url: `/v1${path}`, data, ...config })
  return response.data?.data
}

export const authApi = {
  terms: () => request('get', '/terms'),
  term: (id) => request('get', `/terms/${encodeURIComponent(id)}`),
  availability: (field, value) =>
    request('get', `/auth/availability/${field}`, undefined, { params: { [field]: value } }),
  sendVerification: (email) => request('post', '/auth/signup/email-verifications', { email }),
  confirmEmail: (token) => request('post', '/auth/signup/email-verifications/confirm', { token }),
  signup: (data, key) =>
    request('post', '/auth/signup', data, { headers: { 'Idempotency-Key': key } }),
  login: (email, password) => request('post', '/auth/login', { email, password }),
  sendPasswordReset: (email) => request('post', '/auth/password-resets', { email }),
  verifyPasswordReset: (verificationId, code) =>
    request('post', '/auth/password-resets/verify', { verificationId, code }),
  completePasswordReset: (resetProof, newPassword) =>
    request('post', '/auth/password-resets/complete', { resetProof, newPassword }),
}

export const isAuthMock = mockEnabled

/** 링크 인증에 성공한 뒤에만 주소에서 사용한 토큰을 제거한다. */
export const confirmSignupEmail = async (token) => {
  const result = await authApi.confirmEmail(token)
  const url = new URL(window.location.href)
  if (url.searchParams.get('token') === token) {
    url.searchParams.delete('token')
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
  }
  return result
}

export const authError = (error) => {
  const code = error.response?.data?.error?.code
  const messages = {
    INVALID_CREDENTIALS: '이메일 또는 비밀번호를 확인해 주세요.',
    INVALID_VERIFICATION_CODE: '인증번호를 확인해 주세요.',
    EMAIL_ALREADY_EXISTS: '이미 사용 중인 이메일입니다.',
    NICKNAME_ALREADY_EXISTS: '이미 사용 중인 닉네임입니다.',
    PROOF_EXPIRED: '이메일 인증이 만료되었습니다. 다시 인증해 주세요.',
    PROOF_ALREADY_USED: '이미 사용된 인증입니다. 다시 인증해 주세요.',
    TERMS_VERSION_CHANGED: '약관이 변경되었습니다. 새로고침 후 다시 확인해 주세요.',
    RATE_LIMITED: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  }
  return (
    messages[code] ||
    (error.response
      ? '요청을 처리하지 못했습니다. 입력 내용을 확인해 주세요.'
      : '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.')
  )
}
