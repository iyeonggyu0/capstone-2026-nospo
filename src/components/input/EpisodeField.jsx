import { useId } from 'react'

/**
 * 회차 숫자를 입력받는 작은 입력창이다.
 * total을 전달하면 `2 / 8 챕터`, prefix·unit을 전달하면 `기준 회차 2 화` 형태로 표시한다.
 * 입력값·변경 동작·숫자 검증은 부모가 맡고, ref는 실제 input에 전달한다.
 * 보이는 칸은 Figma 크기(56×28px)를 유지하고 클릭 영역만 44px 높이로 넓힌다.
 */
export const EpisodeField = ({
  id,
  ref,
  value,
  onChange,
  prefix,
  unit,
  total,
  className = '',
  'aria-describedby': describedBy,
  ...inputProps
}) => {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const totalId = total == null ? undefined : `${inputId}-total`
  const inputDescribedBy = [describedBy, totalId].filter(Boolean).join(' ') || undefined

  return (
    <div className={`flex w-full max-w-[270px] items-center justify-center gap-3 ${className}`}>
      {prefix && (
        <label className="shrink-0 text-right text-label-sm text-[#7d7d7d]" htmlFor={inputId}>
          {prefix}
        </label>
      )}
      <label className="-my-2 flex h-11 shrink-0 items-center">
        <input
          {...inputProps}
          id={inputId}
          ref={ref}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={onChange}
          aria-describedby={inputDescribedBy}
          className="h-7 w-14 rounded-sm bg-[#f3f3f3] px-2.5 text-center text-caption text-black disabled:cursor-not-allowed disabled:text-text-muted"
        />
      </label>
      {total != null && (
        <>
          <span
            className="shrink-0 text-right text-label-sm font-medium text-[#bcbcbc]"
            aria-hidden="true"
          >
            /
          </span>
          <span
            id={totalId}
            className="flex h-7 min-w-14 shrink-0 items-center justify-center rounded-sm bg-[#fbfbfb] px-2.5 text-label-sm font-medium whitespace-nowrap text-[#bcbcbc]"
          >
            {total}
          </span>
        </>
      )}
      {unit && <span className="shrink-0 text-right text-label-sm text-[#7d7d7d]">{unit}</span>}
    </div>
  )
}
