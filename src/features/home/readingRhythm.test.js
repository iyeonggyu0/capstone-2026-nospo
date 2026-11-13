import { expect, it } from 'vitest'
import { getReadingRhythm } from './readingRhythm'

it('페이지와 화는 서로 다른 기준으로 이번 주 독서량을 비교한다', () => {
  expect(
    getReadingRhythm([
      { pages: 100, episodes: 0 },
      { pages: 50, episodes: 4 },
      { pages: 0, episodes: 8 },
      { pages: 0, episodes: 0 },
    ]),
  ).toEqual([
    { pages: 100, episodes: 0, pageRatio: 1, episodeRatio: 0, pageHeight: 48, episodeHeight: 0 },
    {
      pages: 50,
      episodes: 4,
      pageRatio: 0.5,
      episodeRatio: 0.5,
      pageHeight: 24,
      episodeHeight: 24,
    },
    { pages: 0, episodes: 8, pageRatio: 0, episodeRatio: 1, pageHeight: 0, episodeHeight: 48 },
    { pages: 0, episodes: 0, pageRatio: 0, episodeRatio: 0, pageHeight: 0, episodeHeight: 0 },
  ])
})

it('같은 페이지 기록은 같은 높이이고 함께 읽은 화가 있어도 변하지 않는다', () => {
  const [pagesOnly, both] = getReadingRhythm([
    { pages: 35, episodes: 0 },
    { pages: 35, episodes: 8 },
  ])
  expect(pagesOnly.pageHeight).toBe(both.pageHeight)
  expect(both.pageHeight + both.episodeHeight).toBe(48)
})
