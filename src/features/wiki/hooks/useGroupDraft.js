import { EMPTY_GROUP_DRAFT, getGroupDraftKey, useGroupDraftStore } from '../store'
import { composeGroups } from '../utils'

/**
 * 서버에서 받은 단체 목록 위에 사용자의 변경(새 단체 추가, 기존 단체 삭제)을 초안으로 얹어서 관리한다.
 * 초안은 판본별로 스토어(메모리)에 보관해 다른 화면에 갔다 와도 유지하며, 검수 제출 전에는 서버 데이터에 반영하지 않는다.
 *
 * @param {Array<{ id: string, name: string }>} [groups=[]] 서버에서 받은 단체 목록
 * @param {string | null} [editionId] 초안을 구분하는 도서 판본 식별자
 * @returns {{
 *   groups: Array,
 *   addedGroups: Array,
 *   removedGroupIds: string[],
 *   hasChanges: boolean,
 *   addGroup: (input: { name: string, unlockEpisode: number }) => void,
 *   removeGroup: (id: string) => void,
 *   reset: () => void,
 * }} 화면에 보여줄 목록과 초안 조작 함수
 */
export const useGroupDraft = (groups = [], editionId) => {
  const key = getGroupDraftKey(editionId)
  const { addedGroups, removedGroupIds } = useGroupDraftStore(
    (state) => state.drafts[key] ?? EMPTY_GROUP_DRAFT,
  )
  const addToStore = useGroupDraftStore((state) => state.addGroup)
  const removeFromStore = useGroupDraftStore((state) => state.removeGroup)
  const resetStore = useGroupDraftStore((state) => state.resetDraft)

  return {
    groups: composeGroups(groups, addedGroups, removedGroupIds),
    addedGroups,
    removedGroupIds,
    hasChanges: addedGroups.length > 0 || removedGroupIds.length > 0,
    addGroup: (input) => addToStore(key, input),
    removeGroup: (id) =>
      removeFromStore(
        key,
        id,
        groups.some((group) => group.id === id),
      ),
    reset: () => resetStore(key),
  }
}
