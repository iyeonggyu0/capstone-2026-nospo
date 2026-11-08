import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderToStaticMarkup } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { groupApi } from '../api/wiki'
import { groupQueryKeys } from '../hooks/useGroupQueries'
import { GroupDetailContainer } from './GroupDetailContainer'
import { GroupListContainer } from './GroupListContainer'

/**
 * 필요한 조회를 미리 해 둔 캐시로 Container를 서버 렌더링해서 HTML 글자로 돌려준다.
 * 미리 실패해 둔 조회를 첫 렌더링에서 다시 시도(로딩)로 바꾸지 않도록 `retryOnMount`를 끈다. 앱 설정은 그대로다.
 */
const renderContainer = async (element, prefetch) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, retryOnMount: false } },
  })
  await prefetch?.(client)

  return renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <StaticRouter location="/">{element}</StaticRouter>
    </QueryClientProvider>,
  )
}

const prefetchList = (client) =>
  client.prefetchQuery({ queryKey: groupQueryKeys.list(null), queryFn: () => groupApi.list(null) })

const prefetchDetail = (groupId) => (client) =>
  client.prefetchQuery({
    queryKey: groupQueryKeys.detail(groupId),
    queryFn: () => groupApi.detail(groupId),
    retry: false,
  })

describe('GroupListContainer', () => {
  it('데이터를 받기 전에는 로딩 상태를 보여준다', async () => {
    const html = await renderContainer(<GroupListContainer />)

    expect(html).toContain('단체 목록을 불러오는 중이에요.')
  })

  it('조회한 도서 정보와 단체 목록을 목록 화면에 전달한다', async () => {
    const html = await renderContainer(<GroupListContainer />, prefetchList)

    expect(html).toContain('애주가의 절주 일기')
    expect(html).toContain('32화까지 읽음')
    expect(html).toContain('그리핀도르')
    expect(html).toContain('groupId=g1&amp;mode=edit')
    expect(html).toContain('신규 단체 추가')
  })
})

describe('GroupDetailContainer', () => {
  it('단체 식별자가 없으면 찾을 수 없음 안내를 보여준다', async () => {
    const html = await renderContainer(<GroupDetailContainer />)

    expect(html).toContain('단체를 찾을 수 없어요.')
  })

  it('조회 전에는 로딩 상태를 보여준다', async () => {
    const html = await renderContainer(<GroupDetailContainer groupId="g1" />)

    expect(html).toContain('단체 정보를 불러오는 중이에요.')
  })

  it('보기 모드에서는 단체 정보와 현재 진도를 보여주고 편집 컨트롤은 숨긴다', async () => {
    const html = await renderContainer(<GroupDetailContainer groupId="g1" />, prefetchDetail('g1'))

    expect(html).toContain('그리핀도르')
    expect(html).toContain('32화 수정')
    expect(html).toContain('서하준')
    expect(html).not.toContain('검수 제출')
  })

  it('편집 모드에서는 검색 줄과 검수 제출 영역을 보여준다', async () => {
    const html = await renderContainer(
      <GroupDetailContainer groupId="g1" mode="edit" />,
      prefetchDetail('g1'),
    )

    expect(html).toContain('인물 검색')
    expect(html).toContain('검수 제출')
  })

  it('서버에 없는 단체(404)는 오류가 아니라 찾을 수 없음으로 보여준다', async () => {
    const html = await renderContainer(
      <GroupDetailContainer groupId="nope" />,
      prefetchDetail('nope'),
    )

    expect(html).toContain('단체를 찾을 수 없어요.')
    expect(html).not.toContain('다시 시도')
  })
})
