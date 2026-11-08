import { useRef, useState } from 'react'
import { composeGroups } from '../utils'

/**
 * 서버에서 받은 단체 목록 위에 사용자의 변경(새 단체 추가, 기존 단체 삭제)을 초안으로 얹어서 관리한다.
 * 초안은 화면 안에서만 유지하며, 검수 제출 전에는 서버 데이터에 반영하지 않는다.
 *
 * @param {Array<{ id: string, name: string }>} [groups=[]] 서버에서 받은 단체 목록
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
export const useGroupDraft = (groups = []) => {
  const [addedGroups, setAddedGroups] = useState([])
  const [removedGroupIds, setRemovedGroupIds] = useState([])
  const lastDraftNumber = useRef(0)

  /** 이름과 등장 회차로 초안 단체를 목록 끝에 추가한다. */
  const addGroup = ({ name, unlockEpisode }) => {
    lastDraftNumber.current += 1
    const draftGroup = {
      id: `draft-${lastDraftNumber.current}`,
      name: name.trim(),
      unlockEpisode: Number(unlockEpisode),
      memberCount: 0,
      isDraft: true,
    }

    setAddedGroups((previous) => [...previous, draftGroup])
  }

  /** 추가했던 초안은 바로 지우고, 서버에 있는 단체는 삭제 목록에 올려 화면에서 숨긴다. */
  const removeGroup = (id) => {
    setAddedGroups((previous) => previous.filter((group) => group.id !== id))
    if (groups.some((group) => group.id === id)) {
      setRemovedGroupIds((previous) => (previous.includes(id) ? previous : [...previous, id]))
    }
  }

  /** 추가·삭제한 내용을 모두 버리고 처음 상태로 돌린다. */
  const reset = () => {
    setAddedGroups([])
    setRemovedGroupIds([])
  }

  return {
    groups: composeGroups(groups, addedGroups, removedGroupIds),
    addedGroups,
    removedGroupIds,
    hasChanges: addedGroups.length > 0 || removedGroupIds.length > 0,
    addGroup,
    removeGroup,
    reset,
  }
}
