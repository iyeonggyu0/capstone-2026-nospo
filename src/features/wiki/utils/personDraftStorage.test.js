import { expect, it } from 'vitest'
import { getPersonDraftKey } from './personDraftStorage'

it('getPersonDraftKey는 모드와 bookId에 따라 초안 저장 키를 생성한다', () => {
  expect(getPersonDraftKey('book-1', 'CREATE')).toBe('nospo:wiki-person-draft:create:book-1')
  expect(getPersonDraftKey('book-1', 'UPDATE')).toBe('nospo:wiki-person-draft:book-1')
  expect(getPersonDraftKey(undefined, 'CREATE')).toBe('nospo:wiki-person-draft:create:preview')
})
