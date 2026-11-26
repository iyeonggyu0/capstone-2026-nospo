import { renderToStaticMarkup } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { GroupViewCard } from './GroupViewCard'
import { GroupViewDetailScreen } from './GroupViewDetailScreen'
import { GroupViewListScreen } from './GroupViewListScreen'

const group = {
  id: 'g1',
  name: '그리핀도르',
  scale: '중',
  memberCount: 12,
  members: [{ id: 'p1', name: '서하준', unlockEpisode: 1 }],
  relations: { friendly: [{ id: 'g2', name: '래번클로', scale: '중', memberCount: 9 }] },
  milestones: [{ id: 'm1', content: '첫 출항', unlockEpisode: 4 }],
}
const groups = [
  { id: 'g1', name: '그리핀도르', memberCount: 12 },
  { id: 'g2', name: '래번클로', memberCount: 9 },
]
const book = { title: '애주가의 절주 일기', progressLabel: '32화까지 읽음', statusLabel: '보호 중' }

/** 라우터가 필요한 화면을 서버 렌더링해서 HTML 글자로 돌려준다. */
const render = (element) =>
  renderToStaticMarkup(<StaticRouter location="/">{element}</StaticRouter>)

describe('GroupViewCard', () => {
  it('이미지·이름은 단체 상세(보기)로, 수정하기는 편집 상세로 이동하고 삭제 버튼은 없다', () => {
    const html = render(<GroupViewCard id="g1" memberCount={12} name="그리핀도르" />)

    expect(html).toContain('href="/wiki/view/group/detail?groupId=g1"')
    expect(html).toContain('href="/wiki/register/group/detail?groupId=g1&amp;mode=edit"')
    expect(html).toContain('12명')
    expect(html).toContain('수정하기')
    expect(html).not.toContain('삭제')
  })

  it('인원을 모르면 -로 보여준다', () => {
    expect(render(<GroupViewCard id="g1" name="그리핀도르" />)).toContain('>-<')
  })
})

describe('GroupViewListScreen', () => {
  it('도서, 칩, 안내, 단체 카드와 신규 단체 추가 링크를 읽기 전용으로 보여준다', () => {
    const html = render(<GroupViewListScreen book={book} groups={groups} personCount={7} />)

    expect(html).toContain('애주가의 절주 일기')
    expect(html).toContain('32화까지 읽음')
    expect(html).toContain('위키 내용 편집')
    expect(html).toContain('인물')
    expect(html).toContain('검수 승인 시 AI 토큰 최대 10개를 보상으로 드려요.')
    expect(html).toContain('그리핀도르')
    expect(html).toContain('래번클로')
    expect(html).toContain('href="/wiki/register/group"')
    expect(html).toContain('신규 단체 추가')
  })

  it('편집 컨트롤이 없다: 삭제, 검수 제출, 저장 안 함, 임시 저장, 뒤로 가기', () => {
    const html = render(<GroupViewListScreen book={book} groups={groups} />)

    expect(html).not.toContain('삭제')
    expect(html).not.toContain('검수 제출')
    expect(html).not.toContain('저장 안 함')
    expect(html).not.toContain('임시 저장')
    expect(html).not.toContain('뒤로 가기')
  })

  it('헤더에 진도 변경이 있다', () => {
    expect(render(<GroupViewListScreen book={{ ...book, currentEpisode: 32 }} />)).toContain(
      '진도 변경',
    )
  })

  it('신규 단체 추가는 넘겨준 주소와 값으로 이동한다', () => {
    const html = render(<GroupViewListScreen addTo="/wiki/register/group?x=1" book={book} />)

    expect(html).toContain('href="/wiki/register/group?x=1"')
  })

  it('로딩, 빈 목록, 오류 상태를 각각 보여준다', () => {
    expect(render(<GroupViewListScreen status="loading" />)).toContain(
      '단체 목록을 불러오는 중이에요.',
    )
    expect(render(<GroupViewListScreen groups={[]} />)).toContain('아직 등록된 단체가 없어요.')
    expect(render(<GroupViewListScreen status="error" />)).toContain('다시 시도')
  })

  it('로딩 중과 오류 상태에서는 신규 단체 추가를 보여주지 않는다', () => {
    expect(render(<GroupViewListScreen status="loading" />)).not.toContain('신규 단체 추가')
    expect(render(<GroupViewListScreen status="error" />)).not.toContain('신규 단체 추가')
  })
})

describe('GroupViewDetailScreen', () => {
  it('단체 요약과 구성원 탭을 읽기 전용으로 보여준다', () => {
    const html = render(
      <GroupViewDetailScreen group={group} onBack={() => {}} progressLabel="32화 수정" />,
    )

    expect(html).toContain('단체 정보')
    expect(html).toContain('32화 수정')
    expect(html).toContain('그리핀도르')
    expect(html).toContain('규모')
    expect(html).toContain('12명')
    expect(html).toContain('구성원')
    expect(html).toContain('관계')
    expect(html).toContain('주요 행적')
    expect(html).toContain('서하준')
    expect(html).toContain('1화')
  })

  it('편집 컨트롤이 없다: 인물 검색, 삭제, 순서 바꾸기, 검수 제출, 임시 저장', () => {
    const html = render(<GroupViewDetailScreen group={group} onBack={() => {}} />)

    expect(html).not.toContain('인물 검색')
    expect(html).not.toContain('삭제')
    expect(html).not.toContain('순서 바꾸기')
    expect(html).not.toContain('검수 제출')
    expect(html).not.toContain('임시 저장')
  })

  it('뒤로가기는 돌아갈 방법이 있을 때만 보여준다', () => {
    expect(render(<GroupViewDetailScreen group={group} onBack={() => {}} />)).toContain(
      'aria-label="뒤로 가기"',
    )
    expect(render(<GroupViewDetailScreen group={group} />)).not.toContain('뒤로 가기')
  })

  it('규모를 모르는 단체도 규모 줄을 -로 보여준다', () => {
    const html = render(<GroupViewDetailScreen group={{ ...group, scale: undefined }} />)

    expect(html).toContain('규모')
    expect(html).toContain('>-<')
  })

  it('로딩, 단체 없음, 오류 상태를 각각 보여주고 다음 행동 버튼을 준다', () => {
    expect(render(<GroupViewDetailScreen status="loading" />)).toContain(
      '단체 정보를 불러오는 중이에요.',
    )
    const notFound = render(<GroupViewDetailScreen onBack={() => {}} />)
    expect(notFound).toContain('단체를 찾을 수 없어요.')
    expect(notFound).toContain('돌아가기')
    expect(render(<GroupViewDetailScreen status="error" />)).toContain('다시 시도')
  })
})
