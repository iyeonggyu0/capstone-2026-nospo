import { useGroupList } from '../hooks/useGroupQueries'
import { PREVIEW_BOOK, PREVIEW_GROUP_ITEMS, PREVIEW_PERSON_COUNT } from '../previewGroups'
import { applyWikiContext } from '../utils'
import { GroupViewListScreen } from './GroupViewListScreen'

/**
 * 위키 내용(보기)의 단체 목록을 조회해 읽기 전용 목록 화면에 전달한다.
 * 서버에 올라간 단체만 보여주며, 편집 화면의 임시 초안은 섞지 않는다.
 * 이동 때 넘어온 진도(`position`)가 있으면 서버가 준 도서 정보의 진도와 안내 문구를 그 값으로 바꿔 보여준다.
 *
 * @param {object} props 컴포넌트 props
 * @param {string | null} [props.editionId] 단체 목록을 볼 도서 식별자(이동 때 넘어온 `bookId`)
 * @param {number | object} [props.position] 이동 때 넘어온 진도. 있으면 서버가 준 진도보다 우선한다.
 * @param {'CREATE' | 'UPDATE'} [props.wikiMode] 이동 때 넘어온 작성 방식. 상단 진도 배지의 `등록`·`수정` 문구에 쓴다.
 * @param {object} [props.viewState] 단체 상세(보기)로 이동할 때 함께 넘길 도서·진도 값
 * @param {object} [props.editState] 편집 화면으로 이동할 때 함께 넘길 도서·진도·작성 방식 값
 * @param {(value: string) => void} [props.onCategoryChange] 유형 칩을 눌렀을 때 실행. 이동은 부모(페이지)가 처리한다.
 * @param {boolean} [props.preview] 개발 모드에서 true면 서버 대신 눈으로 확인용 샘플 단체를 보여준다.
 */
export const GroupViewListContainer = ({
  editionId,
  position,
  wikiMode,
  viewState,
  editState,
  onCategoryChange,
  preview = false,
}) => {
  const showPreview = import.meta.env.DEV && preview
  const query = useGroupList(editionId, { enabled: !showPreview })
  const book = applyWikiContext(showPreview ? PREVIEW_BOOK : query.data?.book, {
    position,
    wikiMode,
  })

  let status = 'ready'
  if (!showPreview && query.isPending) status = 'loading'
  else if (!showPreview && query.isError) status = 'error'

  return (
    <GroupViewListScreen
      addState={editState}
      book={book}
      editState={editState}
      episodeUnit={book?.episodeUnit}
      groups={showPreview ? PREVIEW_GROUP_ITEMS : query.data?.items}
      onCategoryChange={onCategoryChange}
      onRetry={() => query.refetch()}
      personCount={showPreview ? PREVIEW_PERSON_COUNT : query.data?.personCount}
      status={status}
      viewState={viewState}
    />
  )
}
