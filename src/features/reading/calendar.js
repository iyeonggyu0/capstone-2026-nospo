/** 달력 앞뒤의 빈 칸과 월의 날짜를 일요일부터 배열한다. */
export const getCalendarDays = (month) => {
  const [year, number] = month.split('-').map(Number)
  const firstDay = new Date(Date.UTC(year, number - 1, 1)).getUTCDay()
  const count = new Date(Date.UTC(year, number, 0)).getUTCDate()
  const cells = Array(firstDay).fill(null)
  for (let day = 1; day <= count; day += 1) cells.push(`${month}-${String(day).padStart(2, '0')}`)
  while (cells.length % 7) cells.push(null)
  return cells
}
