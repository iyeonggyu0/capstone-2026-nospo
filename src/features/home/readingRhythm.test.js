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
    { pages: 100, episodes: 0, pageRatio: 1, episodeRatio: 0 },
    { pages: 50, episodes: 4, pageRatio: 0.5, episodeRatio: 0.5 },
    { pages: 0, episodes: 8, pageRatio: 0, episodeRatio: 1 },
    { pages: 0, episodes: 0, pageRatio: 0, episodeRatio: 0 },
  ])
})
