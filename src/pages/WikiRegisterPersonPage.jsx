import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/common-ui'
import { ROUTES } from '@/constants/routes'
import {
  createWikiCharacter,
  createWikiCharacterEntry,
  createWikiCharacterProfile,
  createWikiDraft,
  deletePersonDraft,
  getPersonDraftKey,
  getPersonImage,
  getWikiOrganizations,
  restorePersonDraft,
  storePersonDraft,
  storePersonImage,
  submitWikiDraft,
  uploadWikiDraftAsset,
  WikiCharacterImagePicker,
} from '@/features/wiki'
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

const makeLocalPersonId = () => `local-${Date.now()}`
const makeLocalEntryId = () =>
  window.crypto?.randomUUID?.() ?? `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const extractProfileFields = (source, revealAt) => ({
  name: (source.name ?? '').trim(),
  affiliation: source.affiliation ?? '',
  organizationId: source.organizationId ?? null,
  gender: source.gender ?? '',
  role: source.role ?? '',
  personality: source.personality ?? '',
  age: source.age ?? '',
  revealAt,
  ...(source.imageAssetId ? { imageAssetId: source.imageAssetId } : {}),
})

const emptyPerson = (revealAt = 1) => ({
  name: '',
  affiliation: '',
  gender: '',
  role: '',
  personality: '',
  firstRevealAt: revealAt,
  revealAt,
  imageUrl: '',
})

const getPositionValue = (position) => {
  if (typeof position === 'number') return position
  if (position && typeof position === 'object')
    return Number(position.value ?? position.positionValue ?? 1)
  return 1
}

const getPositionUnit = (position, book) => {
  if (typeof position === 'object' && position?.unit) {
    return position.unit === 'PAGE' ? 'PAGE' : 'EPISODE'
  }
  const sourceUnit = book.progressUnit ?? book.unit
  if (sourceUnit === 'PAGE' || sourceUnit === '쪽' || sourceUnit === '페이지') return 'PAGE'
  return 'EPISODE'
}

const getPositionUnitLabel = (unit) => ({ EPISODE: '화', PAGE: '쪽' })[unit] ?? unit ?? '화'

const getMaximumPosition = (book, unit) => {
  const total = unit === 'PAGE' ? book.totalPages : book.totalEpisodes
  return Number(book.totalPositions ?? total ?? book.totalCount) || undefined
}

const toApiPosition = (position, fallbackValue = 1, unit = 'EPISODE') =>
  position && typeof position === 'object'
    ? position
    : { unit, value: Number(position) || fallbackValue }

const getPositionLabel = (position, mode) => {
  const action = mode === 'CREATE' ? '등록' : '수정'
  const volume = position?.volume ?? position?.volumeNumber
  const chapter = position?.chapter ?? position?.chapterNumber
  const unitLabel = getPositionUnitLabel(position?.unit ?? 'EPISODE')
  const label =
    volume && chapter ? `${volume}권 ${chapter}장` : `${getPositionValue(position)}${unitLabel}`
  return `${label} ${action}`
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
          d="M8 0.99994C6.93913 0.99994 5.92172 1.42137 5.17157 2.17151C4.42143 2.92166 4 3.93907 4 4.99994C4 6.06081 4.42143 7.07822 5.17157 7.82837C5.92172 8.57851 6.93913 8.99994 8 8.99994C9.06087 8.99994 10.0783 8.57851 10.8284 7.82837C11.5786 7.07822 12 6.06081 12 4.99994C12 3.93907 11.5786 2.92166 10.8284 2.17151C10.0783 1.42137 9.06087 0.99994 8 0.99994ZM3 4.99994C3.00001 4.03235 3.28077 3.08556 3.80823 2.27438C4.33568 1.4632 5.08717 0.822483 5.97156 0.429945C6.85594 0.0374067 7.83523 -0.0900927 8.79064 0.0629099C9.74605 0.215912 10.6365 0.642844 11.3541 1.29192C12.0717 1.94101 12.5855 2.78435 12.8333 3.71968C13.0811 4.655 13.0521 5.64213 12.75 6.56133C12.4478 7.48053 11.8855 8.29232 11.1311 8.89824C10.3767 9.50416 9.46274 9.87818 8.5 9.97494V11.9999H10.5C10.6326 11.9999 10.7598 12.0526 10.8536 12.1464C10.9473 12.2402 11 12.3673 11 12.4999C11 12.6325 10.9473 12.7597 10.8536 12.8535C10.7598 12.9473 10.6326 12.9999 10.5 12.9999H8.5V15.4999C8.5 15.6325 8.44732 15.7597 8.35355 15.8535C8.25979 15.9473 8.13261 15.9999 8 15.9999C7.86739 15.9999 7.74021 15.9473 7.64645 15.8535C7.55268 15.7597 7.5 15.6325 7.5 15.4999V12.9999H5.5C5.36739 12.9999 5.24021 12.9473 5.14645 12.8535C5.05268 12.7597 5 12.6325 5 12.4999C5 12.3673 5.05268 12.2402 5.14645 12.1464C5.24021 12.0526 5.36739 11.9999 5.5 11.9999H7.5V9.97494C6.26668 9.85099 5.12337 9.27335 4.29188 8.35408C3.46038 7.43482 2.99998 6.23947 3 4.99994Z"
          fill={color}
          fillRule="evenodd"
        />
      )}
    </svg>
  )
}

const relationTypes = ['우호', '대립', '중립']

/** 인물 위키 등록·수정 초안의 목록과 기본 정보 편집 화면이다. */
const WikiRegisterPersonPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useMemo(() => new URLSearchParams(location.search), [location.search])
  const book = useMemo(() => location.state?.book ?? {}, [location.state?.book])
  const bookId = location.state?.bookId ?? params.get('bookId')
  const isAddPersonRoute = location.pathname === ROUTES.WIKI_ADD_PERSON
  const mode =
    location.state?.mode ?? params.get('mode') ?? (isAddPersonRoute ? 'CREATE' : 'UPDATE')
  const isCreatingPerson = location.state?.createPerson ?? isAddPersonRoute
  const isWikiCreation = mode === 'CREATE'
  const initialPosition =
    location.state?.position ?? Number(params.get('position') || (import.meta.env.DEV ? 32 : 1))
  const [position, setPosition] = useState(initialPosition)
  const [positionUnit, setPositionUnit] = useState(() => getPositionUnit(initialPosition, book))
  const [positionDialogOpen, setPositionDialogOpen] = useState(false)
  const [positionInput, setPositionInput] = useState(String(getPositionValue(initialPosition)))
  const [positionUnitInput, setPositionUnitInput] = useState(() =>
    getPositionUnit(initialPosition, book),
  )
  const positionValue = getPositionValue(position)
  const positionUnitLabel = getPositionUnitLabel(positionUnit)
  const positionLabel = getPositionLabel(position, mode)
  const previewUrls = useRef(new Set())
  const [people, setPeople] = useState(() => {
    if (isWikiCreation) return []
    return import.meta.env.DEV && !bookId ? previewPeople : []
  })
  const [isDraftLoaded, setIsDraftLoaded] = useState(false)
  const [modal, setModal] = useState(isCreatingPerson ? 'create' : null)
  const [form, setForm] = useState(emptyPerson(positionValue))
  const [selectedTab, setSelectedTab] = useState('EVENT')
  const [activePersonId, setActivePersonId] = useState(location.state?.personId ?? null)
  const [query, setQuery] = useState('')
  const [organizations, setOrganizations] = useState([
    { id: null, name: '그리핀도르' },
    { id: null, name: '슬리데린' },
    { id: null, name: '래번클로' },
    { id: null, name: '후플푸프' },
  ])
  const [showAbilities, setShowAbilities] = useState(true)
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [entryDraft, setEntryDraft] = useState(null)
  const [relationDraft, setRelationDraft] = useState(null)
  const [dropTargetType, setDropTargetType] = useState(null)

  useEffect(() => {
    const requestedPersonId = location.state?.personId
    if (!requestedPersonId && !isCreatingPerson) {
      navigate(ROUTES.WIKI_ADD_PAGE, { replace: true, state: { mode, book, bookId, position } })
    }
  }, [
    location.state?.personId,
    location.state?.createPerson,
    isCreatingPerson,
    navigate,
    mode,
    book,
    bookId,
    position,
  ])

  useEffect(() => {
    let cancelled = false
    const objectUrls = previewUrls.current
    restorePersonDraft(getPersonDraftKey(bookId, mode))
      .then((savedDraft) => {
        if (!cancelled && savedDraft) {
          savedDraft.people.forEach((person) => {
            if (person.imageUrl) objectUrls.add(person.imageUrl)
          })
          setPeople(savedDraft.people)
          if (savedDraft.position) {
            setPosition(savedDraft.position)
            setPositionInput(String(getPositionValue(savedDraft.position)))
          }
          if (savedDraft.positionUnit) {
            setPositionUnit(savedDraft.positionUnit)
            setPositionUnitInput(savedDraft.positionUnit)
          }
        }
        if (!cancelled) setIsDraftLoaded(true)
      })
      .catch(() => {
        if (!cancelled) setIsDraftLoaded(true)
      })
    return () => {
      cancelled = true
      objectUrls.forEach((url) => URL.revokeObjectURL(url))
      objectUrls.clear()
    }
  }, [bookId, mode])

  useEffect(() => {
    if (import.meta.env.VITE_WIKI_API_MODE !== 'api' || !bookId || mode !== 'UPDATE') return
    let active = true
    getWikiOrganizations({ bookId, positionValue, limit: 100 })
      .then((page) => {
        if (active) {
          setOrganizations(
            (page?.items ?? []).map((item) => ({
              id: item.entityId ?? item.organizationId,
              name: item.name,
            })),
          )
        }
      })
      .catch(() => {
        if (active) setNotice('단체 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')
      })
    return () => {
      active = false
    }
  }, [bookId, positionValue, mode])

  useEffect(() => {
    if (!isDraftLoaded || isSubmitted) return
    storePersonDraft(getPersonDraftKey(bookId, mode), {
      position,
      positionUnit,
      people,
    }).catch(() => {})
  }, [people, position, positionUnit, bookId, mode, isDraftLoaded, isSubmitted])

  const sourcePerson = people.find((person) => person.id === activePersonId)
  const activeProfile = sourcePerson?.profiles
    ?.filter((profile) => Number(profile.revealAt) <= positionValue)
    .sort((a, b) => Number(b.revealAt) - Number(a.revealAt))[0]
  const activePerson =
    sourcePerson && activeProfile
      ? {
          ...sourcePerson,
          ...activeProfile,
          id: sourcePerson.id,
          firstRevealAt: sourcePerson.firstRevealAt,
        }
      : sourcePerson
  const maximumPosition = getMaximumPosition(book, positionUnitInput)
  const openCreate = () => {
    setForm(emptyPerson(positionValue))
    setModal('create')
  }
  const openEdit = (person) => {
    const profile = [...(person.profiles ?? [])]
      .filter((item) => Number(item.revealAt) <= positionValue)
      .sort((a, b) => Number(b.revealAt) - Number(a.revealAt))[0]
    const revealAt = profile?.revealAt ?? person.firstRevealAt
    setForm({
      id: person.id,
      ...extractProfileFields({ ...person, ...(profile ?? {}) }, revealAt),
    })
    setModal('edit')
  }
  const closeModal = () => {
    setModal(null)
    setQuery('')
  }
  const updateField = (name, value) => setForm((current) => ({ ...current, [name]: value }))
  const addOrganization = (searchValue = query) => {
    const value = typeof searchValue === 'string' ? searchValue.trim() : searchValue.name
    if (!value) return
    const organization =
      typeof searchValue === 'object'
        ? searchValue
        : (organizations.find((item) => item.name === value) ?? { id: null, name: value })
    setOrganizations((items) =>
      items.some((item) => item.name === value) ? items : [...items, organization],
    )
    updateField('affiliation', value)
    updateField('organizationId', organization.id)
    setQuery('')
  }
  const savePerson = (event) => {
    event.preventDefault()
    if (!form.name.trim()) {
      setNotice('이름을 입력해 주세요.')
      return
    }
    const revealAt = Number(form.revealAt)
    if (!Number.isInteger(revealAt) || revealAt < 1) {
      setNotice('기준 회차는 1 이상의 정수로 입력해 주세요.')
      return
    }
    if (revealAt > positionValue) {
      setNotice(`기준 회차는 읽은 지점 ${positionValue}${positionUnitLabel}보다 뒤일 수 없어요.`)
      return
    }
    const profile = extractProfileFields(form, revealAt)
    if (modal === 'create') {
      const person = {
        ...profile,
        firstRevealAt: revealAt,
        profiles: [profile],
        id: makeLocalPersonId(),
        imageUrl: '',
      }
      setPeople((items) => [...items, person])
      setActivePersonId(person.id)
      setNotice('인물을 추가했어요.')
    } else {
      setPeople((items) =>
        items.map((person) => {
          if (person.id !== form.id) return person
          const profiles = [...(person.profiles ?? [])]
          const profileIndex = profiles.findIndex((item) => Number(item.revealAt) === revealAt)
          if (profileIndex < 0) profiles.push(profile)
          else profiles[profileIndex] = profile
          return { ...person, ...profile, profiles, firstRevealAt: person.firstRevealAt }
        }),
      )
      setNotice('인물 정보를 수정했어요.')
    }
    setIsDirty(true)
    closeModal()
  }
  const discard = async () => {
    try {
      await deletePersonDraft(
        getPersonDraftKey(bookId, mode),
        people.map((person) => person.imageKey).filter(Boolean),
      )
      navigate(-1)
    } catch (error) {
      setNotice(error.message || '초안 삭제에 실패했어요.')
    }
  }
  const saveDraftAndReturn = () => {
    storePersonDraft(getPersonDraftKey(bookId, mode), {
      position,
      positionUnit,
      people,
    })
      .then(() => {
        navigate(-1)
      })
      .catch((error) => setNotice(error.message || '임시 저장에 실패했어요.'))
  }
  const returnToWikiAdd = async () => {
    try {
      await storePersonDraft(getPersonDraftKey(bookId, mode), {
        position,
        positionUnit,
        people,
      })
      navigate(ROUTES.WIKI_ADD_PAGE, {
        state: {
          mode,
          book,
          bookId,
          position,
          wikiId: location.state?.wikiId,
          baseWikiVersion: location.state?.baseWikiVersion,
          positionConfirmed: true,
        },
      })
    } catch (error) {
      setNotice(error.message || '임시 저장에 실패했어요.')
    }
  }

  const submitForReview = async () => {
    if (isSubmitting) return
    const mockMode = import.meta.env.VITE_WIKI_API_MODE !== 'api'
    if ((!bookId && (!mockMode || !import.meta.env.DEV)) || people.length === 0) {
      setNotice('도서 정보와 인물을 확인해 주세요.')
      return
    }
    if (
      !mockMode &&
      mode === 'UPDATE' &&
      (!location.state?.wikiId || location.state?.baseWikiVersion == null)
    ) {
      setNotice('위키 수정 정보가 없어 제출할 수 없어요. 이전 화면에서 다시 진입해 주세요.')
      return
    }
    if (mode === 'UPDATE' && !isDirty) {
      setNotice('변경한 내용이 있을 때 검수 제출할 수 있어요.')
      return
    }
    if (!mockMode && mode === 'UPDATE') {
      setNotice(
        '기존 위키의 서버 초안과 인물 ID를 먼저 불러온 뒤 제출할 수 있어요. 현재 화면은 목업 수정 모드입니다.',
      )
      return
    }
    const hasSpoilerAfterPosition = people.some((person) => {
      const revealPoints = [
        person.firstRevealAt,
        ...(person.profiles ?? []).map((profile) => profile.revealAt),
        person.imageRevealAt,
        ...(person.entries ?? []).map((entry) => entry.revealAt),
        ...(person.abilities ?? []).map((entry) => entry.revealAt),
        ...(person.otherEntries ?? []).map((entry) => entry.revealAt),
        ...Object.values(person.relations ?? {}).flatMap((relations) =>
          relations.map((relation) =>
            typeof relation === 'string' ? undefined : relation.revealAt,
          ),
        ),
      ]
      return revealPoints.some(
        (revealPoint) => revealPoint != null && Number(revealPoint) > positionValue,
      )
    })
    if (hasSpoilerAfterPosition) {
      setNotice(`읽은 지점 ${positionValue}${positionUnitLabel} 뒤의 정보는 제출할 수 없어요.`)
      return
    }
    setIsSubmitting(true)
    try {
      if (mockMode) {
        await storePersonDraft(getPersonDraftKey(bookId, mode), {
          position,
          positionUnit,
          people,
        })
        setIsSubmitted(true)
        setNotice('목업: 위키 변경 내용을 검수 제출했어요.')
        return
      }

      const created = await createWikiDraft({
        bookId,
        mode,
        position: toApiPosition(position, positionValue, positionUnit),
        wikiId: location.state?.wikiId,
        baseWikiVersion: location.state?.baseWikiVersion,
      })
      const draftId = created.data?.draftId ?? created.data?.id
      if (!draftId || !created.etag) throw new Error('초안 정보를 확인할 수 없어요.')
      let etag = created.etag

      for (const person of people) {
        let imageAssetId = person.imageAssetId ?? null
        if (person.imageKey) {
          const image = await getPersonImage(person.imageKey)
          if (!image) throw new Error(`${person.name}의 이미지를 다시 선택해 주세요.`)
          const uploaded = await uploadWikiDraftAsset({ draftId, file: image, etag })
          etag = uploaded.etag
          imageAssetId = uploaded.data?.assetId ?? uploaded.data?.id ?? null
          if (!etag || !imageAssetId) throw new Error('이미지 업로드 결과를 확인할 수 없어요.')
        }
        const profiles = person.profiles?.length
          ? [...person.profiles].sort((a, b) => Number(a.revealAt) - Number(b.revealAt))
          : [{ ...person, revealAt: person.firstRevealAt }]
        const firstProfile = profiles[0]
        const firstRevealAt = toApiPosition(person.firstRevealAt, positionValue, positionUnit)
        const result = await createWikiCharacter({
          draftId,
          firstRevealAt,
          etag,
          profile: {
            name: (firstProfile.name ?? person.name).trim(),
            role: firstProfile.role || null,
            description: firstProfile.personality || firstProfile.description || '',
            imageAssetId,
            revealAt: toApiPosition(
              firstProfile.revealAt ?? person.firstRevealAt,
              positionValue,
              positionUnit,
            ),
          },
        })
        etag = result.etag
        if (!etag) throw new Error('초안 버전 정보를 확인할 수 없어요.')
        const characterId = result.data?.entityId ?? result.data?.characterId
        if (
          !characterId &&
          (profiles.length > 1 ||
            person.entries?.length ||
            person.abilities?.length ||
            person.otherEntries?.length)
        ) {
          throw new Error('인물 ID를 확인할 수 없어 세부 내용을 저장하지 못했어요.')
        }
        for (const profile of profiles.slice(1)) {
          const savedProfile = await createWikiCharacterProfile({
            draftId,
            characterId,
            etag,
            profile: {
              name: profile.name.trim(),
              role: profile.role || null,
              description: profile.personality || profile.description || '',
              imageAssetId: profile.imageAssetId ?? imageAssetId,
              revealAt: toApiPosition(profile.revealAt, positionValue, positionUnit),
            },
          })
          etag = savedProfile.etag
        }
        for (const [type, entries] of [
          ['EVENT', person.entries ?? []],
          ['ABILITY', person.abilities ?? []],
          ['OTHER', person.otherEntries ?? []],
        ]) {
          for (const entry of entries) {
            const revealAt =
              Number(entry.revealAt) || Number(firstProfile.revealAt) || positionValue
            const savedEntry = await createWikiCharacterEntry({
              draftId,
              characterId,
              etag,
              entry: {
                type,
                title: entry.title,
                content: entry.content ?? '',
                revealAt: toApiPosition(revealAt, positionValue, positionUnit),
                sourcePosition: toApiPosition(revealAt, positionValue, positionUnit),
              },
            })
            etag = savedEntry.etag
          }
        }
      }

      await submitWikiDraft({
        draftId,
        etag,
        idempotencyKey: window.crypto.randomUUID(),
      })
      await deletePersonDraft(
        getPersonDraftKey(bookId, mode),
        people.map((person) => person.imageKey).filter(Boolean),
      ).catch(() => {})
      const hasUnlinkedAffiliation = people.some((person) => person.affiliation)
      setIsSubmitted(true)
      setNotice(
        hasUnlinkedAffiliation
          ? '검수 제출이 완료됐어요. 소속은 현재 초안에 단체 정보가 없어 API에 연결되지 않았어요.'
          : '검수 제출이 완료됐어요.',
      )
    } catch (error) {
      setNotice(
        error.response?.data?.message ||
          error.message ||
          '검수 제출에 실패했어요. 다시 시도해 주세요.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const getEntriesForTab = (person, tabId) =>
    tabId === 'EVENT'
      ? (person.entries ?? [])
      : tabId === 'ABILITY'
        ? (person.abilities ?? [])
        : (person.otherEntries ?? [])

  const setEntriesForTab = (person, tabId, entries) => ({
    ...person,
    ...(tabId === 'EVENT'
      ? { entries }
      : tabId === 'ABILITY'
        ? { abilities: entries }
        : { otherEntries: entries }),
  })

  const saveEntry = (event) => {
    event.preventDefault()
    if (!entryDraft?.title.trim() || !activePerson) return
    if (Number(entryDraft.revealAt) > positionValue) {
      setNotice(`공개 지점은 읽은 지점 ${positionValue}${positionUnitLabel}보다 뒤일 수 없어요.`)
      return
    }
    const entries = getEntriesForTab(activePerson, selectedTab)
    const entry = {
      ...entryDraft,
      id: entryDraft.id ?? makeLocalEntryId(),
      title: entryDraft.title.trim(),
      content: entryDraft.content?.trim() ?? '',
      revealAt: Number(entryDraft.revealAt) || positionValue,
    }
    const nextEntries =
      entryDraft.index == null
        ? [...entries, entry]
        : entries.map((item, index) => (index === entryDraft.index ? entry : item))
    setPeople((items) =>
      items.map((person) =>
        person.id === activePerson.id ? setEntriesForTab(person, selectedTab, nextEntries) : person,
      ),
    )
    setEntryDraft(null)
    setIsDirty(true)
  }

  const deleteEntry = (index) => {
    if (!activePerson) return
    const nextEntries = getEntriesForTab(activePerson, selectedTab).filter((_, i) => i !== index)
    setPeople((items) =>
      items.map((person) =>
        person.id === activePerson.id ? setEntriesForTab(person, selectedTab, nextEntries) : person,
      ),
    )
    setIsDirty(true)
  }

  const saveRelation = (event) => {
    event.preventDefault()
    if (!activePerson || !relationDraft?.name.trim()) return
    if (Number(relationDraft.revealAt) > positionValue) {
      setNotice(`공개 지점은 읽은 지점 ${positionValue}${positionUnitLabel}보다 뒤일 수 없어요.`)
      return
    }
    setPeople((items) =>
      items.map((person) => {
        if (person.id !== activePerson.id) return person
        const relations = Object.fromEntries(
          Object.entries(person.relations ?? {}).map(([type, entries]) => [type, [...entries]]),
        )
        const group = relationDraft.type
        const nextRelation = {
          name: relationDraft.name.trim(),
          revealAt: Number(relationDraft.revealAt) || positionValue,
        }
        if (relationDraft.index != null && relationDraft.originalType === group) {
          relations[group] = (relations[group] ?? []).map((item, idx) =>
            idx === relationDraft.index ? nextRelation : item,
          )
        } else {
          if (relationDraft.index != null) {
            const oldType = relationDraft.originalType
            relations[oldType] = (relations[oldType] ?? []).filter(
              (_, index) => index !== relationDraft.index,
            )
            if (relations[oldType].length === 0) delete relations[oldType]
          }
          relations[group] = [...(relations[group] ?? []), nextRelation]
        }
        return { ...person, relations }
      }),
    )
    setRelationDraft(null)
    setIsDirty(true)
  }

  const deleteRelation = (group, index) => {
    if (!activePerson) return
    const relations = { ...(activePerson.relations ?? {}) }
    const nextGroup = (relations[group] ?? []).filter((_, i) => i !== index)
    if (nextGroup.length > 0) relations[group] = nextGroup
    else delete relations[group]
    setPeople((items) =>
      items.map((person) => (person.id === activePerson.id ? { ...person, relations } : person)),
    )
    setIsDirty(true)
  }

  const moveRelation = (sourceType, sourceIndex, targetType) => {
    if (!activePerson || sourceType === targetType) return
    const relations = Object.fromEntries(
      Object.entries(activePerson.relations ?? {}).map(([type, entries]) => [type, [...entries]]),
    )
    const sourceEntries = relations[sourceType] ?? []
    const [entry] = sourceEntries.splice(sourceIndex, 1)
    if (!entry) return
    if (sourceEntries.length) relations[sourceType] = sourceEntries
    else delete relations[sourceType]
    relations[targetType] = [...(relations[targetType] ?? []), entry]
    setPeople((items) =>
      items.map((person) => (person.id === activePerson.id ? { ...person, relations } : person)),
    )
    setIsDirty(true)
  }

  return (
    <div className="relative mx-auto flex min-h-full w-full max-w-[390px] flex-col bg-surface px-0 pt-5">
      <header className="flex h-[22px] shrink-0 items-center justify-between px-5">
        {activePerson ? (
          <button
            aria-label="인물 목록으로 돌아가기"
            className="flex h-[22px] items-center gap-2 text-teal-strong"
            onClick={() => void returnToWikiAdd()}
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
          onClick={() => {
            setPositionInput(String(positionValue))
            setPositionUnitInput(positionUnit)
            setPositionDialogOpen(true)
          }}
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
                <span className="font-medium text-teal-strong">
                  {positionValue}
                  {positionUnitLabel}까지 읽음
                </span>
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
          <h1 className="text-title font-bold">
            {activePerson ? '인물 정보' : isWikiCreation ? '위키 내용 등록' : '위키 내용 편집'}
          </h1>
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
                        · {person.role || '비중 미정'} · {person.affiliation || '소속 미정'}
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
                  key={activePerson.id}
                  imageUrl={activePerson.imageUrl}
                  onFileSelected={async (file) => {
                    const imageKey = `${getPersonDraftKey(bookId, mode)}:${activePerson.id}`
                    try {
                      await storePersonImage(imageKey, file)
                      if (activePerson.imageUrl && previewUrls.current.has(activePerson.imageUrl)) {
                        URL.revokeObjectURL(activePerson.imageUrl)
                        previewUrls.current.delete(activePerson.imageUrl)
                      }
                      const imageUrl = URL.createObjectURL(file)
                      previewUrls.current.add(imageUrl)
                      setPeople((items) =>
                        items.map((item) =>
                          item.id === activePerson.id
                            ? {
                                ...item,
                                imageKey,
                                imageUrl,
                                imageRevealAt: item.imageRevealAt ?? item.firstRevealAt,
                              }
                            : item,
                        ),
                      )
                      setIsDirty(true)
                    } catch (error) {
                      setNotice(error.message || '이미지 임시 저장에 실패했어요.')
                    }
                  }}
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
                  onClick={() => {
                    setSelectedTab(tab.id)
                    setEntryDraft(null)
                    setRelationDraft(null)
                  }}
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
              {selectedTab === 'ABILITY' ? (
                <div
                  aria-label="능력 표시 설정"
                  className="flex gap-1 text-caption text-text-muted"
                >
                  <button
                    aria-pressed={showAbilities}
                    className={showAbilities ? 'text-teal-strong' : ''}
                    onClick={() => setShowAbilities(true)}
                    type="button"
                  >
                    표시
                  </button>
                  <span aria-hidden="true">|</span>
                  <button
                    aria-pressed={!showAbilities}
                    className={!showAbilities ? 'text-teal-strong' : ''}
                    onClick={() => setShowAbilities(false)}
                    type="button"
                  >
                    숨김
                  </button>
                </div>
              ) : selectedTab !== 'RELATION' ? (
                <span className="text-caption text-text-muted">최신순</span>
              ) : null}
            </div>
            {selectedTab === 'RELATION' ? (
              <div className="mt-3 px-3">
                {relationDraft ? (
                  <form
                    className="space-y-2 rounded-lg bg-control-neutral p-3"
                    onSubmit={saveRelation}
                  >
                    <label className="flex items-center gap-2 text-caption text-text-secondary">
                      관계 유형
                      <select
                        className="h-9 flex-1 rounded-md bg-surface px-2 text-label"
                        onChange={(event) =>
                          setRelationDraft((draft) => ({ ...draft, type: event.target.value }))
                        }
                        value={relationDraft.type}
                      >
                        {relationTypes.map((type) => (
                          <option key={type}>{type}</option>
                        ))}
                      </select>
                    </label>
                    <select
                      aria-label="관계를 맺을 인물"
                      className="h-9 w-full rounded-md bg-surface px-2 text-label"
                      onChange={(event) =>
                        setRelationDraft((draft) => ({ ...draft, name: event.target.value }))
                      }
                      value={relationDraft.name}
                    >
                      <option value="">인물 선택</option>
                      {people
                        .filter((person) => person.id !== activePerson.id)
                        .map((person) => (
                          <option key={person.id} value={person.name}>
                            {person.name}
                          </option>
                        ))}
                    </select>
                    <label className="flex items-center gap-2 text-caption text-text-secondary">
                      공개 지점
                      <input
                        className="h-9 w-20 rounded-md bg-surface px-2 text-body"
                        inputMode="numeric"
                        max={positionValue}
                        min="1"
                        onChange={(event) =>
                          setRelationDraft((draft) => ({ ...draft, revealAt: event.target.value }))
                        }
                        type="number"
                        value={relationDraft.revealAt}
                      />
                      {positionUnitLabel}
                    </label>
                    <div className="flex justify-end gap-3 text-label">
                      <button
                        className="text-text-secondary"
                        onClick={() => setRelationDraft(null)}
                        type="button"
                      >
                        취소
                      </button>
                      <button className="font-medium text-teal-strong" type="submit">
                        저장
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    className="flex h-[37px] w-full items-center rounded-md bg-control-neutral px-3 text-left text-label text-text-secondary"
                    onClick={() =>
                      setRelationDraft({ name: '', type: '우호', revealAt: positionValue })
                    }
                    type="button"
                  >
                    인물 검색 <span className="ml-auto text-text-muted">추가 ＋</span>
                  </button>
                )}
                {relationTypes.map((relation, index) => {
                  const names = activePerson.relations?.[relation] ?? []
                  return (
                    <section
                      className={`mt-3 min-h-20 rounded-md transition-colors ${dropTargetType === relation ? 'bg-teal-selected/10 ring-2 ring-teal-selected' : ''}`}
                      key={relation}
                      onDragEnter={(event) => {
                        event.preventDefault()
                        setDropTargetType(relation)
                      }}
                      onDragLeave={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget))
                          setDropTargetType(null)
                      }}
                      onDragOver={(event) => {
                        event.preventDefault()
                        event.dataTransfer.dropEffect = 'move'
                      }}
                      onDrop={(event) => {
                        event.preventDefault()
                        setDropTargetType(null)
                        try {
                          const payload = JSON.parse(
                            event.dataTransfer.getData('application/x-nospo-relation'),
                          )
                          if (payload.personId === activePerson.id) {
                            moveRelation(payload.sourceType, payload.sourceIndex, relation)
                          }
                        } catch {
                          // Ignore drops that do not contain a relation row.
                        }
                      }}
                    >
                      <h4 className="mb-1 text-body font-bold">{relation}</h4>
                      <ul
                        className={`border-l pl-3 ${index === 0 ? 'border-teal-strong' : index === 1 ? 'border-red-destructive' : 'border-text-secondary'}`}
                      >
                        {names.map((relationEntry, itemIndex) => {
                          const name =
                            typeof relationEntry === 'string' ? relationEntry : relationEntry.name
                          const revealAt =
                            typeof relationEntry === 'string'
                              ? 0
                              : (relationEntry.revealAt ?? positionValue)
                          return (
                            <li
                              className="flex min-h-[60px] cursor-grab items-center gap-3 active:cursor-grabbing"
                              draggable
                              key={`${relation}-${itemIndex}`}
                              onDragStart={(event) => {
                                event.dataTransfer.effectAllowed = 'move'
                                event.dataTransfer.setData(
                                  'application/x-nospo-relation',
                                  JSON.stringify({
                                    personId: activePerson.id,
                                    sourceType: relation,
                                    sourceIndex: itemIndex,
                                  }),
                                )
                              }}
                            >
                              <span
                                className="size-10 shrink-0 rounded-full bg-teal-strong"
                                aria-hidden="true"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block text-body">{name}</span>
                                <span className="text-caption text-text-secondary">
                                  {revealAt ? `${revealAt}${positionUnitLabel}` : '공개 지점 미정'}
                                </span>
                              </span>
                              <div className="flex shrink-0 gap-2">
                                <button
                                  className="text-label text-teal-strong"
                                  onClick={() =>
                                    setRelationDraft({
                                      name,
                                      type: relation,
                                      originalType: relation,
                                      index: itemIndex,
                                      revealAt: revealAt || positionValue,
                                    })
                                  }
                                  type="button"
                                >
                                  편집
                                </button>
                                <button
                                  className="text-label text-red-destructive"
                                  onClick={() => deleteRelation(relation, itemIndex)}
                                  type="button"
                                >
                                  삭제
                                </button>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </section>
                  )
                })}
              </div>
            ) : (
              <>
                {entryDraft && (
                  <form
                    className="mx-3 mt-3 rounded-lg bg-control-neutral p-3"
                    onSubmit={saveEntry}
                  >
                    <label className="block text-caption text-text-secondary">
                      {selectedTab === 'ABILITY' ? '능력 이름' : '내용'}
                      <input
                        autoFocus
                        className="mt-1 h-10 w-full rounded-md bg-surface px-3 text-body"
                        maxLength={selectedTab === 'ABILITY' ? 100 : 1000}
                        onChange={(event) =>
                          setEntryDraft((draft) => ({ ...draft, title: event.target.value }))
                        }
                        placeholder="추가할 내용을 입력해주세요."
                        required
                        value={entryDraft.title}
                      />
                    </label>
                    {selectedTab === 'ABILITY' && (
                      <label className="mt-2 block text-caption text-text-secondary">
                        설명
                        <textarea
                          className="mt-1 min-h-16 w-full rounded-md bg-surface p-3 text-body"
                          maxLength={5000}
                          onChange={(event) =>
                            setEntryDraft((draft) => ({ ...draft, content: event.target.value }))
                          }
                          value={entryDraft.content}
                        />
                      </label>
                    )}
                    <label className="mt-2 flex items-center gap-2 text-caption text-text-secondary">
                      공개 지점
                      <input
                        className="h-9 w-20 rounded-md bg-surface px-2 text-body"
                        inputMode="numeric"
                        max={positionValue}
                        min="1"
                        onChange={(event) =>
                          setEntryDraft((draft) => ({ ...draft, revealAt: event.target.value }))
                        }
                        type="number"
                        value={entryDraft.revealAt}
                      />
                      {positionUnitLabel}
                    </label>
                    <div className="mt-2 flex justify-end gap-3 text-label">
                      <button
                        className="text-text-secondary"
                        onClick={() => setEntryDraft(null)}
                        type="button"
                      >
                        취소
                      </button>
                      <button className="font-medium text-teal-strong" type="submit">
                        저장
                      </button>
                    </div>
                  </form>
                )}
                {selectedTab === 'ABILITY' && !showAbilities ? (
                  <p className="mt-3 px-3 text-caption text-text-secondary">
                    능력과 기술을 숨기고 있어요.
                  </p>
                ) : (
                  <ul className="mt-3 px-3">
                    {getEntriesForTab(activePerson, selectedTab).length === 0 && !entryDraft && (
                      <li className="rounded-lg bg-canvas px-4 py-5 text-label text-text-secondary">
                        아직 등록한 내용이 없어요.
                      </li>
                    )}
                    {getEntriesForTab(activePerson, selectedTab)
                      .map((entry, index) => ({ entry, index }))
                      .sort(
                        (a, b) =>
                          Number(b.entry.revealAt || 0) - Number(a.entry.revealAt || 0) ||
                          a.index - b.index,
                      )
                      .map(({ entry, index }) => (
                        <li
                          className={`flex items-center gap-2 border-b border-border/50 ${selectedTab === 'ABILITY' ? 'min-h-[68px]' : 'min-h-[48px]'}`}
                          key={entry.id ?? `${entry.title}-${index}`}
                        >
                          {selectedTab === 'ABILITY' ? (
                            <>
                              <span className="shrink-0 text-label text-teal-strong">
                                Ⅱ {entry.title}
                              </span>
                              <span className="min-w-0 flex-1 text-caption text-text-secondary">
                                {entry.content}
                              </span>
                            </>
                          ) : (
                            <span className="min-w-0 flex-1 truncate text-body-sm">
                              {entry.title}
                            </span>
                          )}
                          <span className="shrink-0 text-caption-xs text-text-secondary">
                            {entry.revealAt}
                            {positionUnitLabel}
                          </span>
                          <button
                            className="text-label text-teal-strong"
                            onClick={() => setEntryDraft({ ...entry, index })}
                            type="button"
                          >
                            편집
                          </button>
                          <button
                            className="text-label text-red-destructive"
                            onClick={() => deleteEntry(index)}
                            type="button"
                          >
                            삭제
                          </button>
                        </li>
                      ))}
                  </ul>
                )}
              </>
            )}
            <button
              className="mt-3 min-h-11 w-full text-label text-text-secondary"
              onClick={() =>
                selectedTab === 'RELATION'
                  ? setRelationDraft({ name: '', type: '우호', revealAt: positionValue })
                  : setEntryDraft({ title: '', content: '', revealAt: positionValue })
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
          disabled={isSubmitting || isSubmitted}
          onClick={submitForReview}
          text={isSubmitted ? '제출 완료' : '검수 제출'}
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
          className="fixed inset-x-5 bottom-[145px] z-50 mx-auto max-w-[390px] rounded-lg bg-text-primary px-4 py-3 text-label text-white"
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
                  placeholder="검색어 입력"
                  value={query}
                />
              </div>
              {query.trim() && (
                <div className="mt-1 overflow-hidden rounded-md bg-control-neutral">
                  {organizations
                    .filter((organization) => organization.name.includes(query.trim()))
                    .map((organization) => (
                      <button
                        className="block min-h-9 w-full px-3 text-left text-body text-teal-strong hover:bg-teal-subtle"
                        key={organization.id ?? organization.name}
                        onClick={() => addOrganization(organization)}
                        type="button"
                      >
                        {organization.name}
                      </button>
                    ))}
                  {!organizations.some((organization) =>
                    organization.name.includes(query.trim()),
                  ) && (
                    <button
                      className="block min-h-9 w-full px-3 text-left text-body text-teal-strong"
                      onClick={() => addOrganization()}
                      type="button"
                    >
                      ‘{query.trim()}’ 검색어 사용
                    </button>
                  )}
                </div>
              )}
              {form.affiliation && (
                <button
                  className="mt-1 h-5 rounded-full bg-teal-selected px-2 text-caption-xs text-white"
                  onClick={() => updateField('affiliation', '')}
                  type="button"
                >
                  {form.affiliation} ×
                </button>
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
                max={positionValue}
                min="1"
                onChange={(event) => updateField('revealAt', event.target.value.replace(/\D/g, ''))}
                inputMode="numeric"
                pattern="[0-9]*"
                type="text"
                value={form.revealAt ?? form.firstRevealAt}
              />
              {positionUnitLabel}
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

      {positionDialogOpen && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-text-primary/35 px-9 py-8 backdrop-blur-[1.5px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPositionDialogOpen(false)
          }}
        >
          <form
            aria-labelledby="reading-position-title"
            aria-modal="true"
            className="w-full max-w-[318px] rounded-xl bg-surface p-6 shadow-xl"
            onSubmit={(event) => {
              event.preventDefault()
              const value = Number(positionInput)
              if (
                !Number.isInteger(value) ||
                value < 1 ||
                (maximumPosition && value > maximumPosition)
              ) {
                setNotice(
                  maximumPosition
                    ? `1부터 ${maximumPosition}까지 입력해 주세요.`
                    : '읽은 지점을 확인해 주세요.',
                )
                return
              }
              setPosition({ unit: positionUnitInput, value })
              setPositionUnit(positionUnitInput)
              setIsDirty(true)
              setPositionDialogOpen(false)
              setNotice('읽은 지점을 설정했어요.')
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-title font-bold" id="reading-position-title">
                읽은 지점 설정
              </h2>
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
              위키를 작성·수정할 때 발생할 수 있는 스포일러를 제한해요.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <img
                alt=""
                className="size-[52px] shrink-0 rounded-md object-cover"
                src={book.coverUrl || bookCoverPreview}
              />
              <div className="min-w-0">
                <p className="truncate text-body font-medium">{book.title || '선택한 도서'}</p>
                <p className="mt-1 truncate text-caption text-text-secondary">
                  {book.format || (positionUnitInput === 'EPISODE' ? '웹소설' : '종이책')}
                  {maximumPosition &&
                    ` · 전체 ${maximumPosition}${getPositionUnitLabel(positionUnitInput)}`}
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-center gap-2">
              <input
                aria-label="읽은 지점"
                autoFocus
                className="h-10 w-14 rounded-md bg-control-neutral text-center text-body"
                inputMode="numeric"
                max={maximumPosition}
                min="1"
                onChange={(event) => setPositionInput(event.target.value.replace(/\D/g, ''))}
                required
                type="text"
                value={positionInput}
              />
              <span className="text-text-muted">/</span>
              <span className="min-w-14 rounded-md bg-control-neutral px-2 py-2 text-center text-body text-text-secondary">
                {maximumPosition ?? '—'}
              </span>
              <span aria-label="진도 단위" className="min-w-8 text-center text-body">
                {positionUnitInput === 'PAGE' ? '쪽' : '화'}
              </span>
            </div>
            <Button
              className="mt-5 rounded-lg font-bold"
              height="38px"
              text={isWikiCreation ? '위키 생성' : '위키 수정'}
              textStyle="body"
              type="submit"
            />
          </form>
        </div>
      )}
    </div>
  )
}

export default WikiRegisterPersonPage
