import { apiClient } from '@/lib/api-client'

/** 서재의 도서 유형별 목록을 조회한다. */
export const getShelf = async ({ bookType, sort, cursor, signal }) =>
  (await apiClient.get('/v1/me/shelf', { params: { bookType, sort, cursor, limit: 6 }, signal }))
    .data.data

/** 검색 조건에 맞는 판본 목록을 조회한다. */
export const searchBooks = async ({ query, type, cursor, signal }) =>
  (await apiClient.get('/v1/books/search', { params: { query, type, cursor }, signal })).data.data

/** 로그인한 사용자의 최근 검색 이력을 조회한다. */
export const getSearchHistory = async ({ signal }) =>
  (await apiClient.get('/v1/me/search-history', { params: { limit: 5 }, signal })).data.data

/** 도서의 서재 등록 상태와 동시 수정용 ETag를 조회한다. */
export const getShelfBook = async (bookId, signal) => {
  const response = await apiClient.get(`/v1/me/shelf/${encodeURIComponent(bookId)}`, { signal })
  return response.data.data
}

/** 검색한 도서와 최초 진도를 서재에 등록한다. */
export const addShelfBook = async (bookId, position) =>
  (await apiClient.post('/v1/me/shelf', { bookId, position })).data.data

/** 최신 진도 ETag를 확인한 뒤 변경한다. */
export const changeShelfProgress = async (bookId, position) => {
  const url = `/v1/me/shelf/${encodeURIComponent(bookId)}/progress`
  const current = await apiClient.get(url)
  if (!current.headers.etag) throw new Error('진도 버전 정보를 확인할 수 없어요.')
  return (
    await apiClient.patch(url, { position }, { headers: { 'If-Match': current.headers.etag } })
  ).data.data
}

/** 현재 진도에서 공개된 인물과 단체를 조회한다. */
export const getVisibleWikiEntities = async (bookId, kind, cursor, signal) =>
  (
    await apiClient.get(`/v1/books/${encodeURIComponent(bookId)}/wiki/${kind}`, {
      params: { cursor, limit: 50 },
      signal,
    })
  ).data.data

/** 공개된 인물 또는 단체의 진도별 상세를 조회한다. */
export const getVisibleWikiEntity = async (bookId, kind, entityId, signal) =>
  (
    await apiClient.get(
      `/v1/books/${encodeURIComponent(bookId)}/wiki/${kind}/${encodeURIComponent(entityId)}`,
      { signal },
    )
  ).data.data

/** 서버가 반환한 위키 이미지 경로만 인증 헤더와 함께 조회한다. */
export const getWikiImage = async (imageUrl, signal) => {
  const match = /^\/api(\/v1\/wiki\/assets\/[0-9a-f-]+)(\?positionValue=\d+)?$/i.exec(imageUrl)
  if (!match) throw new Error('잘못된 위키 이미지 주소입니다.')
  return (await apiClient.get(`${match[1]}${match[2] ?? ''}`, { responseType: 'blob', signal }))
    .data
}
