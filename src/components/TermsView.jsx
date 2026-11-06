import { useEffect, useRef } from 'react'

const content = {
  SERVICE: {
    title: '서비스 이용약관',
    sections: [
      [
        '서비스 안내',
        'NOSPO는 독서 기록과 설정한 독서 진도를 바탕으로 작품 정보를 제공하는 서비스입니다.',
      ],
      [
        '계정과 이용',
        '이용자는 정확한 정보를 입력하고 계정 정보를 안전하게 관리해야 합니다. 타인의 정보를 도용하거나 서비스를 방해해서는 안 됩니다.',
      ],
      [
        '게시물과 권리',
        '이용자는 다른 사람의 권리를 침해하지 않는 내용을 게시해야 합니다. 게시물에 대한 권리와 책임은 해당 이용자에게 있으며, 서비스 운영에 필요한 범위의 이용 조건은 운영자가 정합니다.',
      ],
      [
        '서비스 변경 및 종료',
        '서비스 기능은 운영 사정에 따라 변경되거나 중단될 수 있습니다. 중요한 변경 사항은 서비스 내에서 안내합니다.',
      ],
      [
        '이용 종료',
        '이용자는 회원 탈퇴를 요청할 수 있습니다. 탈퇴 시 개인정보와 기록은 서비스의 개인정보 처리방침 및 관련 법령에 따라 처리됩니다.',
      ],
    ],
  },
  PRIVACY: {
    title: '개인정보 처리방침',
    sections: [
      [
        '처리하는 정보와 목적',
        '회원가입과 계정 관리를 위해 닉네임, 이메일, 연락처 및 비밀번호를 처리합니다. 독서 기록과 위키 이용 정보는 서비스 제공을 위해 처리할 수 있습니다.',
      ],
      [
        '보유 및 파기',
        '회원 탈퇴 시 개인정보와 개인 기록을 삭제합니다. 법령에 따라 보존해야 하는 정보는 해당 법령에서 정한 기간 동안 별도로 보관한 뒤 파기합니다.',
      ],
      [
        '제공과 처리 위탁',
        '제3자 제공 또는 업무 위탁이 필요한 경우 실제 제공받는 자, 수탁자, 목적 및 항목을 확인하여 안내합니다.',
      ],
      [
        '이용자의 권리',
        '이용자는 자신의 개인정보에 대한 열람, 정정, 삭제, 처리정지 등을 요청할 수 있습니다. 구체적인 요청 방법과 담당자 정보는 서비스 운영 전에 안내합니다.',
      ],
      [
        '안전성 확보',
        '운영자는 개인정보에 대한 접근을 제한하고 안전하게 처리하기 위한 보호 조치를 마련합니다.',
      ],
    ],
  },
}

/** 회원가입 정보를 유지하면서 약관 초안을 확인한다. */
export const TermsView = ({ type, onClose }) => {
  const dialog = useRef(null)
  const document = content[type]

  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  if (!document) return null
  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      onClose={onClose}
      className="m-auto h-dvh max-h-full w-full max-w-none overflow-hidden bg-surface p-0 text-text-primary backdrop:bg-black/30 min-[481px]:h-[min(844px,calc(100dvh-4rem))] min-[481px]:w-[min(390px,calc(100vw-4rem))] min-[481px]:rounded-[32px]"
    >
      <div className="flex h-full flex-col">
        <header className="flex min-h-[68px] items-center gap-3 border-b border-border px-5">
          <button
            type="button"
            onClick={onClose}
            aria-label="뒤로 가기"
            className="-m-2 flex size-9 cursor-pointer items-center justify-center p-2 text-title"
          >
            ‹
          </button>
          <h1 className="text-title font-bold">{document.title}</h1>
        </header>
        <div className="overflow-y-auto px-5 py-6">
          <p className="text-caption text-text-secondary">
            검토용 초안입니다. 서비스 운영 정보와 실제 처리 현황을 확인한 후 적용해야 합니다.
          </p>
          {document.sections.map(([title, text]) => (
            <section key={title} className="mt-6">
              <h2 className="text-body font-bold">{title}</h2>
              <p className="mt-2 text-body leading-relaxed text-text-secondary">{text}</p>
            </section>
          ))}
        </div>
      </div>
    </dialog>
  )
}
