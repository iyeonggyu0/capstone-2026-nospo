import { ROUTES } from '@/constants/routes'
import { REVIEW_STATUS_STEP, REVIEW_STEPS } from './constants'

/** 단체 이름 최대 글자 수다. */
export const GROUP_NAME_MAX_LENGTH = 30
/** 주요 행적 내용 최대 글자 수다. */
export const MILESTONE_MAX_LENGTH = 100

/**
 * 단체 상세 화면으로 이동하는 주소를 만든다.
 * 단체 식별자는 쿼리(`?groupId=`)로, 모드는 `?mode=`로 전달하고, 특수문자는 안전하게 인코딩한다.
 *
 * @param {string | number} groupId 상세 화면에서 보여줄 단체 식별자
 * @param {'view' | 'edit'} [mode] 상세 화면 모드. 생략하면 쿼리에 붙이지 않으며, 화면은 편집 모드로 연다. 보기만 하려면 `view`를 준다.
 * @returns {string} 예: `/wiki/register/group/detail?groupId=g1&mode=edit`
 */
export const getGroupDetailPath = (groupId, mode) => {
  const params = new URLSearchParams({ groupId: String(groupId) })
  if (mode) params.set('mode', mode)

  return `${ROUTES.WIKI_REGISTER_GROUP_DETAIL}?${params}`
}

/**
 * 단체 이름 입력값을 검사한다. 이름은 필수이며 길이 제한이 있고, 이미 있는 이름과 같으면 안 된다.
 *
 * @param {string} name 입력한 단체 이름
 * @param {string[]} [existingNames=[]] 이미 목록에 있는 단체 이름
 * @returns {string} 오류 문구. 문제가 없으면 빈 문자열
 */
export const validateGroupName = (name, existingNames = []) => {
  const trimmed = name.trim()

  if (!trimmed) return '단체 이름을 입력해 주세요.'
  if (trimmed.length > GROUP_NAME_MAX_LENGTH) {
    return `단체 이름은 ${GROUP_NAME_MAX_LENGTH}자 이하로 입력해 주세요.`
  }

  const isDuplicate = existingNames.some(
    (existing) => existing.trim().toLowerCase() === trimmed.toLowerCase(),
  )
  if (isDuplicate) return '이미 있는 단체 이름이에요.'

  return ''
}

/**
 * 등장 회차 입력값을 검사한다. 1 이상의 정수여야 하고, 읽은 진도보다 클 수 없다.
 *
 * @param {string | number} value 입력한 등장 회차
 * @param {{ max?: number, unit?: string }} [options] `max`는 읽은 진도, `unit`은 진도 단위 (기본 화)
 * @returns {string} 오류 문구. 문제가 없으면 빈 문자열
 */
export const validateUnlockEpisode = (value, { max, unit = '화' } = {}) => {
  const text = String(value).trim()

  if (!text) return '등장 회차를 입력해 주세요.'
  if (!/^\d+$/.test(text) || Number(text) < 1) return '1 이상의 숫자로 입력해 주세요.'
  if (max != null && Number(text) > max) return `${max}${unit} 이하로 입력해 주세요.`

  return ''
}

/**
 * 주요 행적 내용 입력값을 검사한다. 내용은 필수이며 길이 제한이 있다.
 *
 * @param {string} content 입력한 행적 내용
 * @returns {string} 오류 문구. 문제가 없으면 빈 문자열
 */
export const validateMilestoneContent = (content) => {
  const trimmed = content.trim()

  if (!trimmed) return '행적 내용을 입력해 주세요.'
  if (trimmed.length > MILESTONE_MAX_LENGTH) {
    return `행적은 ${MILESTONE_MAX_LENGTH}자 이하로 입력해 주세요.`
  }

  return ''
}

/**
 * 구성원·행적 같은 항목의 해금 시점 문구를 만든다.
 * 서버가 준 문구(`unlockLabel`)가 있으면 그대로 쓰고, 없으면 숫자(`unlockEpisode`)와 단위로 만든다.
 *
 * @param {{ unlockLabel?: string, unlockEpisode?: number }} item 해금 시점 정보를 가진 항목
 * @param {string} [unit='화'] 진도 단위
 * @returns {string | undefined} 예: `12화`. 정보가 없으면 undefined
 */
export const getUnlockLabel = (item, unit = '화') => {
  if (item.unlockLabel) return item.unlockLabel

  return item.unlockEpisode != null ? `${item.unlockEpisode}${unit}` : undefined
}

/**
 * 서버에서 받은 단체 목록에서 삭제한 단체를 빼고, 사용자가 추가한 초안 단체를 뒤에 붙인다.
 *
 * @param {Array<{ id: string }>} groups 서버에서 받은 단체 목록
 * @param {Array<{ id: string }>} [addedGroups=[]] 사용자가 추가한 초안 단체
 * @param {string[]} [removedIds=[]] 사용자가 삭제한 서버 단체 식별자
 * @returns {Array} 화면에 보여줄 단체 목록
 */
export const composeGroups = (groups, addedGroups = [], removedIds = []) => [
  ...groups.filter((group) => !removedIds.includes(group.id)),
  ...addedGroups,
]

/**
 * 검수 상태(서버 값)에 해당하는 현재 단계의 식별자를 돌려준다. 모르는 상태는 첫 단계(제출)로 본다.
 *
 * @param {string} [status] 검수 상태 (예: PENDING_REVIEW)
 * @returns {string} 단계 식별자 (submit, review, done)
 */
export const getReviewStepId = (status) => REVIEW_STATUS_STEP[status] ?? REVIEW_STEPS[0].id

/**
 * 제출 일시에서 `2026.10.01 제출` 같은 문구를 만든다. 시간대에 따라 날짜가 바뀌지 않도록 날짜 부분만 쓴다.
 *
 * @param {string} [submittedAt] ISO 형식의 제출 일시 (예: 2026-10-01T09:30:00+09:00)
 * @returns {string | undefined} 제출 문구. 값이 없으면 undefined
 */
export const formatSubmittedLabel = (submittedAt) =>
  submittedAt ? `${submittedAt.slice(0, 10).replaceAll('-', '.')} 제출` : undefined

/**
 * 도서에서 위키를 반영한 진도 문구를 만든다.
 *
 * @param {{ reflectedEpisode?: number, episodeUnit?: string }} [book] 도서 정보
 * @returns {string | undefined} 예: `32화까지 반영`. 값이 없으면 undefined
 */
export const getReflectedLabel = ({ reflectedEpisode, episodeUnit = '화' } = {}) =>
  reflectedEpisode != null ? `${reflectedEpisode}${episodeUnit}까지 반영` : undefined

/**
 * 인물 등록 화면으로 이동하는 주소를 만든다. 도서 식별자가 있으면 인물 화면이 읽는 이름(`bookId`)의 쿼리로 함께 넘긴다.
 *
 * @param {string | null} [bookId] 현재 보고 있는 도서 식별자
 * @returns {string} 예: `/wiki/register/person?bookId=b1`
 */
export const getPersonRegisterPath = (bookId) =>
  bookId
    ? `${ROUTES.WIKI_REGISTER_PERSON}?${new URLSearchParams({ bookId })}`
    : ROUTES.WIKI_REGISTER_PERSON

/** 위키 작성 방식이다. `CREATE`는 새 위키 만들기, `UPDATE`는 기존 위키 고치기다. */
const WIKI_MODES = ['CREATE', 'UPDATE']

/**
 * 진도 값에서 읽은 회차 숫자를 꺼낸다. 숫자면 그대로, `{ value }` 같은 객체면 그 안의 값을 돌려준다.
 *
 * @param {number | { value?: number, positionValue?: number } | null} [position] 진도
 * @returns {number | undefined} 읽은 회차. 알 수 없으면 undefined
 */
export const getPositionValue = (position) => {
  const value =
    position && typeof position === 'object'
      ? Number(position.value ?? position.positionValue)
      : Number(position)

  return Number.isFinite(value) && value > 0 ? value : undefined
}

/**
 * 화면 이동 때 넘긴 값(`location.state`)과 주소 쿼리에서 도서·진도·작성 방식을 읽는다.
 * 인물 등록 화면과 같은 이름(`bookId`, `position`, `mode`, `book`)을 쓰고, 이동 값이 쿼리보다 우선한다.
 * 예전 쿼리 이름 `editionId`도 도서 식별자로 받아 준다. 쿼리의 `mode`는 `CREATE`·`UPDATE`만 작성 방식으로 보고, `view`·`edit`는 화면 모드라 무시한다.
 *
 * @param {object} [input] 입력
 * @param {{ bookId?: string, position?: number | object, mode?: string, book?: object } | null} [input.state] `location.state`
 * @param {URLSearchParams} [input.searchParams] 주소 쿼리
 * @returns {{ bookId: string | null, position?: number | object, wikiMode?: 'CREATE' | 'UPDATE', book?: object }} 읽은 값
 */
export const readWikiContext = ({ state, searchParams } = {}) => {
  const queryMode = searchParams?.get('mode')?.toUpperCase()
  const wikiMode = [state?.mode, queryMode].find((mode) => WIKI_MODES.includes(mode))

  return {
    bookId: state?.bookId ?? searchParams?.get('bookId') ?? searchParams?.get('editionId') ?? null,
    position: state?.position ?? getPositionValue(searchParams?.get('position')),
    wikiMode,
    book: state?.book,
  }
}

/**
 * 읽은 도서·진도·작성 방식을 다른 화면(인물 등록, 단체 상세)으로 이동할 때 넘길 `state`로 바꾼다. 값이 없는 항목은 빼며, 이름은 인물 등록 화면이 읽는 것과 같다.
 *
 * @param {{ bookId?: string | null, position?: number | object, wikiMode?: string, book?: object }} [context] `readWikiContext`가 읽은 값
 * @returns {{ mode?: string, book?: object, bookId?: string, position?: number | object }} 이동 `state`
 */
export const toWikiNavigationState = ({ bookId, position, wikiMode, book } = {}) =>
  Object.fromEntries(
    Object.entries({ mode: wikiMode, book, bookId, position }).filter(([, value]) => value != null),
  )

/**
 * 이동 때 넘어온 진도가 있으면, 서버가 준 도서 정보의 현재 진도와 안내 문구를 그 진도로 바꾼다.
 * 서버가 준 문구는 서버의 진도 기준이라, 사용자가 정한 진도와 어긋나지 않게 같은 값으로 다시 만든다.
 *
 * @param {{ episodeUnit?: string } | undefined} book 서버가 준 도서 정보
 * @param {{ position?: number | object, wikiMode?: string }} [context] 읽은 진도와 작성 방식
 * @returns {object | undefined} 진도를 반영한 도서 정보. 진도가 없으면 받은 도서 정보 그대로
 */
export const applyWikiContext = (book, { position, wikiMode } = {}) => {
  const value = getPositionValue(position)
  if (!book || value == null) return book

  const unit = book.episodeUnit ?? '화'
  const label =
    position?.volume && position?.chapter
      ? `${position.volume}권 ${position.chapter}장`
      : `${value}${unit}`

  return {
    ...book,
    currentEpisode: value,
    progressLabel: `${label}까지 읽음`,
    editLabel: `${label} ${wikiMode === 'CREATE' ? '등록' : '수정'}`,
  }
}

/**
 * 검수 진행 화면으로 이동하는 주소를 만든다. 신청 식별자가 없으면 검수 목록 주소를 돌려준다.
 *
 * @param {string | null} [reviewId] 검수 신청 식별자
 * @returns {string} 예: `/wiki/reviews/r1`
 */
export const getReviewProgressPath = (reviewId) =>
  reviewId
    ? ROUTES.WIKI_REVIEW_PROGRESS.replace(':reviewId', encodeURIComponent(reviewId))
    : ROUTES.WIKI_REVIEW_LIST

/**
 * 인물 목록에서 구성원으로 추가할 수 있는 후보만 돌려준다.
 * 이미 구성원인 인물과, 현재 진도보다 뒤에 등장하는 인물(미해금)은 뺀다. 등장 회차를 모르는 인물은 서버가 이미 거른 것으로 보고 남긴다.
 *
 * @param {Array<{ id: string, unlockEpisode?: number }>} [persons=[]] 인물 목록
 * @param {Array<{ id: string }>} [members=[]] 현재 구성원 목록
 * @param {number} [maxEpisode] 현재 진도(읽은 회차). 없으면 진도로는 거르지 않는다.
 * @returns {Array} 구성원으로 추가할 수 있는 인물 목록
 */
export const getMemberCandidates = (persons = [], members = [], maxEpisode) =>
  persons.filter(
    (person) =>
      !members.some((member) => member.id === person.id) &&
      (maxEpisode == null || person.unlockEpisode == null || person.unlockEpisode <= maxEpisode),
  )

/**
 * 검색어와 이름이 같은 인물을 찾는다. 앞뒤 공백과 대소문자는 무시한다.
 *
 * @param {Array<{ name: string }>} [persons=[]] 인물 목록
 * @param {string} [query=''] 검색어
 * @returns {object | undefined} 이름이 같은 인물. 없거나 검색어가 비어 있으면 undefined
 */
export const findPersonByName = (persons = [], query = '') => {
  const key = query.trim().toLowerCase()

  return key ? persons.find((person) => person.name.trim().toLowerCase() === key) : undefined
}

/**
 * 목록에서 한 항목을 빼서 원하는 위치로 옮긴 새 배열을 만든다. 원본 배열은 바꾸지 않는다.
 *
 * @param {Array<{ id: string }>} items 항목 목록
 * @param {string} id 옮길 항목 식별자
 * @param {number} toIndex 항목을 뺀 뒤의 목록 기준 새 위치. 범위를 벗어나면 처음이나 끝으로 맞춘다.
 * @returns {Array} 순서를 바꾼 목록. 없는 식별자면 원본을 그대로 돌려준다.
 */
export const moveItem = (items, id, toIndex) => {
  const item = items.find((candidate) => candidate.id === id)
  if (!item) return items

  const rest = items.filter((candidate) => candidate.id !== id)
  const index = Math.max(0, Math.min(toIndex, rest.length))

  return [...rest.slice(0, index), item, ...rest.slice(index)]
}

/**
 * 관계 단체 하나를 같은 구역 안이나 다른 구역(우호·대립·중립)의 원하는 위치로 옮긴다.
 *
 * @param {{ friendly?: Array, hostile?: Array, neutral?: Array }} relations 관계별 단체 목록
 * @param {string} id 옮길 단체 식별자
 * @param {string} toType 옮겨 갈 구역 (friendly, hostile, neutral)
 * @param {number} toIndex 단체를 뺀 뒤의 구역 기준 새 위치. 범위를 벗어나면 처음이나 끝으로 맞춘다.
 * @returns {object} 옮긴 뒤의 관계 목록. 없는 식별자면 원본을 그대로 돌려준다.
 */
export const moveRelationItem = (relations, id, toType, toIndex) => {
  const item = Object.values(relations)
    .flat()
    .find((candidate) => candidate.id === id)
  if (!item) return relations

  const rest = Object.fromEntries(
    Object.entries(relations).map(([type, groups]) => [
      type,
      groups.filter((candidate) => candidate.id !== id),
    ]),
  )
  const target = rest[toType] ?? []
  const index = Math.max(0, Math.min(toIndex, target.length))

  return { ...rest, [toType]: [...target.slice(0, index), item, ...target.slice(index)] }
}

/**
 * 주요 행적을 해금 시점이 큰(최신) 순서로 정렬한 새 배열을 만든다. 같은 시점은 원래 순서를 지킨다.
 *
 * @param {Array<{ unlockEpisode?: number }>} milestones 행적 목록
 * @returns {Array} 최신 순으로 정렬한 목록
 */
export const sortMilestonesLatest = (milestones) =>
  [...milestones].sort((a, b) => (b.unlockEpisode ?? 0) - (a.unlockEpisode ?? 0))

/**
 * 새 행적을 해금 시점 순서에 맞는 위치에 끼워 넣는다. 사용자가 직접 바꾼 기존 순서는 건드리지 않는다.
 *
 * @param {Array<{ unlockEpisode?: number }>} milestones 현재 행적 목록
 * @param {{ unlockEpisode?: number }} milestone 추가할 행적
 * @returns {Array} 행적을 추가한 목록. 해금 시점이 더 작은 첫 행적 바로 앞에 들어간다.
 */
export const insertMilestoneLatest = (milestones, milestone) => {
  const index = milestones.findIndex(
    (candidate) => (candidate.unlockEpisode ?? 0) < (milestone.unlockEpisode ?? 0),
  )
  if (index === -1) return [...milestones, milestone]

  return [...milestones.slice(0, index), milestone, ...milestones.slice(index)]
}

/** 관계 구역(우호·대립·중립)의 데이터 키 목록이다. */
const RELATION_TYPES = ['friendly', 'hostile', 'neutral']

/**
 * 서버 목록과 지금 목록을 비교해, 순서(식별자 목록)와 사용자가 새로 만든 항목, 지운 서버 항목의 식별자만 뽑는다.
 * 서버가 준 항목의 내용은 담지 않는다.
 */
const diffList = (baseItems, currentItems) => {
  const baseIds = new Set(baseItems.map((item) => item.id))
  const currentIds = new Set(currentItems.map((item) => item.id))

  return {
    order: currentItems.map((item) => item.id),
    added: currentItems.filter((item) => !baseIds.has(item.id)),
    removed: baseItems.filter((item) => !currentIds.has(item.id)).map((item) => item.id),
  }
}

/**
 * 서버 목록 위에 `diffList`가 뽑은 편집을 적용한다. 편집이 없거나 모양이 맞지 않으면 서버 목록을 그대로 돌려준다.
 * 편집한 뒤 서버에 새로 생긴 항목(순서에도 없고 지운 것도 아닌 항목)은 목록 끝에 붙인다.
 */
const applyList = (baseItems, edit) => {
  if (!Array.isArray(edit?.order)) return baseItems

  const lookup = new Map([...baseItems, ...(edit.added ?? [])].map((item) => [item.id, item]))
  const known = new Set(edit.order)
  const gone = new Set(edit.removed ?? [])
  const ordered = edit.order.map((id) => lookup.get(id)).filter(Boolean)
  const fresh = baseItems.filter((item) => !known.has(item.id) && !gone.has(item.id))

  return [...ordered, ...fresh]
}

/**
 * 서버에 있는 단체의 상세(구성원·관계·주요 행적)에서 사용자가 편집한 부분만 뽑는다.
 * 서버 데이터를 브라우저 저장소에 그대로 복사해 두지 않기 위한 것으로, 서버 항목은 식별자(순서)만 남고
 * 새로 추가한 항목과 고친 행적의 내용만 담긴다.
 *
 * @param {{ members?: Array, relations?: object, milestones?: Array }} base 서버가 준 단체 상세
 * @param {{ members: Array, relations: object, milestones: Array }} current 지금 편집 중인 단체 상세
 * @returns {{ members: object, relations: object, milestones: object }} 편집한 부분
 */
export const toDetailEdit = (base, current) => {
  const baseRelations = base?.relations ?? {}
  const currentRelations = current.relations ?? {}
  const relationDiff = diffList(
    Object.values(baseRelations).flat(),
    Object.values(currentRelations).flat(),
  )
  const baseMilestones = new Map((base?.milestones ?? []).map((item) => [item.id, item]))

  return {
    members: diffList(base?.members ?? [], current.members),
    relations: {
      order: Object.fromEntries(
        Object.entries(currentRelations).map(([type, items]) => [
          type,
          items.map((item) => item.id),
        ]),
      ),
      added: relationDiff.added,
      removed: relationDiff.removed,
    },
    milestones: {
      ...diffList(base?.milestones ?? [], current.milestones),
      changed: Object.fromEntries(
        current.milestones
          .filter((item) => {
            const original = baseMilestones.get(item.id)
            return (
              original &&
              (original.content !== item.content || original.unlockEpisode !== item.unlockEpisode)
            )
          })
          .map((item) => [item.id, { content: item.content, unlockEpisode: item.unlockEpisode }]),
      ),
    },
  }
}

/**
 * 서버가 준 단체 상세 위에 `toDetailEdit`이 뽑은 편집을 적용해 편집 중이던 상세를 되살린다.
 * 편집이 없거나 모양이 맞지 않으면 서버 상세를 그대로 돌려준다.
 *
 * @param {{ members?: Array, relations?: object, milestones?: Array }} base 서버가 준 단체 상세
 * @param {object | undefined} edit `toDetailEdit`의 결과
 * @returns {{ members: Array, relations: object, milestones: Array }} 편집을 적용한 단체 상세
 */
export const applyDetailEdit = (base, edit) => {
  const baseRelations = base?.relations ?? {}
  const flatBaseRelations = Object.values(baseRelations).flat()
  const relationEdit = edit?.relations
  let relations = baseRelations

  if (relationEdit?.order && typeof relationEdit.order === 'object') {
    const lookup = new Map(
      [...flatBaseRelations, ...(relationEdit.added ?? [])].map((item) => [item.id, item]),
    )
    const known = new Set(Object.values(relationEdit.order).flat())
    const gone = new Set(relationEdit.removed ?? [])
    relations = Object.fromEntries(
      RELATION_TYPES.concat(Object.keys(relationEdit.order))
        .filter((type, index, types) => types.indexOf(type) === index)
        .map((type) => [
          type,
          [
            ...(relationEdit.order[type] ?? []).map((id) => lookup.get(id)).filter(Boolean),
            ...(baseRelations[type] ?? []).filter(
              (item) => !known.has(item.id) && !gone.has(item.id),
            ),
          ],
        ])
        .filter(([, items]) => items.length > 0),
    )
  }

  const changed = edit?.milestones?.changed ?? {}
  const milestones = applyList(base?.milestones ?? [], edit?.milestones).map((item) =>
    changed[item.id] ? { ...item, ...changed[item.id], unlockLabel: undefined } : item,
  )

  return {
    members: applyList(base?.members ?? [], edit?.members),
    relations,
    milestones,
  }
}

/**
 * 편집한 부분이 하나도 없는지 확인한다. 서버 상세와 같은 상태로 되돌려 놓은 임시 저장은 저장할 필요가 없다.
 *
 * @param {{ members: object, relations: object, milestones: object }} edit `toDetailEdit`의 결과
 * @param {{ members?: Array, relations?: object, milestones?: Array }} base 서버가 준 단체 상세
 * @returns {boolean} 서버 상세와 순서까지 같으면 true
 */
export const isEmptyDetailEdit = (edit, base) =>
  JSON.stringify(applyDetailEdit(base, edit)) ===
  JSON.stringify({
    members: base?.members ?? [],
    relations: Object.fromEntries(
      Object.entries(base?.relations ?? {}).filter(([, items]) => items.length > 0),
    ),
    // 상세 화면은 행적을 처음에 최신순으로 정렬해 보여주므로, 손대지 않은 상태의 기준도 최신순이다.
    milestones: sortMilestonesLatest(base?.milestones ?? []),
  })
