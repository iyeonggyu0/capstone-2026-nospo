import { groupError } from '../api/wiki'
import { useGroupList, useSubmitGroups } from '../hooks/useGroupQueries'
import { GroupListScreen } from './GroupListScreen'

/**
 * 도서(판본)의 단체 목록을 조회해 목록 화면에 전달하고, 새 단체 제출 요청을 처리한다.
 * 제출은 선택한 판본 ID에 연결되며, 제출한 제안은 관리자 검토 대기 상태가 된다.
 *
 * @param {object} props 컴포넌트 props
 * @param {string | null} [props.editionId] 단체 목록을 볼 도서 판본 식별자
 * @param {string | null} [props.mode] `view`이면 보기 상태, 그 외(없음 포함)는 처음부터 편집 상태
 * @param {(value: string) => void} [props.onCategoryChange] 유형 칩(인물·단체)을 눌렀을 때 실행. 이동은 부모(페이지)가 처리한다.
 */
export const GroupListContainer = ({ editionId, mode, onCategoryChange }) => {
  const query = useGroupList(editionId)
  const submit = useSubmitGroups()
  const book = query.data?.book

  let status = 'ready'
  if (query.isPending) status = 'loading'
  else if (query.isError) status = 'error'

  return (
    <GroupListScreen
      book={book}
      editionId={editionId}
      episodeUnit={book?.episodeUnit}
      groups={query.data?.items}
      isSubmitting={submit.isPending}
      mode={mode === 'view' ? 'view' : 'edit'}
      onCategoryChange={onCategoryChange}
      onRetry={() => query.refetch()}
      onSubmit={({ addedGroups, removedGroupIds }) =>
        submit.mutateAsync({ editionId, groups: addedGroups, removedGroupIds })
      }
      personCount={query.data?.personCount}
      status={status}
      submitError={submit.isError ? groupError(submit.error) : undefined}
    />
  )
}
