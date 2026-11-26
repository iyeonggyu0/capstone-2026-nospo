import { describe, expect, it } from 'vitest'
import { isPreviewGroupId, PREVIEW_GROUP_DETAILS, PREVIEW_GROUP_ITEMS } from './previewGroups'

describe('previewGroups', () => {
  it('샘플 접두사로 시작하는 식별자만 샘플 단체로 본다', () => {
    expect(isPreviewGroupId('preview-g1')).toBe(true)
    expect(isPreviewGroupId('g1')).toBe(false)
    expect(isPreviewGroupId(null)).toBe(false)
    expect(isPreviewGroupId(undefined)).toBe(false)
  })

  it('샘플 목록은 상세와 같은 단체를 같은 식별자로 가진다', () => {
    expect(PREVIEW_GROUP_ITEMS.map((item) => item.id)).toEqual(Object.keys(PREVIEW_GROUP_DETAILS))
    expect(PREVIEW_GROUP_ITEMS).toHaveLength(4)
  })

  it('그리핀도르는 진도 때문에 숨겨질 인물 1명을 포함해 4명이다', () => {
    const group = PREVIEW_GROUP_DETAILS['preview-g1']

    expect(group.members).toHaveLength(4)
    expect(group.members.filter((member) => member.unlockEpisode > 32)).toHaveLength(1)
  })
})
