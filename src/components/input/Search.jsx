import searchIcon from '@/assets/icons/input/search.svg'
import { AuthField } from './AuthField'
import { SearchTypeSelect } from './SearchTypeSelect'

const searchOptions = [
  { value: 'name', label: '이름', placeholder: '이름을 입력하세요.' },
  { value: 'author', label: '저자', placeholder: '저자를 입력하세요.' },
  { value: 'isbn', label: 'ISBN', placeholder: 'ISBN 13자리를 입력하세요.' },
]

/** 검색어와 기준을 입력받고, 검색 실행을 부모에게 전달하는 공통 검색창이다. */
export const Search = ({
  value,
  onChange,
  searchType = 'name',
  onSearchTypeChange,
  onSearch,
  placeholder,
  disabled = false,
  ref,
  className = '',
  onKeyDown,
  ...inputProps
}) => {
  const selectedOption =
    searchOptions.find((option) => option.value === searchType) ?? searchOptions[0]

  /** 검색 버튼과 Enter의 제출을 한곳에서 처리하고 페이지 새로고침을 막는다. */
  const handleSubmit = (event) => {
    event.preventDefault()

    if (disabled) return

    onSearch?.({ query: value, searchType })
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
      className={`relative flex h-[54px] w-full items-center gap-1 rounded-xl border border-[#eee] px-4 ${disabled ? 'bg-canvas' : 'bg-surface'} ${className}`}
      role="search"
      aria-label="도서 검색"
      onSubmit={handleSubmit}
    >
      <div className="min-w-0 flex-1">
        <AuthField
          {...inputProps}
          ref={ref}
          appearance="plain"
          type="search"
          className="h-13 appearance-none placeholder:text-[#d2d2d2]! [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
          aria-label={inputProps['aria-label'] ?? '도서 검색어'}
          value={value}
          onChange={onChange}
          placeholder={placeholder ?? selectedOption.placeholder}
          inputMode={inputProps.inputMode ?? (searchType === 'isbn' ? 'numeric' : undefined)}
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
        <SearchTypeSelect
          options={searchOptions}
          value={searchType}
          onChange={onSearchTypeChange}
          disabled={disabled}
        />
      </div>
    </form>
  )
}
