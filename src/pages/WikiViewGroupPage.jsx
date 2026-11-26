import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  GroupViewListContainer,
  getPersonRegisterPath,
  readWikiContext,
  toWikiNavigationState,
} from '@/features/wiki'

/**
 * 위키 내용(보기)의 단체 목록 페이지다. 이동 때 넘어온 도서·진도·작성 방식(`bookId`, `position`, `mode`)을 읽어
 * 읽기 전용 단체 목록에 전달하고, 단체 상세(보기)와 편집 화면으로 이동할 때 같은 값을 이어서 넘긴다.
 * 편집 화면으로 가는 값에는 작성 방식이 없으면 기존 위키를 고치는 `UPDATE`를 담는다.
 * 유형 칩의 `인물`은 같은 값을 인물 등록 화면으로 넘겨 이동한다.
 */
const WikiViewGroupPage = () => {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const context = readWikiContext({ state: location.state, searchParams })
  const editState = toWikiNavigationState({ ...context, wikiMode: context.wikiMode ?? 'UPDATE' })

  /** 유형 칩에서 `인물`을 고르면 읽은 도서·진도를 그대로 넘겨 인물 등록 화면으로 이동한다. */
  const handleCategoryChange = (value) => {
    if (value === 'person') {
      navigate(getPersonRegisterPath(context.bookId), { state: editState })
    }
  }

  return (
    <GroupViewListContainer
      editState={editState}
      editionId={context.bookId}
      onCategoryChange={handleCategoryChange}
      position={context.position}
      preview={searchParams.has('preview')}
      viewState={toWikiNavigationState(context)}
      wikiMode={context.wikiMode}
    />
  )
}

export default WikiViewGroupPage
