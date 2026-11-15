import { apiClient } from '@/lib/api-client'

const getData = (response) => response.data?.data ?? response.data

/** 응답 본문과 초안 편집에 필요한 최신 ETag를 함께 반환한다. */
const getDraftResult = (response) => ({
  data: getData(response),
  etag: response.headers.etag,
})

/** 위키 작성 또는 수정 초안을 생성하고 동시 수정 기준 ETag를 반환한다. */
export const createWikiDraft = async ({ bookId, mode, position, wikiId, baseWikiVersion }) => {
  const response = await apiClient.post('/v1/wiki/drafts', {
    bookId,
    mode,
    position,
    ...(wikiId ? { wikiId } : {}),
    ...(baseWikiVersion !== undefined ? { baseWikiVersion } : {}),
  })

  return getDraftResult(response)
}

/** 초안과 인물·프로필·항목 전체를 조회하고 최신 ETag를 반환한다. */
export const getWikiDraft = async (draftId) => {
  const response = await apiClient.get(`/v1/wiki/drafts/${draftId}`)
  return getDraftResult(response)
}

/** 선택한 판본의 현재 진도와 PositionContext를 조회한다. */
export const getShelfProgress = async (bookId) => {
  const response = await apiClient.get(`/v1/me/shelf/${bookId}/progress`)
  return getDraftResult(response)
}

/** 도서 위키의 존재 여부와 UPDATE 초안 생성에 필요한 wikiVersion을 조회한다. */
export const getBookWiki = async ({ bookId, positionValue } = {}) => {
  const response = await apiClient.get(`/v1/books/${bookId}/wiki`, {
    params: positionValue !== undefined ? { positionValue } : {},
  })

  return getData(response)
}

/** 현재 공개 진도에서 보이는 인물 목록을 조회한다. */
export const getPublicWikiCharacters = async ({ bookId, positionValue, cursor, limit }) => {
  const response = await apiClient.get(`/v1/books/${bookId}/wiki/characters`, {
    params: {
      ...(positionValue !== undefined ? { positionValue } : {}),
      ...(cursor ? { cursor } : {}),
      ...(limit ? { limit } : {}),
    },
  })

  return getData(response)
}

/** 도서의 내 초안 목록을 조회해 기존 작성·수정 초안을 재사용할 수 있게 한다. */
export const getMyWikiDrafts = async ({ bookId, cursor, limit } = {}) => {
  const response = await apiClient.get('/v1/me/wiki/drafts', {
    params: {
      ...(bookId ? { bookId } : {}),
      ...(cursor ? { cursor } : {}),
      ...(limit ? { limit } : {}),
    },
  })

  return getData(response)
}

/** 초안의 작성 지점을 수정하고 새 동시 수정 기준 ETag를 반환한다. */
export const updateWikiDraftPosition = async ({ draftId, position, etag }) => {
  const response = await apiClient.patch(
    `/v1/wiki/drafts/${draftId}`,
    { position },
    { headers: { 'If-Match': etag } },
  )

  return getDraftResult(response)
}

/** 초안에 이미지 파일을 업로드하고 서버가 발급한 assetId와 최신 ETag를 반환한다. */
export const uploadWikiDraftAsset = async ({ draftId, file, etag }) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post(`/v1/wiki/drafts/${draftId}/assets`, formData, {
    headers: {
      'If-Match': etag,
      'Content-Type': 'multipart/form-data',
    },
  })

  return getDraftResult(response)
}

/** 인물과 최초 프로필을 함께 추가하고 초안 ETag를 갱신한다. */
export const createWikiCharacter = async ({ draftId, firstRevealAt, profile, etag }) => {
  const response = await apiClient.post(
    `/v1/wiki/drafts/${draftId}/characters`,
    { firstRevealAt, profile },
    { headers: { 'If-Match': etag } },
  )

  return getDraftResult(response)
}

/** 기존 인물의 프로필 전체를 수정하고 초안 ETag를 갱신한다. */
export const updateWikiCharacterProfile = async ({
  draftId,
  characterId,
  profileId,
  profile,
  etag,
}) => {
  const response = await apiClient.put(
    `/v1/wiki/drafts/${draftId}/characters/${characterId}/profiles/${profileId}`,
    profile,
    { headers: { 'If-Match': etag } },
  )

  return getDraftResult(response)
}

/** 인물의 주요 행적·능력·기타 항목을 추가하고 초안 ETag를 갱신한다. */
export const createWikiCharacterEntry = async ({ draftId, characterId, entry, etag }) => {
  const response = await apiClient.post(
    `/v1/wiki/drafts/${draftId}/characters/${characterId}/entries`,
    entry,
    { headers: { 'If-Match': etag } },
  )

  return getDraftResult(response)
}

/** 인물 세부 항목 전체를 수정하고 초안 ETag를 갱신한다. */
export const updateWikiCharacterEntry = async ({ draftId, characterId, entryId, entry, etag }) => {
  const response = await apiClient.put(
    `/v1/wiki/drafts/${draftId}/characters/${characterId}/entries/${entryId}`,
    entry,
    { headers: { 'If-Match': etag } },
  )

  return getDraftResult(response)
}

/** 인물 세부 항목을 삭제하고 초안 ETag를 갱신한다. */
export const deleteWikiCharacterEntry = async ({ draftId, characterId, entryId, etag }) => {
  const response = await apiClient.delete(
    `/v1/wiki/drafts/${draftId}/characters/${characterId}/entries/${entryId}`,
    { headers: { 'If-Match': etag } },
  )

  return getDraftResult(response)
}

/** 초안 안의 인물과 단체를 소속 관계로 연결하고 초안 ETag를 갱신한다. */
export const createWikiAffiliation = async ({
  draftId,
  characterId,
  organizationId,
  position,
  description = '',
  etag,
}) => {
  const response = await apiClient.post(
    `/v1/wiki/drafts/${draftId}/relations`,
    {
      from: { type: 'CHARACTER', id: characterId },
      to: { type: 'ORGANIZATION', id: organizationId },
      type: 'AFFILIATION',
      description,
      revealAt: position,
      sourcePosition: position,
      events: [],
    },
    { headers: { 'If-Match': etag } },
  )

  return getDraftResult(response)
}

/** 초안 관리 화면에서 명시적인 전체 삭제를 수행한다. */
export const deleteWikiDraft = async ({ draftId, etag }) => {
  await apiClient.delete(`/v1/wiki/drafts/${draftId}`, {
    headers: { 'If-Match': etag },
  })
}

/** 초안에서 사용하지 않는 이미지를 삭제하고 초안 ETag를 갱신한다. */
export const deleteWikiDraftAsset = async ({ draftId, assetId, etag }) => {
  const response = await apiClient.delete(`/v1/wiki/drafts/${draftId}/assets/${assetId}`, {
    headers: { 'If-Match': etag },
  })

  return getDraftResult(response)
}

/** 제출 가능한 초안을 검수에 제출하고 중복 요청을 방지한다. */
export const submitWikiDraft = async ({ draftId, etag, idempotencyKey }) => {
  const response = await apiClient.post(
    `/v1/wiki/drafts/${draftId}/submissions`,
    {},
    {
      headers: {
        'If-Match': etag,
        'Idempotency-Key': idempotencyKey,
      },
    },
  )

  return getData(response)
}

/** 수정 요청을 받은 제출 건에서 기존 재작성 초안을 생성하거나 재사용한다. */
export const createWikiRevisionDraft = async (submissionId) => {
  const response = await apiClient.post(`/v1/wiki/submissions/${submissionId}/revision-drafts`)
  return getDraftResult(response)
}
