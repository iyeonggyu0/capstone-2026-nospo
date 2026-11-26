import { useId, useState } from 'react'
import plusSmallIcon from '@/assets/icons/wiki/plus-small.svg'

/**
 * 인물이나 단체를 검색어로 찾아 추가하는 한 줄 입력 영역이다.
 * 검색 대상 데이터는 부모가 처리하며, 이 컴포넌트는 입력한 검색어를 `onAdd`로 전달만 한다.
 * `options`를 주면 입력 중에 그 이름들을 자동완성으로 보여주고, `requireMatch`면 그중 하나와 이름이 같을 때만 `추가`할 수 있다.
 * `onAdd`가 없거나 검색어가 비어 있으면 `추가` 버튼은 비활성이다.
 *
 * @param {object} props 컴포넌트 props
 * @param {string} props.label 입력칸의 이름이자 안내 문구 (예: 인물 검색)
 * @param {(query: string) => void} [props.onAdd] `추가`를 눌렀을 때 검색어와 함께 실행
 * @param {string[]} [props.options] 자동완성으로 보여줄 이름 목록
 * @param {boolean} [props.requireMatch=false] `options` 중 이름이 같은 항목이 있을 때만 `추가`를 허용할지 여부
 */
export const GroupSearchBar = ({ label, onAdd, options, requireMatch = false }) => {
  const inputId = useId()
  const [query, setQuery] = useState('')
  const trimmedQuery = query.trim()
  const hasMatch =
    !requireMatch ||
    Boolean(options?.some((option) => option.trim().toLowerCase() === trimmedQuery.toLowerCase()))
  const canAdd = Boolean(onAdd) && Boolean(trimmedQuery) && hasMatch

  /** 검색어가 있고 조건에 맞으면 부모에게 전달하고 입력칸을 비운다. */
  const handleSubmit = (event) => {
    event.preventDefault()
    if (!canAdd) return

    onAdd(trimmedQuery)
    setQuery('')
  }

  return (
    <form
      className="flex h-9.25 items-center justify-between gap-2 rounded-sm bg-canvas px-2.5"
      onSubmit={handleSubmit}
    >
      <label className="sr-only" htmlFor={inputId}>
        {label}
      </label>
      <input
        className="min-w-0 flex-1 bg-transparent text-caption text-text-primary placeholder:text-teal-strong"
        id={inputId}
        list={options ? `${inputId}-options` : undefined}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={label}
        value={query}
      />
      {options && (
        <datalist id={`${inputId}-options`}>
          {options.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      )}
      <button
        className="-my-1 flex min-h-11 shrink-0 items-center gap-1.5 text-caption font-medium text-text-muted disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!canAdd}
        type="submit"
      >
        추가
        <img alt="" src={plusSmallIcon} />
      </button>
    </form>
  )
}
