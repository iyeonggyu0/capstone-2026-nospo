import { useControllableValue } from './useControllableValue'

const defaultOptions = [
  { value: 'all', label: '전체' },
  { value: 'reviewing', label: '검수 중' },
  { value: 'revision', label: '수정 요청' },
  { value: 'approved', label: '승인' },
]

/** 위키 검수 목록을 상태별로 선택하는 탭이다. */
export const ReviewTabs = ({
  options = defaultOptions,
  value,
  defaultValue = options[0]?.value,
  onChange,
  className = '',
}) => {
  const [selectedValue, setSelectedValue] = useControllableValue({
    value,
    defaultValue,
    onChange,
  })

  return (
    <div aria-label="검수 상태" className={`flex border-b border-border ${className}`} role="group">
      {options.map((option) => {
        const selected = option.value === selectedValue

        return (
          <button
            aria-pressed={selected}
            className={`min-h-10 flex-1 border-b text-label font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-strong ${selected ? 'border-teal-strong text-teal-strong' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
            key={option.value}
            onClick={() => setSelectedValue(option.value)}
            type="button"
          >
            {option.label} {option.count !== undefined && <span>{option.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
