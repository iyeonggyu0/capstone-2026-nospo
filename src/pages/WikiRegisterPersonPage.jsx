import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/common-ui'
import { WikiCharacterImagePicker } from '@/features/wiki'
import chevronLeft from '@/assets/icons/header/chevron-left.svg'
import genderFemaleIcon from '@/assets/icons/gender/gender-female.svg'
import genderMaleIcon from '@/assets/icons/gender/gender-male.svg'

const previewPeople = [
  {
    id: 'preview-1',
    name: '서하준',
    affiliation: '소속',
    age: 26,
    gender: '남성',
    role: '주인공',
    personality: '',
    firstRevealAt: 26,
    imageUrl: '',
  },
  {
    id: 'preview-2',
    name: '서하준',
    affiliation: '소속',
    age: 26,
    gender: '남성',
    role: '주연',
    personality: '',
    firstRevealAt: 26,
    imageUrl: '',
  },
  {
    id: 'preview-3',
    name: '서하준',
    affiliation: '소속',
    age: 26,
    gender: '남성',
    role: '조연',
    personality: '',
    firstRevealAt: 26,
    imageUrl: '',
  },
]

const roles = ['주인공', '주연', '조연', '단역', '엑스트라']
const genders = ['남성', '여성', '인외', '기타']
const tabs = [
  { id: 'EVENT', label: '주요 행적' },
  { id: 'ABILITY', label: '능력 · 기술' },
  { id: 'RELATION', label: '관계' },
  { id: 'OTHER', label: '기타' },
]

const emptyPerson = (revealAt = 1) => ({
  name: '',
  affiliation: '',
  gender: '',
  role: '',
  personality: '',
  firstRevealAt: revealAt,
  imageUrl: '',
})

const getPositionValue = (position) => {
  if (typeof position === 'number') return position
  if (position && typeof position === 'object')
    return Number(position.value ?? position.positionValue ?? 1)
  return 1
}

const getPositionLabel = (position) => {
  const volume = position?.volume ?? position?.volumeNumber ?? 2
  const chapter = position?.chapter ?? position?.chapterNumber ?? 7
  return `${volume}권 ${chapter}장 수정`
}

const GenderIcon = ({ gender, selected = false, size = 'size-4' }) => {
  if (gender !== '남성' && gender !== '여성') return null

  const isMale = gender === '남성'
  const icon = isMale ? genderMaleIcon : genderFemaleIcon
  const colorStyle =
    isMale && selected
      ? {
          filter:
            'brightness(0) saturate(100%) invert(39%) sepia(24%) saturate(1280%) hue-rotate(166deg) brightness(94%) contrast(90%)',
        }
      : !isMale && !selected
        ? { filter: 'grayscale(1) opacity(.45)' }
        : undefined

  return <img alt="" aria-hidden="true" className={size} src={icon} style={colorStyle} />
}

/** 인물 위키 등록·수정 초안의 목록과 기본 정보 편집 화면이다. */
const WikiRegisterPersonPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useMemo(() => new URLSearchParams(location.search), [location.search])
  const book = location.state?.book ?? {}
  const bookId = location.state?.bookId ?? params.get('bookId')
  const position = location.state?.position ?? Number(params.get('position') || 1)
  const positionValue = getPositionValue(position)
  const positionLabel = getPositionLabel(position)
  const [people, setPeople] = useState(import.meta.env.DEV && !bookId ? previewPeople : [])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyPerson(positionValue))
  const [selectedTab, setSelectedTab] = useState('EVENT')
  const [activePersonId, setActivePersonId] = useState(null)
  const [query, setQuery] = useState('')
  const [organizations, setOrganizations] = useState([])
  const [notice, setNotice] = useState('')

  const activePerson = people.find((person) => person.id === activePersonId)
  const openCreate = () => {
    setForm(emptyPerson(positionValue))
    setModal('create')
  }
  const openEdit = (person) => {
    setForm({ ...person })
    setModal('edit')
  }
  const closeModal = () => {
    setModal(null)
    setQuery('')
  }
  const updateField = (name, value) => setForm((current) => ({ ...current, [name]: value }))
  const addOrganization = () => {
    const value = query.trim()
    if (!value) return
    setOrganizations((items) => (items.includes(value) ? items : [...items, value]))
    updateField('affiliation', value)
    setQuery('')
  }
  const savePerson = (event) => {
    event.preventDefault()
    if (!form.name.trim()) {
      setNotice('이름을 입력해 주세요.')
      return
    }
    if (modal === 'create') {
      setPeople((items) => [...items, { ...form, id: `local-${Date.now()}` }])
      setNotice('미리보기 인물을 추가했어요.')
    } else {
      setPeople((items) =>
        items.map((person) =>
          person.id === form.id ? { ...form, name: form.name.trim() } : person,
        ),
      )
      setNotice('미리보기 정보를 수정했어요.')
    }
    closeModal()
  }
  const discard = () => {
    navigate(-1)
  }

  return (
    <div className="relative mx-auto flex min-h-full w-full max-w-[430px] flex-col bg-surface pb-[144px]">
      <header className="flex h-11 shrink-0 items-center justify-between px-5">
        {activePerson ? (
          <button
            aria-label="인물 목록으로 돌아가기"
            className="flex min-h-11 items-center gap-2 text-teal-strong"
            onClick={() => setActivePersonId(null)}
            type="button"
          >
            <img alt="" aria-hidden="true" className="size-5" src={chevronLeft} />
            <Logo className="gap-1" imageClassName="size-6" />
          </button>
        ) : (
          <Logo className="gap-1" imageClassName="size-7" />
        )}
        <button
          className="min-h-11 text-label font-medium text-text-primary"
          onClick={() => setNotice(`현재 진도 ${positionValue}화 기준으로 작성 중이에요.`)}
          type="button"
        >
          진도 변경
        </button>
      </header>

      {!activePerson && (
        <section className="px-5 pt-1" aria-label="도서와 진도">
          <div className="flex items-center gap-3 rounded-2xl bg-canvas p-3">
            {book.coverUrl ? (
              <img
                alt=""
                className="size-[68px] shrink-0 rounded-xl object-cover"
                src={book.coverUrl}
              />
            ) : (
              <div
                className="flex size-[68px] shrink-0 items-center justify-center rounded-xl bg-teal-subtle text-title font-bold text-teal-strong"
                aria-hidden="true"
              >
                책
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-body-lg font-bold">
                {book.title ?? '애주가의 절주 일기'}
              </p>
              <p className="mt-1 text-label text-text-secondary">
                <span className="font-medium text-teal-strong">{positionValue}화까지 읽음</span>
                <span className="px-2">·</span>스포일러 보호 중
              </p>
            </div>
          </div>
          <p className="mt-3 text-right text-caption text-text-secondary">
            현재 읽은 범위까지 진도를 변경하고, 수정할 수 있어요.
          </p>
        </section>
      )}

      {import.meta.env.DEV && !activePerson && (
        <div
          className="mx-5 mt-3 rounded-lg bg-blue-info-light px-3 py-2 text-caption text-blue-action"
          role="status"
        >
          {bookId
            ? '화면 미리보기 · 인물·초안 API와 인증은 아직 연결되지 않았어요.'
            : '미리보기 데이터 · 도서 화면에서 bookId와 진도를 전달하면 실제 문맥으로 연결됩니다.'}
        </div>
      )}

      <main className="flex-1 px-5 pt-7">
        <div className="flex items-center justify-between">
          <h1 className="text-title font-bold">{activePerson ? '인물 정보' : '위키 내용 편집'}</h1>
          {activePerson && (
            <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-teal-subtle px-3 text-label font-medium text-teal-strong">
              <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
                <path
                  d="M12 3.5 19 6v5.3c0 4.2-2.8 7.6-7 9.2-4.2-1.6-7-5-7-9.2V6l7-2.5Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="m9 12 2 2 4-4"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.6"
                />
              </svg>
              {positionLabel}
            </span>
          )}
        </div>

        {!activePerson ? (
          <>
            <div className="mt-4 grid grid-cols-2 gap-2" role="tablist" aria-label="위키 유형">
              <button
                aria-selected="true"
                className="h-8 rounded-lg bg-teal-selected text-label font-medium text-white"
                role="tab"
                type="button"
              >
                인물 {people.length}
              </button>
              <button
                aria-selected="false"
                className="h-8 rounded-lg bg-control-neutral text-label text-text-secondary"
                onClick={() => setNotice('단체 위키는 단체 등록 화면에서 편집할 수 있어요.')}
                role="tab"
                type="button"
              >
                단체
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-background px-3 py-2.5 text-caption text-amber-foreground">
              <span aria-hidden="true" className="text-body">
                ✧
              </span>
              <span>검수 승인 시 AI 토큰 최대 10개를 보상으로 드려요.</span>
            </div>
            <ul className="mt-3 divide-y divide-border/50">
              {people.map((person) => (
                <li key={person.id} className="flex min-h-[72px] items-center gap-3">
                  <button
                    className="flex min-h-[60px] min-w-0 flex-1 items-center gap-3 text-left"
                    onClick={() => setActivePersonId(person.id)}
                    type="button"
                  >
                    {person.imageUrl ? (
                      <img
                        alt=""
                        className="size-12 rounded-full object-cover"
                        src={person.imageUrl}
                      />
                    ) : (
                      <span
                        className="size-12 shrink-0 rounded-full bg-teal-strong"
                        aria-hidden="true"
                      />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-body-lg font-medium">{person.name}</span>
                      <span className="mt-0.5 block text-label text-text-secondary">
                        {person.gender === '남성'
                          ? '남'
                          : person.gender === '여성'
                            ? '여'
                            : person.gender === '인외'
                              ? '인외'
                              : '기타'}{' '}
                        · {person.age ? `${person.age}살` : '나이 미정'} ·{' '}
                        {person.affiliation || '소속 미정'}
                      </span>
                    </span>
                  </button>
                  <button
                    aria-label={`${person.name} 정보 수정`}
                    className="flex size-11 shrink-0 items-center justify-center text-text-secondary"
                    onClick={() => openEdit(person)}
                    type="button"
                  >
                    ›
                  </button>
                </li>
              ))}
            </ul>
            <button
              className="mt-3 flex min-h-12 w-full items-center justify-center gap-1 text-label text-text-secondary"
              onClick={openCreate}
              type="button"
            >
              신규 인물 추가{' '}
              <span aria-hidden="true" className="text-body">
                ＋
              </span>
            </button>
          </>
        ) : (
          <section className="mt-4" aria-label="인물 상세 편집">
            <div className="rounded-xl border border-border p-3">
              <div className="flex items-center gap-3">
                <WikiCharacterImagePicker
                  imageUrl={activePerson.imageUrl}
                  onFileSelected={(file) =>
                    setPeople((items) =>
                      items.map((item) =>
                        item.id === activePerson.id
                          ? { ...item, imageUrl: URL.createObjectURL(file) }
                          : item,
                      ),
                    )
                  }
                />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-title font-bold">{activePerson.name}</h2>
                </div>
                <span
                  aria-label={activePerson.gender || '성별 미정'}
                  title={activePerson.gender || '성별 미정'}
                >
                  <GenderIcon gender={activePerson.gender} selected size="size-5" />
                </span>
              </div>
              <dl className="mt-2 grid grid-cols-[56px_1fr] gap-y-1 text-body">
                <dt className="text-label text-text-secondary">비중</dt>
                <dd>{activePerson.role || '미정'}</dd>
                <dt className="text-label text-text-secondary">나이</dt>
                <dd>{activePerson.age ? `${activePerson.age}살` : '미정'}</dd>
                <dt className="text-label text-text-secondary">소속</dt>
                <dd>{activePerson.affiliation || '미정'}</dd>
                <dt className="text-label text-text-secondary">성향</dt>
                <dd>{activePerson.personality || '미등록'}</dd>
              </dl>
            </div>
            <div
              className="mt-4 grid grid-cols-4 border-b border-border"
              role="tablist"
              aria-label="인물 정보"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  aria-selected={selectedTab === tab.id}
                  className={`min-h-12 border-b-2 px-1 text-label ${selectedTab === tab.id ? 'border-teal-strong font-bold text-teal-strong' : 'border-transparent text-text-secondary'}`}
                  onClick={() => setSelectedTab(tab.id)}
                  role="tab"
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between">
              <h3 className="text-body-lg font-bold">
                {tabs.find((tab) => tab.id === selectedTab)?.label}
              </h3>
              {selectedTab !== 'RELATION' && (
                <span className="text-caption text-text-muted">최신순</span>
              )}
            </div>
            {selectedTab === 'RELATION' ? (
              <div className="mt-4 rounded-lg bg-control-neutral p-4 text-label text-text-secondary">
                관계는 인물과 단체를 추가한 뒤 초안 안에서 연결할 수 있어요.
              </div>
            ) : (
              <div className="mt-4 rounded-lg bg-canvas p-4 text-label text-text-secondary">
                아직 등록한 내용이 없어요.
              </div>
            )}
            <button
              className="mt-3 min-h-11 w-full text-label text-text-secondary"
              onClick={() =>
                setNotice('세부 항목 추가는 관계·행적 편집 API 연결 후 저장할 수 있어요.')
              }
              type="button"
            >
              추가 ＋
            </button>
          </section>
        )}
      </main>

      <footer className="fixed inset-x-0 bottom-[74px] z-10 mx-auto w-full max-w-[390px] border-t border-border bg-surface px-5 pt-3 pb-2">
        <Button
          className="rounded-lg font-bold"
          onClick={() => setNotice('검수 제출 API와 인증 연결이 필요해요.')}
          text="검수 제출"
          height="46px"
          color="emphasis"
          textStyle="body"
        />
        <div className="flex min-h-8 items-center justify-center gap-3 text-caption text-text-secondary">
          <button onClick={discard} type="button">
            저장 안 함
          </button>
          <span aria-hidden="true">|</span>
          <button
            onClick={() =>
              setNotice(
                '임시 저장 API와 인증 연결이 필요해요. 현재 미리보기 변경 내용은 저장되지 않아요.',
              )
            }
            type="button"
          >
            임시 저장 후 돌아가기
          </button>
        </div>
      </footer>

      {notice && (
        <div
          className="fixed inset-x-5 bottom-[145px] z-20 mx-auto max-w-[390px] rounded-lg bg-text-primary px-4 py-3 text-label text-white"
          role="status"
        >
          <div className="flex items-center justify-between gap-3">
            <span>{notice}</span>
            <button
              aria-label="알림 닫기"
              className="shrink-0"
              onClick={() => setNotice('')}
              type="button"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {modal && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-text-primary/35 px-5 py-8"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal()
          }}
        >
          <form
            className="max-h-full w-full max-w-[390px] overflow-y-auto rounded-2xl bg-surface p-5 shadow-xl"
            onSubmit={savePerson}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-title font-bold">
                {modal === 'create' ? '기본 정보 등록' : '기본 정보 추가 · 수정'}
              </h2>
              <button
                aria-label="닫기"
                className="flex size-11 items-center justify-center text-text-secondary"
                onClick={closeModal}
                type="button"
              >
                ×
              </button>
            </div>
            <label className="mb-3 block text-caption text-text-secondary">
              이름
              <input
                autoFocus
                className="mt-1.5 min-h-11 w-full rounded-md bg-control-neutral px-3 text-body text-text-primary placeholder:text-text-muted"
                style={{ outline: 'none' }}
                maxLength={100}
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="이름을 입력하세요."
                required
                value={form.name}
              />
            </label>
            <label className="mb-3 block text-caption text-text-secondary">
              소속
              <div className="mt-1.5 flex gap-2">
                <input
                  className="min-h-11 min-w-0 flex-1 rounded-md bg-control-neutral px-3 text-body text-text-primary placeholder:text-text-muted"
                  style={{ outline: 'none' }}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      addOrganization()
                    }
                  }}
                  placeholder="단체 검색"
                  value={query}
                />
                <button
                  className="min-h-11 rounded-md bg-teal-subtle px-3 text-label text-teal-strong"
                  onClick={addOrganization}
                  type="button"
                >
                  추가
                </button>
              </div>
              {(organizations.length > 0 || form.affiliation) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[
                    ...new Set([...organizations, ...(form.affiliation ? [form.affiliation] : [])]),
                  ].map((name) => (
                    <button
                      key={name}
                      className={`rounded-full px-2.5 py-1 text-caption ${form.affiliation === name ? 'bg-teal-selected text-white' : 'bg-control-neutral text-text-secondary'}`}
                      onClick={() =>
                        updateField('affiliation', form.affiliation === name ? '' : name)
                      }
                      type="button"
                    >
                      {name} ×
                    </button>
                  ))}
                </div>
              )}
            </label>
            <label className="mb-4 block text-caption text-text-secondary">
              성향
              <textarea
                className="mt-1.5 min-h-20 w-full resize-y rounded-md bg-control-neutral px-3 py-2.5 text-body text-text-primary placeholder:text-text-muted"
                style={{ outline: 'none' }}
                maxLength={1000}
                onChange={(event) => updateField('personality', event.target.value)}
                placeholder="성향을 입력하세요."
                value={form.personality}
              />
            </label>
            <fieldset className="mb-3">
              <legend className="mb-1 text-caption text-text-secondary">비중</legend>
              <div className="grid grid-cols-5">
                {roles.map((role) => (
                  <button
                    aria-pressed={form.role === role}
                    className={`min-h-11 rounded-md px-1 text-caption ${form.role === role ? 'font-bold text-teal-strong' : 'text-text-muted'}`}
                    key={role}
                    onClick={() => updateField('role', role)}
                    type="button"
                  >
                    {role}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="mb-3">
              <legend className="mb-1 text-caption text-text-secondary">성별</legend>
              <div className="grid grid-cols-4">
                {genders.map((gender) => (
                  <button
                    aria-pressed={form.gender === gender}
                    className={`min-h-11 rounded-md text-label ${form.gender === gender ? 'font-bold text-teal-strong' : 'text-text-muted'}`}
                    key={gender}
                    onClick={() => updateField('gender', gender)}
                    type="button"
                  >
                    <span className="inline-flex items-center justify-center gap-1">
                      <GenderIcon gender={gender} selected={form.gender === gender} />
                      {gender}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="mb-5 flex min-h-11 items-center justify-center gap-2 text-label text-text-secondary">
              기준 회차
              <input
                className="h-10 w-16 rounded-md bg-control-neutral text-center text-body text-text-primary"
                min="1"
                onChange={(event) =>
                  updateField('firstRevealAt', event.target.value.replace(/\D/g, ''))
                }
                inputMode="numeric"
                pattern="[0-9]*"
                type="text"
                value={form.firstRevealAt}
              />
              화
            </label>
            <button
              className="min-h-11 w-full rounded-lg bg-teal-strong text-body font-bold text-white"
              type="submit"
            >
              {modal === 'create' ? '인물 추가' : '수정'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default WikiRegisterPersonPage
