import { describe, expect, it } from 'vitest'
import {
  GROUP_NAME_MAX_LENGTH,
  MILESTONE_MAX_LENGTH,
  composeGroups,
  formatSubmittedLabel,
  getReflectedLabel,
  getReviewStepId,
  getGroupDetailPath,
  getPersonRegisterPath,
  getUnlockLabel,
  validateGroupName,
  validateMilestoneContent,
  validateUnlockEpisode,
} from './utils'

describe('getGroupDetailPath', () => {
  it('단체 식별자를 쿼리로 붙인 상세 화면 주소를 만든다', () => {
    expect(getGroupDetailPath('g1')).toBe('/wiki/register/group/detail?groupId=g1')
  })

  it('숫자 식별자도 문자열로 전달한다', () => {
    expect(getGroupDetailPath(7)).toBe('/wiki/register/group/detail?groupId=7')
  })

  it('모드를 주면 쿼리에 함께 붙인다', () => {
    expect(getGroupDetailPath('g1', 'edit')).toBe(
      '/wiki/register/group/detail?groupId=g1&mode=edit',
    )
  })

  it('주소를 깨뜨릴 수 있는 문자는 인코딩한다', () => {
    expect(getGroupDetailPath('a&b=c')).toBe('/wiki/register/group/detail?groupId=a%26b%3Dc')
  })
})

describe('validateGroupName', () => {
  it('올바른 이름이면 빈 문자열을 돌려준다', () => {
    expect(validateGroupName('그리핀도르', ['래번클로'])).toBe('')
  })

  it.each(['', '   '])('비어 있거나 공백뿐이면(%j) 필수 안내를 돌려준다', (name) => {
    expect(validateGroupName(name)).toBe('단체 이름을 입력해 주세요.')
  })

  it('길이 제한을 넘으면 안내를 돌려준다', () => {
    const tooLong = 'a'.repeat(GROUP_NAME_MAX_LENGTH + 1)

    expect(validateGroupName(tooLong)).toContain(`${GROUP_NAME_MAX_LENGTH}자 이하`)
  })

  it('길이 제한과 같은 길이는 허용한다', () => {
    expect(validateGroupName('a'.repeat(GROUP_NAME_MAX_LENGTH))).toBe('')
  })

  it('앞뒤 공백과 대소문자를 무시하고 중복을 막는다', () => {
    expect(validateGroupName('  Ravenclaw ', ['ravenclaw'])).toBe('이미 있는 단체 이름이에요.')
  })
})

describe('validateUnlockEpisode', () => {
  it('범위 안의 정수면 빈 문자열을 돌려준다', () => {
    expect(validateUnlockEpisode('2', { max: 32 })).toBe('')
    expect(validateUnlockEpisode(32, { max: 32 })).toBe('')
  })

  it('비어 있으면 필수 안내를 돌려준다', () => {
    expect(validateUnlockEpisode('')).toBe('등장 회차를 입력해 주세요.')
  })

  it.each(['0', '-1', '1.5', 'abc', '1e3'])(
    '1 이상의 정수가 아니면(%s) 안내를 돌려준다',
    (value) => {
      expect(validateUnlockEpisode(value)).toBe('1 이상의 숫자로 입력해 주세요.')
    },
  )

  it('읽은 진도를 넘으면 단위와 함께 안내한다', () => {
    expect(validateUnlockEpisode('33', { max: 32 })).toBe('32화 이하로 입력해 주세요.')
    expect(validateUnlockEpisode('9', { max: 8, unit: '장' })).toBe('8장 이하로 입력해 주세요.')
  })

  it('읽은 진도를 모르면 상한을 검사하지 않는다', () => {
    expect(validateUnlockEpisode('999')).toBe('')
  })
})

describe('validateMilestoneContent', () => {
  it('올바른 내용이면 빈 문자열을 돌려준다', () => {
    expect(validateMilestoneContent('폭풍을 피해 새로운 항로를 제안')).toBe('')
  })

  it.each(['', '  '])('비어 있거나 공백뿐이면(%j) 필수 안내를 돌려준다', (content) => {
    expect(validateMilestoneContent(content)).toBe('행적 내용을 입력해 주세요.')
  })

  it('길이 제한을 넘으면 안내를 돌려준다', () => {
    expect(validateMilestoneContent('a'.repeat(MILESTONE_MAX_LENGTH + 1))).toContain(
      `${MILESTONE_MAX_LENGTH}자 이하`,
    )
  })
})

describe('composeGroups', () => {
  const groups = [{ id: 'g1' }, { id: 'g2' }, { id: 'g3' }]

  it('삭제한 서버 단체를 빼고 추가한 초안을 뒤에 붙인다', () => {
    expect(composeGroups(groups, [{ id: 'draft-1' }], ['g2'])).toEqual([
      { id: 'g1' },
      { id: 'g3' },
      { id: 'draft-1' },
    ])
  })

  it('추가·삭제가 없으면 서버 목록을 그대로 돌려준다', () => {
    expect(composeGroups(groups)).toEqual(groups)
  })

  it('원본 목록을 바꾸지 않는다', () => {
    composeGroups(groups, [], ['g1'])

    expect(groups).toHaveLength(3)
  })
})

describe('검수 진행 문구', () => {
  it.each([
    ['PENDING_REVIEW', 'submit'],
    ['REJECTED', 'review'],
    ['APPROVED', 'done'],
    ['UNKNOWN', 'submit'],
    [undefined, 'submit'],
  ])('검수 상태 %s의 현재 단계는 %s다', (status, stepId) => {
    expect(getReviewStepId(status)).toBe(stepId)
  })

  it('제출 일시에서 날짜 부분만 꺼내 제출 문구를 만든다', () => {
    expect(formatSubmittedLabel('2026-10-01T09:30:00+09:00')).toBe('2026.10.01 제출')
    expect(formatSubmittedLabel('2026-12-31T23:59:59Z')).toBe('2026.12.31 제출')
    expect(formatSubmittedLabel()).toBeUndefined()
  })

  it('반영한 진도 문구를 만든다', () => {
    expect(getReflectedLabel({ reflectedEpisode: 32 })).toBe('32화까지 반영')
    expect(getReflectedLabel({ reflectedEpisode: 7, episodeUnit: '장' })).toBe('7장까지 반영')
    expect(getReflectedLabel({})).toBeUndefined()
    expect(getReflectedLabel()).toBeUndefined()
  })
})

describe('getPersonRegisterPath', () => {
  it('판본 식별자가 있으면 쿼리로 함께 넘긴다', () => {
    expect(getPersonRegisterPath('e1')).toBe('/wiki/register/person?editionId=e1')
  })

  it.each([null, undefined, ''])('판본 식별자가 없으면(%j) 주소만 돌려준다', (editionId) => {
    expect(getPersonRegisterPath(editionId)).toBe('/wiki/register/person')
  })
})

describe('getUnlockLabel', () => {
  it('서버가 준 문구가 있으면 그대로 쓴다', () => {
    expect(getUnlockLabel({ unlockLabel: '2권 7장', unlockEpisode: 3 })).toBe('2권 7장')
  })

  it('문구가 없으면 숫자와 단위로 만든다', () => {
    expect(getUnlockLabel({ unlockEpisode: 12 })).toBe('12화')
    expect(getUnlockLabel({ unlockEpisode: 7 }, '장')).toBe('7장')
  })

  it('해금 시점 정보가 없으면 undefined를 돌려준다', () => {
    expect(getUnlockLabel({})).toBeUndefined()
  })
})
