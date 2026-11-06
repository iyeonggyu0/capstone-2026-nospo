import { useEffect, useRef } from 'react'

/** 회원가입 정보를 유지하면서 서버에서 받은 약관을 보여준다. */
export const TermsView = ({ title, content, onClose }) => {
  const dialog = useRef(null)

  useEffect(() => {
    dialog.current?.showModal()
  }, [])

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
          <h1 className="text-title font-bold">{title}</h1>
        </header>
        <div className="overflow-y-auto px-5 py-6">
          <p className="text-body whitespace-pre-wrap text-text-secondary">{content}</p>
        </div>
      </div>
    </dialog>
  )
}
