import { useControllableValue } from './useControllableValue'

const defaultOptions = [
  { value: 'main', label: '주요 행적' },
  { value: 'ability', label: '능력 · 기술' },
  { value: 'relationship', label: '관계' },
  { value: 'other', label: '기타' },
]

/** 인물·단체 상세의 정보 섹션을 선택하는 탭이다. */
export const DetailTabs = ({
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
    <div aria-label="상세 정보" className={`flex border-b border-border ${className}`} role="group">
      {options.map((option) => {
        const selected = option.value === selectedValue

        return (
          <button
            aria-pressed={selected}
            className={`min-h-10 flex-1 border-b text-label font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-strong ${selected ? 'border-teal-strong text-teal-strong' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
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
