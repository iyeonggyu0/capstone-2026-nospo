import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Search } from '@/components/input'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/features/auth'
import { getSearchHistory, searchBooks } from '@/features/wiki'

const options = [
  { value: 'title', label: '이름', placeholder: '도서 제목을 입력하세요.' },
  { value: 'author', label: '저자', placeholder: '저자 이름을 입력하세요.' },
  { value: 'isbn', label: 'ISBN', placeholder: 'ISBN 13자리를 입력하세요.', inputMode: 'numeric' },
]
const titles = { title: '제목으로', author: '저자로', isbn: 'ISBN으로' }
const mockBooks = [
  {
    bookId: 'preview-0',
    title: '데미안',
    authors: ['헤르만 헤세'],
    bookType: 'BOOK',
    publisher: '민음사',
    isbn: '9788937460449',
  },
  {
    bookId: 'preview-1',
    title: '데미안: 싱클레어의 이야기',
    authors: ['헤르만 헤세'],
    bookType: 'WEB_NOVEL',
    publisher: '문피아',
  },
  {
    bookId: 'preview-2',
    title: '불편한 편의점',
    authors: ['김호연'],
    bookType: 'BOOK',
    publisher: '나무옆의자',
    isbn: '9791161571188',
  },
  {
    bookId: 'preview-3',
    title: '지구 끝의 온실',
    authors: ['김초엽'],
    bookType: 'BOOK',
    publisher: '자이언트북스',
    isbn: '9791191824001',
  },
]

/** 도서 검색 결과를 판본 상세로 연결한다. */
const SearchBook = ({ book, preview }) => (
  <Link
    to={`${ROUTES.WIKI}/${encodeURIComponent(book.bookId)}${preview ? '?preview' : ''}`}
    state={{ book }}
    className="flex items-center gap-3 px-4 py-3"
  >
    <div className="h-[72px] w-[54px] shrink-0 overflow-hidden rounded-lg bg-control-neutral">
      {book.coverUrl && <img src={book.coverUrl} alt="" className="size-full object-cover" />}
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-title-sm font-medium">{book.title}</p>
      <p className="truncate text-body text-text-secondary">
        {book.authors?.join(', ') || '저자 정보 없음'}
      </p>
      <p className="truncate text-caption text-text-secondary">
        {[book.publisher, book.editionLabel].filter(Boolean).join(' · ')}
      </p>
    </div>
    <span
      className={`shrink-0 rounded-full px-3 py-1 text-caption ${book.bookType === 'WEB_NOVEL' ? 'bg-blue-info-light text-blue-info' : 'bg-teal-subtle text-teal-strong'}`}
    >
      {book.bookType === 'WEB_NOVEL' ? '소설' : '책'}
    </span>
  </Link>
)

/** 제목·저자·ISBN 검색과 로그인 사용자의 최근 검색을 제공한다. */
const WikiSearchPage = () => {
  const { searchType } = useParams()
  const type = titles[searchType] ? searchType : 'title'
  const { search } = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const loggedIn = useAuth((state) => state.status === 'authenticated')
  const preview = import.meta.env.DEV && new URLSearchParams(search).has('preview')
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState(null)
  const [error, setError] = useState('')
  const [mockHistory, setMockHistory] = useState([
    { query: '채식주의자', type: 'TITLE' },
    { query: '달러구트', type: 'TITLE' },
  ])
  const history = useQuery({
    queryKey: ['wiki', 'search-history'],
    queryFn: getSearchHistory,
    enabled: loggedIn && !preview,
    retry: false,
  })
  const results = useInfiniteQuery({
    queryKey: ['wiki', 'search', submitted],
    queryFn: ({ pageParam, signal }) => searchBooks({ ...submitted, cursor: pageParam, signal }),
    initialPageParam: undefined,
    getNextPageParam: (page) => (page.hasNext ? page.nextCursor : undefined),
    enabled: Boolean(submitted) && !preview,
    retry: false,
  })
  useEffect(() => {
    if (results.isSuccess && loggedIn)
      void queryClient.invalidateQueries({ queryKey: ['wiki', 'search-history'] })
  }, [results.isSuccess, results.dataUpdatedAt, loggedIn, queryClient])

  const submit = (value, selected = type) => {
    const query = value.trim()
    if (!query || query.length > 100) {
      setError('검색어를 1~100자로 입력해 주세요.')
      return
    }
    if (selected === 'isbn' && !/^\d{13}$/.test(query)) {
      setError('ISBN 13자리를 숫자로 입력해 주세요.')
      return
    }
    setError('')
    setInput(query)
    const next = { query, type: selected.toUpperCase() }
    setSubmitted(next)
    if (preview)
      setMockHistory((items) =>
        [next, ...items.filter((item) => item.query !== query || item.type !== next.type)].slice(
          0,
          5,
        ),
      )
    else if (submitted?.query === next.query && submitted.type === next.type) void results.refetch()
  }
  const changeType = (value) => {
    setInput('')
    setSubmitted(null)
    setError('')
    navigate(`${ROUTES.WIKI_SEARCH.replace(':searchType', value)}${preview ? '?preview' : ''}`)
  }
  const mockResults = submitted
    ? mockBooks.filter((book) => {
        const value =
          submitted.type === 'AUTHOR'
            ? book.authors.join(' ')
            : submitted.type === 'ISBN'
              ? book.isbn || ''
              : book.title
        return value.toLowerCase().includes(submitted.query.toLowerCase())
      })
    : []
  const items = preview ? mockResults : (results.data?.pages.flatMap((page) => page.items) ?? [])
  const recent = preview ? mockHistory : (history.data?.items ?? [])

  return (
    <div className="bg-canvas px-5 pt-0 pb-10">
      <h1 className="text-headline font-bold">{titles[type]} 검색하기</h1>
      <p className="text-body text-text-secondary">지금 읽고 있는 책을 찾아보세요.</p>
      <div className="mt-6">
        <Search
          value={input}
          onChange={(event) => setInput(event.target.value)}
          options={options}
          searchType={type}
          onSearchTypeChange={changeType}
          onSearch={({ query }) => submit(query)}
          maxLength={100}
          aria-label="도서 검색어"
        />
        {error && (
          <p role="alert" className="mt-2 text-caption text-red-error">
            {error}
          </p>
        )}
        {recent.length > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-3 px-3 text-caption text-text-muted">
            <span className="font-medium">최근</span>
            <span aria-hidden="true">│</span>
            {recent.map((item) => (
              <button
                key={`${item.type}-${item.query}`}
                type="button"
                onClick={() => {
                  const selected = item.type.toLowerCase()
                  if (!titles[selected]) return
                  if (selected !== type)
                    navigate(
                      `${ROUTES.WIKI_SEARCH.replace(':searchType', selected)}${preview ? '?preview' : ''}`,
                    )
                  submit(item.query, selected)
                }}
              >
                {item.query}
              </button>
            ))}
          </div>
        )}
      </div>
      {submitted && (
        <section className="mt-6" aria-label="검색 결과">
          <div className="flex items-center justify-between">
            <h2 className="text-title font-bold">
              {submitted.type === 'ISBN' ? '확인된 도서' : '검색 결과'}
            </h2>
            {(preview || results.isSuccess) && (
              <span className="text-label text-text-secondary">
                {items.length}
                {results.hasNextPage ? '+' : ''}권
              </span>
            )}
          </div>
          {!preview && results.isPending && (
            <p role="status" className="mt-4 text-body text-text-secondary">
              도서를 검색하고 있어요.
            </p>
          )}
          {!preview && results.isError && !results.data && (
            <p role="alert" className="mt-4 text-body text-text-secondary">
              도서를 검색하지 못했어요.{' '}
              <button type="button" className="text-teal-strong" onClick={() => results.refetch()}>
                다시 시도
              </button>
            </p>
          )}
          {(preview || results.isSuccess) && items.length === 0 && (
            <p className="mt-4 text-body text-text-secondary">검색 결과가 없어요.</p>
          )}
          {items.length > 0 && (
            <div className="mt-3 flex flex-col gap-4 rounded-xl bg-surface py-4">
              {items.map((book) => (
                <SearchBook key={book.bookId} book={book} preview={preview} />
              ))}
            </div>
          )}
          {!preview && results.hasNextPage && (
            <button
              type="button"
              onClick={() => results.fetchNextPage()}
              disabled={results.isFetchingNextPage}
              className="mt-4 w-full rounded-xl border border-border bg-surface p-3 text-body text-text-secondary"
            >
              {results.isFetchingNextPage
                ? '불러오는 중'
                : results.isFetchNextPageError
                  ? '다시 불러오기'
                  : '더 보기'}
            </button>
          )}
        </section>
      )}
      {type === 'isbn' && (
        <p className="mt-6 text-caption text-text-secondary">같은 ISBN은 중복 등록되지 않아요.</p>
      )}
    </div>
  )
}

export default WikiSearchPage
