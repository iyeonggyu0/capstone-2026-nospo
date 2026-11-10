import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'

vi.mock('./store', () => ({
  useAuth: (selector) => selector({ status: 'unknown', restoreSession: () => {} }),
}))

import { useIsLoggedIn } from './useIsLoggedIn'

afterEach(() => {
  vi.unstubAllEnvs()
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
