import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderToStaticMarkup } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { groupApi } from '../api/wiki'
import { groupQueryKeys } from '../hooks/useGroupQueries'
import { useGroupDraftStore } from '../store'
import { toDetailEdit } from '../utils'
import { GroupDetailContainer } from './GroupDetailContainer'
import { GroupListContainer } from './GroupListContainer'
import { GroupViewDetailContainer } from './GroupViewDetailContainer'
import { GroupViewListContainer } from './GroupViewListContainer'

// 서버 렌더링은 Zustand 스토어의 '처음 상태'만 읽으므로, 이 파일에서는 스토어를 현재 상태를 읽는 대역으로 바꿔 끼운다.
vi.mock('../store', async (importOriginal) => {
  const actual = await importOriginal()
  const useGroupDraftStore = Object.assign(
    (selector) => selector(actual.useGroupDraftStore.getState()),
    actual.useGroupDraftStore,
  )

  return { ...actual, useGroupDraftStore }
})

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

const prefetchDetail = (groupId) => (client) =>
  client.prefetchQuery({
    queryKey: groupQueryKeys.detail(groupId),
    queryFn: () => groupApi.detail(groupId),
    retry: false,
  })

/** 테스트 전용 도서 정보다. 개발용 모의 서버에는 미리 만든 단체가 없으므로 필요한 데이터를 여기서 만든다. */
const fixtureBook = {
  title: '애주가의 절주 일기',
  progressLabel: '32화까지 읽음',
  editLabel: '32화 수정',
  currentEpisode: 32,
  episodeUnit: '화',
}

/** 테스트 전용 단체 상세다. */
const fixtureGroup = {
  id: 'g1',
  name: '그리핀도르',
  scale: '중',
  memberCount: 1,
  members: [{ id: 'p1', name: '서하준', unlockEpisode: 1 }],
  relations: {},
  milestones: [],
}

/** 목록 조회 결과를 캐시에 직접 넣어 둔다. */
const seedList = (client) =>
  client.setQueryData(groupQueryKeys.list(null), {
    book: fixtureBook,
    personCount: 1,
    items: [{ id: 'g1', name: '그리핀도르', memberCount: 1 }],
  })

/** 단체 상세 조회 결과를 캐시에 직접 넣어 둔다. */
const seedDetail = (groupId) => (client) =>
  client.setQueryData(groupQueryKeys.detail(groupId), { book: fixtureBook, group: fixtureGroup })

/** 상세 조회 결과와, 구성원으로 고를 수 있는 인물 목록 조회 결과를 캐시에 직접 넣어 둔다. */
const seedDetailWithPersons = (groupId) => (client) => {
  seedDetail(groupId)(client)
  client.setQueryData(groupQueryKeys.persons(undefined, fixtureBook.currentEpisode), {
    items: [
      { id: 'p1', name: '서하준', unlockEpisode: 1 },
      { id: 'p9', name: '새로운 인물', unlockEpisode: 5 },
      { id: 'p8', name: '아직 모르는 인물', unlockEpisode: 40 },
    ],
  })
}

describe('GroupListContainer', () => {
  it('데이터를 받기 전에는 로딩 상태를 보여준다', async () => {
    const html = await renderContainer(<GroupListContainer />)

    expect(html).toContain('단체 목록을 불러오는 중이에요.')
  })

  it('조회한 도서 정보와 단체 목록을 목록 화면에 전달한다', async () => {
    const html = await renderContainer(<GroupListContainer />, seedList)

    expect(html).toContain('애주가의 절주 일기')
    expect(html).toContain('32화까지 읽음')
    expect(html).toContain('그리핀도르')
    expect(html).toContain('groupId=g1&amp;mode=edit')
    expect(html).toContain('신규 단체 추가')
  })

  it('이동 때 넘어온 진도가 있으면 서버가 준 진도 문구 대신 그 값으로 보여준다', async () => {
    const html = await renderContainer(<GroupListContainer position={40} />, seedList)

    expect(html).toContain('40화까지 읽음')
    expect(html).not.toContain('32화까지 읽음')
  })
})

describe('GroupViewListContainer (위키 내용 보기)', () => {
  it('서버에 올라간 단체를 보기 목록으로 보여주고 편집 컨트롤은 없다', async () => {
    const html = await renderContainer(<GroupViewListContainer />, seedList)

    expect(html).toContain('애주가의 절주 일기')
    expect(html).toContain('그리핀도르')
    expect(html).toContain('href="/wiki/view/group/detail?groupId=g1"')
    expect(html).toContain('href="/wiki/register/group/detail?groupId=g1&amp;mode=edit"')
    expect(html).not.toContain('삭제')
    expect(html).not.toContain('검수 제출')
  })

  it('서버의 전체 인원수는 진도 이후 구성원까지 세므로 카드에서 숨기고 -로 보여준다', async () => {
    const html = await renderContainer(<GroupViewListContainer />, seedList)

    expect(html).not.toContain('1명')
    expect(html).toContain('>-<')
  })

  it('편집 화면에서 임시로 추가한 단체는 보기 목록에 섞이지 않는다', async () => {
    useGroupDraftStore.getState().addGroup('default', { name: '임시 단체', unlockEpisode: 1 })

    const html = await renderContainer(<GroupViewListContainer />, seedList)

    expect(html).not.toContain('임시 단체')
    useGroupDraftStore.setState(useGroupDraftStore.getInitialState(), true)
  })

  it('데이터를 받기 전에는 로딩 상태를 보여준다', async () => {
    const html = await renderContainer(<GroupViewListContainer />)

    expect(html).toContain('단체 목록을 불러오는 중이에요.')
  })

  it('이동 때 넘어온 진도가 있으면 그 값으로 진도 문구를 보여준다', async () => {
    const html = await renderContainer(<GroupViewListContainer position={40} />, seedList)

    expect(html).toContain('40화까지 읽음')
    expect(html).not.toContain('32화까지 읽음')
  })
})

describe('GroupViewDetailContainer (위키 내용 보기)', () => {
  /** 현재 진도(32화)보다 뒤에 등장하는 구성원이 섞인 단체 상세를 캐시에 넣는다. */
  const seedWithLocked = (client) =>
    client.setQueryData(groupQueryKeys.detail('g1'), {
      book: fixtureBook,
      group: {
        ...fixtureGroup,
        members: [
          { id: 'p1', name: '서하준', unlockEpisode: 1 },
          { id: 'p7', name: '아직 모르는 인물', unlockEpisode: 40 },
        ],
      },
    })

  it('단체 정보와 현재 진도를 읽기 전용으로 보여준다', async () => {
    const html = await renderContainer(<GroupViewDetailContainer groupId="g1" />, seedDetail('g1'))

    expect(html).toContain('그리핀도르')
    expect(html).toContain('32화 수정')
    expect(html).toContain('서하준')
    expect(html).not.toContain('인물 검색')
    expect(html).not.toContain('검수 제출')
    expect(html).not.toContain('임시 저장')
  })

  it('가린 구성원 수만큼 인원에서도 빼서 숨은 인원 수가 드러나지 않게 한다', async () => {
    const seedCounted = (client) =>
      client.setQueryData(groupQueryKeys.detail('g1'), {
        book: fixtureBook,
        group: {
          ...fixtureGroup,
          memberCount: 3,
          members: [
            { id: 'p1', name: '서하준', unlockEpisode: 1 },
            { id: 'p2', name: '배서현', unlockEpisode: 3 },
            { id: 'p7', name: '아직 모르는 인물', unlockEpisode: 40 },
          ],
        },
      })

    const html = await renderContainer(<GroupViewDetailContainer groupId="g1" />, seedCounted)

    expect(html).toContain('2명')
    expect(html).not.toContain('3명')
  })

  it('현재 진도보다 뒤에 등장하는 구성원은 이름도 보이지 않는다', async () => {
    const html = await renderContainer(<GroupViewDetailContainer groupId="g1" />, seedWithLocked)

    expect(html).toContain('서하준')
    expect(html).not.toContain('아직 모르는 인물')
  })

  it('이동 때 넘어온 진도를 낮추면 그 진도 기준으로 더 많이 가린다', async () => {
    const seedEarly = (client) =>
      client.setQueryData(groupQueryKeys.detail('g1'), {
        book: fixtureBook,
        group: {
          ...fixtureGroup,
          members: [{ id: 'p5', name: '5화에 등장하는 인물', unlockEpisode: 5 }],
        },
      })

    const atThree = await renderContainer(
      <GroupViewDetailContainer groupId="g1" position={3} />,
      seedEarly,
    )
    const atFive = await renderContainer(
      <GroupViewDetailContainer groupId="g1" position={5} />,
      seedEarly,
    )

    expect(atThree).not.toContain('5화에 등장하는 인물')
    expect(atFive).toContain('5화에 등장하는 인물')
  })

  it('이동 때 넘어온 진도와 작성 방식으로 배지 문구를 만든다', async () => {
    const html = await renderContainer(
      <GroupViewDetailContainer groupId="g1" position={40} wikiMode="CREATE" />,
      seedDetail('g1'),
    )

    expect(html).toContain('40화 등록')
  })

  it('서버에 없는 단체(임시 초안 포함)는 찾을 수 없음과 돌아가기 버튼을 보여준다', async () => {
    const html = await renderContainer(
      <GroupViewDetailContainer groupId="draft-1" onBack={() => {}} />,
      prefetchDetail('draft-1'),
    )

    expect(html).toContain('단체를 찾을 수 없어요.')
    expect(html).toContain('돌아가기')
  })

  it('식별자가 없으면 찾을 수 없음, 조회 전에는 로딩 상태를 보여준다', async () => {
    expect(await renderContainer(<GroupViewDetailContainer />)).toContain('단체를 찾을 수 없어요.')
    expect(await renderContainer(<GroupViewDetailContainer groupId="g1" />)).toContain(
      '단체 정보를 불러오는 중이에요.',
    )
  })
})

describe('GroupDetailContainer (새로 추가한 단체)', () => {
  const initialState = useGroupDraftStore.getState()

  afterEach(() => {
    useGroupDraftStore.setState(initialState, true)
  })

  it('서버에 없는 초안 단체도 찾을 수 없다고 하지 않고 스토어의 초안으로 보여준다', async () => {
    useGroupDraftStore.getState().addGroup('default', { name: '신규 단체', unlockEpisode: 3 })

    const html = await renderContainer(<GroupDetailContainer groupId="draft-1" mode="edit" />)

    expect(html).toContain('신규 단체')
    expect(html).not.toContain('단체를 찾을 수 없어요.')
    expect(html).not.toContain('불러오는 중')
  })

  it('새로 추가한 단체는 편집하기 전에도 검수 제출 버튼이 활성이다', async () => {
    useGroupDraftStore.getState().addGroup('default', { name: '신규 단체', unlockEpisode: 3 })

    const html = await renderContainer(<GroupDetailContainer groupId="draft-1" mode="edit" />)

    expect(getSubmitButtonTag(html)).not.toMatch(DISABLED_ATTRIBUTE)
  })
})

/** 버튼의 `disabled` 속성만 찾는다. `disabled:opacity-50` 같은 CSS 클래스 이름은 속성이 아니므로 제외한다. */
const DISABLED_ATTRIBUTE = /\sdisabled(=|\s|>)/

/** HTML에서 `text` 글자가 들어 있는 버튼의 여는 태그를 찾아 돌려준다. */
const getButtonTag = (html, text) => {
  const textIndex = html.indexOf(text)
  const start = html.lastIndexOf('<button', textIndex)

  return html.slice(start, html.indexOf('>', start) + 1)
}

/** `검수 제출` 버튼의 여는 태그를 돌려준다. */
const getSubmitButtonTag = (html) => getButtonTag(html, '검수 제출')

describe('GroupDetailContainer (임시 저장·구성원 선택)', () => {
  const initialState = useGroupDraftStore.getState()

  afterEach(() => {
    useGroupDraftStore.setState(initialState, true)
  })

  it('편집 모드에서는 임시 저장 버튼이 활성이다', async () => {
    const html = await renderContainer(
      <GroupDetailContainer groupId="g1" mode="edit" />,
      seedDetail('g1'),
    )

    expect(getButtonTag(html, '임시 저장')).not.toMatch(DISABLED_ATTRIBUTE)
  })

  it('임시 저장한 서버 단체는 저장한 내용으로 다시 열고, 편집 전에도 검수 제출을 누를 수 있다', async () => {
    // 임시 저장에는 서버 데이터 전체가 아니라 편집한 부분(toDetailEdit)만 들어간다.
    useGroupDraftStore.getState().saveDetailDraft(
      'g1',
      toDetailEdit(fixtureGroup, {
        members: [{ id: 'p9', name: '임시 저장한 구성원' }],
        relations: {},
        milestones: [],
      }),
    )

    const html = await renderContainer(
      <GroupDetailContainer groupId="g1" mode="edit" />,
      seedDetail('g1'),
    )

    expect(html).toContain('임시 저장한 구성원')
    expect(html).not.toContain('서하준 삭제')
    expect(getSubmitButtonTag(html)).not.toMatch(DISABLED_ATTRIBUTE)
  })

  it('구성원은 인물 목록에서 고르며, 이미 구성원인 인물은 자동완성 후보에서 뺀다', async () => {
    const html = await renderContainer(
      <GroupDetailContainer groupId="g1" mode="edit" />,
      seedDetailWithPersons('g1'),
    )

    expect(html).toContain('<datalist')
    expect(html).toContain('value="새로운 인물"')
    expect(html).not.toContain('value="서하준"')
  })

  it('현재 진도보다 뒤에 등장하는 인물은 서버가 보내도 후보에 나오지 않는다', async () => {
    const html = await renderContainer(
      <GroupDetailContainer groupId="g1" mode="edit" />,
      seedDetailWithPersons('g1'),
    )

    expect(html).not.toContain('아직 모르는 인물')
  })
})

describe('GroupDetailContainer', () => {
  it('서버에 있는 단체는 편집하기 전에는 검수 제출 버튼이 비활성이다', async () => {
    const html = await renderContainer(
      <GroupDetailContainer groupId="g1" mode="edit" />,
      seedDetail('g1'),
    )

    expect(getSubmitButtonTag(html)).toMatch(DISABLED_ATTRIBUTE)
  })

  it('단체 식별자가 없으면 찾을 수 없음 안내를 보여준다', async () => {
    const html = await renderContainer(<GroupDetailContainer />)

    expect(html).toContain('단체를 찾을 수 없어요.')
  })

  it('조회 전에는 로딩 상태를 보여준다', async () => {
    const html = await renderContainer(<GroupDetailContainer groupId="g1" />)

    expect(html).toContain('단체 정보를 불러오는 중이에요.')
  })

  it('mode=view로 열면 단체 정보와 현재 진도를 보여주고 편집 컨트롤은 숨긴다', async () => {
    const html = await renderContainer(
      <GroupDetailContainer groupId="g1" mode="view" />,
      seedDetail('g1'),
    )

    expect(html).toContain('그리핀도르')
    expect(html).toContain('32화 수정')
    expect(html).toContain('서하준')
    expect(html).not.toContain('검수 제출')
  })

  it('이동 때 넘어온 진도와 작성 방식(CREATE)으로 진도 배지 문구를 만든다', async () => {
    const created = await renderContainer(
      <GroupDetailContainer groupId="g1" position={40} wikiMode="CREATE" />,
      seedDetail('g1'),
    )
    const updated = await renderContainer(
      <GroupDetailContainer groupId="g1" position={40} wikiMode="UPDATE" />,
      seedDetail('g1'),
    )

    expect(created).toContain('40화 등록')
    expect(updated).toContain('40화 수정')
    expect(created).not.toContain('32화 수정')
  })

  it('mode가 없어도 편집 모드로 열려 검색 줄, 삭제, 검수 제출이 보인다', async () => {
    const html = await renderContainer(<GroupDetailContainer groupId="g1" />, seedDetail('g1'))

    expect(html).toContain('인물 검색')
    expect(html).toContain('서하준 삭제')
    expect(html).toContain('검수 제출')
  })

  it('편집 모드에서는 검색 줄과 검수 제출 영역을 보여준다', async () => {
    const html = await renderContainer(
      <GroupDetailContainer groupId="g1" mode="edit" />,
      seedDetail('g1'),
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
