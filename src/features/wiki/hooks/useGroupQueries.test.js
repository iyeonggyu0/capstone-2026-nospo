import { describe, expect, it } from 'vitest'
import { groupQueryKeys } from './useGroupQueries'

describe('groupQueryKeys.persons', () => {
  it('진도가 다르면 다른 조회로 보아, 다른 진도의 인물 목록이 섞이지 않는다', () => {
    expect(groupQueryKeys.persons('b1', 10)).not.toEqual(groupQueryKeys.persons('b1', 32))
    expect(groupQueryKeys.persons('b1', 10)).toEqual(groupQueryKeys.persons('b1', 10))
  })

  it('도서나 진도가 없으면 null로 채워 키 모양을 일정하게 유지한다', () => {
    expect(groupQueryKeys.persons()).toEqual(['wiki', 'persons', null, null])
  })
})
