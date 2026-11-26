import { useGroupDetail } from '../hooks/useGroupQueries'
import { isPreviewGroupId, PREVIEW_BOOK, PREVIEW_GROUP_DETAILS } from '../previewGroups'
import { applyWikiContext, splitByProgress } from '../utils'
import { GroupViewDetailScreen } from './GroupViewDetailScreen'

/**
 * 위키 내용(보기)의 단체 한 곳을 조회해 읽기 전용 상세 화면에 전달한다.
 * 서버에 올라간 단체만 보여주므로, 목록에서 새로 추가해 임시로만 있는 단체는 "찾을 수 없음"으로 나온다.
 * 현재 진도보다 뒤에 등장하는 구성원과 행적은 내용도 개수도 보이지 않게 거르고(가린 구성원 수만큼 인원에서도 뺀다), 행적은 최신 순으로 정렬한다.
 * 관계에 나오는 단체의 인원수는 진도 이후 구성원이 섞여 있으므로 숨긴다.
 * 식별자가 없거나 서버에 없는 단체(404)는 "찾을 수 없음"으로 표시하고, 그 외 실패는 오류 상태로 표시한다.
 *
 * @param {object} props 컴포넌트 props
 * @param {string | null} [props.groupId] 보여줄 단체 식별자
 * @param {number | object} [props.position] 이동 때 넘어온 진도. 있으면 서버가 준 진도보다 우선한다.
 * @param {'CREATE' | 'UPDATE'} [props.wikiMode] 이동 때 넘어온 작성 방식. 상단 진도 배지의 `등록`·`수정` 문구에 쓴다.
 * @param {() => void} [props.onBack] 헤더의 뒤로가기와 `돌아가기`를 눌렀을 때 실행. 이동은 부모(페이지)가 처리한다.
 */
export const GroupViewDetailContainer = ({ groupId, position, wikiMode, onBack }) => {
  // 개발 모드의 샘플 단체(`preview-`로 시작하는 식별자)는 서버를 거치지 않고 샘플에서 찾는다.
  const isPreviewId = isPreviewGroupId(groupId)
  const previewGroup = isPreviewId ? PREVIEW_GROUP_DETAILS[groupId] : undefined
  const query = useGroupDetail(isPreviewId ? null : groupId)
  const book = applyWikiContext(isPreviewId ? PREVIEW_BOOK : query.data?.book, {
    position,
    wikiMode,
  })
  const maxEpisode = book?.currentEpisode
  const isNotFound = query.error?.response?.status === 404
  const serverGroup = isPreviewId ? previewGroup : query.data?.group
  const { visible: group } = splitByProgress(serverGroup, maxEpisode)

  let status = 'ready'
  if (groupId && !isPreviewId && query.isPending) status = 'loading'
  else if (query.isError && !isNotFound) status = 'error'

  return (
    <GroupViewDetailScreen
      episodeUnit={book?.episodeUnit}
      group={group}
      maxEpisode={maxEpisode}
      onBack={onBack}
      onRetry={() => query.refetch()}
      progressLabel={book?.editLabel}
      status={status}
    />
  )
}
