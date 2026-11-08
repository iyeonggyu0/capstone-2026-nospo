import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api-client', () => ({ apiClient: { request: vi.fn() } }))

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
  vi.clearAllMocks()
})

describe('단체 API (실제 환경)', () => {
  it('목록, 상세, 제출 요청을 공통 apiClient로 전달한다', async () => {
    vi.stubEnv('DEV', false)
    const { apiClient } = await import('@/lib/api-client')
    apiClient.request.mockResolvedValue({ data: { data: { ok: true } } })
    const { groupApi } = await import('./wiki')

    await expect(groupApi.list('e1')).resolves.toEqual({ ok: true })
    await groupApi.detail('g 1')
    await groupApi.submitGroups({
      editionId: 'e1',
      groups: [{ id: 'draft-1', name: '신규', unlockEpisode: 3, memberCount: 0, isDraft: true }],
    })
    await groupApi.submitGroupDetail({
      groupId: 'g1',
      members: [],
      relations: {},
      milestones: [],
    })

    expect(apiClient.request).toHaveBeenNthCalledWith(1, {
      method: 'get',
      url: '/v1/wiki/groups',
      data: undefined,
      params: { editionId: 'e1' },
    })
    expect(apiClient.request).toHaveBeenNthCalledWith(2, {
      method: 'get',
      url: '/v1/wiki/groups/g%201',
      data: undefined,
    })
    expect(apiClient.request).toHaveBeenNthCalledWith(3, {
      method: 'post',
      url: '/v1/wiki/group-proposals',
      data: { editionId: 'e1', groups: [{ name: '신규', unlockEpisode: 3 }], removedGroupIds: [] },
    })
    expect(apiClient.request).toHaveBeenNthCalledWith(4, {
      method: 'post',
      url: '/v1/wiki/groups/g1/edit-proposals',
      data: { members: [], relations: {}, milestones: [] },
    })
  })
})

describe('단체 API (개발 모의 응답)', () => {
  it('목록과 상세를 모의 응답으로 돌려주고 apiClient를 호출하지 않는다', async () => {
    vi.stubEnv('DEV', true)
    const { apiClient } = await import('@/lib/api-client')
    const { groupApi } = await import('./wiki')

    const list = await groupApi.list('e1')
    const detail = await groupApi.detail('g1')

    expect(list.items.length).toBeGreaterThan(0)
    expect(list.book.currentEpisode).toBe(32)
    expect(detail.group.name).toBe('그리핀도르')
    expect(detail.group.relations.friendly[0].name).toBe('래번클로')
    expect(apiClient.request).not.toHaveBeenCalled()
  })

  it('없는 단체는 404 오류를 던진다', async () => {
    vi.stubEnv('DEV', true)
    const { groupApi } = await import('./wiki')

    await expect(groupApi.detail('nope')).rejects.toMatchObject({ response: { status: 404 } })
  })

  it('제출은 관리자 검토 대기(PENDING_REVIEW) 상태로 접수한다', async () => {
    vi.stubEnv('DEV', true)
    const { groupApi } = await import('./wiki')

    await expect(
      groupApi.submitGroups({ editionId: 'e1', groups: [{ name: '신규', unlockEpisode: 3 }] }),
    ).resolves.toMatchObject({ status: 'PENDING_REVIEW' })
  })

  it("제출 내용에 '실패'가 있으면 서버 연결 실패를 흉내 낸다", async () => {
    vi.stubEnv('DEV', true)
    const { groupApi, groupError } = await import('./wiki')

    const failure = await groupApi
      .submitGroups({ editionId: 'e1', groups: [{ name: '실패 시험', unlockEpisode: 3 }] })
      .catch((error) => error)

    expect(failure).toBeInstanceOf(Error)
    expect(groupError(failure)).toBe('서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.')
  })
})

describe('검수 진행 API', () => {
  it('실제 환경에서는 공통 apiClient로 검수 진행 상황을 요청한다', async () => {
    vi.stubEnv('DEV', false)
    const { apiClient } = await import('@/lib/api-client')
    apiClient.request.mockResolvedValue({ data: { data: { id: 'r 1' } } })
    const { reviewApi } = await import('./wiki')

    await expect(reviewApi.progress('r 1')).resolves.toEqual({ id: 'r 1' })
    expect(apiClient.request).toHaveBeenCalledWith({
      method: 'get',
      url: '/v1/wiki/reviews/r%201',
      data: undefined,
    })
  })

  it('개발 모의 응답은 관리자 검토 대기 상태와 도서 정보를 돌려준다', async () => {
    vi.stubEnv('DEV', true)
    const { reviewApi } = await import('./wiki')

    const review = await reviewApi.progress('r1')

    expect(review.status).toBe('PENDING_REVIEW')
    expect(review.submittedAt).toContain('2026-10-01')
    expect(review.book.reflectedEpisode).toBe(32)
  })

  it('없는 검수 신청은 404 오류를 던진다', async () => {
    vi.stubEnv('DEV', true)
    const { reviewApi } = await import('./wiki')

    await expect(reviewApi.progress('nope')).rejects.toMatchObject({
      response: { status: 404 },
    })
  })
})

describe('groupError', () => {
  it('서버 응답이 있으면 입력 확인 안내를, 없으면 연결 안내를 돌려준다', async () => {
    const { groupError } = await import('./wiki')

    expect(groupError({ response: { status: 400 } })).toBe(
      '요청을 처리하지 못했습니다. 입력 내용을 확인해 주세요.',
    )
    expect(groupError(new Error('network'))).toBe(
      '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.',
    )
  })
})
