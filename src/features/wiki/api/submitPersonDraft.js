import {
  createWikiCharacter,
  createWikiCharacterEntry,
  createWikiCharacterProfile,
  createWikiDraft,
  submitWikiDraft,
  uploadWikiDraftAsset,
} from './wikiDrafts'
import {
  getPersonImage,
  getSubmissionJournal,
  saveSubmissionJournal,
} from '../utils/personDraftStorage'

const apiPosition = (value, fallback, unit) =>
  value && typeof value === 'object' ? value : { unit, value: Number(value) || fallback }

const profilePayload = (profile, fallbackName, imageAssetId, position, unit) => ({
  name: (profile.name ?? fallbackName).trim(),
  role: profile.role || null,
  gender: profile.gender || null,
  personality: profile.personality || null,
  description: profile.description || '',
  imageAssetId,
  revealAt: apiPosition(profile.revealAt, position, unit),
})

/** 확인된 저장 단계와 제출 멱등 키를 보존하고 미확인 비멱등 요청은 자동 재전송하지 않는다. */
export const submitPersonDraft = async ({
  journalKey,
  bookId,
  mode,
  position,
  positionUnit,
  people,
  wikiId,
  baseWikiVersion,
}) => {
  const fingerprint = JSON.stringify({
    bookId,
    mode,
    position,
    positionUnit,
    wikiId,
    baseWikiVersion,
    people: people.map((person) => {
      const saved = { ...person }
      delete saved.imageUrl
      return saved
    }),
  })
  let journal = await getSubmissionJournal(journalKey)
  if (
    journal &&
    journal.fingerprint !== fingerprint &&
    !journal.pending &&
    Object.keys(journal.steps).length === 0
  )
    journal = null
  if (journal && journal.fingerprint !== fingerprint)
    throw new Error(
      '이전 제출이 완료되지 않아 내용을 변경해 다시 제출할 수 없어요. 내 위키 초안과 제출 내역을 먼저 확인해 주세요.',
    )
  if (!journal)
    journal = {
      fingerprint,
      steps: {},
      etag: null,
      pending: null,
      idempotencyKey: crypto.randomUUID(),
    }
  const persist = () => saveSubmissionJournal(journalKey, journal)
  const run = async (key, action, retryable = false) => {
    if (Object.hasOwn(journal.steps, key)) return journal.steps[key]
    if (journal.pending && (journal.pending !== key || !retryable)) {
      throw new Error(
        '이전 저장의 처리 결과를 확인할 수 없어요. 중복 생성을 막기 위해 내 위키 초안과 제출 내역을 확인해 주세요.',
      )
    }
    journal.pending = key
    await persist()
    let result
    try {
      result = await action()
    } catch (error) {
      if (
        !retryable &&
        error.response?.status >= 400 &&
        error.response.status < 500 &&
        error.response.status !== 408
      ) {
        journal.pending = null
        await persist()
      }
      throw error
    }
    if (key !== 'submit' && !result.etag)
      throw new Error('저장 결과의 버전을 확인할 수 없어요. 내 위키 초안을 확인해 주세요.')
    if (result.etag) journal.etag = result.etag
    journal.steps[key] = result.data ?? result
    journal.pending = null
    await persist()
    return journal.steps[key]
  }
  const created = await run('draft', () =>
    createWikiDraft({
      bookId,
      mode,
      position: apiPosition(position, 1, positionUnit),
      wikiId,
      baseWikiVersion,
    }),
  )
  const draftId = created.draftId ?? created.id
  if (!draftId) throw new Error('초안 ID를 확인할 수 없어요. 내 위키 초안을 확인해 주세요.')
  const positionValue = typeof position === 'object' ? position.value : position
  for (const [index, person] of people.entries()) {
    let imageAssetId = person.imageAssetId ?? null
    if (person.imageKey) {
      const imageKey = `image:${index}`
      const uploaded = await run(imageKey, async () => {
        const file = await getPersonImage(person.imageKey)
        if (!file) {
          const error = new Error(`${person.name}의 이미지를 다시 선택해 주세요.`)
          error.response = { status: 400 }
          throw error
        }
        return uploadWikiDraftAsset({ draftId, file, etag: journal.etag })
      })
      imageAssetId = uploaded.assetId ?? uploaded.id
      if (!imageAssetId)
        throw new Error('이미지 ID를 확인할 수 없어요. 내 위키 초안을 확인해 주세요.')
    }
    const profiles = person.profiles?.length
      ? [...person.profiles].sort((a, b) => Number(a.revealAt) - Number(b.revealAt))
      : [{ ...person, revealAt: person.firstRevealAt }]
    const first = profiles[0]
    const character = await run(`character:${index}`, () =>
      createWikiCharacter({
        draftId,
        firstRevealAt: apiPosition(person.firstRevealAt, positionValue, positionUnit),
        etag: journal.etag,
        profile: profilePayload(
          { ...first, revealAt: first.revealAt ?? person.firstRevealAt },
          person.name,
          imageAssetId,
          positionValue,
          positionUnit,
        ),
      }),
    )
    const characterId = character.entityId ?? character.characterId
    if (!characterId) throw new Error('인물 ID를 확인할 수 없어요. 내 위키 초안을 확인해 주세요.')
    for (const [profileIndex, profile] of profiles.slice(1).entries()) {
      await run(`profile:${index}:${profileIndex}`, () =>
        createWikiCharacterProfile({
          draftId,
          characterId,
          etag: journal.etag,
          profile: profilePayload(
            profile,
            person.name,
            profile.imageAssetId ?? imageAssetId,
            positionValue,
            positionUnit,
          ),
        }),
      )
    }
    for (const [type, entries] of [
      ['EVENT', person.entries ?? []],
      ['ABILITY', person.abilities ?? []],
      ['OTHER', person.otherEntries ?? []],
    ]) {
      for (const [entryIndex, entry] of entries.entries()) {
        const revealAt = Number(entry.revealAt) || Number(first.revealAt) || positionValue
        await run(`entry:${index}:${type}:${entryIndex}`, () =>
          createWikiCharacterEntry({
            draftId,
            characterId,
            etag: journal.etag,
            entry: {
              type,
              title: entry.title,
              content: entry.content ?? '',
              revealAt: apiPosition(revealAt, positionValue, positionUnit),
              sourcePosition: apiPosition(revealAt, positionValue, positionUnit),
            },
          }),
        )
      }
    }
  }
  const result = await run(
    'submit',
    () => submitWikiDraft({ draftId, etag: journal.etag, idempotencyKey: journal.idempotencyKey }),
    true,
  )
  return result
}
