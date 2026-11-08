import { useSearchParams } from 'react-router-dom'
import { GroupDetailContainer } from '@/features/wiki'

/** 주소의 단체 식별자(groupId)와 모드(mode)를 읽어 단체 상세 화면에 전달한다. */
const WikiRegisterGroupDetailPage = () => {
  const [searchParams] = useSearchParams()

  return (
    <GroupDetailContainer groupId={searchParams.get('groupId')} mode={searchParams.get('mode')} />
  )
}

export default WikiRegisterGroupDetailPage
