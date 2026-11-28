import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/common-ui'
import { ROUTES } from '@/constants/routes'
import { useAuth, useIsLoggedIn } from '@/features/auth'
import { myApi } from '@/features/my'
import {
  addShelfBook,
  changeShelfProgress,
  getBookWiki,
  getShelfBook,
  getVisibleWikiEntities,
  getVisibleWikiEntity,
} from '@/features/wiki'

/** 도서를 서재에 등록하고 현재 진도에서 공개된 위키를 보여준다. */
const WikiDetailPage = () => {
  const { wikiId: bookId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const loggedIn = useIsLoggedIn({ persistPreview: false })
  const authStatus = useAuth((s) => s.status)
  const restoreSession = useAuth((s) => s.restoreSession)
  const [position, setPosition] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [kind, setKind] = useState('characters')
  const [selectedId, setSelectedId] = useState(null)
  const shelf = useQuery({
    queryKey: ['shelfBook', bookId],
    queryFn: ({ signal }) => getShelfBook(bookId, signal),
    enabled: loggedIn,
    retry: false,
  })
  const bookQuery = useQuery({
    queryKey: ['book', bookId],
    queryFn: ({ signal }) => myApi.book(bookId, signal),
    enabled: loggedIn && !state?.book && shelf.error?.response?.status === 404,
    retry: false,
  })
  const book = shelf.data?.book ?? state?.book ?? bookQuery.data
  const wiki = useQuery({
    queryKey: ['wikiInfo', bookId, shelf.data?.currentPosition?.value],
    queryFn: () => getBookWiki({ bookId }),
    enabled: loggedIn && !!shelf.data,
    retry: false,
  })
  const entities = useInfiniteQuery({
    queryKey: ['visibleWiki', bookId, kind, shelf.data?.currentPosition?.value],
    queryFn: ({ pageParam, signal }) => getVisibleWikiEntities(bookId, kind, pageParam, signal),
    initialPageParam: undefined,
    getNextPageParam: (page) => (page.hasNext ? page.nextCursor : undefined),
    enabled: loggedIn && !!shelf.data && wiki.data?.exists === true,
    retry: false,
  })
  const detail = useQuery({
    queryKey: ['visibleWikiDetail', bookId, kind, selectedId, shelf.data?.currentPosition?.value],
    queryFn: ({ signal }) => getVisibleWikiEntity(bookId, kind, selectedId, signal),
    enabled: loggedIn && !!selectedId,
    retry: false,
  })
  const isNew = shelf.error?.response?.status === 404
  const unit =
    shelf.data?.currentPosition?.unit ?? (book?.bookType === 'WEB_NOVEL' ? 'EPISODE' : 'PAGE')
  const savePosition = async (event) => {
    event.preventDefault()
    const value = Number(position)
    if (!Number.isSafeInteger(value) || value < 0) {
      setMessage('읽은 지점을 0 이상의 숫자로 입력해 주세요.')
      return
    }
    setBusy(true)
    setMessage('')
    try {
      if (isNew) {
        const result = await addShelfBook(bookId, { unit, value })
        const permanentId = result.book?.bookId
        if (!permanentId) throw new Error('등록된 도서 정보를 확인할 수 없어요.')
        await queryClient.invalidateQueries({ queryKey: ['wiki', 'shelf'] })
        navigate(`${ROUTES.WIKI}/${encodeURIComponent(permanentId)}`, {
          replace: true,
          state: { book: result.book },
        })
      } else {
        await changeShelfProgress(bookId, { unit, value })
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['shelfBook', bookId] }),
          queryClient.invalidateQueries({ queryKey: ['wiki', 'shelf'] }),
          queryClient.invalidateQueries({ queryKey: ['visibleWiki', bookId] }),
          queryClient.invalidateQueries({ queryKey: ['visibleWikiDetail', bookId] }),
          queryClient.invalidateQueries({ queryKey: ['wikiInfo', bookId] }),
          queryClient.invalidateQueries({ queryKey: ['home'] }),
        ])
        setMessage('읽은 지점을 변경했어요.')
      }
      setPosition('')
    } catch (error) {
      setMessage(
        error.response?.status === 412
          ? '다른 곳에서 진도가 변경됐어요. 다시 시도해 주세요.'
          : error.response?.data?.error?.message ||
              error.message ||
              '저장하지 못했어요. 다시 시도해 주세요.',
      )
    } finally {
      setBusy(false)
    }
  }
  if (!loggedIn && (authStatus === 'unknown' || authStatus === 'checking'))
    return <p className="px-5 py-6">로그인 상태를 확인하고 있어요.</p>
  if (!loggedIn && authStatus === 'error')
    return (
      <button className="px-5 py-6 text-teal-strong" onClick={restoreSession}>
        로그인 상태 다시 확인
      </button>
    )
  if (!loggedIn) return <Navigate to={ROUTES.AUTH_LOGIN} replace />
  return (
    <section className="flex flex-col gap-5 px-5 py-6">
      <Link to={ROUTES.WIKI} className="text-label text-teal-strong">
        서재로 돌아가기
      </Link>
      <h1 className="text-title font-bold">{book?.title ?? '도서 정보'}</h1>
      {shelf.isPending && <p role="status">서재 정보를 불러오고 있어요.</p>}
      {shelf.isError && !isNew && (
        <p role="alert">
          서재 정보를 불러오지 못했어요.{' '}
          <button className="text-teal-strong" onClick={() => shelf.refetch()}>
            다시 시도
          </button>
        </p>
      )}
      {(isNew || shelf.data) && book && (
        <>
          <p className="text-body text-text-secondary">
            {shelf.data
              ? `현재 ${shelf.data.currentPosition?.value ?? 0}${unit === 'PAGE' ? '쪽' : '화'}까지 읽었어요.`
              : '읽은 지점을 설정하면 서재에 추가돼요.'}
          </p>
          <form onSubmit={savePosition} className="flex items-end gap-2">
            <label className="flex flex-1 flex-col gap-2 text-label">
              읽은 지점 ({unit === 'PAGE' ? '쪽' : '화'})
              <input
                type="number"
                min="0"
                step="1"
                required
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="h-12 rounded-lg border border-border bg-surface px-3 text-body"
              />
            </label>
            <Button
              type="submit"
              disabled={busy}
              text={busy ? '저장 중' : isNew ? '서재에 추가' : '진도 변경'}
              className="max-w-32"
            />
          </form>
          {message && (
            <p role="status" className="text-label text-text-secondary">
              {message}
            </p>
          )}
        </>
      )}
      {isNew && !book && (
        <p role="alert">도서 정보를 불러오지 못했어요. 검색 결과에서 다시 선택해 주세요.</p>
      )}
      {shelf.data && wiki.isPending && <p role="status">위키 정보를 확인하고 있어요.</p>}
      {shelf.data && wiki.isError && (
        <p role="alert">
          위키 정보를 불러오지 못했어요.{' '}
          <button className="text-teal-strong" onClick={() => wiki.refetch()}>
            다시 시도
          </button>
        </p>
      )}
      {shelf.data && wiki.isSuccess && !wiki.data?.exists && (
        <div className="flex flex-col gap-3">
          <p>아직 등록된 위키가 없어요.</p>
          <Link
            to={ROUTES.WIKI_ADD_EMPTY}
            state={{ book, bookId, position: shelf.data.currentPosition }}
            className="rounded-lg bg-teal-strong px-4 py-3 text-center text-white"
          >
            위키 등록하기
          </Link>
        </div>
      )}
      {shelf.data && wiki.data?.exists && (
        <>
          <div className="flex gap-2" aria-label="위키 유형">
            {[
              ['characters', '인물'],
              ['organizations', '단체'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={kind === value}
                onClick={() => {
                  setKind(value)
                  setSelectedId(null)
                }}
                className={`rounded-lg px-4 py-2 text-label ${kind === value ? 'bg-teal-strong text-white' : 'bg-control-neutral text-text-secondary'}`}
              >
                {label}
              </button>
            ))}
          </div>
          {entities.isPending && <p role="status">위키를 불러오고 있어요.</p>}
          {entities.isError && (
            <p role="alert">
              위키를 불러오지 못했어요.{' '}
              <button className="text-teal-strong" onClick={() => entities.refetch()}>
                다시 시도
              </button>
            </p>
          )}
          {entities.isSuccess && (
            <ul className="divide-y divide-border">
              {entities.data.pages
                .flatMap((page) => page.items ?? [])
                .map((item) => (
                  <li key={item.entityId}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.entityId)}
                      className="flex w-full gap-3 py-3 text-left"
                    >
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="size-12 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <p className="text-body font-medium">{item.name}</p>
                        <p className="text-label text-text-secondary">{item.description}</p>
                      </div>
                    </button>
                  </li>
                ))}
            </ul>
          )}
          {entities.hasNextPage && (
            <Button
              color="neutral"
              text="더 보기"
              disabled={entities.isFetchingNextPage}
              onClick={() => entities.fetchNextPage()}
            />
          )}
          {entities.isSuccess && entities.data.pages.every((page) => !page.items?.length) && (
            <p className="text-body text-text-secondary">
              현재 읽은 지점에서 볼 수 있는 내용이 없어요.
            </p>
          )}
          {selectedId && (
            <section aria-label="위키 상세" className="rounded-xl bg-canvas p-4">
              <button
                type="button"
                className="float-right text-label text-teal-strong"
                onClick={() => setSelectedId(null)}
              >
                닫기
              </button>
              {detail.isPending && <p role="status">상세 내용을 불러오고 있어요.</p>}
              {detail.isError && (
                <p role="alert">
                  상세 내용을 불러오지 못했어요.{' '}
                  <button className="text-teal-strong" onClick={() => detail.refetch()}>
                    다시 시도
                  </button>
                </p>
              )}
              {detail.data && (
                <>
                  <h2 className="text-title font-bold">{detail.data.name}</h2>
                  <p className="mt-2 text-body whitespace-pre-wrap">{detail.data.description}</p>
                  {detail.data.entries?.map((entry) => (
                    <div key={entry.entryId} className="mt-4">
                      <h3 className="text-body font-medium">{entry.title}</h3>
                      <p className="text-label whitespace-pre-wrap text-text-secondary">
                        {entry.content}
                      </p>
                    </div>
                  ))}
                </>
              )}
            </section>
          )}
        </>
      )}
    </section>
  )
}
export default WikiDetailPage
