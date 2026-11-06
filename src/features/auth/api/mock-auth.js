// 개발용 메모리 모의 응답: 서버나 실제 계정을 변경하지 않는다.
const terms = [
  {
    termVersionId: '00000000-0000-4000-8000-000000000001',
    title: '서비스 이용약관',
    type: 'SERVICE',
    required: true,
    content:
      '검토용 초안입니다. 서비스 운영 정보와 실제 처리 현황을 확인한 후 적용해야 합니다.\n\n서비스 안내\nNOSPO는 독서 기록과 설정한 독서 진도를 바탕으로 작품 정보를 제공하는 서비스입니다.\n\n계정과 이용\n이용자는 정확한 정보를 입력하고 계정 정보를 안전하게 관리해야 합니다. 타인의 정보를 도용하거나 서비스를 방해해서는 안 됩니다.\n\n게시물과 권리\n이용자는 다른 사람의 권리를 침해하지 않는 내용을 게시해야 합니다. 게시물에 대한 권리와 책임은 해당 이용자에게 있으며, 서비스 운영에 필요한 범위의 이용 조건은 운영자가 정합니다.\n\n서비스 변경 및 종료\n서비스 기능은 운영 사정에 따라 변경되거나 중단될 수 있습니다. 중요한 변경 사항은 서비스 내에서 안내합니다.\n\n이용 종료\n이용자는 회원 탈퇴를 요청할 수 있습니다. 탈퇴 시 개인정보와 기록은 서비스의 개인정보 처리방침 및 관련 법령에 따라 처리됩니다.',
  },
  {
    termVersionId: '00000000-0000-4000-8000-000000000002',
    title: '개인정보 처리방침',
    type: 'PRIVACY',
    required: true,
    content:
      '검토용 초안입니다. 서비스 운영 정보와 실제 처리 현황을 확인한 후 적용해야 합니다.\n\n처리하는 정보와 목적\n회원가입과 계정 관리를 위해 닉네임, 이메일, 연락처 및 비밀번호를 처리합니다. 독서 기록과 위키 이용 정보는 서비스 제공을 위해 처리할 수 있습니다.\n\n보유 및 파기\n회원 탈퇴 시 개인정보와 개인 기록을 삭제합니다. 법령에 따라 보존해야 하는 정보는 해당 법령에서 정한 기간 동안 별도로 보관한 뒤 파기합니다.\n\n제공과 처리 위탁\n제3자 제공 또는 업무 위탁이 필요한 경우 실제 제공받는 자, 수탁자, 목적 및 항목을 확인하여 안내합니다.\n\n이용자의 권리\n이용자는 자신의 개인정보에 대한 열람, 정정, 삭제, 처리정지 등을 요청할 수 있습니다. 구체적인 요청 방법과 담당자 정보는 서비스 운영 전에 안내합니다.\n\n안전성 확보\n운영자는 개인정보에 대한 접근을 제한하고 안전하게 처리하기 위한 보호 조치를 마련합니다.',
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
    data.token === 'dev-test' &&
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
