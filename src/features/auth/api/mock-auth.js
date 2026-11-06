// 개발용 메모리 모의 응답: 서버나 실제 계정을 변경하지 않는다.
const terms = [
  {
    termVersionId: '00000000-0000-4000-8000-000000000001',
    title: '서비스 이용약관',
    type: 'SERVICE',
    required: true,
    content: '약관 내용이 준비 중입니다.',
  },
  {
    termVersionId: '00000000-0000-4000-8000-000000000002',
    title: '개인정보 처리방침',
    type: 'PRIVACY',
    required: true,
    content: '약관 내용이 준비 중입니다.',
  },
]
let account
let verifiedEmail

export const request = async (method, path, data) => {
  if (path === '/terms') return { items: terms }
  if (path.startsWith('/terms/')) return terms.find((term) => path.endsWith(term.termVersionId))
  if (path.startsWith('/auth/availability/')) return { available: true }
  if (path === '/auth/signup/email-verifications') {
    verifiedEmail = data.email
    return {
      verificationId: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 600000).toISOString(),
    }
  }
  if (
    path === '/auth/signup/email-verifications/confirm' &&
    (data.token === 'dev-test' || data.token === '123456') &&
    verifiedEmail
  ) {
    return {
      emailProof: 'dev-proof',
      email: verifiedEmail,
      expiresAt: new Date(Date.now() + 600000).toISOString(),
    }
  }
  if (path === '/auth/signup/email-verifications/confirm') {
    throw { response: { data: { error: { code: 'INVALID_VERIFICATION_CODE' } } } }
  }
  if (path === '/auth/signup' && data.emailProof === 'dev-proof') {
    account = { nickname: data.nickname, email: verifiedEmail, password: data.password }
    return {
      accessToken: 'dev-token',
      member: { nickname: account.nickname, email: account.email },
    }
  }
  if (
    path === '/auth/login' &&
    account?.email === data.email &&
    account?.password === data.password
  ) {
    return {
      accessToken: 'dev-token',
      member: { nickname: account.nickname, email: account.email },
    }
  }
  throw { response: { data: { error: { code: 'INVALID_CREDENTIALS' } } } }
}
