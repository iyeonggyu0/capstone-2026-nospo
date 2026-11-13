import { faCheck, faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { useAuth, useIsLoggedIn } from '@/features/auth'
import { homeApi } from '@/features/home'
import { getShelf } from '@/features/wiki'

const cover =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZisW5UzjFSeMfP9SjV-NeFkfHETornqEFVxEFqeyMmS6xSN6zPoWeK4M&s=10'
const previewItems = Array.from({ length: 18 }, (_, index) => ({
  book: {
    bookId: `preview-${index}`,
    title: '애주가의 절주 일기',
    authors: ['저자'],
    coverUrl: cover,
  },
  currentPosition: { value: 200 },
}))
const previewCurrent = {
  book: { bookId: 'preview-0', title: '파도의 아이', coverUrl: cover },
  currentPosition: { value: 32, unit: 'EPISODE' },
}
const sorts = [
  ['RECENT_ACTIVITY', '최근 활동순'],
  ['RECENT_ADDED', '최근 추가순'],
  ['TITLE', '제목순'],
]

/** 선택한 정렬 기준을 표시하고 정렬 메뉴를 제공한다. */
const SortMenu = ({ sort, onChange }) => {
  const [open, setOpen] = useState(false)
  const container = useRef(null)
  const trigger = useRef(null)

  useEffect(() => {
    if (!open) return
    const closeOutside = (event) => {
      if (!container.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [open])

  return (
    <div
      ref={container}
      className="relative z-20"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          setOpen(false)
          trigger.current?.focus()
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-label={`정렬 기준: ${sorts.find(([value]) => value === sort)?.[1]}`}
        aria-expanded={open}
        aria-controls="wiki-sort-options"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg py-2 pl-2 text-label-sm font-medium text-text-secondary"
      >
        {sorts.find(([value]) => value === sort)?.[1]}
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`text-[10px] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div
          id="wiki-sort-options"
          className="absolute top-full right-0 mt-1 w-32 rounded-xl border border-border bg-surface p-1 shadow-[0_8px_24px_rgb(18_25_24_/_0.12)]"
          aria-label="정렬 기준"
        >
          {sorts.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={sort === value}
              onClick={() => {
                onChange(value)
                setOpen(false)
                trigger.current?.focus()
              }}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-label-sm transition-colors ${sort === value ? 'bg-teal-subtle font-medium text-teal-strong' : 'text-text-secondary hover:bg-canvas'}`}
            >
              {label}
              {sort === value && <FontAwesomeIcon icon={faCheck} className="text-[10px]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** 서재 도서와 마지막으로 읽은 도서를 위키 진입점으로 보여준다. */
const WikiListPage = () => {
  const isLoggedIn = useIsLoggedIn()
  const { search } = useLocation()
  const status = useAuth((state) => state.status)
  const previewEnabled = useAuth((state) => state.preview)
  const restoreSession = useAuth((state) => state.restoreSession)
  const preview =
    import.meta.env.DEV && (previewEnabled || new URLSearchParams(search).has('preview'))
  const [bookType, setBookType] = useState('WEB_NOVEL')
  const [sort, setSort] = useState('RECENT_ACTIVITY')
  const [previewCount, setPreviewCount] = useState(6)
  const moreHint = useRef(null)
  const loadingMore = useRef(false)
  const shelf = useInfiniteQuery({
    queryKey: ['wiki', 'shelf', bookType, sort],
    queryFn: ({ pageParam, signal }) => getShelf({ bookType, sort, cursor: pageParam, signal }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : undefined),
    enabled: isLoggedIn && !preview,
    retry: false,
  })
  const current = useQuery({
    queryKey: ['home', 'current'],
    queryFn: ({ signal }) => homeApi.current(signal),
    enabled: isLoggedIn && !preview,
    retry: false,
  })
  const hasNext = preview ? previewCount < previewItems.length : shelf.hasNextPage
  const loadMore = () => {
    if (preview) setPreviewCount((count) => Math.min(count + 6, previewItems.length))
    else if (shelf.hasNextPage && !shelf.isFetchingNextPage && !loadingMore.current) {
      loadingMore.current = true
      void shelf.fetchNextPage().finally(() => {
        loadingMore.current = false
      })
    }
  }
  const loadMoreRef = useRef(loadMore)
  useEffect(() => {
    loadMoreRef.current = loadMore
  })
  useEffect(() => {
    const node = moreHint.current
    const scroller = node?.closest('main')
    if (!node || !scroller || !hasNext || (!preview && shelf.isFetchNextPageError)) return
    let lastWheelTime = 0
    let ready = false
    let timer
    const observer = new IntersectionObserver(
      ([entry]) => {
        clearTimeout(timer)
        ready = false
        if (entry.isIntersecting)
          timer = setTimeout(() => {
            ready = true
          }, 500)
      },
      { root: scroller, rootMargin: '0px 0px -100px 0px', threshold: 1 },
    )
    observer.observe(node)
    const onScrollIntent = (event) => {
      if (event.type === 'wheel') {
        const previous = lastWheelTime
        lastWheelTime = Date.now()
        if (event.deltaY <= 0 || lastWheelTime - previous < 250) return
      }
      if (event.type === 'keydown' && !['ArrowDown', 'PageDown', ' ', 'End'].includes(event.key))
        return
      if (ready) {
        ready = false
        loadMoreRef.current()
      }
    }
    scroller.addEventListener('wheel', onScrollIntent, { passive: true })
    scroller.addEventListener('touchmove', onScrollIntent, { passive: true })
    scroller.addEventListener('keydown', onScrollIntent)
    return () => {
      clearTimeout(timer)
      observer.disconnect()
      scroller.removeEventListener('wheel', onScrollIntent)
      scroller.removeEventListener('touchmove', onScrollIntent)
      scroller.removeEventListener('keydown', onScrollIntent)
    }
  }, [hasNext, preview, shelf.isFetchNextPageError])

  if (!isLoggedIn && (status === 'unknown' || status === 'checking'))
    return (
      <p className="px-5 text-body text-text-secondary" role="status">
        로그인 상태를 확인하고 있어요.
      </p>
    )
  if (!isLoggedIn && status === 'error')
    return (
      <div className="space-y-3 px-5" role="alert">
        <p className="text-body text-text-secondary">로그인 상태를 확인하지 못했어요.</p>
        <button type="button" className="text-body text-teal-strong" onClick={restoreSession}>
          다시 시도
        </button>
      </div>
    )
  if (!isLoggedIn) return <Navigate to={ROUTES.ONBOARDING} replace />

  const items = preview
    ? previewItems.slice(0, previewCount)
    : (shelf.data?.pages.flatMap((page) => page.items) ?? [])
  const reading = preview ? previewCurrent : current.data?.item
  const detailPath = (id) => `${ROUTES.WIKI}/${id}${preview ? '?preview' : ''}`

  return (
    <div className="px-5 pt-[22px] pb-[130px]">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-4" aria-label="도서 유형">
          {[
            ['WEB_NOVEL', '웹 소설'],
            ['BOOK', '도서'],
          ]
            .sort(([a]) => (a === bookType ? -1 : 1))
            .map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={bookType === value}
                onClick={() => {
                  setBookType(value)
                  setPreviewCount(6)
                }}
                className={
                  bookType === value
                    ? 'text-title font-bold'
                    : 'text-label-sm font-medium text-text-muted'
                }
              >
                {label}
              </button>
            ))}
        </div>
        <SortMenu sort={sort} onChange={setSort} />
      </div>
      {!preview && shelf.isPending && (
        <p className="mt-8 text-body text-text-secondary" role="status">
          도서를 불러오고 있어요.
        </p>
      )}
      {!preview && shelf.isError && !shelf.data && (
        <div className="mt-8 text-body text-text-secondary" role="alert">
          도서를 불러오지 못했어요.{' '}
          <button type="button" onClick={() => shelf.refetch()} className="text-teal-strong">
            다시 시도
          </button>
        </div>
      )}
      {(preview || shelf.isSuccess) && items.length === 0 && (
        <p className="mt-8 text-body text-text-secondary">서재에 등록된 도서가 없어요.</p>
      )}
      <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-[18px]">
        {items.map((item) => (
          <Link key={item.book.bookId} to={detailPath(item.book.bookId)} className="min-w-0">
            <div className="aspect-[169/223] overflow-hidden rounded-xl bg-control-neutral">
              {item.book.coverUrl && (
                <img src={item.book.coverUrl} alt="" className="size-full object-cover" />
              )}
            </div>
            <p className="mt-2.5 truncate text-body font-medium">{item.book.title}</p>
            <p className="mt-0.5 truncate text-caption-sm text-text-muted">
              {preview && bookType === 'WEB_NOVEL'
                ? '화요일'
                : item.book.authors?.join(', ') || '저자 정보 없음'}{' '}
              <span className="mx-1 text-border">│</span>{' '}
              {item.currentPosition?.value != null
                ? `${item.currentPosition.value.toLocaleString('ko-KR')}${bookType === 'BOOK' ? 'p' : '화'}`
                : '읽기 전'}
              {preview && <span> / 1,500{bookType === 'BOOK' ? 'p' : '화'}</span>}
            </p>
          </Link>
        ))}
      </div>
      {hasNext && (
        <div ref={moreHint} className="mt-10 text-center text-caption-sm text-text-secondary">
          <button
            type="button"
            onClick={loadMore}
            disabled={!preview && shelf.isFetchingNextPage}
            className="inline-flex flex-col items-center gap-2"
          >
            <FontAwesomeIcon icon={faChevronDown} className="text-[11px] text-text-muted" />
            <span>
              {!preview && shelf.isFetchingNextPage
                ? '불러오는 중'
                : shelf.isFetchNextPageError
                  ? '다시 불러오기'
                  : '스크롤하여 더 보기'}
            </span>
          </button>
        </div>
      )}
      {!preview && !reading && (current.isPending || current.isError) && (
        <div
          className="absolute right-5 bottom-[90px] left-5 z-10 rounded-xl border border-border bg-surface p-[14px] text-body text-text-secondary"
          role={current.isError ? 'alert' : 'status'}
        >
          {current.isPending
            ? '읽고 있는 책을 불러오고 있어요.'
            : '읽고 있는 책을 불러오지 못했어요.'}
          {current.isError && (
            <button
              type="button"
              onClick={() => current.refetch()}
              className="ml-2 text-teal-strong"
            >
              다시 시도
            </button>
          )}
        </div>
      )}
      {reading && (
        <div className="absolute right-5 bottom-[90px] left-5 z-10">
          <Link
            to={detailPath(reading.book.bookId)}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface p-[14px]"
          >
            <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-control-neutral">
              {reading.book.coverUrl && (
                <img src={reading.book.coverUrl} alt="" className="size-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body font-medium">{reading.book.title}</p>
              <p className="mt-[3px] text-caption text-text-secondary">
                {reading.currentPosition
                  ? `${reading.currentPosition.value}${reading.currentPosition.unit === 'PAGE' ? '페이지' : '화'}에서 이어 읽기`
                  : '이어 읽기'}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-teal-subtle px-2.5 py-2 text-label-sm font-medium text-teal-strong">
              이어 읽기
            </span>
          </Link>
        </div>
      )}
    </div>
  )
}

export default WikiListPage
