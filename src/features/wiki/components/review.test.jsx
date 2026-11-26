import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderToStaticMarkup } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { reviewApi } from '../api/wiki'
import { REVIEW_STEPS } from '../constants'
import { reviewQueryKeys } from '../hooks/useReviewQueries'
import { ReviewProgressContainer } from './ReviewProgressContainer'
import { ReviewProgressScreen } from './ReviewProgressScreen'
import { ReviewStepper } from './ReviewStepper'

const review = {
  id: 'r1',
  status: 'PENDING_REVIEW',
  submittedAt: '2026-10-01T09:30:00+09:00',
  book: { title: '애주가의 절주 일기', reflectedEpisode: 32, episodeUnit: '화' },
}

/** 라우터가 필요한 화면을 서버 렌더링해서 HTML 글자로 돌려준다. */
const renderWithRouter = (element) =>
  renderToStaticMarkup(<StaticRouter location="/">{element}</StaticRouter>)

/** 필요한 조회를 미리 해 둔 캐시로 Container를 서버 렌더링한다. */
const renderContainer = async (element, reviewId) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, retryOnMount: false } },
  })
  if (reviewId) {
    await client.prefetchQuery({
      queryKey: reviewQueryKeys.progress(reviewId),
      queryFn: () => reviewApi.progress(reviewId),
      retry: false,
    })
  }

  return renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <StaticRouter location="/">{element}</StaticRouter>
    </QueryClientProvider>,
  )
}

describe('ReviewStepper', () => {
  it('현재 단계에만 현재 칩과 aria-current를 붙인다', () => {
    const html = renderToStaticMarkup(<ReviewStepper currentStepId="submit" steps={REVIEW_STEPS} />)

    expect(html.match(/현재/g)).toHaveLength(1)
    expect(html.match(/aria-current="step"/g)).toHaveLength(1)
    expect(html).toContain('제출')
    expect(html).toContain('검수 의견을 반영해 한 항목을 수정해 주세요.')
  })

  it('이미 지난 단계는 채운 점으로, 앞으로 올 단계는 연한 점으로 그린다', () => {
    const html = renderToStaticMarkup(<ReviewStepper currentStepId="review" steps={REVIEW_STEPS} />)

    expect(html.match(/bg-teal-strong flex|flex size-7[^"]*bg-teal-strong/g)).toHaveLength(2)
    expect(html.match(/bg-control-neutral/g)).toHaveLength(1)
  })

  it('모르는 단계 식별자면 첫 단계를 현재로 본다', () => {
    const html = renderToStaticMarkup(<ReviewStepper currentStepId="x" steps={REVIEW_STEPS} />)

    expect(html.match(/aria-current="step"/g)).toHaveLength(1)
  })
})

describe('ReviewProgressScreen', () => {
  it('Figma처럼 도서 카드, 제출 안내, 진행 흐름, 돌아가기를 보여준다', () => {
    const html = renderWithRouter(<ReviewProgressScreen backTo="/wiki/reviews" review={review} />)

    expect(html).toContain('애주가의 절주 일기')
    expect(html).toContain('32화까지 반영')
    expect(html).toContain('2026.10.01 제출')
    expect(html).toContain('제출이 되었어요! 검수가 끝나면 토큰이 지급될 예정입니다.')
    expect(html).toContain('입력한 위키 내용과 해금 시점이 접수되었어요.')
    expect(html).toContain('수정본이 승인되면 위키에 안전하게 반영됩니다.')
    expect(html).toContain('href="/wiki/reviews"')
    expect(html).toContain('돌아가기')
  })

  it('제출 직후가 아닌 단계에서는 제출 안내를 보여주지 않는다', () => {
    const html = renderWithRouter(
      <ReviewProgressScreen backTo="/wiki/reviews" review={{ ...review, status: 'APPROVED' }} />,
    )

    expect(html).not.toContain('제출이 되었어요!')
  })

  it('로딩, 신청 없음, 오류 상태를 각각 보여준다', () => {
    expect(renderWithRouter(<ReviewProgressScreen backTo="/x" status="loading" />)).toContain(
      '검수 진행 상황을 불러오는 중이에요.',
    )
    expect(renderWithRouter(<ReviewProgressScreen backTo="/x" />)).toContain(
      '신청 내역을 찾을 수 없어요.',
    )
    expect(renderWithRouter(<ReviewProgressScreen backTo="/x" status="error" />)).toContain(
      '다시 시도',
    )
  })
})

describe('ReviewProgressContainer', () => {
  it('식별자가 없으면 신청 내역을 찾을 수 없다고 보여준다', async () => {
    const html = await renderContainer(<ReviewProgressContainer backTo="/x" />)

    expect(html).toContain('신청 내역을 찾을 수 없어요.')
  })

  it('조회 전에는 로딩 상태를 보여준다', async () => {
    const html = await renderContainer(<ReviewProgressContainer backTo="/x" reviewId="r1" />)

    expect(html).toContain('검수 진행 상황을 불러오는 중이에요.')
  })

  it('조회한 검수 신청을 화면에 전달한다', async () => {
    const html = await renderContainer(
      <ReviewProgressContainer backTo="/wiki/reviews" reviewId="r1" />,
      'r1',
    )

    expect(html).toContain('32화까지 반영')
    expect(html).toContain('2026.10.01 제출')
    expect(html).toContain('제출이 되었어요!')
  })

  it('서버에 없는 신청(404)은 오류가 아니라 찾을 수 없음으로 보여준다', async () => {
    const html = await renderContainer(
      <ReviewProgressContainer backTo="/x" reviewId="nope" />,
      'nope',
    )

    expect(html).toContain('신청 내역을 찾을 수 없어요.')
    expect(html).not.toContain('다시 시도')
  })
})
