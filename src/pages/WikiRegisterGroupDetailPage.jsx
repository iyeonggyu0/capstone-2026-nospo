import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { GroupDetailContainer, getReviewProgressPath, readWikiContext } from '@/features/wiki'

/**
 * 주소의 단체 식별자(groupId)와 모드(mode), 이동 때 넘어온 도서·진도·작성 방식(`bookId`, `position`, `mode`)을 읽어 단체 상세 화면에 전달한다.
 * 뒤로가기 후 이전 화면 이동과 검수 제출 후 검수 진행 화면 이동을 처리한다.
 */
const WikiRegisterGroupDetailPage = () => {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const context = readWikiContext({ state: location.state, searchParams })

  return (
    <GroupDetailContainer
      editionId={context.bookId}
      groupId={searchParams.get('groupId')}
      mode={searchParams.get('mode')}
      onBack={() => navigate(-1)}
      onSubmitted={(result) => navigate(getReviewProgressPath(result?.proposalId))}
      position={context.position}
      wikiMode={context.wikiMode}
    />
  )
}

export default WikiRegisterGroupDetailPage
