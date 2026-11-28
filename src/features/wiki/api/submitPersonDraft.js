import {
  createWikiCharacter,
  createWikiCharacterEntry,
  createWikiCharacterProfile,
  createWikiDraft,
  createWikiRelation,
  submitWikiDraft,
  uploadWikiDraftAsset,
} from './wikiDrafts'
import {
  deleteSubmissionJournal,
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

const recoveryError = (message) =>
  Object.assign(new Error(message), { code: 'SUBMISSION_RECOVERY_REQUIRED' })

/** 서버 초안에 존재하는 인물만 관계 대상으로 사용한다. */
const resolveRelations = (people, positionValue) => {
  const types = { 우호: 'FRIENDLY', 대립: 'HOSTILE', 중립: 'NEUTRAL' }
  const result = []
  for (const [from, person] of people.entries()) {
    for (const [type, relations] of Object.entries(person.relations ?? {})) {
      for (const relation of relations) {
        const name = (typeof relation === 'string' ? relation : relation.name)?.trim()
        const targets = people
          .map((item, index) => ({ item, index }))
          .filter(({ item }) => item.name?.trim() === name)
        if (!types[type] || targets.length !== 1 || targets[0].index === from)
          throw new Error(
            `관계 대상 '${name || ''}'을 같은 초안의 다른 인물 한 명으로 지정해 주세요.`,
          )
        const revealAt = Number(
          typeof relation === 'string' ? person.firstRevealAt : relation.revealAt,
        )
        if (
          !Number.isInteger(revealAt) ||
          revealAt <
            Math.max(Number(person.firstRevealAt), Number(targets[0].item.firstRevealAt)) ||
          revealAt > positionValue
        )
          throw new Error(`'${name}' 관계의 공개 지점을 두 인물의 등장 이후로 설정해 주세요.`)
        result.push({ from, to: targets[0].index, type: types[type], revealAt })
      }
    }
  }
  return result
}

/** 같은 브라우저의 다른 탭도 같은 초안을 동시에 처리하지 못하게 한다. */
const withSubmissionLock = async (journalKey, action) => {
  if (!navigator.locks?.request)
    throw new Error(
      '이 브라우저에서는 안전한 동시 제출을 지원하지 않아요. 최신 브라우저를 사용해 주세요.',
    )
  return navigator.locks.request(
    `nospo:wiki-submission:${journalKey}`,
    { ifAvailable: true },
    (lock) => {
      if (!lock)
        throw new Error('다른 탭에서 이 도서를 제출하고 있어요. 완료 후 다시 시도해 주세요.')
      return action()
    },
  )
}

/** 제출 기록 초기화도 다른 탭의 제출과 동시에 실행되지 않게 한다. */
export const resetPersonSubmission = (journalKey) =>
  withSubmissionLock(journalKey, async () => {
    await deleteSubmissionJournal(journalKey)
  })

/** 탭 간 중복 실행을 막고 확인된 저장 단계와 제출 멱등 키를 보존한다. */
export const submitPersonDraft = (input) =>
  withSubmissionLock(input.journalKey, () => submitLockedPersonDraft(input))

const submitLockedPersonDraft = async ({
  journalKey,
  bookId,
  mode,
  position,
  positionUnit,
  people,
  wikiId,
  baseWikiVersion,
}) => {
  const positionValue = typeof position === 'object' ? position.value : position
  const relations = resolveRelations(people, positionValue)
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
  if (journal && journal.fingerprint !== fingerprint && journal.steps?.submit && !journal.pending)
    journal = null
  if (
    journal &&
    journal.fingerprint !== fingerprint &&
    !journal.pending &&
    Object.keys(journal.steps).length === 1 &&
    journal.steps.draft
  ) {
    const old = JSON.parse(journal.fingerprint)
    const current = JSON.parse(fingerprint)
    const sameDraft = [
      'bookId',
      'mode',
      'position',
      'positionUnit',
      'wikiId',
      'baseWikiVersion',
    ].every((key) => JSON.stringify(old[key]) === JSON.stringify(current[key]))
    if (sameDraft) {
      journal.fingerprint = fingerprint
      await saveSubmissionJournal(journalKey, journal)
    }
  }
  if (
    journal &&
    journal.fingerprint !== fingerprint &&
    !journal.pending &&
    Object.keys(journal.steps).length === 0
  )
    journal = null
  if (journal && journal.fingerprint !== fingerprint)
    throw recoveryError(
      '작성 내용이 이전 제출과 달라요. 기존 초안과 제출 내역을 확인한 뒤 새 초안으로 제출할 수 있어요.',
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
      throw recoveryError(
        '이전 저장의 처리 결과를 확인할 수 없어요. 기존 초안과 제출 내역을 확인한 뒤 새 초안으로 제출할 수 있어요.',
      )
    }
    journal.pending = key
    await persist()
    let result
    try {
      result = await action()
    } catch (error) {
      if (error.response?.status === 412) {
        throw recoveryError(
          '서버 초안이 다른 곳에서 변경됐어요. 기존 초안과 제출 내역을 확인한 뒤 새 초안을 시작해 주세요.',
        )
      }
      if (
        !retryable &&
        error.response?.status >= 400 &&
        error.response.status < 500 &&
        error.response.status !== 408
      ) {
        journal.pending = null
        await persist()
      }
      if (
        !retryable &&
        (!error.response || error.response.status >= 500 || error.response.status === 408)
      ) {
        throw recoveryError(
          '저장 결과를 확인할 수 없어요. 기존 초안과 제출 내역을 먼저 확인해 주세요.',
        )
      }
      throw error
    }
    if (key !== 'submit' && !result.etag)
      throw recoveryError('저장 결과의 버전을 확인할 수 없어요. 내 위키 초안을 확인해 주세요.')
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
  if (!draftId) throw recoveryError('초안 ID를 확인할 수 없어요. 내 위키 초안을 확인해 주세요.')
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
        throw recoveryError('이미지 ID를 확인할 수 없어요. 내 위키 초안을 확인해 주세요.')
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
    if (!characterId)
      throw recoveryError('인물 ID를 확인할 수 없어요. 내 위키 초안을 확인해 주세요.')
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
  for (const [index, relation] of relations.entries()) {
    await run(`relation:${index}`, () =>
      createWikiRelation({
        draftId,
        fromId:
          journal.steps[`character:${relation.from}`].entityId ??
          journal.steps[`character:${relation.from}`].characterId,
        toId:
          journal.steps[`character:${relation.to}`].entityId ??
          journal.steps[`character:${relation.to}`].characterId,
        type: relation.type,
        position: apiPosition(relation.revealAt, positionValue, positionUnit),
        etag: journal.etag,
      }),
    )
  }
  const result = await run(
    'submit',
    () => submitWikiDraft({ draftId, etag: journal.etag, idempotencyKey: journal.idempotencyKey }),
    true,
  )
  return result
}
