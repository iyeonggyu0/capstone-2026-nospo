import { beforeEach, expect, it, vi } from 'vitest'

vi.mock('./wikiDrafts', () => ({
  createWikiCharacter: vi.fn(),
  createWikiCharacterEntry: vi.fn(),
  createWikiCharacterProfile: vi.fn(),
  createWikiDraft: vi.fn(),
  submitWikiDraft: vi.fn(),
  uploadWikiDraftAsset: vi.fn(),
}))
vi.mock('../utils/personDraftStorage', () => ({
  getPersonImage: vi.fn(),
  getSubmissionJournal: vi.fn(),
  saveSubmissionJournal: vi.fn(),
  deleteSubmissionJournal: vi.fn(),
}))

import * as api from './wikiDrafts'
import * as storage from '../utils/personDraftStorage'
import { submitPersonDraft } from './submitPersonDraft'

const input = {
  journalKey: 'journal',
  bookId: 'book',
  mode: 'CREATE',
  position: { unit: 'PAGE', value: 10 },
  positionUnit: 'PAGE',
  people: [
    {
      id: 'p',
      name: '인물',
      firstRevealAt: 2,
      gender: '여성',
      personality: '차분함',
      entries: [{ title: '행적', revealAt: 3 }],
    },
  ],
}
let journal
beforeEach(() => {
  vi.clearAllMocks()
  journal = undefined
  storage.getSubmissionJournal.mockImplementation(async () => structuredClone(journal))
  storage.saveSubmissionJournal.mockImplementation(async (_, value) => {
    journal = structuredClone(value)
  })
  storage.deleteSubmissionJournal.mockImplementation(async () => {
    journal = undefined
  })
  api.createWikiDraft.mockResolvedValue({ data: { draftId: 'draft' }, etag: '"1"' })
  api.createWikiCharacter.mockResolvedValue({ data: { entityId: 'character' }, etag: '"2"' })
  api.createWikiCharacterEntry.mockResolvedValue({ data: { entryId: 'entry' }, etag: '"3"' })
  api.submitWikiDraft.mockResolvedValue({ submissionId: 'submission' })
})

it('확인된 단계는 재실행하지 않고 성별과 성향을 각각 보존한다', async () => {
  api.createWikiCharacterEntry.mockRejectedValueOnce({ response: { status: 422 } })
  await expect(submitPersonDraft(input)).rejects.toMatchObject({ response: { status: 422 } })
  expect(api.createWikiCharacter.mock.calls[0][0].profile).toMatchObject({
    gender: '여성',
    personality: '차분함',
  })
  await expect(submitPersonDraft(input)).resolves.toEqual({ submissionId: 'submission' })
  await expect(submitPersonDraft(input)).resolves.toEqual({ submissionId: 'submission' })
  expect(api.createWikiDraft).toHaveBeenCalledTimes(1)
  expect(api.createWikiCharacter).toHaveBeenCalledTimes(1)
  expect(api.createWikiCharacterEntry).toHaveBeenCalledTimes(2)
  expect(api.submitWikiDraft).toHaveBeenCalledTimes(1)
})

it('결과를 모르는 인물 생성은 재전송하지 않으며 제출 요청은 같은 키로 재시도한다', async () => {
  api.createWikiCharacter.mockRejectedValueOnce(new Error('연결 끊김'))
  await expect(submitPersonDraft(input)).rejects.toThrow('연결 끊김')
  await expect(submitPersonDraft(input)).rejects.toThrow('처리 결과를 확인할 수 없어요')
  expect(api.createWikiCharacter).toHaveBeenCalledTimes(1)
  journal = undefined
  api.submitWikiDraft.mockRejectedValueOnce(new Error('응답 유실'))
  await expect(submitPersonDraft(input)).rejects.toThrow('응답 유실')
  await submitPersonDraft(input)
  expect(api.submitWikiDraft.mock.calls[0][0].idempotencyKey).toBe(
    api.submitWikiDraft.mock.calls[1][0].idempotencyKey,
  )
})
