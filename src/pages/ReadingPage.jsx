import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { useAuth, useIsLoggedIn } from '@/features/auth'
import { homeApi } from '@/features/home'
import { getCalendar, getCalendarDays } from '@/features/reading'

const previewCover =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZisW5UzjFSeMfP9SjV-NeFkfHETornqEFVxEFqeyMmS6xSN6zPoWeK4M&s=10'
const previewCurrent = {
  book: { bookId: 'preview-0', title: '파도의 아이', coverUrl: previewCover },
  currentPosition: { unit: 'EPISODE', value: 32 },
}
const previewValues = [
  [0, 0],
  [20, 0],
  [0, 8],
  [30, 10],
  [0, 0],
  [0, 5],
  [24, 12],
]
const todayMonth = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date())
const moveMonth = (month, change) => {
  const [year, number] = month.split('-').map(Number)
  return new Date(Date.UTC(year, number - 1 + change, 1)).toISOString().slice(0, 7)
}

/** 월별 독서 기록과 마지막으로 읽은 도서를 보여준다. */
const ReadingPage = () => {
  const loggedIn = useIsLoggedIn({ persistPreview: false })
  const { search } = useLocation()
  const status = useAuth((state) => state.status)
  const restoreSession = useAuth((state) => state.restoreSession)
  const preview = import.meta.env.DEV && new URLSearchParams(search).has('preview')
  const [month, setMonth] = useState(todayMonth)
  const calendar = useQuery({
    queryKey: ['reading', 'calendar', month],
    queryFn: ({ signal }) => getCalendar(month, signal),
    enabled: loggedIn && !preview,
    retry: false,
  })
  const current = useQuery({
    queryKey: ['home', 'current'],
    queryFn: ({ signal }) => homeApi.current(signal),
    enabled: loggedIn && !preview,
    retry: false,
  })

  if (!loggedIn && (status === 'unknown' || status === 'checking'))
    return (
      <p className="px-5 text-body text-text-secondary" role="status">
        로그인 상태를 확인하고 있어요.
      </p>
    )
  if (!loggedIn && status === 'error')
    return (
      <div className="space-y-3 px-5" role="alert">
        <p className="text-body text-text-secondary">로그인 상태를 확인하지 못했어요.</p>
        <button type="button" onClick={restoreSession} className="text-body text-teal-strong">
          다시 시도
        </button>
      </div>
    )
  if (!loggedIn) return <Navigate to={ROUTES.ONBOARDING} replace />

  const days = getCalendarDays(month)
  const records = preview
    ? days.filter(Boolean).map((date, index) => {
        const [pages, episodes] = previewValues[index % previewValues.length]
        return { date, pages, episodes }
      })
    : (calendar.data?.days ?? [])
  const byDate = new Map(records.map((day) => [day.date, day]))
  const reading = preview ? previewCurrent : current.data?.item
  const [year, number] = month.split('-')

  return (
    <div className="px-5 pt-3 pb-[130px]">
      <div className="flex items-center justify-center gap-6">
        <button
          type="button"
          aria-label="이전 달"
          className="flex size-8 items-center justify-center text-text-secondary"
          onClick={() => setMonth(moveMonth(month, -1))}
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <h2 className="text-title font-bold" aria-live="polite">
          {year}년 {Number(number)}월
        </h2>
        <button
          type="button"
          aria-label="다음 달"
          className="flex size-8 items-center justify-center text-text-secondary disabled:text-text-muted/50"
          disabled={month >= todayMonth()}
          onClick={() => setMonth(moveMonth(month, 1))}
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
      <section
        className="mt-3 rounded-xl border border-border px-3.5 py-4"
        aria-label={`${year}년 ${Number(number)}월 독서 달력`}
      >
        <div className="grid grid-cols-7 gap-x-1 text-center text-caption text-text-secondary">
          {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        {!preview && calendar.isPending ? (
          <p className="py-10 text-center text-body text-text-secondary" role="status">
            독서 기록을 불러오고 있어요.
          </p>
        ) : !preview && calendar.isError ? (
          <div className="py-10 text-center text-body text-text-secondary" role="alert">
            독서 기록을 불러오지 못했어요.{' '}
            <button type="button" onClick={() => calendar.refetch()} className="text-teal-strong">
              다시 시도
            </button>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-7 gap-x-1 gap-y-3">
            {days.map((date, index) => {
              if (!date) return <div key={`empty-${index}`} aria-hidden="true" />
              const record = byDate.get(date)
              const pages = record?.pages ?? 0
              const episodes = record?.episodes ?? 0
              const total = pages + episodes
              return (
                <div
                  key={date}
                  className="min-w-0 text-center"
                  role="img"
                  aria-label={`${date}, ${pages}페이지, ${episodes}화`}
                >
                  <div className="flex h-12 flex-col-reverse overflow-hidden rounded-lg bg-control-neutral">
                    {pages > 0 && (
                      <div
                        className="w-full bg-teal-reading"
                        style={{ height: `${(pages / total) * 100}%` }}
                      />
                    )}
                    {episodes > 0 && (
                      <div
                        className="w-full bg-blue-reading"
                        style={{ height: `${(episodes / total) * 100}%` }}
                      />
                    )}
                  </div>
                  <span className="mt-1 block text-caption text-text-secondary">
                    {Number(date.slice(-2))}
                  </span>
                </div>
              )
            })}
          </div>
        )}
        <div className="mt-4 flex justify-center gap-4 text-caption text-text-secondary">
          <span className="flex items-center gap-1">
            <span className="size-2.5 rounded-sm bg-teal-reading" />
            페이지
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2.5 rounded-sm bg-blue-reading" />화
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2.5 rounded-sm bg-control-neutral" />
            기록 없음
          </span>
        </div>
        <p className="mt-2 text-center text-caption-sm text-text-muted">
          색상 비율은 페이지와 화의 수치를 기준으로 표시해요.
        </p>
      </section>
      {reading && (
        <div className="absolute right-5 bottom-[90px] left-5 z-10">
          <Link
            to={`${ROUTES.WIKI}/${reading.book.bookId}${preview ? '?preview' : ''}`}
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
      {!preview && current.isError && (
        <p className="mt-3 text-caption text-text-secondary">이어 읽을 도서를 불러오지 못했어요.</p>
      )}
    </div>
  )
}

export default ReadingPage
