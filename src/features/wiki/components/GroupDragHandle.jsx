/**
 * 순서 바꾸기 손잡이다. 마우스·터치로 끌거나, 포커스한 뒤 위·아래 방향키로 항목을 옮긴다.
 * 모양은 기존 손잡이와 같고, 눌러서 쓸 수 있도록 버튼으로 만들었다.
 *
 * @param {object} props 컴포넌트 props
 * @param {string} props.label 스크린 리더가 읽을 이름 (예: `서하준 순서 바꾸기`)
 * @param {boolean} [props.disabled=false] 비활성 여부
 */
export const GroupDragHandle = ({ label, disabled = false, ...handleProps }) => (
  <button
    aria-label={label}
    className="flex min-w-4 shrink-0 cursor-grab touch-none items-center justify-center gap-0.5 self-stretch py-1.25 active:cursor-grabbing disabled:cursor-default"
    disabled={disabled}
    type="button"
    {...handleProps}
  >
    <span aria-hidden="true" className="h-2.5 w-px bg-text-muted/70" />
    <span aria-hidden="true" className="h-2.5 w-px bg-text-muted/70" />
  </button>
)
