import { expect, it } from 'vitest'
import { getCalendarDays } from './calendar'

it('요일에 맞는 빈 칸과 윤년 날짜를 포함한다', () => {
  const days = getCalendarDays('2024-02')
  expect(days.slice(0, 5)).toEqual([null, null, null, null, '2024-02-01'])
  expect(days).toContain('2024-02-29')
  expect(days).toHaveLength(35)
})
