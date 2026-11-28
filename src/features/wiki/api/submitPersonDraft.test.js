import { afterEach, beforeEach, expect, it, vi } from 'vitest'

vi.mock('./wikiDrafts', () => ({
  createWikiCharacter: vi.fn(),
  createWikiCharacterEntry: vi.fn(),
  createWikiCharacterProfile: vi.fn(),
  createWikiDraft: vi.fn(),
  createWikiRelation: vi.fn(),
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
import { resetPersonSubmission, submitPersonDraft } from './submitPersonDraft'

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
  const held = new Set()
  vi.stubGlobal('navigator', {
    locks: {
      request: async (key, options, callback) => {
        if (held.has(key)) return callback(null)
        held.add(key)
        try {
          return await callback({ name: key })
        } finally {
          held.delete(key)
        }
      },
    },
  })
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
afterEach(() => vi.unstubAllGlobals())

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
  await expect(submitPersonDraft(input)).rejects.toMatchObject({
    code: 'SUBMISSION_RECOVERY_REQUIRED',
  })
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

it('인물 저장 거절 뒤 수정한 내용을 기존 빈 초안에 다시 저장한다', async () => {
  api.createWikiCharacter.mockRejectedValueOnce({ response: { status: 422 } })
  await expect(submitPersonDraft(input)).rejects.toMatchObject({ response: { status: 422 } })
  const corrected = { ...input, people: [{ ...input.people[0], name: '수정된 이름' }] }
  await submitPersonDraft(corrected)
  expect(api.createWikiDraft).toHaveBeenCalledTimes(1)
  expect(api.createWikiCharacter.mock.calls[1][0].profile.name).toBe('수정된 이름')
})

it('업로드된 이미지를 바꿨다면 오래된 이미지를 재사용하지 않고 복구를 요청한다', async () => {
  const original = {
    ...input,
    people: [{ ...input.people[0], imageKey: 'image', imageVersion: 'first' }],
  }
  storage.getPersonImage.mockResolvedValue(new Blob(['first']))
  api.uploadWikiDraftAsset.mockResolvedValue({ data: { assetId: 'old-image' }, etag: '"2"' })
  api.createWikiCharacter.mockRejectedValueOnce({ response: { status: 422 } })
  await expect(submitPersonDraft(original)).rejects.toMatchObject({ response: { status: 422 } })
  const replaced = { ...original, people: [{ ...original.people[0], imageVersion: 'second' }] }
  await expect(submitPersonDraft(replaced)).rejects.toMatchObject({
    code: 'SUBMISSION_RECOVERY_REQUIRED',
  })
  expect(api.uploadWikiDraftAsset).toHaveBeenCalledTimes(1)
  expect(api.submitWikiDraft).not.toHaveBeenCalled()
})

it('동시 제출과 기록 초기화는 같은 도서 잠금을 공유한다', async () => {
  let finish
  api.createWikiDraft.mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve
    }),
  )
  const first = submitPersonDraft(input)
  await vi.waitFor(() => expect(api.createWikiDraft).toHaveBeenCalledTimes(1))
  await expect(submitPersonDraft(input)).rejects.toThrow('다른 탭')
  await expect(resetPersonSubmission(input.journalKey)).rejects.toThrow('다른 탭')
  finish({ data: { draftId: 'draft' }, etag: '"1"' })
  await first
  await submitPersonDraft(input)
  expect(api.createWikiDraft).toHaveBeenCalledTimes(1)
  expect(api.submitWikiDraft).toHaveBeenCalledTimes(1)
})

it.each(['entry', 'submit'])('서버 초안 충돌(%s)은 복구 경로를 제공한다', async (step) => {
  const target = step === 'entry' ? api.createWikiCharacterEntry : api.submitWikiDraft
  target.mockRejectedValueOnce({ response: { status: 412 } })
  await expect(submitPersonDraft(input)).rejects.toMatchObject({
    code: 'SUBMISSION_RECOVERY_REQUIRED',
  })
})

it('탭 간 잠금이 없는 환경에서는 요청을 보내지 않는다', async () => {
  vi.stubGlobal('navigator', {})
  await expect(submitPersonDraft(input)).rejects.toThrow('동시 제출')
  expect(api.createWikiDraft).not.toHaveBeenCalled()
})

it('관계 대상을 초안 인물 ID로 변환하고 대상이 없으면 저장 전에 거부한다', async () => {
  const related = {
    ...input,
    people: [
      { ...input.people[0], relations: { 우호: [{ name: '상대', revealAt: 4 }] } },
      { id: 'p2', name: '상대', firstRevealAt: 3 },
    ],
  }
  api.createWikiCharacter
    .mockResolvedValueOnce({ data: { entityId: 'first' }, etag: '"2"' })
    .mockResolvedValueOnce({ data: { entityId: 'second' }, etag: '"4"' })
  api.createWikiRelation.mockResolvedValue({ data: { relationId: 'relation' }, etag: '"5"' })
  await submitPersonDraft(related)
  expect(api.createWikiRelation).toHaveBeenCalledWith({
    draftId: 'draft',
    fromId: 'first',
    toId: 'second',
    type: 'FRIENDLY',
    position: { unit: 'PAGE', value: 4 },
    etag: '"4"',
  })
  journal = undefined
  api.createWikiDraft.mockClear()
  await expect(
    submitPersonDraft({
      ...input,
      people: [{ ...input.people[0], relations: { 우호: [{ name: '없는 인물', revealAt: 4 }] } }],
    }),
  ).rejects.toThrow('관계 대상')
  expect(api.createWikiDraft).not.toHaveBeenCalled()
})
