import { useId } from 'react'
import check from '@/assets/icons/input/check.svg'

/**
 * 약관 한 줄의 동의 체크박스, 제목, 필수 표시, 설명, 전문 보기 버튼을 보여주는 공통 행이다.
 * 동의 상태(checked)와 변경(onChange), 전문 보기(onView)는 부모가 전달하며 약관 내용·정책은 알지 못한다.
 * 실제 checkbox를 화면 밖에 두어 키보드·스크린리더 동작을 유지하고, 모양만 따로 그린다.
 */
export const TermsRow = ({
  id,
  ref,
  checked,
  onChange,
  title,
  description,
  required = false,
  onView,
  className = '',
  ...inputProps
}) => {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const titleId = `${inputId}-title`
  const descriptionId = description ? `${inputId}-description` : undefined

  return (
    <div className={`flex min-h-12 w-full items-center gap-2.5 ${className}`}>
      <label className="flex min-h-12 min-w-0 flex-1 cursor-pointer items-center gap-2.5 has-disabled:cursor-not-allowed">
        <input
          {...inputProps}
          id={inputId}
          ref={ref}
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={onChange}
          aria-required={required || undefined}
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
        />
        <span
          className={`flex size-5.5 shrink-0 items-center justify-center rounded-md border peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-teal-strong peer-disabled:opacity-50 ${checked ? 'border-teal-strong bg-teal-strong' : 'border-border bg-surface'}`}
          aria-hidden="true"
        >
          {checked && <img src={check} alt="" width={14} height={14} />}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-px">
          <span id={titleId} className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-body font-medium text-text-primary">{title}</span>
            {required && <span className="text-caption text-teal-strong">필수</span>}
          </span>
          {description && (
            <span id={descriptionId} className="text-caption text-text-secondary">
              {description}
            </span>
          )}
        </span>
      </label>
      {onView && (
        <button
          className="flex h-11 min-w-11 shrink-0 items-center justify-end text-label-sm font-medium text-teal-strong"
          type="button"
          aria-label={`${title} 전문 보기`}
          onClick={onView}
        >
          보기
        </button>
      )}
    </div>
  )
}
