/** 이메일의 아이디 일부를 가려 프로필에 표시한다. */
export const maskEmail = (email) => {
  if (!email || !email.includes('@')) return '이메일 정보 없음'
  const [name, domain] = email.split('@')
  return `${name.slice(0, Math.min(3, Math.max(1, name.length - 1)))}***@${domain}`
}
