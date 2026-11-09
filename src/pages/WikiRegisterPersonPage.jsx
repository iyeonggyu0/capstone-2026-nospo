import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/common-ui'
import { WikiCharacterImagePicker } from '@/features/wiki'
import chevronLeft from '@/assets/icons/header/chevron-left.svg'
import bookCoverPreview from '@/assets/images/wiki-book-cover-preview.png'

const previewPeople = [
  {
    id: 'preview-1',
    name: '서하준',
    affiliation: '소속',
    age: 26,
    gender: '남성',
    role: '주인공',
    personality: '침착하고 신중함',
    firstRevealAt: 2,
    imageUrl: '',
    entries: [
      { title: '폭풍을 피해 새로운 항로를 제안', revealAt: 12 },
      { title: '폭풍을 피해 새로운 항로를 제안', revealAt: 10 },
      { title: '폭풍을 피해 새로운 항로를 제안', revealAt: 7 },
      { title: '폭풍을 피해 새로운 항로를 제안', revealAt: 4 },
      { title: '폭풍을 피해 새로운 항로를 제안', revealAt: 4 },
      { title: '폭풍을 피해 새로운 항로를 제안', revealAt: 4 },
      { title: '폭풍을 피해 새로운 항로를 제안', revealAt: 4 },
    ],
    abilities: [
      {
        title: '항로 읽기',
        content: '바람과 조류의 변화를 읽어 안전한 길을 찾습니다.',
        revealAt: 4,
      },
      {
        title: '항로 읽기',
        content: '바람과 조류의 변화를 읽어 안전한 길을 찾습니다.',
        revealAt: 4,
      },
      {
        title: '항로 읽기',
        content: '바람과 조류의 변화를 읽어 안전한 길을 찾습니다.',
        revealAt: 4,
      },
    ],
    otherEntries: [
      { title: '폭풍을 피해 새로운 항로를 제안', revealAt: 12 },
      { title: '폭풍을 피해 새로운 항로를 제안', revealAt: 12 },
      { title: '폭풍을 피해 새로운 항로를 제안', revealAt: 12 },
      { title: '폭풍을 피해 새로운 항로를 제안', revealAt: 12 },
    ],
    relations: {
      우호: ['서하준', '서하준', '서하준'],
      대립: ['서하준', '서하준', '서하준'],
      중립: ['서하준', '서하준', '서하준'],
    },
  },
  {
    id: 'preview-2',
    name: '서하준',
    affiliation: '소속',
    age: 26,
    gender: '남성',
    role: '주연',
    personality: '침착하고 신중함',
    firstRevealAt: 2,
    imageUrl: '',
  },
  {
    id: 'preview-3',
    name: '서하준',
    affiliation: '소속',
    age: 26,
    gender: '남성',
    role: '조연',
    personality: '침착하고 신중함',
    firstRevealAt: 2,
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

const getDraftStorageKey = (bookId) => `nospo:wiki-person-draft:${bookId ?? 'preview'}`

const readStoredPeople = (bookId) => {
  if (typeof window === 'undefined') return null

  try {
    const savedDraft = window.sessionStorage.getItem(getDraftStorageKey(bookId))
    const people = savedDraft ? JSON.parse(savedDraft) : null
    return Array.isArray(people) ? people : null
  } catch {
    return null
  }
}

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
  const color = isMale ? (selected ? '#3572A8' : '#878787') : selected ? '#D35B5D' : '#878787'

  return (
    <svg aria-hidden="true" className={size} fill="none" viewBox="0 0 16 16">
      {isMale ? (
        <path
          d="M14.4643 1H9.96429C9.90536 1 9.85714 1.04821 9.85714 1.10714V2.10714C9.85714 2.16607 9.90536 2.21429 9.96429 2.21429H12.8286L9.26964 5.77321C8.37678 5.08571 7.2875 4.71429 6.14286 4.71429C4.76964 4.71429 3.47679 5.25 2.50714 6.22143C1.5375 7.19286 1 8.48393 1 9.85714C1 11.2304 1.53571 12.5232 2.50714 13.4929C3.47679 14.4643 4.76964 15 6.14286 15C7.51607 15 8.80893 14.4643 9.77857 13.4929C10.75 12.5232 11.2857 11.2304 11.2857 9.85714C11.2857 8.7125 10.9143 7.62679 10.2286 6.73393L13.7857 3.17679V6.03571C13.7857 6.09464 13.8339 6.14286 13.8929 6.14286H14.8929C14.9518 6.14286 15 6.09464 15 6.03571V1.53571C15 1.24107 14.7589 1 14.4643 1ZM6.14286 13.6429C4.05536 13.6429 2.35714 11.9446 2.35714 9.85714C2.35714 7.76964 4.05536 6.07143 6.14286 6.07143C8.23036 6.07143 9.92857 7.76964 9.92857 9.85714C9.92857 11.9446 8.23036 13.6429 6.14286 13.6429Z"
          fill={color}
        />
      ) : (
        <path
          d="M8 0.99994C6.93913 0.99994 5.92172 1.42137 5.17157 2.17151C4.42143 2.92166 4 3.93907 4 4.99994C4 6.06081 4.42143 7.07822 5.17157 7.82837C5.92172 8.57851 6.93913 8.99994 8 8.99994C9.06087 8.99994 10.0783 8.57851 10.8284 7.82837C11.5786 7.07822 12 6.06081 12 4.99994C12 3.93907 11.5786 2.92166 10.8284 2.17151C10.0783 1.42137 9.06087 0.99994 8 0.99994ZM3 4.99994C3.00001 4.03235 3.28077 3.08556 3.80823 2.27438C4.33568 1.4632 5.08717 0.822483 5.97156 0.429945C6.85594 0.0374067 7.83523 -0.0900927 8.79064 0.0629099C9.74605 0.215912 10.6365 0.642844 11.3541 1.29192C12.0717 1.94101 12.5855 2.78435 12.8333 3.71968C13.0811 4.655 13.0521 5.64213 12.75 6.56133C12.4478 7.48053 11.8855 8.29232 11.1311 8.89824C10.3767 9.50416 9.46274 9.87818 8.5 9.97494V11.9999H10.5C10.6326 11.9999 10.7598 12.0526 10.8536 12.1464C10.9473 12.2402 11 12.3673 11 12.4999C11 12.6325 10.9473 12.7597 10.8536 12.8535C10.7598 12.9473 10.6326 12.9999 10.5 12.9999H8.5V15.4999C8.5 15.6325 8.44732 15.7597 8.35355 15.8535C8.25979 15.9211 8.13261 15.9999 8 15.9999C7.86739 15.9999 7.74021 15.9211 7.64645 15.8535C7.55268 15.7597 7.5 15.6325 7.5 15.4999V12.9999H5.5C5.36739 12.9999 5.24021 12.9473 5.14645 12.8535C5.05268 12.7597 5 12.6325 5 12.4999C5 12.3673 5.05268 12.1464 5.14645 12.1464C5.14645 12.1464 5.36739 12.1464 5.5 12.1464H7.5V9.97494C6.26668 9.85099 5.12337 9.27335 4.29188 8.35408C3.46038 7.43482 2.99998 6.23947 3 4.99994Z"
          fill={color}
          fillRule="evenodd"
        />
      )}
    </svg>
  )
}

/** 인물 위키 등록·수정 초안의 목록과 기본 정보 편집 화면이다. */
const WikiRegisterPersonPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useMemo(() => new URLSearchParams(location.search), [location.search])
  const book = location.state?.book ?? {}
  const bookId = location.state?.bookId ?? params.get('bookId')
  const position =
    location.state?.position ?? Number(params.get('position') || (import.meta.env.DEV ? 32 : 1))
  const positionValue = getPositionValue(position)
  const positionLabel = getPositionLabel(position)
  const [people, setPeople] = useState(() => {
    const savedPeople = readStoredPeople(bookId)
    if (savedPeople) return savedPeople
    return import.meta.env.DEV && !bookId ? previewPeople : []
  })
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyPerson(positionValue))
  const [selectedTab, setSelectedTab] = useState('EVENT')
  const [activePersonId, setActivePersonId] = useState(null)
  const [query, setQuery] = useState('')
  const [organizations, setOrganizations] = useState([])
  const [notice, setNotice] = useState('')

  const activePerson = people.find((person) => person.id === activePersonId)
  const openCreate = () => {
    setForm(emptyPerson(import.meta.env.DEV && !bookId ? 2 : positionValue))
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
  const saveDraftAndReturn = () => {
    try {
      window.sessionStorage.setItem(getDraftStorageKey(bookId), JSON.stringify(people))
      navigate(-1)
    } catch {
      setNotice('이 브라우저에서는 임시 저장을 사용할 수 없어요.')
    }
  }

  return (
    <div className="relative mx-auto flex min-h-full w-full max-w-[390px] flex-col bg-surface px-0 pt-5">
      <header className="flex h-[22px] shrink-0 items-center justify-between px-5">
        {activePerson ? (
          <button
            aria-label="인물 목록으로 돌아가기"
            className="flex h-[22px] items-center gap-2 text-teal-strong"
            onClick={() => setActivePersonId(null)}
            type="button"
          >
            <img alt="" aria-hidden="true" className="size-5" src={chevronLeft} />
            <Logo
              className="gap-1 [&>span]:text-label [&>span]:leading-[22px]"
              imageClassName="size-[22px]"
            />
          </button>
        ) : (
          <Logo
            className="gap-1 [&>span]:text-label [&>span]:leading-[22px]"
            imageClassName="size-[22px]"
          />
        )}
        <button
          className="h-[22px] text-label font-medium text-text-primary"
          onClick={() => setNotice(`현재 진도 ${positionValue}화 기준으로 작성 중이에요.`)}
          type="button"
        >
          진도 변경
        </button>
      </header>

      {!activePerson && (
        <section className="px-5 pt-3" aria-label="도서와 진도">
          <div className="flex h-[118px] items-center gap-4 rounded-2xl bg-canvas p-3">
            {book.coverUrl ? (
              <img
                alt=""
                className="h-[94px] w-[72px] shrink-0 rounded-lg object-cover"
                src={book.coverUrl}
              />
            ) : (
              <img
                alt=""
                className="h-[94px] w-[72px] shrink-0 rounded-lg object-cover"
                src={bookCoverPreview}
              />
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

      <main className={`flex-1 px-5 ${activePerson ? 'pt-6' : 'pt-7'}`}>
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
            <div className="mt-[10px] grid grid-cols-2 gap-2" role="tablist" aria-label="위키 유형">
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
            <div className="mt-3 flex h-[37px] w-[calc(100%+8px)] items-center gap-2 rounded-lg bg-amber-background px-3 text-caption text-amber-foreground">
              <span aria-hidden="true" className="text-body">
                ✧
              </span>
              <span>검수 승인 시 AI 토큰 최대 10개를 보상으로 드려요.</span>
            </div>
            <ul className="mt-[14px] divide-y divide-border/50">
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
                        className="size-10 rounded-full object-cover"
                        src={person.imageUrl}
                      />
                    ) : (
                      <span
                        className="size-10 shrink-0 rounded-full bg-teal-strong"
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
                    aria-label={`${person.name} 정보 보기`}
                    className="flex size-11 shrink-0 items-center justify-center text-text-secondary"
                    onClick={() => setActivePersonId(person.id)}
                    type="button"
                  >
                    ›
                  </button>
                </li>
              ))}
            </ul>
            <button
              className="mt-3 flex min-h-16 w-full items-center justify-center gap-1 text-label text-text-secondary"
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
          <section className="mt-3" aria-label="인물 상세 편집">
            <div className="rounded-xl border border-border p-3">
              <div className="flex items-start gap-3">
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
                <button
                  className="min-w-0 flex-1 text-left"
                  onClick={() => openEdit(activePerson)}
                  type="button"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-title font-bold">{activePerson.name}</span>
                    <span
                      aria-label={activePerson.gender || '성별 미정'}
                      className="flex shrink-0 items-center gap-2"
                      title={activePerson.gender || '성별 미정'}
                    >
                      <GenderIcon
                        gender="남성"
                        selected={activePerson.gender === '남성'}
                        size="size-4"
                      />
                      <GenderIcon
                        gender="여성"
                        selected={activePerson.gender === '여성'}
                        size="size-4"
                      />
                    </span>
                  </span>
                </button>
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
              className="mt-3 grid grid-cols-4 border-b border-border"
              role="tablist"
              aria-label="인물 정보"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  aria-selected={selectedTab === tab.id}
                  className={`h-10 border-b-2 px-1 text-label ${selectedTab === tab.id ? 'border-teal-strong font-bold text-teal-strong' : 'border-transparent text-text-secondary'}`}
                  onClick={() => setSelectedTab(tab.id)}
                  role="tab"
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between px-3">
              <h3 className="text-body-lg font-bold">
                {tabs.find((tab) => tab.id === selectedTab)?.label}
              </h3>
              {selectedTab !== 'RELATION' && (
                <span className="text-caption text-text-muted">최신순</span>
              )}
            </div>
            {selectedTab === 'RELATION' ? (
              <div className="mt-3 px-3">
                <div className="flex h-[37px] items-center rounded-md bg-control-neutral px-3 text-label text-text-secondary">
                  인물 검색
                  <button
                    className="ml-auto text-text-muted"
                    onClick={() => setNotice('관계 추가 API 연결이 필요해요.')}
                    type="button"
                  >
                    추가 ＋
                  </button>
                </div>
                {Object.entries(activePerson.relations ?? {}).map(([relation, names], index) => (
                  <section className="mt-3" key={relation}>
                    <h4 className="mb-1 text-body font-bold">{relation}</h4>
                    <ul
                      className={`border-l pl-3 ${index === 0 ? 'border-teal-strong' : index === 1 ? 'border-red-destructive' : 'border-text-secondary'}`}
                    >
                      {names.map((name, itemIndex) => (
                        <li
                          className="flex min-h-[60px] items-center gap-3"
                          key={`${relation}-${itemIndex}`}
                        >
                          <span
                            className="size-10 shrink-0 rounded-full bg-teal-strong"
                            aria-hidden="true"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-body">{name}</span>
                            <span className="text-caption text-text-secondary">00화</span>
                          </span>
                          <button
                            className="text-label text-red-destructive"
                            onClick={() => setNotice('관계 삭제 API 연결이 필요해요.')}
                            type="button"
                          >
                            삭제
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            ) : (
              <ul className="mt-3 px-3">
                {(selectedTab === 'EVENT'
                  ? activePerson.entries
                  : selectedTab === 'ABILITY'
                    ? activePerson.abilities
                    : activePerson.otherEntries
                )?.map((entry, index) => (
                  <li
                    className={`flex items-center gap-2 border-b border-border/50 ${selectedTab === 'ABILITY' ? 'min-h-[68px]' : 'min-h-[48px]'}`}
                    key={`${entry.title}-${index}`}
                  >
                    {selectedTab === 'ABILITY' ? (
                      <>
                        <span className="text-label text-teal-strong">Ⅱ 항로 읽기</span>
                        <span className="min-w-0 flex-1 text-caption text-text-secondary">
                          {entry.content}
                        </span>
                      </>
                    ) : (
                      <span className="min-w-0 flex-1 truncate text-body-sm">{entry.title}</span>
                    )}
                    <span className="shrink-0 text-caption-xs text-text-secondary">
                      {entry.revealAt}화
                    </span>
                    <button
                      className="text-label text-teal-strong"
                      onClick={() => setNotice('항목 수정 API 연결이 필요해요.')}
                      type="button"
                    >
                      편집
                    </button>
                    <button
                      className="text-label text-red-destructive"
                      onClick={() => setNotice('항목 삭제 API 연결이 필요해요.')}
                      type="button"
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
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

      <footer className="sticky bottom-0 z-10 mt-auto w-full bg-surface px-5 pt-[10px] pb-[14px]">
        <Button
          className="rounded-lg font-bold"
          onClick={() => setNotice('검수 제출 API와 인증 연결이 필요해요.')}
          text="검수 제출"
          height="46px"
          color="emphasis"
          textStyle="body"
        />
        <div className="flex h-[22px] items-center justify-center gap-3 text-caption text-text-secondary">
          <button onClick={discard} type="button">
            저장 안 함
          </button>
          <span aria-hidden="true">|</span>
          <button onClick={saveDraftAndReturn} type="button">
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
          className="fixed inset-0 z-30 flex items-center justify-center bg-text-primary/35 px-5 py-8 backdrop-blur-[1.5px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal()
          }}
        >
          <form
            className={`flex max-h-[calc(100dvh-32px)] w-full max-w-[318px] flex-col overflow-y-auto rounded-xl bg-surface p-6 shadow-xl ${modal === 'edit' ? 'min-h-[548px]' : 'min-h-[536px]'}`}
            onSubmit={savePerson}
          >
            <div className="flex h-11 items-center justify-between">
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
            <label className="mb-5 block text-caption text-text-secondary">
              이름
              <input
                autoFocus
                className="h-[37px] w-full rounded-md bg-control-neutral px-3 text-body text-text-primary placeholder:text-text-muted"
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
              <div className="mt-0.5 flex">
                <input
                  className="h-[37px] min-w-0 flex-1 rounded-md bg-control-neutral px-3 text-body text-text-primary placeholder:text-text-muted"
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
              </div>
              {(organizations.length > 0 || form.affiliation) && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {[
                    ...new Set([...organizations, ...(form.affiliation ? [form.affiliation] : [])]),
                  ].map((name) => (
                    <button
                      key={name}
                      className={`h-5 min-w-9 rounded-full px-2 text-caption-xs ${form.affiliation === name ? 'bg-teal-selected text-white' : 'bg-control-neutral text-text-secondary'}`}
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
            <label className="mb-3 block text-caption text-text-secondary">
              성향
              <input
                className="h-[37px] w-full rounded-md bg-control-neutral px-3 text-body text-text-primary placeholder:text-text-muted"
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
                    className={`h-8 rounded-md px-1 text-caption ${form.role === role ? 'font-bold text-teal-strong' : 'text-text-muted'}`}
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
                    className={`h-8 rounded-md text-label ${form.gender === gender ? 'font-bold text-teal-strong' : 'text-text-muted'}`}
                    key={gender}
                    onClick={() => updateField('gender', gender)}
                    type="button"
                  >
                    {gender}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="mb-5 flex h-7 items-center justify-center gap-2 text-label text-text-secondary">
              기준 회차
              <input
                className="h-7 w-14 rounded-md bg-control-neutral text-center text-body text-text-primary"
                style={{ outline: 'none' }}
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
              className="mt-auto h-[38px] w-full rounded-lg bg-teal-strong text-body font-bold text-white"
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
