import { groupError } from '../api/wiki'
import { useGroupList, useSubmitGroups } from '../hooks/useGroupQueries'
import { applyWikiContext } from '../utils'
import { GroupListScreen } from './GroupListScreen'

/**
 * 도서의 단체 목록을 조회해 목록 화면에 전달하고, 새 단체 제출 요청을 처리한다.
 * 제출은 선택한 도서 ID에 연결되며, 제출한 제안은 관리자 검토 대기 상태가 된다.
 * 이동 때 넘어온 진도(`position`)가 있으면 서버가 준 도서 정보의 진도와 안내 문구를 그 값으로 바꿔 보여준다.
 *
 * @param {object} props 컴포넌트 props
 * @param {string | null} [props.editionId] 단체 목록을 볼 도서 식별자(이동 때 넘어온 `bookId`)
 * @param {number | object} [props.position] 이동 때 넘어온 진도. 있으면 서버가 준 진도보다 우선한다.
 * @param {'CREATE' | 'UPDATE'} [props.wikiMode] 이동 때 넘어온 작성 방식. 상단 진도 배지의 `등록`·`수정` 문구에 쓴다.
 * @param {object} [props.detailState] 단체 카드를 눌러 상세 화면으로 이동할 때 함께 넘길 도서·진도·작성 방식 값
 * @param {string | null} [props.mode] `view`이면 보기 상태, 그 외(없음 포함)는 처음부터 편집 상태
 * @param {(value: string) => void} [props.onCategoryChange] 유형 칩(인물·단체)을 눌렀을 때 실행. 이동은 부모(페이지)가 처리한다.
 * @param {(result: { proposalId?: string }) => void} [props.onSubmitted] 검수 제출이 성공했을 때 서버 응답과 함께 실행. 이동은 부모(페이지)가 처리한다.
 */
export const GroupListContainer = ({
  editionId,
  position,
  wikiMode,
  detailState,
  mode,
  onCategoryChange,
  onSubmitted,
}) => {
  const query = useGroupList(editionId)
  const submit = useSubmitGroups()
  const book = applyWikiContext(query.data?.book, { position, wikiMode })
  let status = 'ready'
  if (query.isPending) status = 'loading'
  else if (query.isError) status = 'error'

  return (
    <GroupListScreen
      book={book}
      detailState={detailState}
      editionId={editionId}
      episodeUnit={book?.episodeUnit}
      groups={query.data?.items}
      isSubmitting={submit.isPending}
      mode={mode === 'view' ? 'view' : 'edit'}
      onCategoryChange={onCategoryChange}
      onRetry={() => query.refetch()}
      onSubmit={async ({ addedGroups, removedGroupIds }) => {
        const result = await submit.mutateAsync({
          editionId,
          groups: addedGroups,
          removedGroupIds,
        })
        onSubmitted?.(result)
      }}
      personCount={query.data?.personCount}
      status={status}
      submitError={submit.isError ? groupError(submit.error) : undefined}
    />
  )
}
