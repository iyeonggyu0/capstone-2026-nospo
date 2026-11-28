import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/common-ui'
import { ROUTES } from '@/constants/routes'
import { getPersonDraftKey, restorePersonDraft } from '@/features/wiki'
import bookCoverPreview from '@/assets/images/wiki-book-cover-preview.png'

const previewUpdatePeople = [
  {
    id: 'preview-existing-person',
    name: '서하준',
    role: '주인공',
    affiliation: '소속',
    gender: '남성',
    firstRevealAt: 2,
    profiles: [
      { name: '서하준', role: '주인공', affiliation: '소속', gender: '남성', revealAt: 2 },
    ],
  },
]

/** 위키 추가 개요: 인물·단체·관계도 진입점을 제공한다. */
const WikiAddPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const book = location.state?.book ?? (import.meta.env.DEV ? { title: '애주가의 절주 일기' } : {})
  const bookId = location.state?.bookId ?? book.id
  const mode = location.state?.mode ?? 'CREATE'
  const wikiId = location.state?.wikiId
  const baseWikiVersion = location.state?.baseWikiVersion
  const initialPosition = location.state?.position ?? (import.meta.env.DEV ? 32 : 1)
  const [position, setPosition] = useState(initialPosition)
  const initialUnit =
    typeof initialPosition === 'object'
      ? initialPosition.unit === 'PAGE'
        ? 'PAGE'
        : 'EPISODE'
      : book.progressUnit === 'PAGE' || book.unit === 'PAGE'
        ? 'PAGE'
        : 'EPISODE'
  const [positionUnit, setPositionUnit] = useState(initialUnit)
  const [positionInput, setPositionInput] = useState(
    String(typeof initialPosition === 'object' ? initialPosition.value : initialPosition),
  )
  const [positionDialogOpen, setPositionDialogOpen] = useState(!location.state?.positionConfirmed)
  const [people, setPeople] = useState(() =>
    mode === 'UPDATE' && import.meta.env.DEV && import.meta.env.VITE_WIKI_API_MODE === 'mock'
      ? previewUpdatePeople
      : [],
  )
  const [peopleSort, setPeopleSort] = useState('AFFILIATION')
  const [tab, setTab] = useState('CHARACTER')
  const positionValue = typeof position === 'object' ? position.value : position
  const unitLabel = positionUnit === 'PAGE' ? '쪽' : '화'
  const maximumPosition =
    Number(positionUnit === 'PAGE' ? book.totalPages : book.totalEpisodes) || undefined

  useEffect(() => {
    let active = true
    restorePersonDraft(getPersonDraftKey(bookId, mode))
      .then((draft) => {
        if (!active || !draft) return
        setPeople(draft.people)
        if (draft.position) {
          setPosition(draft.position)
          setPositionInput(
            String(typeof draft.position === 'object' ? draft.position.value : draft.position),
          )
        }
        if (draft.positionUnit) {
          setPositionUnit(draft.positionUnit)
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [bookId, mode])

  const goRegister = (personId, createPerson = false) =>
    navigate(mode === 'CREATE' ? ROUTES.WIKI_ADD_PERSON : ROUTES.WIKI_REGISTER_PERSON, {
      state: {
        mode,
        book,
        bookId,
        position,
        personId,
        createPerson,
        wikiId,
        baseWikiVersion,
        positionConfirmed: true,
      },
    })

  const title = useMemo(() => book.title || '선택한 도서', [book.title])
  const sortedPeople = useMemo(() => {
    const importance = { 주인공: 0, 주연: 1, 조연: 2, 단역: 3, 엑스트라: 4 }
    const byName = (a, b) => (a.name || '').localeCompare(b.name || '', 'ko')
    return [...people].sort((a, b) => {
      if (peopleSort === 'NAME') return byName(a, b)
      if (peopleSort === 'IMPORTANCE') {
        return (importance[a.role] ?? 5) - (importance[b.role] ?? 5) || byName(a, b)
      }
      return (
        (a.affiliation || '소속 미정').localeCompare(b.affiliation || '소속 미정', 'ko') ||
        byName(a, b)
      )
    })
  }, [people, peopleSort])
  const peopleByAffiliation = useMemo(() => {
    if (peopleSort !== 'AFFILIATION') return null
    return sortedPeople.reduce((groups, person) => {
      const affiliation = person.affiliation || '소속 미정'
      groups.set(affiliation, [...(groups.get(affiliation) ?? []), person])
      return groups
    }, new Map())
  }, [peopleSort, sortedPeople])

  const renderPerson = (person) => (
    <li className="flex min-h-[72px] items-center" key={person.id}>
      <button
        className="flex min-h-[60px] w-full items-center gap-3 text-left"
        onClick={() => goRegister(person.id)}
        type="button"
      >
        {person.imageUrl ? (
          <img alt="" className="size-10 rounded-full object-cover" src={person.imageUrl} />
        ) : (
          <span aria-hidden="true" className="size-10 rounded-full bg-teal-strong" />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body-lg font-medium">{person.name}</span>
          <span className="text-label text-text-secondary">
            {person.role || '비중 미정'} · {person.affiliation || '소속 미정'}
          </span>
        </span>
        <span className="pr-2 text-body-lg text-text-secondary">›</span>
      </button>
    </li>
  )

  return (
    <div className="mx-auto flex min-h-full w-full max-w-[390px] flex-col bg-surface pt-5">
      <header className="flex h-[22px] items-center justify-between px-5">
        <Logo
          className="gap-1 [&>span]:text-label [&>span]:leading-[22px]"
          imageClassName="size-[22px]"
        />
        <button
          className="h-[22px] text-label"
          onClick={() => {
            setPositionInput(String(positionValue))
            setPositionDialogOpen(true)
          }}
          type="button"
        >
          진도 변경
        </button>
      </header>
      <section className="px-5 pt-3">
        <div className="flex h-[118px] items-center gap-4 rounded-2xl bg-canvas p-3">
          <img
            alt=""
            className="h-[94px] w-[72px] shrink-0 rounded-lg object-cover"
            src={book.coverUrl || bookCoverPreview}
          />
          <div className="min-w-0">
            <p className="truncate text-body-lg font-bold">{title}</p>
            <p className="mt-1 text-label text-text-secondary">
              <span className="font-medium text-teal-strong">
                {positionValue}
                {unitLabel}까지 읽음
              </span>
              <span className="px-2">·</span>스포일러 보호 중
            </p>
          </div>
        </div>
        <p className="mt-3 text-right text-caption text-text-secondary">
          현재 읽은 범위까지 위키 내용을 작성할 수 있어요.
        </p>
      </section>
      <main className="flex-1 px-5 pt-7">
        <h1 className="text-title font-bold">위키 내용 편집</h1>
        <div className="mt-[10px] grid grid-cols-3 gap-2" role="tablist" aria-label="위키 유형">
          <button
            aria-selected={tab === 'CHARACTER'}
            className={`h-8 rounded-lg text-label font-medium ${tab === 'CHARACTER' ? 'bg-teal-selected text-white' : 'bg-control-neutral text-text-secondary'}`}
            onClick={() => setTab('CHARACTER')}
            role="tab"
            type="button"
          >
            인물 {people.length}
          </button>
          <button
            aria-selected={tab === 'GROUP'}
            className={`h-8 rounded-lg text-label font-medium ${tab === 'GROUP' ? 'bg-teal-selected text-white' : 'bg-control-neutral text-text-secondary'}`}
            onClick={() => setTab('GROUP')}
            role="tab"
            type="button"
          >
            단체
          </button>
          <button
            aria-selected={tab === 'RELATIONSHIP_MAP'}
            className={`h-8 rounded-lg text-label font-medium ${tab === 'RELATIONSHIP_MAP' ? 'bg-teal-selected text-white' : 'bg-control-neutral text-text-secondary'}`}
            onClick={() => setTab('RELATIONSHIP_MAP')}
            role="tab"
            type="button"
          >
            관계도
          </button>
        </div>
        {tab === 'CHARACTER' ? (
          <>
            <div className="mt-3 rounded-lg bg-amber-background px-3 py-2 text-caption text-amber-foreground">
              ✧ 검수 승인 시 AI 토큰 최대 10개를 보상으로 드려요.
            </div>
            <h2 className="mt-4 text-body-lg font-bold">등장인물</h2>
            <div aria-label="인물 정렬" className="mt-1 flex gap-3 text-caption text-text-muted">
              {[
                ['AFFILIATION', '소속'],
                ['NAME', '이름순'],
                ['IMPORTANCE', '중요도 순'],
              ].map(([value, label]) => (
                <button
                  aria-pressed={peopleSort === value}
                  className={peopleSort === value ? 'font-medium text-teal-strong' : ''}
                  key={value}
                  onClick={() => setPeopleSort(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
            <ul className="mt-2 divide-y divide-border/50">
              {peopleByAffiliation
                ? [...peopleByAffiliation].map(([affiliation, groupedPeople]) => (
                    <li className="list-none" key={affiliation}>
                      <h3 className="pt-3 text-label font-semibold">{affiliation}</h3>
                      <ul>{groupedPeople.map(renderPerson)}</ul>
                    </li>
                  ))
                : sortedPeople.map(renderPerson)}
            </ul>
            <button
              className="min-h-14 w-full text-label text-text-secondary"
              onClick={() => goRegister(undefined, true)}
              type="button"
            >
              신규 인물 추가 ＋
            </button>
          </>
        ) : tab === 'GROUP' ? (
          <div className="min-h-[360px]" role="tabpanel" aria-label="단체 추가 화면 예정" />
        ) : (
          <div className="min-h-[360px]" role="tabpanel" aria-label="관계도 추가 화면 예정" />
        )}
      </main>
      {positionDialogOpen && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-text-primary/35 px-9 py-8 backdrop-blur-[1.5px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPositionDialogOpen(false)
          }}
        >
          <form
            aria-modal="true"
            className="w-full max-w-[318px] rounded-xl bg-surface p-6 shadow-xl"
            onSubmit={(event) => {
              event.preventDefault()
              const value = Number(positionInput)
              if (
                !Number.isInteger(value) ||
                value < 1 ||
                (maximumPosition && value > maximumPosition)
              )
                return
              const nextPosition = { unit: positionUnit, value }
              setPosition(nextPosition)
              setPositionDialogOpen(false)
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-title font-bold">읽은 지점 설정</h2>
              <button
                aria-label="닫기"
                className="-mt-1 -mr-1 flex size-8 items-center justify-center text-text-secondary"
                onClick={() => setPositionDialogOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>
            <p className="mt-1 text-label text-text-secondary">
              위키를 작성할 때 공개할 수 있는 정보 범위를 정해요.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <img
                alt=""
                className="size-[52px] shrink-0 rounded-md object-cover"
                src={book.coverUrl || bookCoverPreview}
              />
              <div className="min-w-0">
                <p className="truncate text-body font-medium">{title}</p>
                <p className="mt-1 text-caption text-text-secondary">
                  {positionUnit === 'PAGE' ? '종이책 · 페이지' : '웹소설 · 회차'}
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-center gap-2">
              <input
                aria-label="읽은 지점"
                autoFocus
                className="h-10 w-16 rounded-md bg-control-neutral text-center text-body"
                inputMode="numeric"
                max={maximumPosition}
                min="1"
                onChange={(event) => setPositionInput(event.target.value.replace(/\D/g, ''))}
                required
                type="text"
                value={positionInput}
              />
              <span className="text-caption text-text-secondary">
                {positionUnit === 'PAGE' ? '쪽' : '화'}
              </span>
            </div>
            <Button
              className="mt-5 rounded-lg font-bold"
              height="38px"
              text={mode === 'CREATE' ? '위키 생성' : '위키 수정'}
              textStyle="body"
              type="submit"
            />
          </form>
        </div>
      )}
    </div>
  )
}

export default WikiAddPage
