import { useId } from 'react'
import checkCircle from '@/assets/icons/input/check-circle.svg'

/**
 * 라벨과 안내 문구를 연결하고 부모가 전달한 상태를 표시하는 공통 입력창이다.
 * 입력값·검증 결과는 부모가 관리하고, ref는 실제 input에 전달한다.
 * plain 형태는 바깥 컴포넌트가 테두리와 크기를 구성할 때 사용한다.
 */
export const AuthField = ({
  label,
  id,
  ref,
  type = 'text',
  value,
  onChange,
  status = 'default',
  message,
  appearance = 'outline',
  className = '',
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  ...inputProps
}) => {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const messageId = message ? `${inputId}-message` : undefined
  const inputDescribedBy = [describedBy, messageId].filter(Boolean).join(' ') || undefined
  const isError = status === 'error'
  const isSuccess = status === 'success'
  const borderClassName = isError
    ? 'border-red-error'
    : isSuccess
      ? 'border-teal-strong'
      : 'border-border'
  const appearanceClassName =
    appearance === 'plain'
      ? 'bg-transparent'
      : `h-[46px] rounded-lg border bg-surface px-3 disabled:bg-canvas ${borderClassName}`

  return (
    <div className="flex w-full min-w-0 flex-col gap-[5px]">
      {label && (
        <label className="text-label-sm font-medium text-text-secondary" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className="relative w-full">
        <input
          {...inputProps}
          id={inputId}
          ref={ref}
          type={type}
          value={value}
          onChange={onChange}
          aria-invalid={isError ? true : ariaInvalid}
          aria-describedby={inputDescribedBy}
          className={`w-full min-w-0 text-body text-text-primary placeholder:text-text-muted disabled:cursor-not-allowed disabled:text-text-muted ${appearanceClassName} ${isSuccess ? 'pr-10' : ''} ${className}`}
        />
        {isSuccess && (
          <img
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
            src={checkCircle}
            alt=""
            aria-hidden="true"
            width={16}
            height={16}
          />
        )}
      </div>
      {message && (
        <p
          id={messageId}
          className={`text-caption ${isError ? 'text-red-error' : 'text-text-secondary'}`}
          aria-live="polite"
        >
          {message}
        </p>
      )}
    </div>
  )
}
