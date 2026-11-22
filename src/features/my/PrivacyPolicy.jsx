import { faShieldHalved } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const previewSections = [
  [
    '01',
    '수집하는 개인정보와 이용 목적',
    '회원가입 및 계정 관리에 필요한 이메일, 닉네임, 연락처와 로그인 정보를 처리합니다. 서비스 이용 과정에서 독서 기록, 위키 활동, AI 질문과 서비스 이용 기록이 생성될 수 있습니다.\n\n카카오 로그인을 이용하는 경우, 카카오 동의 화면에서 동의한 정보와 서비스가 실제로 제공받는 항목을 확인해야 합니다.',
  ],
  [
    '02',
    '보유 기간과 파기',
    '개인정보는 회원 관리와 서비스 제공에 필요한 기간 동안 보관합니다. 회원 탈퇴 후 삭제되는 정보와 법령에 따라 보관해야 하는 정보, 각각의 보유 기간 및 파기 방법은 확정 후 기재해야 합니다.',
  ],
  [
    '03',
    '개인정보의 제3자 제공',
    '개인정보를 제3자에게 제공하는 경우 제공받는 자, 제공 목적, 제공 항목, 보유·이용 기간을 안내합니다. 별도 동의가 필요한 경우 동의 거부 권리와 거부 시 영향을 함께 안내하고 동의를 받습니다.\n\n실제 제공 여부와 대상: [확인 필요]',
  ],
  [
    '04',
    '개인정보 처리위탁과 AI 서비스',
    'AI 질문과 답변 기능에 외부 AI 서비스를 사용하는 경우, 실제 계약 및 전송 내용을 확인해 수탁자와 위탁 업무를 안내합니다. OpenAI를 사용하는 경우 전송되는 질문, 위키 내용 및 개인정보 포함 가능 항목을 확인해야 합니다.\n\n수탁자, 위탁 업무 및 처리 항목: [확인 필요]',
  ],
  [
    '05',
    '개인정보의 국외 이전',
    '외부 AI 서비스 등을 통해 개인정보가 국외로 이전되는 경우, 법적 근거에 맞춰 이전받는 자와 국가, 이전 일시·방법, 항목, 이용 목적, 보유 기간 및 필요한 권리 안내를 기재합니다.\n\n국외 이전 여부와 세부 내용: [확인 필요]',
  ],
  [
    '06',
    '이용자의 권리와 행사 방법',
    '이용자는 관련 법령에 따라 자신의 개인정보에 대한 열람, 정정, 삭제, 처리정지 등을 요청할 수 있습니다. 서비스에서 제공하는 요청 방법과 처리 절차를 안내해야 합니다.',
  ],
  [
    '07',
    '안전성 확보 및 문의',
    '개인정보 보호를 위한 안전조치와 권익침해에 대한 문의 방법을 안내합니다.\n\n개인정보 보호책임자 및 연락처: [확인 필요]\n시행일 및 개정 이력: [확인 필요]',
  ],
]

/** 서버에서 제공한 개인정보 처리방침과 개발 미리보기 내용을 표시한다. */
export const PrivacyPolicy = ({ policy, preview = false }) => {
  const date = policy?.effectiveAt ? new Date(policy.effectiveAt) : null
  const effectiveDate =
    date && !Number.isNaN(date.getTime())
      ? new Intl.DateTimeFormat('ko-KR', {
          timeZone: 'Asia/Seoul',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(date)
      : null

  return (
    <article className="flex flex-col gap-6 pb-4">
      <div className="flex items-start gap-3 rounded-xl bg-teal-subtle p-4">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-teal-strong"
          aria-hidden="true"
        >
          <FontAwesomeIcon icon={faShieldHalved} />
        </span>
        <div className="min-w-0">
          <p className="text-body font-medium text-text-primary">개인정보 처리방침</p>
          <p className="mt-1 text-caption text-text-secondary">
            {preview
              ? '검토용 초안입니다. 실제 처리 현황에 맞게 확인이 필요합니다.'
              : '개인정보 처리에 관한 내용을 확인해 주세요.'}
          </p>
        </div>
      </div>
      {preview ? (
        <div className="flex flex-col divide-y divide-border">
          {previewSections.map(([number, title, description]) => (
            <section key={number} className="flex gap-3 py-5 first:pt-0">
              <span className="pt-0.5 text-label-sm font-medium text-teal-strong">{number}</span>
              <div className="min-w-0 flex-1">
                <h3 className="text-body font-medium text-text-primary">{title}</h3>
                <p className="mt-2 text-body leading-relaxed text-text-secondary">{description}</p>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {(policy?.version || effectiveDate) && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 border-b border-border pb-4 text-caption text-text-secondary">
              {policy?.version && <span>버전 {policy.version}</span>}
              {effectiveDate && <span>시행일 {effectiveDate}</span>}
            </div>
          )}
          {policy?.content ? (
            <div className="text-body leading-relaxed break-words whitespace-pre-wrap text-text-secondary">
              {policy.content}
            </div>
          ) : (
            <p className="text-body text-text-secondary">처리방침 내용이 없습니다.</p>
          )}
        </div>
      )}
    </article>
  )
}
