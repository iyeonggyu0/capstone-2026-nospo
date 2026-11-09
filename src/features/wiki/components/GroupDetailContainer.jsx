import { groupError } from '../api/wiki'
import { useGroupDetail, useGroupList, useSubmitGroupDetail } from '../hooks/useGroupQueries'
import { DEFAULT_DRAFT_KEY, findDraftGroup, useGroupDraftStore } from '../store'
import { GroupDetailScreen } from './GroupDetailScreen'

/**
 * 단체 한 곳의 상세 정보를 조회해 상세 화면에 전달하고, 편집 내용 제출 요청을 처리한다.
 * 목록에서 새로 추가한(아직 서버에 없는) 단체는 서버에 묻지 않고 스토어의 초안으로 보여주며, 편집 내용은 초안에 저장해 목록 제출 때 함께 보낸다.
 * 식별자가 없거나 서버에 없는 단체(404)는 "찾을 수 없음"으로 표시하고, 그 외 실패는 오류 상태로 표시한다.
 *
 * @param {object} props 컴포넌트 props
 * @param {string | null} [props.groupId] 보여줄 단체 식별자
 * @param {string | null} [props.mode] `edit`이면 편집 모드, 그 외는 보기 모드
 */
export const GroupDetailContainer = ({ groupId, mode }) => {
  // 선택 함수가 매번 새 객체를 돌려주면 화면이 끝없이 다시 그려지므로, 이미 있는 값(단체 객체, 키 문자열)만 각각 고른다.
  const draftGroup = useGroupDraftStore((state) => findDraftGroup(state.drafts, groupId)?.group)
  const draftKey = useGroupDraftStore((state) => findDraftGroup(state.drafts, groupId)?.key)
  const saveDraftGroupDetail = useGroupDraftStore((state) => state.saveDraftGroupDetail)
  const isDraft = Boolean(draftGroup)
  const query = useGroupDetail(isDraft ? null : groupId)
  const listQuery = useGroupList(draftKey === DEFAULT_DRAFT_KEY ? undefined : draftKey, {
    enabled: isDraft,
  })
  const submit = useSubmitGroupDetail()
  const book = isDraft ? listQuery.data?.book : query.data?.book
  const isNotFound = query.error?.response?.status === 404
  const group = isDraft
    ? { members: [], relations: {}, milestones: [], ...draftGroup }
    : query.data?.group

  let status = 'ready'
  if (!isDraft && groupId && query.isPending) status = 'loading'
  else if (query.isError && !isNotFound) status = 'error'

  return (
    <GroupDetailScreen
      episodeUnit={book?.episodeUnit}
      group={group}
      isSubmitting={!isDraft && submit.isPending}
      maxEpisode={book?.currentEpisode}
      mode={mode === 'edit' ? 'edit' : 'view'}
      onRetry={() => query.refetch()}
      onSubmit={
        isDraft
          ? (draft) => saveDraftGroupDetail(groupId, draft)
          : (draft) => submit.mutateAsync({ groupId, ...draft })
      }
      progressLabel={book?.editLabel}
      status={status}
      submitError={!isDraft && submit.isError ? groupError(submit.error) : undefined}
    />
  )
}
