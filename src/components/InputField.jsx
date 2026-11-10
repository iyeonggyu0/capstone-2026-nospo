import { useId } from 'react'

/** 라벨과 입력값, 선택적인 도움말 및 오류 메시지를 표시한다. */
export const InputField = ({
  label,
  labelHidden = false,
  error,
  isError = Boolean(error),
  hint,
  id,
  action,
  ...inputProps
}) => {
  const generatedId = useId()
  const inputId = id || generatedId
  const messageId = `${inputId}-message`
  const message = isError ? error : hint

  return (
    <div className="flex flex-col gap-[5px]">
      <label
        htmlFor={inputId}
        className={labelHidden ? 'sr-only' : 'text-label-sm font-medium text-text-secondary'}
      >
        {label}
      </label>
      <div className="relative">
        <input
          {...inputProps}
          id={inputId}
          aria-invalid={isError || undefined}
          aria-describedby={message ? messageId : undefined}
          className={`h-[46px] w-full rounded-lg border bg-surface px-3 text-body font-normal text-text-primary ${action ? 'pr-14' : ''} ${isError ? 'border-red-error' : 'border-border'}`}
        />
        {action && <div className="absolute inset-y-0 right-3 flex items-center">{action}</div>}
      </div>
      {message && (
        <p
          id={messageId}
          className={`text-caption ${isError ? 'text-red-error' : 'text-text-secondary'}`}
          aria-live={isError ? 'polite' : undefined}
        >
          {message}
        </p>
      )}
    </div>
  )
}
