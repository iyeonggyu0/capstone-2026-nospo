import { useEffect, useId, useRef, useState } from 'react'
import chevronDown from '@/assets/icons/input/chevron-down.svg'

/**
 * 검색 기준의 선택 버튼과 목록을 제공한다.
 * 항목은 부모가 전달하며, 빈 목록에서는 선택 버튼을 비활성화한다.
 * 목록은 가장 가까운 relative 조상(검색창)의 오른쪽 끝과 맞춰 아래에 표시한다.
 */
export const SearchTypeSelect = ({
  options = [],
  value,
  onChange,
  disabled: disabledProp = false,
}) => {
  const disabled = disabledProp || options.length === 0
  const [isOpen, setIsOpen] = useState(false)
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )
  const [activeIndex, setActiveIndex] = useState(selectedIndex)
  const activeOptionIndex = Math.min(activeIndex, Math.max(options.length - 1, 0))
  const containerRef = useRef(null)
  const typedCharactersRef = useRef({ text: '', time: 0 })
  const listboxId = `${useId()}-search-types`
  const isExpanded = isOpen && !disabled

  /** 선택한 기준을 부모에게 전달하고 목록을 닫는다. */
  const selectOption = (index) => {
    if (disabled) return

    if (options[index].value !== value) onChange?.(options[index].value)
    setIsOpen(false)
  }

  /** 목록을 열 때 현재 선택값이나 지정한 항목에 키보드 탐색을 맞춘다. */
  const openOptions = (index = selectedIndex) => {
    if (disabled) return

    typedCharactersRef.current = { text: '', time: 0 }
    setActiveIndex(index)
    setIsOpen(true)
  }

  /** 목록의 키보드 탐색과 선택을 처리하되 검색 폼은 제출하지 않는다. */
  const handleKeyDown = (event) => {
    if (disabled || event.nativeEvent.isComposing) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (isExpanded) setActiveIndex(Math.min(activeOptionIndex + 1, options.length - 1))
        else openOptions()
        break
      case 'ArrowUp':
        event.preventDefault()
        if (isExpanded && event.altKey) selectOption(activeOptionIndex)
        else if (isExpanded) setActiveIndex(Math.max(activeOptionIndex - 1, 0))
        else openOptions(0)
        break
      case 'Home':
      case 'PageUp':
        event.preventDefault()
        openOptions(0)
        break
      case 'End':
      case 'PageDown':
        event.preventDefault()
        openOptions(options.length - 1)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (isExpanded) selectOption(activeOptionIndex)
        else openOptions()
        break
      case 'Escape':
        if (isExpanded) {
          event.preventDefault()
          event.stopPropagation()
        }
        setIsOpen(false)
        break
      case 'Tab':
        if (isExpanded) selectOption(activeOptionIndex)
        break
      default: {
        if (event.key.length !== 1 || event.altKey || event.ctrlKey || event.metaKey) return

        const now = Date.now()
        const previous = typedCharactersRef.current
        const text =
          (now - previous.time < 500 ? previous.text : '') + event.key.toLocaleLowerCase()
        typedCharactersRef.current = { text, time: now }
        const index = options.findIndex((option) =>
          option.label.toLocaleLowerCase().startsWith(text),
        )

        if (index >= 0) {
          event.preventDefault()
          setActiveIndex(index)
          setIsOpen(true)
        }
      }
    }
  }

  useEffect(() => {
    if (!isExpanded) return

    /** 바깥 영역을 누르면 열린 목록을 닫는다. */
    const handleOutsidePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false)
    }

    document.addEventListener('pointerdown', handleOutsidePointerDown)
    return () => document.removeEventListener('pointerdown', handleOutsidePointerDown)
  }, [isExpanded])

  return (
    <div
      ref={containerRef}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false)
      }}
    >
      <input
        type="hidden"
        name="searchType"
        value={value ?? options[selectedIndex]?.value ?? ''}
        disabled={disabled}
      />
      <button
        className="flex h-11 items-center justify-end gap-[6px] rounded-md pl-2.5 text-label-sm font-medium text-text-muted disabled:cursor-not-allowed"
        type="button"
        role="combobox"
        aria-label="검색 기준"
        aria-haspopup="listbox"
        aria-expanded={isExpanded}
        aria-controls={listboxId}
        aria-activedescendant={isExpanded ? `${listboxId}-${activeOptionIndex}` : undefined}
        disabled={disabled}
        onClick={() => {
          if (isExpanded) setIsOpen(false)
          else openOptions()
        }}
        onKeyDown={handleKeyDown}
      >
        <span>{options[selectedIndex]?.label ?? '검색 기준'}</span>
        <img src={chevronDown} alt="" aria-hidden="true" width={13} height={13} />
      </button>
      <ul
        id={listboxId}
        className="absolute top-full -right-px z-20 mt-1.5 w-20 rounded-xl border border-border bg-surface p-1 shadow-md"
        role="listbox"
        aria-label="검색 기준 목록"
        hidden={!isExpanded}
      >
        {options.map((option, index) => (
          <li
            key={option.value}
            id={`${listboxId}-${index}`}
            className={`flex min-h-11 cursor-pointer items-center rounded-lg px-3 text-left text-label-sm font-medium hover:bg-canvas ${index === (isExpanded ? activeOptionIndex : selectedIndex) ? 'bg-teal-subtle text-teal-strong' : 'text-text-primary'}`}
            role="option"
            aria-selected={index === (isExpanded ? activeOptionIndex : selectedIndex)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => selectOption(index)}
          >
            {option.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
