import { useControllableValue } from './useControllableValue'

const defaultOptions = [
  { value: 'person', label: '인물' },
  { value: 'group', label: '단체' },
  { value: 'relationship', label: '관계도' },
]

export const WikiCategory = ({
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
    <div aria-label="위키 콘텐츠 유형" className={`flex gap-2 ${className}`} role="group">
      {options.map((option) => {
        const selected = option.value === selectedValue

        return (
          <button
            aria-pressed={selected}
            className={`min-h-8 flex-1 rounded-lg px-3 text-label font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-strong ${selected ? 'bg-teal-selected text-white' : 'bg-[#eef1ef] text-text-secondary hover:bg-[#e5eae7]'}`}
            key={option.value}
            onClick={() => setSelectedValue(option.value)}
            type="button"
          >
            {option.label}
            {option.count !== undefined && <span className="ml-1">{option.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
