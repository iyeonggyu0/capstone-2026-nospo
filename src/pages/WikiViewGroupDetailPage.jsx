import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { GroupViewDetailContainer, readWikiContext } from '@/features/wiki'

/**
 * 위키 내용(보기)의 단체 상세 페이지다. 주소의 단체 식별자(groupId)와 이동 때 넘어온 진도·작성 방식(`position`, `mode`)을 읽어
 * 읽기 전용 단체 상세에 전달하고, 뒤로가기와 `돌아가기`는 이전 화면으로 이동시킨다.
 */
const WikiViewGroupDetailPage = () => {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const context = readWikiContext({ state: location.state, searchParams })

  return (
    <GroupViewDetailContainer
      groupId={searchParams.get('groupId')}
      onBack={() => navigate(-1)}
      position={context.position}
      wikiMode={context.wikiMode}
    />
  )
}

export default WikiViewGroupDetailPage
