import { useId, useState } from 'react'
import plusSmallIcon from '@/assets/icons/wiki/plus-small.svg'

/**
 * 인물이나 단체를 검색어로 찾아 추가하는 한 줄 입력 영역이다.
 * 검색 대상 데이터는 부모가 처리하며, 이 컴포넌트는 입력한 검색어를 `onAdd`로 전달만 한다.
 * `onAdd`가 없거나 검색어가 비어 있으면 `추가` 버튼은 비활성이다.
 *
 * @param {object} props 컴포넌트 props
 * @param {string} props.label 입력칸의 이름이자 안내 문구 (예: 인물 검색)
 * @param {(query: string) => void} [props.onAdd] `추가`를 눌렀을 때 검색어와 함께 실행
 */
export const GroupSearchBar = ({ label, onAdd }) => {
  const inputId = useId()
  const [query, setQuery] = useState('')
  const trimmedQuery = query.trim()

  /** 검색어가 있으면 부모에게 전달하고 입력칸을 비운다. */
  const handleSubmit = (event) => {
    event.preventDefault()
    if (!trimmedQuery || !onAdd) return

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
        onChange={(event) => setQuery(event.target.value)}
        placeholder={label}
        value={query}
      />
      <button
        className="-my-1 flex min-h-11 shrink-0 items-center gap-1.5 text-caption font-medium text-text-muted disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!onAdd || !trimmedQuery}
        type="submit"
      >
        추가
        <img alt="" src={plusSmallIcon} />
      </button>
    </form>
  )
}
