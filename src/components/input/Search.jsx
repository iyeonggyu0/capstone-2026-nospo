import searchIcon from '@/assets/icons/input/search.svg'
import { AuthField } from './AuthField'
import { SearchTypeSelect } from './SearchTypeSelect'

/**
 * 검색어와 기준을 입력받고, 검색 실행을 부모에게 전달하는 공통 검색창이다.
 * options는 부모가 정한 { value, label, placeholder?, inputMode? } 목록이며 value는 서로 달라야 한다.
 * searchType이 없거나 목록에 없으면 첫 항목을 표시·제출하고, 목록이 없으면 기준 선택을 숨긴다.
 * 목록이 없는 검색에서는 onSearch에 전달하는 searchType도 undefined다.
 * searchLabel은 검색 영역의 이름, aria-label은 실제 입력칸의 이름이다.
 * 직접 전달한 placeholder·inputMode를 항목별 설정보다 우선하며 입력값과 검색 정책은 부모가 관리한다.
 */
export const Search = ({
  value,
  onChange,
  options = [],
  searchType,
  onSearchTypeChange,
  onSearch,
  searchLabel = '검색',
  placeholder,
  disabled = false,
  ref,
  className = '',
  onKeyDown,
  ...inputProps
}) => {
  const selectedOption = options.find((option) => option.value === searchType) ?? options[0]
  const selectedSearchType = selectedOption?.value

  /** 검색 버튼과 Enter의 제출을 한곳에서 처리하고 페이지 새로고침을 막는다. */
  const handleSubmit = (event) => {
    event.preventDefault()

    if (disabled) return

    onSearch?.({ query: value, searchType: selectedSearchType })
  }

  /** 한글 등 문자를 조합하는 Enter가 검색을 실행하지 않도록 한다. */
  const handleKeyDown = (event) => {
    if (
      event.key === 'Enter' &&
      (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229)
    ) {
      event.preventDefault()
    }

    onKeyDown?.(event)
  }

  return (
    <form
      className={`relative flex h-[54px] w-full items-center gap-1 rounded-xl border border-border px-4 ${disabled ? 'bg-canvas' : 'bg-surface'} ${className}`}
      role="search"
      aria-label={searchLabel}
      onSubmit={handleSubmit}
    >
      <div className="min-w-0 flex-1">
        <AuthField
          {...inputProps}
          ref={ref}
          appearance="plain"
          type="search"
          className="h-13 appearance-none [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
          aria-label={inputProps['aria-label'] ?? '검색어'}
          value={value}
          onChange={onChange}
          placeholder={placeholder ?? selectedOption?.placeholder ?? '검색어를 입력하세요.'}
          inputMode={inputProps.inputMode ?? selectedOption?.inputMode}
          disabled={disabled}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className="flex shrink-0 items-center pr-px">
        <button
          className="flex size-11 shrink-0 items-center justify-end rounded-md disabled:cursor-not-allowed disabled:opacity-50"
          type="submit"
          aria-label="검색"
          disabled={disabled}
        >
          <img src={searchIcon} alt="" aria-hidden="true" width={20} height={20} />
        </button>
        {options.length > 0 && (
          <SearchTypeSelect
            options={options}
            value={selectedSearchType}
            onChange={onSearchTypeChange}
            disabled={disabled}
          />
        )}
      </div>
    </form>
  )
}
