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
