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
 * @param {'view' | 'edit'} [mode] 상세 화면 모드. 생략하면 쿼리에 붙이지 않는다(보기).
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
 * 인물 등록 화면으로 이동하는 주소를 만든다. 판본 식별자가 있으면 쿼리로 함께 넘긴다.
 *
 * @param {string | null} [editionId] 현재 보고 있는 도서 판본 식별자
 * @returns {string} 예: `/wiki/register/person?editionId=e1`
 */
export const getPersonRegisterPath = (editionId) =>
  editionId
    ? `${ROUTES.WIKI_REGISTER_PERSON}?${new URLSearchParams({ editionId })}`
    : ROUTES.WIKI_REGISTER_PERSON
