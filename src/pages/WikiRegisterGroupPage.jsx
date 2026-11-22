import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  GroupListContainer,
  getPersonRegisterPath,
  getReviewProgressPath,
  readWikiContext,
  toWikiNavigationState,
} from '@/features/wiki'

/**
 * 이동 때 넘어온 도서·진도·작성 방식(`bookId`, `position`, `mode`)을 읽어 단체 목록 화면에 전달한다.
 * 유형 칩의 `인물` 이동(같은 값을 인물 화면으로 넘김), 검수 제출 후 검수 진행 화면 이동을 처리한다.
 */
const WikiRegisterGroupPage = () => {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const context = readWikiContext({ state: location.state, searchParams })
  const navigationState = toWikiNavigationState(context)

  /** 유형 칩에서 `인물`을 고르면 읽은 도서·진도를 그대로 넘겨 인물 등록 화면으로 이동한다. */
  const handleCategoryChange = (value) => {
    if (value === 'person') {
      navigate(getPersonRegisterPath(context.bookId), { state: navigationState })
    }
  }

  return (
    <GroupListContainer
      detailState={navigationState}
      editionId={context.bookId}
      mode={searchParams.get('mode')}
      onCategoryChange={handleCategoryChange}
      onSubmitted={(result) => navigate(getReviewProgressPath(result?.proposalId))}
      position={context.position}
      wikiMode={context.wikiMode}
    />
  )
}

export default WikiRegisterGroupPage
