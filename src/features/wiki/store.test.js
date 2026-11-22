import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { findDraftGroup, getGroupDraftKey, useGroupDraftStore } from './store'

const initialState = useGroupDraftStore.getState()

beforeEach(() => {
  useGroupDraftStore.setState(initialState, true)
})

describe('단체 초안 스토어', () => {
  it('판본 식별자가 없으면 기본 키를 쓴다', () => {
    expect(getGroupDraftKey('e1')).toBe('e1')
    expect(getGroupDraftKey()).toBe('default')
    expect(getGroupDraftKey(null)).toBe('default')
  })

  it('추가한 초안을 이름 공백을 정리해 보관하고 번호를 이어서 붙인다', () => {
    const { addGroup } = useGroupDraftStore.getState()

    addGroup('e1', { name: '  신규 ', unlockEpisode: '3' })
    addGroup('e1', { name: '둘째', unlockEpisode: 5 })

    expect(useGroupDraftStore.getState().drafts.e1.addedGroups).toEqual([
      { id: 'draft-1', name: '신규', unlockEpisode: 3, memberCount: 0, isDraft: true },
      { id: 'draft-2', name: '둘째', unlockEpisode: 5, memberCount: 0, isDraft: true },
    ])
  })

  it('판본마다 초안을 따로 보관한다', () => {
    const { addGroup } = useGroupDraftStore.getState()

    addGroup('e1', { name: 'A', unlockEpisode: 1 })

    expect(useGroupDraftStore.getState().drafts.e2).toBeUndefined()
  })

  it('초안은 바로 지우고, 서버 단체는 삭제 목록에 한 번만 올린다', () => {
    const { addGroup, removeGroup } = useGroupDraftStore.getState()
    addGroup('e1', { name: 'A', unlockEpisode: 1 })

    removeGroup('e1', 'draft-1', false)
    removeGroup('e1', 'g1', true)
    removeGroup('e1', 'g1', true)

    expect(useGroupDraftStore.getState().drafts.e1).toEqual({
      addedGroups: [],
      removedGroupIds: ['g1'],
    })
  })

  it('초기화하면 해당 판본의 변경을 모두 버린다', () => {
    const { addGroup, resetDraft } = useGroupDraftStore.getState()
    addGroup('e1', { name: 'A', unlockEpisode: 1 })

    resetDraft('e1')

    expect(useGroupDraftStore.getState().drafts.e1).toEqual({
      addedGroups: [],
      removedGroupIds: [],
    })
  })

  it('모든 판본의 초안에서 식별자로 초안 단체를 찾는다', () => {
    const { addGroup } = useGroupDraftStore.getState()
    addGroup('e1', { name: 'A', unlockEpisode: 1 })
    addGroup('e2', { name: 'B', unlockEpisode: 2 })

    const found = findDraftGroup(useGroupDraftStore.getState().drafts, 'draft-2')

    expect(found.key).toBe('e2')
    expect(found.group.name).toBe('B')
    expect(findDraftGroup(useGroupDraftStore.getState().drafts, 'g1')).toBeUndefined()
  })

  it('초안 단체의 상세 편집 내용을 그 단체에 저장한다', () => {
    const { addGroup, saveDraftGroupDetail } = useGroupDraftStore.getState()
    addGroup('e1', { name: 'A', unlockEpisode: 1 })

    saveDraftGroupDetail('draft-1', {
      members: [{ id: 'p1', name: '서하준' }],
      relations: {},
      milestones: [{ id: 'm1', content: '첫 출항', unlockEpisode: 1 }],
    })

    const [group] = useGroupDraftStore.getState().drafts.e1.addedGroups
    expect(group.members).toHaveLength(1)
    expect(group.milestones[0].content).toBe('첫 출항')
    expect(group.memberCount).toBe(1)
  })

  it('서버 단체의 상세 임시 저장을 단체별로 보관하고, 제출 후 지운다', () => {
    const { saveDetailDraft, clearDetailDraft } = useGroupDraftStore.getState()
    const detail = { members: [{ id: 'p1', name: '서하준' }], relations: {}, milestones: [] }

    saveDetailDraft('g1', detail)
    saveDetailDraft('g2', { ...detail, members: [] })

    expect(useGroupDraftStore.getState().detailDrafts.g1).toEqual(detail)
    expect(Object.keys(useGroupDraftStore.getState().detailDrafts)).toEqual(['g1', 'g2'])

    clearDetailDraft('g1')

    expect(useGroupDraftStore.getState().detailDrafts.g1).toBeUndefined()
    expect(useGroupDraftStore.getState().detailDrafts.g2).toBeDefined()
  })
})

describe('단체 초안 스토어 (임시 저장 상태로 되돌리기)', () => {
  it('저장 안함은 마지막으로 임시 저장한 목록으로 되돌린다', () => {
    const { addGroup, saveDraftSnapshot, restoreDraftSnapshot } = useGroupDraftStore.getState()
    addGroup('e1', { name: '저장한 단체', unlockEpisode: 1 })
    saveDraftSnapshot('e1')
    addGroup('e1', { name: '저장 안 한 단체', unlockEpisode: 2 })

    restoreDraftSnapshot('e1')

    const names = useGroupDraftStore.getState().drafts.e1.addedGroups.map((group) => group.name)
    expect(names).toEqual(['저장한 단체'])
  })

  it('임시 저장한 적이 없으면 저장 안함은 목록 초안을 비운다', () => {
    const { addGroup, restoreDraftSnapshot } = useGroupDraftStore.getState()
    addGroup('e1', { name: 'A', unlockEpisode: 1 })

    restoreDraftSnapshot('e1')

    expect(useGroupDraftStore.getState().drafts.e1.addedGroups).toEqual([])
  })

  it('판본마다 임시 저장 상태를 따로 기억한다', () => {
    const { addGroup, saveDraftSnapshot, restoreDraftSnapshot } = useGroupDraftStore.getState()
    addGroup('e1', { name: 'A', unlockEpisode: 1 })
    saveDraftSnapshot('e1')
    addGroup('e2', { name: 'B', unlockEpisode: 1 })

    restoreDraftSnapshot('e2')

    expect(useGroupDraftStore.getState().drafts.e1.addedGroups).toHaveLength(1)
    expect(useGroupDraftStore.getState().drafts.e2.addedGroups).toEqual([])
  })

  it('검수 제출 후 초안을 비우면 임시 저장 상태도 함께 비운다', () => {
    const { addGroup, saveDraftSnapshot, resetDraft, restoreDraftSnapshot } =
      useGroupDraftStore.getState()
    addGroup('e1', { name: 'A', unlockEpisode: 1 })
    saveDraftSnapshot('e1')

    resetDraft('e1')
    restoreDraftSnapshot('e1')

    expect(useGroupDraftStore.getState().drafts.e1.addedGroups).toEqual([])
  })
})

describe('단체 초안 스토어 (새로고침 유지)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('초안을 sessionStorage에 저장하고, 모듈을 다시 불러와도(새로고침) 되살린다', async () => {
    const data = {}
    vi.stubGlobal('sessionStorage', {
      getItem: (key) => data[key] ?? null,
      setItem: (key, value) => {
        data[key] = value
      },
      removeItem: (key) => {
        delete data[key]
      },
    })
    vi.resetModules()
    const first = await import('./store')
    first.useGroupDraftStore.getState().addGroup('e1', { name: '새로고침 단체', unlockEpisode: 2 })

    expect(Object.keys(data)).toEqual(['nospo-wiki-group-drafts'])

    vi.resetModules()
    const reloaded = await import('./store')
    const [group] = reloaded.useGroupDraftStore.getState().drafts.e1.addedGroups

    expect(group.name).toBe('새로고침 단체')
    expect(reloaded.useGroupDraftStore.getState().lastDraftNumber).toBe(1)
  })
})
