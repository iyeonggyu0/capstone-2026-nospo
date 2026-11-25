import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  preview: false,
  status: 'unknown',
  restoreSession: () => {},
  enablePreview: () => {},
}))
vi.mock('./store', () => ({ useAuth: (selector) => selector(state) }))

import { useIsLoggedIn } from './useIsLoggedIn'

afterEach(() => {
  vi.unstubAllEnvs()
  state.preview = false
})

it('개발 미리보기 상태는 주소가 바뀌어도 유지하고 운영에서는 무시한다', () => {
  state.preview = true
  const Check = () => <span>{String(useIsLoggedIn())}</span>
  vi.stubEnv('DEV', true)
  expect(
    renderToStaticMarkup(
      <MemoryRouter initialEntries={['/home']}>
        <Check />
      </MemoryRouter>,
    ),
  ).toContain('true')
  vi.stubEnv('DEV', false)
  expect(
    renderToStaticMarkup(
      <MemoryRouter initialEntries={['/home']}>
        <Check />
      </MemoryRouter>,
    ),
  ).toContain('false')
})

it('기록 화면은 이전 미리보기 상태가 있어도 주소에 preview가 없으면 인증을 확인한다', () => {
  state.preview = true
  vi.stubEnv('DEV', true)
  const Check = () => <span>{String(useIsLoggedIn({ persistPreview: false }))}</span>
  expect(
    renderToStaticMarkup(
      <MemoryRouter initialEntries={['/reading']}>
        <Check />
      </MemoryRouter>,
    ),
  ).toContain('false')
  expect(
    renderToStaticMarkup(
      <MemoryRouter initialEntries={['/reading?preview']}>
        <Check />
      </MemoryRouter>,
    ),
  ).toContain('true')
})

it.each([
  [true, '/home?preview', 'true'],
  [true, '/home', 'false'],
  [false, '/home?preview', 'false'],
])('preview 인증은 개발 모드에서만 적용한다: %s %s', (dev, path, expected) => {
  vi.stubEnv('DEV', dev)
  const Check = () => <span>{String(useIsLoggedIn())}</span>
  expect(
    renderToStaticMarkup(
      <MemoryRouter initialEntries={[path]}>
        <Check />
      </MemoryRouter>,
    ),
  ).toContain(expected)
})
