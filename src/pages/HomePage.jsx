import { useQuery } from '@tanstack/react-query'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { BookContext } from '@/components/BookContext'
import { ROUTES } from '@/constants/routes'
import { useAuth, useIsLoggedIn } from '@/features/auth'
import { getReadingRhythm, homeApi } from '@/features/home'

const formatDate = (date) => date.toISOString().slice(0, 10)

/** 한국 날짜를 기준으로 이번 달과 이번 주 조회 기간을 만든다. */
const getPeriods = () => {
  const todayString = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  const today = new Date(`${todayString}T00:00:00Z`)
  const weekStart = new Date(today)
  weekStart.setUTCDate(today.getUTCDate() - today.getUTCDay())
  return {
    today: todayString,
    month: today.getUTCMonth() + 1,
    monthStart: `${todayString.slice(0, 7)}-01`,
    weekStart: formatDate(weekStart),
    weekday: today.getUTCDay(),
  }
}

const previewCurrent = {
  book: {
    title: '성공하는 인생의 비밀',
    coverUrl:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZisW5UzjFSeMfP9SjV-NeFkfHETornqEFVxEFqeyMmS6xSN6zPoWeK4M&s=10',
  },
  currentPosition: { unit: 'PAGE', value: 32 },
  progressPercent: 42,
}
const previewMonth = { pages: 1108, episodes: 240 }
const previewWeek = [
  { pages: 0, episodes: 0 },
  { pages: 35, episodes: 0 },
  { pages: 0, episodes: 0 },
  { pages: 18, episodes: 8 },
  { pages: 0, episodes: 0 },
  { pages: 0, episodes: 0 },
  { pages: 0, episodes: 4 },
]

/** 로그인 상태에 따라 현재 도서와 독서 요약을 표시한다. */
const HomePage = () => {
  const isLoggedIn = useIsLoggedIn()
  const { search } = useLocation()
  const status = useAuth((state) => state.status)
  const previewEnabled = useAuth((state) => state.preview)
  const restoreSession = useAuth((state) => state.restoreSession)
  const preview =
    import.meta.env.DEV && (previewEnabled || new URLSearchParams(search).has('preview'))
  const { today, month, monthStart, weekStart, weekday } = getPeriods()
  const enabled = isLoggedIn && !preview
  const current = useQuery({
    queryKey: ['home', 'current'],
    queryFn: ({ signal }) => homeApi.current(signal),
    enabled,
    retry: false,
  })
  const monthly = useQuery({
    queryKey: ['home', 'summary', monthStart, today],
    queryFn: ({ signal }) => homeApi.summary(monthStart, today, signal),
    enabled,
    retry: false,
  })
  const weekly = useQuery({
    queryKey: ['home', 'summary', weekStart, today],
    queryFn: ({ signal }) => homeApi.summary(weekStart, today, signal),
    enabled,
    retry: false,
  })
  const notices = useQuery({
    queryKey: ['home', 'notices'],
    queryFn: ({ signal }) => homeApi.notices(signal),
    enabled,
    retry: false,
  })

  if (!isLoggedIn && (status === 'unknown' || status === 'checking'))
    return (
      <p className="px-5 text-body text-text-secondary" role="status">
        로그인 상태를 확인하고 있어요.
      </p>
    )
  if (!isLoggedIn && status === 'error')
    return (
      <div className="space-y-3 px-5" role="alert">
        <p className="text-body text-text-secondary">
          로그인 상태를 확인하지 못했어요. 연결 상태를 확인해 주세요.
        </p>
        <button
          type="button"
          className="text-body font-medium text-teal-strong"
          onClick={restoreSession}
        >
          다시 시도
        </button>
      </div>
    )
  if (!isLoggedIn) return <Navigate to={ROUTES.ONBOARDING} replace />

  const book = preview ? previewCurrent : current.data?.item
  const summary = preview ? previewMonth : monthly.data
  const notice = preview
    ? '신규 소설 1,200개의 위키가 업데이트 되었어요!'
    : notices.data?.items?.[0]?.title
  const daily = weekly.data?.daily ?? []
  const records = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(`${weekStart}T00:00:00Z`)
    day.setUTCDate(day.getUTCDate() + index)
    const reading = daily.find((item) => item.date === formatDate(day))
    return {
      label: ['일', '월', '화', '수', '목', '금', '토'][index],
      pages: preview ? previewWeek[index].pages : (reading?.pages ?? 0),
      episodes: preview ? previewWeek[index].episodes : (reading?.episodes ?? 0),
      today: index === weekday,
    }
  })
  const rhythms = getReadingRhythm(records)

  return (
    <div className="px-5 pb-6">
      <h1 className="mt-4 text-headline font-bold">
        오늘의 이야기,
        <br />
        어디까지 왔나요?
      </h1>
      <section className="mt-[22px]" aria-label="지금 읽는 책">
        {book ? (
          <BookContext
            variant="current"
            title={book.book.title}
            coverImageSrc={book.book.coverUrl}
            accentText={
              book.currentPosition
                ? `${book.currentPosition.value}${book.currentPosition.unit === 'PAGE' ? '페이지' : '화'}`
                : '읽기 전'
            }
            captionText={
              book.progressPercent == null ? '읽는 중' : `${book.progressPercent}% 읽는 중`
            }
            progressPercent={book.progressPercent}
            action={
              <button
                type="button"
                disabled
                className="h-[38px] w-full rounded-lg bg-control-neutral text-body font-medium text-text-secondary"
                title="이어 읽기 기능 준비 중"
              >
                바로 이어 읽기
              </button>
            }
          />
        ) : (
          <div className="flex h-[180px] items-center text-body text-text-secondary">
            {current.isPending
              ? '읽고 있는 책을 불러오고 있어요.'
              : current.isError
                ? '읽고 있는 책을 불러오지 못했어요.'
                : '아직 읽고 있는 책이 없어요.'}
          </div>
        )}
      </section>
      <section className="mt-6" aria-labelledby="monthly-title">
        <div className="flex items-center justify-between">
          <h2 id="monthly-title" className="text-title font-bold">
            {month}월의 읽기
          </h2>
          <Link to={ROUTES.READING} className="text-body font-medium text-teal-strong">
            자세히 보기
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {[
            ['페이지', '이번 달 읽은 페이지', summary?.pages, 'bg-canvas'],
            ['화', '이번 달 읽은 소설', summary?.episodes, 'bg-teal-subtle'],
          ].map(([unit, label, count, color]) => (
            <div key={unit} className={`h-24 rounded-xl p-4 ${color}`}>
              <p className="text-title-sm font-medium">
                {typeof count === 'number' ? count.toLocaleString('ko-KR') : '—'}{' '}
                <span className="font-normal">{unit}</span>
              </p>
              <p className="mt-1 text-caption text-text-secondary">{label}</p>
            </div>
          ))}
        </div>
        {!preview && monthly.isError && (
          <p className="mt-2 text-caption text-text-secondary">월간 독서량을 불러오지 못했어요.</p>
        )}
      </section>
      {notice && <p className="mt-3 text-body text-text-secondary">{notice}</p>}
      {!preview && notices.isError && (
        <p className="mt-3 text-caption text-text-secondary">공지사항을 불러오지 못했어요.</p>
      )}
      <section className="mt-5 py-4" aria-labelledby="weekly-title">
        <h2 id="weekly-title" className="text-body font-medium">
          이번 주의 독서 리듬
        </h2>
        {(preview || weekly.isSuccess) && (
          <>
            <div className="mt-[34px] flex h-[69px] items-end gap-2">
              {records.map((day, index) => {
                const { pages, episodes, pageHeight, episodeHeight } = rhythms[index]
                const height = pageHeight + episodeHeight || 12
                return (
                  <div
                    key={day.label}
                    className="relative flex min-w-0 flex-1 flex-col items-center gap-[5px]"
                  >
                    {day.today && (
                      <span className="absolute bottom-[75px] rounded-full bg-text-primary px-1.5 text-caption-xs text-white">
                        오늘
                      </span>
                    )}
                    <div
                      className="flex w-full flex-col-reverse overflow-hidden rounded-lg bg-control-neutral"
                      style={{ height }}
                      role="img"
                      aria-label={`${day.label}요일 ${pages}페이지, ${episodes}화`}
                    >
                      {pages > 0 && (
                        <div
                          className="w-full shrink-0 bg-teal-reading"
                          style={{ height: pageHeight }}
                        />
                      )}
                      {episodes > 0 && (
                        <div
                          className="w-full shrink-0 bg-blue-reading"
                          style={{ height: episodeHeight }}
                        />
                      )}
                    </div>
                    <span className="text-caption text-text-secondary">{day.label}</span>
                  </div>
                )
              })}
            </div>
            <div
              className="mt-3 flex gap-4 text-caption text-text-secondary"
              aria-label="그래프 범례"
            >
              <span className="flex items-center gap-1">
                <span className="size-2.5 rounded-sm bg-teal-reading" />
                페이지
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2.5 rounded-sm bg-blue-reading" />화
              </span>
            </div>
          </>
        )}
        {!preview && weekly.isPending && (
          <p className="mt-4 text-caption text-text-secondary">주간 독서 기록을 불러오고 있어요.</p>
        )}
        {!preview && weekly.isError && (
          <p className="mt-2 text-caption text-text-secondary">
            주간 독서 기록을 불러오지 못했어요.
          </p>
        )}
      </section>
    </div>
  )
}

export default HomePage
