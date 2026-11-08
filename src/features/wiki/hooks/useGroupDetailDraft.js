import { useRef, useState } from 'react'

/** 두 값의 내용이 같은지 비교한다. 변경 여부 판단에 쓴다. */
const isSameValue = (a, b) => JSON.stringify(a) === JSON.stringify(b)

/**
 * 단체 상세 편집 중인 구성원, 관계, 주요 행적을 화면 안에서 초안으로 관리한다.
 * 원본(처음 전달받은 단체 정보)과 비교해 변경 여부를 알려주고, 되돌릴 수도 있다.
 * 단체가 바뀌면 부모가 `key`로 이 hook을 쓰는 컴포넌트를 다시 만들어 초안을 초기화한다.
 *
 * @param {{ members?: Array, relations?: object, milestones?: Array }} [group] 편집을 시작할 단체 정보
 * @returns {{
 *   members: Array,
 *   relations: object,
 *   milestones: Array,
 *   hasChanges: boolean,
 *   removeMember: (id: string) => void,
 *   removeRelation: (id: string) => void,
 *   addMilestone: (input: { content: string, unlockEpisode: number }) => void,
 *   updateMilestone: (id: string, input: { content: string, unlockEpisode: number }) => void,
 *   removeMilestone: (id: string) => void,
 *   reset: () => void,
 *   markSaved: () => void,
 * }} 현재 초안과 조작 함수
 */
export const useGroupDetailDraft = (group) => {
  const [initial, setInitial] = useState(() => ({
    members: group?.members ?? [],
    relations: group?.relations ?? {},
    milestones: group?.milestones ?? [],
  }))
  const [members, setMembers] = useState(initial.members)
  const [relations, setRelations] = useState(initial.relations)
  const [milestones, setMilestones] = useState(initial.milestones)
  const lastDraftNumber = useRef(0)

  /** 구성원 하나를 목록에서 제거한다. */
  const removeMember = (id) => {
    setMembers((previous) => previous.filter((member) => member.id !== id))
  }

  /** 우호·대립·중립 어느 구간에 있든 해당 단체를 관계에서 제거한다. */
  const removeRelation = (id) => {
    setRelations((previous) =>
      Object.fromEntries(
        Object.entries(previous).map(([type, groups]) => [
          type,
          groups.filter((related) => related.id !== id),
        ]),
      ),
    )
  }

  /** 새 주요 행적을 목록 끝에 추가한다. */
  const addMilestone = ({ content, unlockEpisode }) => {
    lastDraftNumber.current += 1
    const milestone = {
      id: `draft-milestone-${lastDraftNumber.current}`,
      content: content.trim(),
      unlockEpisode: Number(unlockEpisode),
      isDraft: true,
    }

    setMilestones((previous) => [...previous, milestone])
  }

  /** 기존 주요 행적의 내용과 등장 회차를 고친다. 서버가 준 해금 문구는 새 값으로 대체한다. */
  const updateMilestone = (id, { content, unlockEpisode }) => {
    setMilestones((previous) =>
      previous.map((milestone) =>
        milestone.id === id
          ? {
              ...milestone,
              content: content.trim(),
              unlockEpisode: Number(unlockEpisode),
              unlockLabel: undefined,
            }
          : milestone,
      ),
    )
  }

  /** 주요 행적 하나를 제거한다. */
  const removeMilestone = (id) => {
    setMilestones((previous) => previous.filter((milestone) => milestone.id !== id))
  }

  /** 편집한 내용을 모두 버리고 처음 상태로 돌린다. */
  const reset = () => {
    setMembers(initial.members)
    setRelations(initial.relations)
    setMilestones(initial.milestones)
  }

  /** 지금 내용을 제출된 상태로 보고, 이후 변경 여부를 이 내용 기준으로 비교한다. */
  const markSaved = () => setInitial({ members, relations, milestones })

  const hasChanges =
    !isSameValue(members, initial.members) ||
    !isSameValue(relations, initial.relations) ||
    !isSameValue(milestones, initial.milestones)

  return {
    members,
    relations,
    milestones,
    hasChanges,
    removeMember,
    removeRelation,
    addMilestone,
    updateMilestone,
    removeMilestone,
    reset,
    markSaved,
  }
}
