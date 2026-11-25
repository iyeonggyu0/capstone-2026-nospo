/** 페이지와 화를 각각 이번 주 최고 기록에 비례해 계산한다. */
export const getReadingRhythm = (records) => {
  const maxPages = Math.max(0, ...records.map(({ pages }) => pages || 0))
  const maxEpisodes = Math.max(0, ...records.map(({ episodes }) => episodes || 0))
  const ratios = records.map(({ pages = 0, episodes = 0 }) => ({
    pages,
    episodes,
    pageRatio: maxPages ? pages / maxPages : 0,
    episodeRatio: maxEpisodes ? episodes / maxEpisodes : 0,
  }))
  const maxTotal = Math.max(
    1,
    ...ratios.map(({ pageRatio, episodeRatio }) => pageRatio + episodeRatio),
  )
  return ratios.map((record) => ({
    ...record,
    pageHeight: (48 * record.pageRatio) / maxTotal,
    episodeHeight: (48 * record.episodeRatio) / maxTotal,
  }))
}
