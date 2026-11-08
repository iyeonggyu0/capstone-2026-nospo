import { renderToStaticMarkup } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { GroupDetailScreen } from './GroupDetailScreen'
import { GroupListScreen } from './GroupListScreen'
import { GroupMilestoneList } from './GroupMilestoneList'
import { GroupRelationList } from './GroupRelationList'

const group = {
  id: 'g1',
  name: '그리핀도르',
  scale: '중',
  memberCount: 12,
  members: [{ id: 'p1', name: '서하준', unlockEpisode: 1 }],
  relations: {
    friendly: [{ id: 'g2', name: '래번클로', scale: '중', memberCount: 9 }],
    hostile: [{ id: 'g4', name: '슬리데린', scale: '대', memberCount: 11 }],
  },
  milestones: [
    { id: 'm1', content: '첫 번째 행적', unlockEpisode: 4 },
    { id: 'm2', content: '두 번째 행적', unlockEpisode: 12 },
  ],
}
const groups = [
  { id: 'g1', name: '그리핀도르', memberCount: 12 },
  { id: 'g2', name: '래번클로', memberCount: 9 },
]
const book = { title: '애주가의 절주 일기', progressLabel: '32화까지 읽음', statusLabel: '보호 중' }

/** 라우터가 필요한 화면을 서버 렌더링해서 HTML 글자로 돌려준다. */
const renderWithRouter = (element) =>
  renderToStaticMarkup(<StaticRouter location="/">{element}</StaticRouter>)

describe('GroupListScreen', () => {
  it('도서, 칩, 안내, 단체 카드, 수정하기 링크, 신규 단체 추가를 보여준다', () => {
    const html = renderWithRouter(<GroupListScreen book={book} groups={groups} personCount={7} />)

    expect(html).toContain('애주가의 절주 일기')
    expect(html).toContain('위키 내용 편집')
    expect(html).toContain('인물')
    expect(html).toContain('검수 승인 시 AI 토큰 최대 10개를 보상으로 드려요.')
    expect(html).toContain('그리핀도르')
    expect(html).toContain('href="/wiki/register/group/detail?groupId=g2&amp;mode=edit"')
    expect(html).toContain('신규 단체 추가')
  })

  it('보기 모드에서는 Figma 보기 프레임처럼 삭제 버튼과 검수 제출 영역이 없다', () => {
    const html = renderWithRouter(
      <GroupListScreen groups={groups} mode="view" onSubmit={() => {}} />,
    )

    expect(html).toContain('수정하기')
    expect(html).toContain('신규 단체 추가')
    expect(html).not.toContain('삭제')
    expect(html).not.toContain('검수 제출')
  })

  it('기본(편집)에서는 처음부터 모든 단체 카드에 삭제 버튼과 검수 제출 영역을 보여준다', () => {
    const html = renderWithRouter(<GroupListScreen groups={groups} onSubmit={() => {}} />)

    expect(html).toContain('그리핀도르 삭제')
    expect(html).toContain('래번클로 삭제')
    expect(html).toContain('검수 제출')
    expect(html).toContain('저장 안함')
  })

  it('편집 모드에서 변경이 없으면 검수 제출 버튼이 비활성이다', () => {
    const html = renderWithRouter(
      <GroupListScreen groups={groups} mode="edit" onSubmit={() => {}} />,
    )

    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>검수 제출<\/button>/)
  })

  it('로딩 중에는 검수 제출 영역을 보여주지 않는다', () => {
    expect(renderWithRouter(<GroupListScreen mode="edit" status="loading" />)).not.toContain(
      '검수 제출',
    )
  })

  it('로딩, 빈 목록, 오류 상태를 각각 보여준다', () => {
    expect(renderWithRouter(<GroupListScreen status="loading" />)).toContain(
      '단체 목록을 불러오는 중이에요.',
    )
    expect(renderWithRouter(<GroupListScreen groups={[]} />)).toContain(
      '아직 등록된 단체가 없어요.',
    )
    expect(renderWithRouter(<GroupListScreen status="error" />)).toContain('다시 시도')
  })
})

describe('GroupDetailScreen', () => {
  it('보기 모드에서는 요약과 탭을 보여주고 편집 컨트롤은 숨긴다', () => {
    const html = renderWithRouter(<GroupDetailScreen group={group} progressLabel="2권 7장 수정" />)

    expect(html).toContain('단체 정보')
    expect(html).toContain('2권 7장 수정')
    expect(html).toContain('규모')
    expect(html).toContain('구성원')
    expect(html).toContain('서하준')
    expect(html).toContain('1화')
    expect(html).not.toContain('검수 제출')
    expect(html).not.toContain('인물 검색')
    expect(html).not.toContain('삭제')
  })

  it('편집 모드에서는 검색 줄, 삭제 버튼, 검수 제출 영역을 보여준다', () => {
    const html = renderWithRouter(<GroupDetailScreen group={group} mode="edit" />)

    expect(html).toContain('인물 검색')
    expect(html).toContain('서하준 삭제')
    expect(html).toContain('검수 제출')
    expect(html).toContain('저장 안함')
    expect(html).toContain('임시 저장')
  })

  it('변경이 없으면 검수 제출 버튼이 비활성이다', () => {
    const html = renderWithRouter(
      <GroupDetailScreen group={group} mode="edit" onSubmit={() => {}} />,
    )

    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>검수 제출<\/button>/)
  })

  it('로딩, 단체 없음, 오류 상태를 각각 보여준다', () => {
    expect(renderWithRouter(<GroupDetailScreen status="loading" />)).toContain(
      '단체 정보를 불러오는 중이에요.',
    )
    expect(renderWithRouter(<GroupDetailScreen />)).toContain('단체를 찾을 수 없어요.')
    expect(renderWithRouter(<GroupDetailScreen status="error" />)).toContain('다시 시도')
  })
})

describe('GroupRelationList', () => {
  it('항목이 없어도 우호·대립·중립 구간 제목을 모두 보여준다', () => {
    const html = renderWithRouter(<GroupRelationList relations={group.relations} />)

    expect(html).toContain('우호')
    expect(html).toContain('대립')
    expect(html).toContain('중립')
    expect(html).toContain('래번클로')
  })

  it('관계가 없으면 빈 상태 문구를 보여준다', () => {
    expect(renderWithRouter(<GroupRelationList />)).toContain('아직 등록된 관계가 없어요.')
  })
})

describe('편집 상태 레이아웃(Figma 기준)', () => {
  it('관계 탭은 편집일 때만 관계 제목과 단체 검색 줄, 항목 삭제 버튼을 보여준다', () => {
    const editHtml = renderWithRouter(
      <GroupRelationList editable onRemove={() => {}} relations={group.relations} />,
    )
    const viewHtml = renderWithRouter(<GroupRelationList relations={group.relations} />)

    expect(editHtml).toContain('id="group-relation-title"')
    expect(editHtml).toContain('단체 검색')
    expect(editHtml).toContain('래번클로 삭제')
    expect(viewHtml).not.toContain('group-relation-title')
    expect(viewHtml).not.toContain('단체 검색')
    expect(viewHtml).not.toContain('삭제')
  })

  it('행적이 없어도 편집 모드에서는 빈 목록 대신 안내와 추가 버튼만 보여준다', () => {
    const html = renderWithRouter(<GroupMilestoneList editable />)

    expect(html).toContain('아직 등록된 행적이 없어요.')
    expect(html).not.toContain('<ul')
    expect(html).toContain('추가')
  })

  it('하단 영역이 항상 아래에 붙도록 화면 본문에 최소 높이를 준다', () => {
    const detailHtml = renderWithRouter(<GroupDetailScreen group={group} mode="edit" />)

    expect(detailHtml).toContain('min-h-[calc(100%-4.75rem)]')
    expect(renderWithRouter(<GroupListScreen groups={groups} />)).toContain(
      'min-h-[calc(100%-4.75rem)]',
    )
  })
})

describe('GroupMilestoneList', () => {
  it('해금 시점이 큰 행적부터 최신 순으로 보여준다', () => {
    const html = renderWithRouter(<GroupMilestoneList milestones={group.milestones} />)

    expect(html.indexOf('두 번째 행적')).toBeLessThan(html.indexOf('첫 번째 행적'))
    expect(html).toContain('12화')
    expect(html).toContain('최신 순')
  })

  it('편집 모드에서는 편집·삭제 버튼과 추가 버튼을 보여준다', () => {
    const html = renderWithRouter(
      <GroupMilestoneList editable milestones={group.milestones} onRemove={() => {}} />,
    )

    expect(html).toContain('첫 번째 행적 편집')
    expect(html).toContain('첫 번째 행적 삭제')
    expect(html).toContain('추가')
  })

  it('행적이 없으면 빈 상태 문구를 보여준다', () => {
    expect(renderWithRouter(<GroupMilestoneList />)).toContain('아직 등록된 행적이 없어요.')
  })
})
