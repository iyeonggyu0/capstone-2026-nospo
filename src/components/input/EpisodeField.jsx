import { useEffect, useId } from 'react'

/**
 * 회차 숫자를 입력받는 작은 입력창이다.
 * total을 전달하면 `2 / 8 챕터`, prefix·unit을 전달하면 `기준 회차 2 화` 형태로 표시한다.
 * 입력값·변경 동작·숫자 검증은 부모가 맡고, ref는 실제 input에 전달한다.
 * 보이는 칸은 Figma 크기(56×28px)를 유지하고 클릭 영역만 44px 높이로 넓힌다.
 * 접근 가능한 이름은 필수다. prefix(보이는 라벨) 또는 aria-label(음성 안내용 이름)을 제공한다.
 * aria-labelledby로 이름 요소를 연결하거나 id와 외부 label의 htmlFor를 맞춰도 된다.
 * total·unit은 이름을 대신하지 않으며, 이름 누락은 개발 환경에서 경고한다.
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
  'aria-label': ariaLabel,
  'aria-labelledby': labelledBy,
  'aria-describedby': describedBy,
  ...inputProps
}) => {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const totalId = total == null ? undefined : `${inputId}-total`
  const inputDescribedBy = [describedBy, totalId].filter(Boolean).join(' ') || undefined

  /** 렌더링된 라벨과 ARIA 이름을 확인해 개발 중 입력 이름 누락을 알린다. */
  useEffect(() => {
    if (!import.meta.env.DEV) return

    const input = document.getElementById(inputId)
    if (!input) return

    const hasAriaLabel = Boolean(input.getAttribute('aria-label')?.trim())
    const hasLabelledBy = input
      .getAttribute('aria-labelledby')
      ?.trim()
      .split(/\s+/)
      .some((labelId) => document.getElementById(labelId)?.textContent?.trim())
    const hasLabel = Array.from(input.labels ?? []).some((label) => label.textContent?.trim())

    if (!hasAriaLabel && !hasLabelledBy && !hasLabel) {
      console.warn(
        `[EpisodeField: ${inputId}] 입력 이름이 필요합니다. prefix, aria-label, aria-labelledby 또는 연결된 외부 label을 제공하세요.`,
      )
    }
  }, [inputId, prefix, ariaLabel, labelledBy])

  return (
    <div className={`flex w-full max-w-[270px] items-center justify-center gap-3 ${className}`}>
      {prefix && (
        <label className="shrink-0 text-right text-label-sm text-text-muted" htmlFor={inputId}>
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
          aria-label={ariaLabel}
          aria-labelledby={labelledBy}
          aria-describedby={inputDescribedBy}
          className="h-7 w-14 rounded-sm bg-canvas px-2.5 text-center text-caption text-text-primary disabled:cursor-not-allowed disabled:text-text-muted"
        />
      </label>
      {total != null && (
        <>
          <span
            className="shrink-0 text-right text-label-sm font-medium text-text-muted"
            aria-hidden="true"
          >
            /
          </span>
          <span
            id={totalId}
            className="flex h-7 min-w-14 shrink-0 items-center justify-center rounded-sm bg-canvas px-2.5 text-label-sm font-medium whitespace-nowrap text-text-muted"
          >
            {total}
          </span>
        </>
      )}
      {unit && <span className="shrink-0 text-right text-label-sm text-text-muted">{unit}</span>}
    </div>
  )
}
