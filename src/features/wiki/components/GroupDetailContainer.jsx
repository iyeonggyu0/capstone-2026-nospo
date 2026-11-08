import { groupError } from '../api/wiki'
import { useGroupDetail, useSubmitGroupDetail } from '../hooks/useGroupQueries'
import { GroupDetailScreen } from './GroupDetailScreen'

/**
 * 단체 한 곳의 상세 정보를 조회해 상세 화면에 전달하고, 편집 내용 제출 요청을 처리한다.
 * 식별자가 없거나 서버에 없는 단체(404)는 "찾을 수 없음"으로 표시하고, 그 외 실패는 오류 상태로 표시한다.
 *
 * @param {object} props 컴포넌트 props
 * @param {string | null} [props.groupId] 보여줄 단체 식별자
 * @param {string | null} [props.mode] `edit`이면 편집 모드, 그 외는 보기 모드
 */
export const GroupDetailContainer = ({ groupId, mode }) => {
  const query = useGroupDetail(groupId)
  const submit = useSubmitGroupDetail()
  const book = query.data?.book
  const isNotFound = query.error?.response?.status === 404

  let status = 'ready'
  if (groupId && query.isPending) status = 'loading'
  else if (query.isError && !isNotFound) status = 'error'

  return (
    <GroupDetailScreen
      episodeUnit={book?.episodeUnit}
      group={query.data?.group}
      isSubmitting={submit.isPending}
      maxEpisode={book?.currentEpisode}
      mode={mode === 'edit' ? 'edit' : 'view'}
      onRetry={() => query.refetch()}
      onSubmit={(draft) => submit.mutateAsync({ groupId, ...draft })}
      progressLabel={book?.editLabel}
      status={status}
      submitError={submit.isError ? groupError(submit.error) : undefined}
    />
  )
}
