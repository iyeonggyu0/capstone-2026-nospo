import { useControllableValue } from './useControllableValue'

const defaultOptions = [
  { value: 'all', label: '전체' },
  { value: 'close', label: '친밀' },
  { value: 'conflict', label: '대립' },
]

/** 관계도에서 표시할 관계 범위를 고르는 필터다. */
export const RelationshipFilter = ({
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
    <div
      aria-label="관계 범위"
      className={`flex flex-col items-start gap-2 ${className}`}
      role="group"
    >
      {options.map((option) => {
        const selected = option.value === selectedValue

        return (
          <button
            aria-pressed={selected}
            className={`min-h-8 rounded-full px-3 text-label font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-strong ${selected ? 'bg-teal-strong text-white' : 'bg-[#eef1ef] text-text-secondary hover:bg-[#e5eae7]'}`}
            key={option.value}
            onClick={() => setSelectedValue(option.value)}
            type="button"
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
