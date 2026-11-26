import { useRef, useState } from 'react'
import { getMaxDraftNumber, insertMilestoneLatest, moveItem, moveRelationItem } from '../utils'

/** 두 값의 내용이 같은지 비교한다. 변경 여부 판단에 쓴다. */
const isSameValue = (a, b) => JSON.stringify(a) === JSON.stringify(b)

/**
 * 단체 상세 편집 중인 구성원, 관계, 주요 행적을 화면 안에서 초안으로 관리한다.
 * 원본(처음 전달받은 단체 정보)과 비교해 변경 여부를 알려주고, 되돌릴 수도 있다.
 * 단체가 바뀌면 부모가 `key`로 이 hook을 쓰는 컴포넌트를 다시 만들어 초안을 초기화한다.
 * 전달받은 행적 순서를 그대로 쓴다. 사용자가 바꾼 순서(임시 저장 복원 포함)를 다시 정렬하지 않으므로, 최신 순 정렬은 단체를 불러오는 쪽이 맡는다.
 *
 * @param {{ members?: Array, relations?: object, milestones?: Array }} [group] 편집을 시작할 단체 정보
 * @returns {{
 *   members: Array,
 *   relations: object,
 *   milestones: Array,
 *   hasChanges: boolean,
 *   addMember: (person: { id: string, name: string, unlockEpisode?: number }) => void,
 *   removeMember: (id: string) => void,
 *   addRelation: (name: string) => void,
 *   removeRelation: (id: string) => void,
 *   addMilestone: (input: { content: string, unlockEpisode: number }) => void,
 *   updateMilestone: (id: string, input: { content: string, unlockEpisode: number }) => void,
 *   removeMilestone: (id: string) => void,
 *   moveMember: (id: string, toIndex: number) => void,
 *   moveRelation: (id: string, toType: string, toIndex: number) => void,
 *   moveMilestone: (id: string, toIndex: number) => void,
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
  // 임시 저장을 복원한 항목과 식별자가 겹치지 않도록, 이미 있는 임시 번호 다음부터 이어서 매긴다.
  const lastDraftNumber = useRef(getMaxDraftNumber(initial))

  /** 인물 목록에서 고른 인물을 구성원 끝에 추가한다. 이미 구성원인 인물(같은 식별자)이면 추가하지 않는다. */
  const addMember = (person) => {
    if (!person?.id || members.some((member) => member.id === person.id)) return

    setMembers((previous) => [
      ...previous,
      {
        id: person.id,
        name: person.name,
        unlockEpisode: person.unlockEpisode,
        isDraft: true,
      },
    ])
  }

  /** 구성원 하나를 목록에서 제거한다. */
  const removeMember = (id) => {
    setMembers((previous) => previous.filter((member) => member.id !== id))
  }

  /** 이름으로 관계 단체를 `우호` 구간 끝에 추가한다. 어느 구간이든 이미 같은 이름이 있으면 추가하지 않는다. */
  const addRelation = (name) => {
    const trimmed = name.trim()
    const isDuplicate = Object.values(relations)
      .flat()
      .some((related) => related.name.trim().toLowerCase() === trimmed.toLowerCase())
    if (!trimmed || isDuplicate) return

    lastDraftNumber.current += 1
    const related = {
      id: `draft-relation-${lastDraftNumber.current}`,
      name: trimmed,
      isDraft: true,
    }
    setRelations((previous) => ({ ...previous, friendly: [...(previous.friendly ?? []), related] }))
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

  /** 구성원 하나를 목록의 새 위치로 옮긴다. `toIndex`는 그 구성원을 뺀 목록 기준이다. */
  const moveMember = (id, toIndex) => {
    setMembers((previous) => moveItem(previous, id, toIndex))
  }

  /** 관계 단체 하나를 같은 구역이나 다른 구역(우호·대립·중립)의 새 위치로 옮긴다. */
  const moveRelation = (id, toType, toIndex) => {
    setRelations((previous) => moveRelationItem(previous, id, toType, toIndex))
  }

  /** 주요 행적 하나를 목록의 새 위치로 옮긴다. */
  const moveMilestone = (id, toIndex) => {
    setMilestones((previous) => moveItem(previous, id, toIndex))
  }

  /** 새 주요 행적을 해금 시점 순서에 맞는 위치에 추가한다. 직접 바꾼 기존 순서는 유지한다. */
  const addMilestone = ({ content, unlockEpisode }) => {
    lastDraftNumber.current += 1
    const milestone = {
      id: `draft-milestone-${lastDraftNumber.current}`,
      content: content.trim(),
      unlockEpisode: Number(unlockEpisode),
      isDraft: true,
    }

    setMilestones((previous) => insertMilestoneLatest(previous, milestone))
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
    addMember,
    removeMember,
    addRelation,
    removeRelation,
    addMilestone,
    updateMilestone,
    removeMilestone,
    moveMember,
    moveRelation,
    moveMilestone,
    reset,
    markSaved,
  }
}
