import { useState } from 'react'
import { groupError } from '../api/wiki'
import {
  useGroupDetail,
  useGroupList,
  usePersonList,
  useSubmitGroupDetail,
  useSubmitGroups,
} from '../hooks/useGroupQueries'
import { SAVE_DRAFT_ERROR } from '../constants'
import { DEFAULT_DRAFT_KEY, findDraftGroup, useGroupDraftStore } from '../store'
import {
  applyDetailEdit,
  applyWikiContext,
  filterDetailByProgress,
  isEmptyDetailEdit,
  splitByProgress,
  toDetailEdit,
  withHiddenItems,
} from '../utils'
import { GroupDetailScreen } from './GroupDetailScreen'

/**
 * 단체 한 곳의 상세 정보를 조회해 상세 화면에 전달하고, 편집 내용 제출·임시 저장 요청을 처리한다.
 * 목록에서 새로 추가한(아직 서버에 없는) 단체는 서버에 묻지 않고 스토어의 초안으로 보여준다.
 * 이 단체의 `검수 제출`은 편집 내용을 초안에 저장한 뒤 그 판본의 추가·삭제 초안을 함께 서버에 제출하고, 성공하면 초안을 비운다.
 * 서버에 있는 단체의 `임시 저장`은 서버 데이터를 복사하지 않고 사용자가 편집한 부분(순서, 새로 추가한 항목, 지운 항목, 고친 행적)만
 * 스토어에 보관해 두었다가, 다시 열 때 서버가 준 최신 내용 위에 적용해 이어서 편집하게 하고, 제출에 성공하면 지운다.
 * 식별자가 없거나 서버에 없는 단체(404)는 "찾을 수 없음"으로 표시하고, 그 외 실패는 오류 상태로 표시한다.
 *
 * @param {object} props 컴포넌트 props
 * @param {string | null} [props.groupId] 보여줄 단체 식별자
 * @param {string | null} [props.editionId] 이동 때 넘어온 도서 식별자(`bookId`). 인물 후보 조회에 쓰며, 새로 추가한 단체는 만들 때 정해진 도서를 우선한다.
 * @param {number | object} [props.position] 이동 때 넘어온 진도. 있으면 서버가 준 진도보다 우선한다.
 * @param {'CREATE' | 'UPDATE'} [props.wikiMode] 이동 때 넘어온 작성 방식. 상단 진도 배지의 `등록`·`수정` 문구에 쓴다.
 * @param {string | null} [props.mode] `view`이면 보기 모드, 그 외(생략 포함)는 편집 모드
 * @param {(result: { proposalId?: string }) => void} [props.onSubmitted] 검수 제출이 성공했을 때 서버 응답과 함께 실행. 이동은 부모(페이지)가 처리한다.
 * @param {() => void} [props.onBack] 헤더의 뒤로가기를 눌렀을 때 실행. 이동은 부모(페이지)가 처리한다.
 */
export const GroupDetailContainer = ({
  groupId,
  editionId: contextEditionId,
  position,
  wikiMode,
  mode,
  onSubmitted,
  onBack,
}) => {
  // 선택 함수가 매번 새 객체를 돌려주면 화면이 끝없이 다시 그려지므로, 이미 있는 값(단체 객체, 키 문자열)만 각각 고른다.
  const draftGroup = useGroupDraftStore((state) => findDraftGroup(state.drafts, groupId)?.group)
  const draftKey = useGroupDraftStore((state) => findDraftGroup(state.drafts, groupId)?.key)
  const savedDetail = useGroupDraftStore((state) => state.detailDrafts[groupId])
  const saveDraftGroupDetail = useGroupDraftStore((state) => state.saveDraftGroupDetail)
  const saveDetailDraft = useGroupDraftStore((state) => state.saveDetailDraft)
  const clearDetailDraft = useGroupDraftStore((state) => state.clearDetailDraft)
  const resetDraft = useGroupDraftStore((state) => state.resetDraft)
  const saveDraftSnapshot = useGroupDraftStore((state) => state.saveDraftSnapshot)
  const isDraft = Boolean(draftGroup)
  // 새로 추가한 단체의 식별자(`draft-N`)는 서버에 없다. 제출 직후 초안이 비워지는 순간에 서버로 잘못 조회하지 않도록 막는다.
  const isDraftId = typeof groupId === 'string' && groupId.startsWith('draft-')
  const shouldFetch = !isDraft && !isDraftId
  const query = useGroupDetail(shouldFetch ? groupId : null)
  // 새로 추가한 단체는 만들 때 정해진 도서(초안 키)가 기준이고, 서버 단체는 이동 때 넘어온 도서를 쓴다.
  const draftEditionId = draftKey === DEFAULT_DRAFT_KEY ? undefined : draftKey
  const editionId = draftKey != null ? draftEditionId : (contextEditionId ?? undefined)
  const listQuery = useGroupList(editionId, { enabled: isDraft })
  const submit = useSubmitGroupDetail()
  const submitDrafts = useSubmitGroups()
  const activeSubmit = isDraft ? submitDrafts : submit
  const book = applyWikiContext(isDraft ? listQuery.data?.book : query.data?.book, {
    position,
    wikiMode,
  })
  // 구성원 후보는 현재 진도 기준으로만 받는다. 진도를 알기 전에는 조회하지 않아 미해금 인물이 섞이지 않는다.
  const personQuery = usePersonList(editionId, book?.currentEpisode)
  const [saveError, setSaveError] = useState('')
  const isNotFound = query.error?.response?.status === 404
  // 현재 진도 이후의 구성원·행적·인원은 화면에 보여주지 않는다. 가린 항목은 제출할 때 다시 붙여 지워지지 않게 한다.
  // 행적은 처음에 최신 순으로 보여주며, 임시 저장을 복원할 때는 이 정렬을 기준으로 저장된 순서를 적용해 사용자가 바꾼 순서가 유지된다.
  // 편집을 시작한 시점의 서버 단체를 기준으로 고정한다. 편집 중에 서버 데이터가 새로 와도 초안은 처음 기준으로 만들어져 있으므로,
  // 같은 기준으로 달라진 부분을 비교하고 제출해야 그 사이 서버에 생긴 항목이 지워지지 않는다.
  const fresh = splitByProgress(query.data?.group, book?.currentEpisode)
  const [frozen, setFrozen] = useState(null)
  const isFrozenForGroup = frozen !== null && frozen.groupId === groupId
  if (fresh.visible && !isFrozenForGroup) setFrozen({ groupId, split: fresh })
  const {
    visible: serverGroup,
    hiddenMembers,
    hiddenMilestones,
  } = isFrozenForGroup ? frozen.split : fresh
  let working = serverGroup
  if (isDraft) working = { members: [], relations: {}, milestones: [], ...draftGroup }
  else if (serverGroup && savedDetail) {
    working = { ...serverGroup, ...applyDetailEdit(serverGroup, savedDetail) }
  }
  // 임시 저장본이나 새 단체 초안에 높은 진도에서 추가해 둔 항목이 있어도 현재 진도로 다시 거른다.
  // 가린 편집 내용은 임시 저장과 제출 때 다시 붙여 보존한다.
  const edited = filterDetailByProgress(working, book?.currentEpisode)
  const group = working && {
    ...working,
    members: edited.members,
    milestones: edited.milestones,
    memberCount:
      isDraft && working.memberCount != null
        ? Math.max(0, working.memberCount - edited.hiddenMembers.length)
        : working.memberCount,
  }

  let status = 'ready'
  // 새로 추가한 단체는 목록 조회로 현재 진도를 알아야 한다. 진도를 모르는 채로 보여주면 진도 이후 회차 제한이 적용되지 않는다.
  if (isDraft && listQuery.isPending) status = 'loading'
  else if (isDraft && listQuery.isError) status = 'error'
  else if (shouldFetch && groupId && query.isPending) status = 'loading'
  else if (query.isError && !isNotFound) status = 'error'

  /** 새로 추가한 단체의 상세를 초안에 저장하고, 그 판본의 추가·삭제 초안을 함께 제출한다. 성공하면 이동 신호를 보낸 뒤 초안을 비운다. */
  const submitDraftGroup = async (detail) => {
    saveDraftGroupDetail(groupId, withHiddenItems(detail, edited))
    const { addedGroups, removedGroupIds } = useGroupDraftStore.getState().drafts[draftKey]
    const result = await submitDrafts.mutateAsync({
      editionId: editionId ?? null,
      groups: addedGroups,
      removedGroupIds,
    })
    onSubmitted?.(result)
    resetDraft(draftKey)
  }

  /** 서버에 있는 단체의 편집 내용을 제출하고, 성공하면 임시 저장을 지우고 이동 신호를 보낸다. */
  const submitServerGroup = async (detail) => {
    const result = await submit.mutateAsync({
      groupId,
      ...withHiddenItems(detail, {
        hiddenMembers: [...hiddenMembers, ...edited.hiddenMembers],
        hiddenMilestones: [...hiddenMilestones, ...edited.hiddenMilestones],
      }),
    })
    clearDetailDraft(groupId)
    onSubmitted?.(result)
  }

  /**
   * 편집 내용을 임시 저장하고 화면에 머무른다. 성공하면 `true`, 실패하면 `false`를 돌려준다.
   * 새 단체는 목록 초안에(그 판본의 목록 임시 저장 상태도 함께 갱신), 서버 단체는 서버 상세와 달라진 부분만 상세 임시 저장에 보관한다.
   * 서버 단체를 서버 상세와 똑같은 상태로 되돌려 놓고 저장하면 저장할 편집이 없으므로 기존 임시 저장을 지운다.
   * 저장 공간 오류 등으로 실패하면 안내를 보여줘, 편집한 내용이 그대로 남고 다시 시도할 수 있게 한다.
   */
  const saveDraft = (detail) => {
    try {
      const fullDetail = withHiddenItems(detail, edited)
      if (isDraft) {
        saveDraftGroupDetail(groupId, fullDetail)
        saveDraftSnapshot(draftKey)
      } else {
        const edit = toDetailEdit(serverGroup, fullDetail)
        if (isEmptyDetailEdit(edit, serverGroup)) clearDetailDraft(groupId)
        else saveDetailDraft(groupId, edit)
      }
    } catch {
      setSaveError(SAVE_DRAFT_ERROR)
      return false
    }

    setSaveError('')
    return true
  }

  return (
    <GroupDetailScreen
      canSubmitUnchanged={isDraft || Boolean(savedDetail)}
      episodeUnit={book?.episodeUnit}
      group={group}
      isSubmitting={activeSubmit.isPending}
      maxEpisode={book?.currentEpisode}
      memberCandidates={personQuery.data?.items}
      mode={mode === 'view' ? 'view' : 'edit'}
      onBack={onBack}
      onRetry={() => (isDraft ? listQuery.refetch() : query.refetch())}
      onSaveDraft={saveDraft}
      onSubmit={isDraft ? submitDraftGroup : submitServerGroup}
      saveDraftError={saveError || undefined}
      progressLabel={book?.editLabel}
      status={status}
      submitError={activeSubmit.isError ? groupError(activeSubmit.error) : undefined}
    />
  )
}
