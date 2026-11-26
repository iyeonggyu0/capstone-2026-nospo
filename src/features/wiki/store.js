import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/** 초안을 브라우저 저장소에 넣을 때 쓰는 이름이다. */
const DRAFT_STORAGE_NAME = 'nospo-wiki-group-drafts'

/** 초안이 아직 없는 판본에 쓰는 빈 초안이다. 매번 새 객체를 만들면 화면이 계속 다시 그려지므로 하나만 둔다. */
export const EMPTY_GROUP_DRAFT = { addedGroups: [], removedGroupIds: [] }

/** 판본 식별자가 없을 때 초안을 저장하는 키다. */
export const DEFAULT_DRAFT_KEY = 'default'

/** 판본 식별자를 초안 저장 키로 바꾼다. */
export const getGroupDraftKey = (editionId) => editionId ?? DEFAULT_DRAFT_KEY

/** 모든 판본의 초안 중에서 식별자가 같은 초안 단체를 찾아 `{ key, group }`으로 돌려준다. 없으면 undefined. */
export const findDraftGroup = (drafts, groupId) => {
  for (const [key, draft] of Object.entries(drafts)) {
    const group = draft.addedGroups.find((item) => item.id === groupId)
    if (group) return { key, group }
  }
  return undefined
}

/**
 * 단체 목록 화면에서 추가·삭제한 초안을 판본별로 보관하고, 서버에 있는 단체의 상세 임시 저장도 함께 보관한다.
 * 다른 화면에 갔다가 돌아오거나 새로고침해도 유지되도록 `sessionStorage`에 함께 저장하며, 탭을 닫으면 사라진다.
 * 서버에 제출하기 전의 임시 값이라 탭을 닫은 뒤까지 남기지 않는다. 저장소를 쓸 수 없는 환경에서는 메모리에서만 동작한다.
 */
export const useGroupDraftStore = create(
  persist(
    (set) => ({
      drafts: {},
      /** 판본별로 마지막에 `임시 저장`한 목록 초안이다. `저장 안함`을 누르면 이 상태로 되돌린다. */
      savedDrafts: {},
      /**
       * 서버에 있는 단체의 상세 편집을 임시 저장한 내용이다. 단체 식별자별로 구성원·관계·주요 행적의 **편집한 부분만** 보관한다.
       * 서버 데이터를 복사해 두지 않으며, 서버 상세 위에 적용하는 방법은 `utils.js`의 `applyDetailEdit`을 따른다.
       */
      detailDrafts: {},
      lastDraftNumber: 0,

      /** 이름과 등장 회차로 초안 단체를 해당 판본 목록 끝에 추가한다. */
      addGroup: (key, { name, unlockEpisode }) =>
        set((state) => {
          const number = state.lastDraftNumber + 1
          const draft = state.drafts[key] ?? EMPTY_GROUP_DRAFT
          const draftGroup = {
            id: `draft-${number}`,
            name: name.trim(),
            unlockEpisode: Number(unlockEpisode),
            memberCount: 0,
            isDraft: true,
          }

          return {
            lastDraftNumber: number,
            drafts: {
              ...state.drafts,
              [key]: { ...draft, addedGroups: [...draft.addedGroups, draftGroup] },
            },
          }
        }),

      /** 추가했던 초안은 바로 지우고, 서버에 있는 단체(`isServerGroup`)는 삭제 목록에 올려 화면에서 숨긴다. */
      removeGroup: (key, id, isServerGroup) =>
        set((state) => {
          const draft = state.drafts[key] ?? EMPTY_GROUP_DRAFT
          const removedGroupIds =
            isServerGroup && !draft.removedGroupIds.includes(id)
              ? [...draft.removedGroupIds, id]
              : draft.removedGroupIds

          return {
            drafts: {
              ...state.drafts,
              [key]: {
                addedGroups: draft.addedGroups.filter((group) => group.id !== id),
                removedGroupIds,
              },
            },
          }
        }),

      /** 초안 단체의 상세(구성원·관계·주요 행적) 편집 내용을 그 단체에 저장한다. 목록을 제출할 때 함께 보낸다. */
      saveDraftGroupDetail: (groupId, { members, relations, milestones }) =>
        set((state) => {
          const found = findDraftGroup(state.drafts, groupId)
          if (!found) return state

          const draft = state.drafts[found.key]
          return {
            drafts: {
              ...state.drafts,
              [found.key]: {
                ...draft,
                addedGroups: draft.addedGroups.map((group) =>
                  group.id === groupId
                    ? { ...group, members, relations, milestones, memberCount: members.length }
                    : group,
                ),
              },
            },
          }
        }),

      /** 서버에 있는 단체의 상세 편집분(`toDetailEdit`의 결과)을 임시 저장한다. 다시 열면 서버 상세 위에 적용해 이어서 편집한다. */
      saveDetailDraft: (groupId, { members, relations, milestones }) =>
        set((state) => ({
          detailDrafts: { ...state.detailDrafts, [groupId]: { members, relations, milestones } },
        })),

      /** 서버에 있는 단체의 임시 저장 내용을 지운다. 제출에 성공했을 때 쓴다. */
      clearDetailDraft: (groupId) =>
        set((state) => ({
          detailDrafts: Object.fromEntries(
            Object.entries(state.detailDrafts).filter(([id]) => id !== groupId),
          ),
        })),

      /** 해당 판본의 지금 목록 초안을 `임시 저장` 상태로 기억해 둔다. */
      saveDraftSnapshot: (key) =>
        set((state) => ({
          savedDrafts: { ...state.savedDrafts, [key]: state.drafts[key] ?? EMPTY_GROUP_DRAFT },
        })),

      /** 해당 판본의 목록 초안을 마지막 `임시 저장` 상태로 되돌린다. 임시 저장한 적이 없으면 비운다. */
      restoreDraftSnapshot: (key) =>
        set((state) => ({
          drafts: { ...state.drafts, [key]: state.savedDrafts[key] ?? EMPTY_GROUP_DRAFT },
        })),

      /**
       * 해당 판본의 추가·삭제 내용과 임시 저장 상태를 모두 버린다. 검수 제출에 성공했을 때 쓴다.
       * 삭제를 제출한 서버 단체의 상세 임시 저장도 함께 지워, 나중에 같은 식별자로 열어도 옛 편집이 되살아나지 않게 한다.
       */
      resetDraft: (key) =>
        set((state) => {
          const removed = new Set((state.drafts[key] ?? EMPTY_GROUP_DRAFT).removedGroupIds)

          return {
            drafts: { ...state.drafts, [key]: EMPTY_GROUP_DRAFT },
            savedDrafts: { ...state.savedDrafts, [key]: EMPTY_GROUP_DRAFT },
            detailDrafts: Object.fromEntries(
              Object.entries(state.detailDrafts).filter(([id]) => !removed.has(id)),
            ),
          }
        }),
    }),
    {
      name: DRAFT_STORAGE_NAME,
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ drafts, savedDrafts, detailDrafts, lastDraftNumber }) => ({
        drafts,
        savedDrafts,
        detailDrafts,
        lastDraftNumber,
      }),
    },
  ),
)
