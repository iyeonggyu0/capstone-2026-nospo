import { describe, expect, it } from 'vitest'
import {
  GROUP_NAME_MAX_LENGTH,
  MILESTONE_MAX_LENGTH,
  applyWikiContext,
  composeGroups,
  findPersonByName,
  formatSubmittedLabel,
  getMaxDraftNumber,
  splitByProgress,
  withHiddenItems,
  hideRelatedMemberCounts,
  getMemberCandidates,
  getPositionValue,
  getReflectedLabel,
  getReviewStepId,
  getGroupDetailPath,
  getPersonRegisterPath,
  getReviewProgressPath,
  getUnlockLabel,
  insertMilestoneLatest,
  moveItem,
  moveRelationItem,
  readWikiContext,
  sortMilestonesLatest,
  toWikiNavigationState,
  applyDetailEdit,
  filterUnlocked,
  getGroupViewDetailPath,
  isEmptyDetailEdit,
  toDetailEdit,
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
  it('도서 식별자가 있으면 인물 화면이 읽는 이름(bookId)의 쿼리로 함께 넘긴다', () => {
    expect(getPersonRegisterPath('b1')).toBe('/wiki/register/person?bookId=b1')
  })

  it.each([null, undefined, ''])('도서 식별자가 없으면(%j) 주소만 돌려준다', (bookId) => {
    expect(getPersonRegisterPath(bookId)).toBe('/wiki/register/person')
  })
})

describe('getPositionValue', () => {
  it('숫자는 그대로, 객체는 value(또는 positionValue)를 돌려준다', () => {
    expect(getPositionValue(32)).toBe(32)
    expect(getPositionValue('32')).toBe(32)
    expect(getPositionValue({ unit: 'EPISODE', value: 7 })).toBe(7)
    expect(getPositionValue({ positionValue: 5 })).toBe(5)
  })

  it.each([undefined, null, '', 0, -1, 'abc', {}])('알 수 없는 값(%j)은 undefined다', (value) => {
    expect(getPositionValue(value)).toBeUndefined()
  })
})

describe('readWikiContext', () => {
  const query = (text) => new URLSearchParams(text)

  it('이동 때 넘긴 값(state)을 인물 화면과 같은 이름으로 읽는다', () => {
    const state = { mode: 'CREATE', bookId: 'b1', position: 32, book: { title: '책' } }

    expect(readWikiContext({ state, searchParams: query('') })).toEqual({
      bookId: 'b1',
      position: 32,
      wikiMode: 'CREATE',
      book: { title: '책' },
    })
  })

  it('state가 없으면 쿼리(bookId, position, mode)에서 읽는다', () => {
    const context = readWikiContext({ searchParams: query('bookId=b2&position=12&mode=update') })

    expect(context).toMatchObject({ bookId: 'b2', position: 12, wikiMode: 'UPDATE' })
  })

  it('state가 쿼리보다 우선하고, 예전 쿼리 이름 editionId도 도서 식별자로 받는다', () => {
    expect(
      readWikiContext({ state: { bookId: 'b1' }, searchParams: query('bookId=b2') }).bookId,
    ).toBe('b1')
    expect(readWikiContext({ searchParams: query('editionId=e1') }).bookId).toBe('e1')
  })

  it('쿼리의 mode가 view·edit(화면 모드)이면 작성 방식으로 보지 않는다', () => {
    expect(readWikiContext({ searchParams: query('mode=view') }).wikiMode).toBeUndefined()
    expect(readWikiContext({ searchParams: query('mode=edit') }).wikiMode).toBeUndefined()
  })

  it('아무 값도 없으면 도서 식별자는 null이고 나머지는 비어 있다', () => {
    expect(readWikiContext()).toEqual({
      bookId: null,
      position: undefined,
      wikiMode: undefined,
      book: undefined,
    })
  })
})

describe('toWikiNavigationState', () => {
  it('값이 있는 항목만 인물 화면이 읽는 이름으로 담는다', () => {
    expect(
      toWikiNavigationState({ bookId: 'b1', position: 32, wikiMode: 'CREATE', book: { id: 1 } }),
    ).toEqual({ mode: 'CREATE', book: { id: 1 }, bookId: 'b1', position: 32 })
    expect(toWikiNavigationState({ bookId: 'b1', wikiMode: undefined })).toEqual({ bookId: 'b1' })
    expect(toWikiNavigationState()).toEqual({})
  })
})

describe('applyWikiContext', () => {
  const book = {
    title: '책',
    currentEpisode: 32,
    progressLabel: '32화까지 읽음',
    editLabel: '32화 수정',
    episodeUnit: '화',
  }

  it('넘어온 진도로 현재 진도와 안내 문구를 다시 만든다', () => {
    expect(applyWikiContext(book, { position: 40, wikiMode: 'CREATE' })).toMatchObject({
      currentEpisode: 40,
      progressLabel: '40화까지 읽음',
      editLabel: '40화 등록',
    })
    expect(applyWikiContext(book, { position: { value: 7 } }).editLabel).toBe('7화 수정')
  })

  it('권·장 진도는 권·장 문구로 보여준다', () => {
    const result = applyWikiContext(book, { position: { value: 7, volume: 2, chapter: 7 } })

    expect(result.progressLabel).toBe('2권 7장까지 읽음')
    expect(result.editLabel).toBe('2권 7장 수정')
  })

  it('진도가 없거나 도서 정보가 없으면 받은 값을 그대로 돌려준다', () => {
    expect(applyWikiContext(book, {})).toBe(book)
    expect(applyWikiContext(book)).toBe(book)
    expect(applyWikiContext(undefined, { position: 40 })).toBeUndefined()
  })
})

describe('getReviewProgressPath', () => {
  it('신청 식별자를 붙인 검수 진행 화면 주소를 만든다', () => {
    expect(getReviewProgressPath('proposal-1')).toBe('/wiki/reviews/proposal-1')
    expect(getReviewProgressPath('a b')).toBe('/wiki/reviews/a%20b')
  })

  it.each([null, undefined, ''])(
    '신청 식별자가 없으면(%j) 검수 목록 주소를 돌려준다',
    (reviewId) => {
      expect(getReviewProgressPath(reviewId)).toBe('/wiki/reviews')
    },
  )
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

describe('moveItem', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]

  it('항목을 빼서 새 위치에 끼워 넣는다', () => {
    expect(moveItem(items, 'a', 2).map((item) => item.id)).toEqual(['b', 'c', 'a'])
    expect(moveItem(items, 'c', 0).map((item) => item.id)).toEqual(['c', 'a', 'b'])
  })

  it('범위를 벗어난 위치는 처음이나 끝으로 맞추고 원본은 바꾸지 않는다', () => {
    expect(moveItem(items, 'b', 99).map((item) => item.id)).toEqual(['a', 'c', 'b'])
    expect(moveItem(items, 'b', -5).map((item) => item.id)).toEqual(['b', 'a', 'c'])
    expect(items.map((item) => item.id)).toEqual(['a', 'b', 'c'])
  })

  it('없는 식별자면 원본을 그대로 돌려준다', () => {
    expect(moveItem(items, 'x', 0)).toBe(items)
  })
})

describe('moveRelationItem', () => {
  const relations = {
    friendly: [{ id: 'g2' }, { id: 'g3' }],
    hostile: [{ id: 'g4' }],
  }

  it('같은 구역 안에서 순서를 바꾼다', () => {
    const result = moveRelationItem(relations, 'g2', 'friendly', 1)

    expect(result.friendly.map((group) => group.id)).toEqual(['g3', 'g2'])
    expect(result.hostile.map((group) => group.id)).toEqual(['g4'])
  })

  it('다른 구역으로 옮기고 원래 구역에서는 뺀다', () => {
    const result = moveRelationItem(relations, 'g3', 'hostile', 0)

    expect(result.friendly.map((group) => group.id)).toEqual(['g2'])
    expect(result.hostile.map((group) => group.id)).toEqual(['g3', 'g4'])
  })

  it('데이터에 없던 구역(중립)으로도 옮길 수 있다', () => {
    const result = moveRelationItem(relations, 'g4', 'neutral', 0)

    expect(result.neutral.map((group) => group.id)).toEqual(['g4'])
    expect(result.hostile).toEqual([])
  })

  it('없는 식별자면 원본을 그대로 돌려준다', () => {
    expect(moveRelationItem(relations, 'x', 'friendly', 0)).toBe(relations)
  })
})

describe('sortMilestonesLatest / insertMilestoneLatest', () => {
  const milestones = [
    { id: 'm1', unlockEpisode: 4 },
    { id: 'm2', unlockEpisode: 12 },
    { id: 'm3', unlockEpisode: 4 },
  ]

  it('해금 시점이 큰 순서로 정렬하고 같은 시점은 원래 순서를 지킨다', () => {
    expect(sortMilestonesLatest(milestones).map((item) => item.id)).toEqual(['m2', 'm1', 'm3'])
  })

  it('새 행적은 해금 시점이 더 작은 첫 행적 앞에 끼워 넣어 직접 바꾼 순서를 유지한다', () => {
    const manual = [
      { id: 'a', unlockEpisode: 2 },
      { id: 'b', unlockEpisode: 9 },
    ]
    const result = insertMilestoneLatest(manual, { id: 'n', unlockEpisode: 5 })

    expect(result.map((item) => item.id)).toEqual(['n', 'a', 'b'])
  })

  it('더 작은 시점이 없으면 맨 끝에 붙인다', () => {
    const result = insertMilestoneLatest([{ id: 'a', unlockEpisode: 9 }], {
      id: 'n',
      unlockEpisode: 5,
    })

    expect(result.map((item) => item.id)).toEqual(['a', 'n'])
  })
})

describe('getMemberCandidates / findPersonByName', () => {
  const persons = [
    { id: 'p1', name: '서하준' },
    { id: 'p2', name: '배서현' },
    { id: 'p3', name: 'Alice' },
  ]

  it('이미 구성원인 인물은 후보에서 뺀다', () => {
    const candidates = getMemberCandidates(persons, [{ id: 'p2', name: '배서현' }])

    expect(candidates.map((person) => person.id)).toEqual(['p1', 'p3'])
  })

  it('현재 진도보다 뒤에 등장하는 인물은 후보에서 뺀다', () => {
    const withEpisodes = [
      { id: 'p1', name: '서하준', unlockEpisode: 1 },
      { id: 'p2', name: '배서현', unlockEpisode: 33 },
      { id: 'p3', name: '구교승' },
    ]

    expect(getMemberCandidates(withEpisodes, [], 32).map((person) => person.id)).toEqual([
      'p1',
      'p3',
    ])
    expect(getMemberCandidates(withEpisodes, [], 33).map((person) => person.id)).toEqual([
      'p1',
      'p2',
      'p3',
    ])
    expect(getMemberCandidates(withEpisodes, []).length).toBe(3)
  })

  it('인물이나 구성원이 없어도 오류 없이 빈 후보를 돌려준다', () => {
    expect(getMemberCandidates()).toEqual([])
    expect(getMemberCandidates(persons).length).toBe(3)
  })

  it('검색어와 이름이 같은 인물을 찾고, 공백과 대소문자는 무시한다', () => {
    expect(findPersonByName(persons, ' 서하준 ')?.id).toBe('p1')
    expect(findPersonByName(persons, 'alice')?.id).toBe('p3')
  })

  it('이름이 다르거나 검색어가 비면 찾지 않는다(일부만 일치해도 안 됨)', () => {
    expect(findPersonByName(persons, '서하')).toBeUndefined()
    expect(findPersonByName(persons, '   ')).toBeUndefined()
    expect(findPersonByName(persons, '')).toBeUndefined()
    expect(findPersonByName()).toBeUndefined()
  })
})

describe('toDetailEdit / applyDetailEdit (서버 데이터를 복사하지 않는 임시 저장)', () => {
  const base = {
    members: [
      { id: 'p1', name: '서하준', unlockEpisode: 1 },
      { id: 'p2', name: '배서현', unlockEpisode: 3 },
    ],
    relations: {
      friendly: [{ id: 'g2', name: '래번클로', scale: '중', memberCount: 9 }],
      hostile: [{ id: 'g4', name: '슬리데린', scale: '대', memberCount: 11 }],
    },
    milestones: [
      { id: 'm1', content: '첫 출항', unlockEpisode: 4 },
      { id: 'm2', content: '낡은 지도를 발견', unlockEpisode: 7 },
    ],
  }
  /** 상세 화면이 처음에 보여주는 상태(행적은 최신순)다. */
  const untouched = {
    members: base.members,
    relations: base.relations,
    milestones: [base.milestones[1], base.milestones[0]],
  }
  const roundTrip = (current) => applyDetailEdit(base, toDetailEdit(base, current))

  it('손대지 않았으면 편집이 비어 있다고 본다', () => {
    expect(isEmptyDetailEdit(toDetailEdit(base, untouched), base)).toBe(true)
  })

  it('편집분에는 서버 항목의 내용이 들어가지 않고 식별자만 남는다', () => {
    const edit = JSON.stringify(toDetailEdit(base, untouched))

    expect(edit).not.toContain('서하준')
    expect(edit).not.toContain('래번클로')
    expect(edit).not.toContain('낡은 지도를 발견')
    expect(edit).toContain('p1')
  })

  it('새로 추가한 항목은 내용까지 저장하고, 되살리면 서버 항목 뒤에 이어진다', () => {
    const added = { id: 'p9', name: '새 인물', unlockEpisode: 2 }
    const edit = toDetailEdit(base, { ...untouched, members: [...base.members, added] })

    expect(edit.members.added).toEqual([added])
    expect(roundTrip({ ...untouched, members: [...base.members, added] }).members).toEqual([
      ...base.members,
      added,
    ])
    expect(isEmptyDetailEdit(edit, base)).toBe(false)
  })

  it('지운 서버 항목은 식별자만 기억해 두고, 되살려도 다시 나타나지 않는다', () => {
    const current = { ...untouched, members: [base.members[0]] }

    expect(toDetailEdit(base, current).members.removed).toEqual(['p2'])
    expect(roundTrip(current).members).toEqual([base.members[0]])
  })

  it('순서를 바꾼 것을 되살린다', () => {
    const current = { ...untouched, members: [base.members[1], base.members[0]] }

    expect(roundTrip(current).members.map((item) => item.id)).toEqual(['p2', 'p1'])
  })

  it('관계 단체를 다른 구역으로 옮긴 것과 새로 추가한 것을 되살린다', () => {
    const added = { id: 'draft-relation-1', name: '새 단체', isDraft: true }
    const current = {
      ...untouched,
      relations: {
        friendly: [added],
        hostile: [base.relations.friendly[0], base.relations.hostile[0]],
      },
    }

    const result = roundTrip(current)

    expect(result.relations.friendly).toEqual([added])
    expect(result.relations.hostile.map((item) => item.id)).toEqual(['g2', 'g4'])
  })

  it('서버 행적을 고치면 고친 내용만 저장하고, 되살릴 때 서버 항목에 덮어쓴다', () => {
    const edited = { ...base.milestones[0], content: '수정한 행적', unlockEpisode: 5 }
    const current = { ...untouched, milestones: [base.milestones[1], edited] }
    const edit = toDetailEdit(base, current)

    expect(edit.milestones.changed).toEqual({ m1: { content: '수정한 행적', unlockEpisode: 5 } })
    expect(roundTrip(current).milestones.find((item) => item.id === 'm1')).toMatchObject({
      content: '수정한 행적',
      unlockEpisode: 5,
    })
  })

  it('저장한 뒤 서버에 새로 생긴 항목은 목록 끝에 붙는다', () => {
    const edit = toDetailEdit(base, { ...untouched, members: [base.members[0]] })
    const newerServer = {
      ...base,
      members: [...base.members, { id: 'p5', name: '서버에 새로 생긴 인물' }],
    }

    expect(applyDetailEdit(newerServer, edit).members.map((item) => item.id)).toEqual(['p1', 'p5'])
  })

  it('편집이 없거나 모양이 맞지 않으면 서버 내용을 그대로 쓴다', () => {
    const result = applyDetailEdit(base, undefined)

    expect(result.members).toEqual(base.members)
    expect(result.milestones).toEqual(base.milestones)
    expect(result.relations).toEqual(base.relations)
    expect(
      applyDetailEdit(base, { members: [{ id: 'p9' }], relations: {}, milestones: [] }).members,
    ).toBe(base.members)
  })
})

describe('getGroupViewDetailPath', () => {
  it('단체 식별자를 쿼리로 붙인 위키 내용(보기) 단체 상세 주소를 만든다', () => {
    expect(getGroupViewDetailPath('g1')).toBe('/wiki/view/group/detail?groupId=g1')
    expect(getGroupViewDetailPath(7)).toBe('/wiki/view/group/detail?groupId=7')
  })

  it('특수문자는 안전하게 인코딩한다', () => {
    expect(getGroupViewDetailPath('a b&c')).toBe('/wiki/view/group/detail?groupId=a+b%26c')
  })
})

describe('filterUnlocked', () => {
  const items = [{ id: 'a', unlockEpisode: 1 }, { id: 'b', unlockEpisode: 33 }, { id: 'c' }]

  it('현재 진도보다 뒤에 등장하는 항목은 뺀다', () => {
    expect(filterUnlocked(items, 32).map((item) => item.id)).toEqual(['a', 'c'])
    expect(filterUnlocked(items, 33).map((item) => item.id)).toEqual(['a', 'b', 'c'])
  })

  it('등장 회차를 모르는 항목은 남기고, 진도를 모르면 거르지 않는다', () => {
    expect(filterUnlocked(items).length).toBe(3)
    expect(filterUnlocked(undefined, 32)).toEqual([])
  })

  it('원본 목록은 바꾸지 않는다', () => {
    filterUnlocked(items, 1)

    expect(items).toHaveLength(3)
  })
})

describe('getMaxDraftNumber', () => {
  it('임시 관계와 행적 식별자의 가장 큰 번호를 돌려준다', () => {
    expect(
      getMaxDraftNumber({
        relations: { friendly: [{ id: 'draft-relation-2' }], hostile: [{ id: 'g3' }] },
        milestones: [{ id: 'draft-milestone-5' }, { id: 'm1' }, { id: 'draft-milestone-1' }],
      }),
    ).toBe(5)
  })

  it('임시 항목이 없거나 값이 비어 있으면 0이다', () => {
    expect(getMaxDraftNumber({ relations: {}, milestones: [{ id: 'm1' }] })).toBe(0)
    expect(getMaxDraftNumber({})).toBe(0)
    expect(getMaxDraftNumber()).toBe(0)
  })

  it('번호 형식이 아닌 식별자는 무시한다', () => {
    expect(
      getMaxDraftNumber({ milestones: [{ id: 'draft-milestone-x' }, { id: 'draft-9' }] }),
    ).toBe(0)
  })
})

describe('applyDetailEdit (임시 저장한 행적 순서)', () => {
  it('최신 순으로 정렬한 기준 위에 저장된 순서를 적용하면 사용자가 바꾼 순서가 유지된다', () => {
    const base = {
      members: [],
      relations: {},
      milestones: sortMilestonesLatest([
        { id: 'm1', unlockEpisode: 4 },
        { id: 'm2', unlockEpisode: 7 },
        { id: 'm3', unlockEpisode: 12 },
      ]),
    }
    // 정렬된 기준은 m3(12화), m2(7화), m1(4화) 순이다. 사용자가 이를 m2, m1, m3 순으로 바꿔 임시 저장했다고 본다.
    const byId = Object.fromEntries(base.milestones.map((item) => [item.id, item]))
    const custom = [byId.m2, byId.m1, byId.m3]
    const edit = toDetailEdit(base, { members: [], relations: {}, milestones: custom })

    expect(base.milestones.map((item) => item.id)).toEqual(['m3', 'm2', 'm1'])
    expect(applyDetailEdit(base, edit).milestones.map((item) => item.id)).toEqual([
      'm2',
      'm1',
      'm3',
    ])
  })
})

describe('hideRelatedMemberCounts', () => {
  it('관계에 나오는 단체의 인원수만 지우고 나머지는 그대로 둔다', () => {
    const relations = {
      friendly: [{ id: 'g2', name: '래번클로', scale: '중', memberCount: 12 }],
      hostile: [{ id: 'g3', name: '슬리데린', memberCount: 4 }],
    }
    const result = hideRelatedMemberCounts(relations)

    expect(result.friendly[0]).toEqual({
      id: 'g2',
      name: '래번클로',
      scale: '중',
      memberCount: undefined,
    })
    expect(result.hostile[0].memberCount).toBeUndefined()
    expect(relations.friendly[0].memberCount).toBe(12)
  })

  it('관계가 없으면 빈 객체를 돌려준다', () => {
    expect(hideRelatedMemberCounts()).toEqual({})
    expect(hideRelatedMemberCounts({})).toEqual({})
  })
})

describe('isEmptyDetailEdit (관계 구분 순서)', () => {
  it('서버가 관계 구분을 대립, 우호 순으로 보내도 손대지 않은 상태로 본다', () => {
    const base = {
      members: [],
      relations: {
        hostile: [{ id: 'g3', name: '슬리데린' }],
        friendly: [{ id: 'g2', name: '래번클로' }],
      },
      milestones: [],
    }
    const edit = toDetailEdit(base, {
      members: [],
      relations: base.relations,
      milestones: [],
    })

    expect(isEmptyDetailEdit(edit, base)).toBe(true)
  })
})

describe('splitByProgress / withHiddenItems (수정 화면의 진도 보호)', () => {
  const group = {
    id: 'g1',
    memberCount: 4,
    members: [
      { id: 'p1', unlockEpisode: 1 },
      { id: 'p2', unlockEpisode: 40 },
      { id: 'p3', unlockEpisode: 5 },
    ],
    milestones: [
      { id: 'm1', unlockEpisode: 4 },
      { id: 'm2', unlockEpisode: 50 },
      { id: 'm3', unlockEpisode: 12 },
    ],
    relations: { friendly: [{ id: 'g2', name: '래번클로', memberCount: 9 }] },
  }

  it('진도 이후 구성원·행적을 빼고 인원에서도 뺀다. 행적은 최신 순이고 관계 단체 인원은 숨긴다', () => {
    const { visible, hiddenMembers, hiddenMilestones } = splitByProgress(group, 32)

    expect(visible.members.map((item) => item.id)).toEqual(['p1', 'p3'])
    expect(visible.milestones.map((item) => item.id)).toEqual(['m3', 'm1'])
    expect(visible.memberCount).toBe(3)
    expect(visible.relations.friendly[0].memberCount).toBeUndefined()
    expect(hiddenMembers.map((item) => item.id)).toEqual(['p2'])
    expect(hiddenMilestones.map((item) => item.id)).toEqual(['m2'])
  })

  it('진도를 모르면 아무것도 가리지 않고, 단체가 없으면 빈 결과다', () => {
    const { visible, hiddenMembers } = splitByProgress(group)

    expect(visible.members).toHaveLength(3)
    expect(hiddenMembers).toEqual([])
    expect(splitByProgress(undefined, 32)).toEqual({
      visible: undefined,
      hiddenMembers: [],
      hiddenMilestones: [],
    })
  })

  it('제출할 때 가려 둔 구성원은 끝에, 가려 둔 행적(더 최신)은 앞에 다시 붙인다', () => {
    const { hiddenMembers, hiddenMilestones } = splitByProgress(group, 32)
    const detail = {
      members: [{ id: 'p1' }],
      relations: {},
      milestones: [{ id: 'm3' }, { id: 'm1' }],
    }
    const result = withHiddenItems(detail, { hiddenMembers, hiddenMilestones })

    expect(result.members.map((item) => item.id)).toEqual(['p1', 'p2'])
    expect(result.milestones.map((item) => item.id)).toEqual(['m2', 'm3', 'm1'])
  })
})
