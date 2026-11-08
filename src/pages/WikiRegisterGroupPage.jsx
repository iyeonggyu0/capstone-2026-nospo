import { useNavigate, useSearchParams } from 'react-router-dom'
import { GroupListContainer, getPersonRegisterPath } from '@/features/wiki'

/** 주소의 판본 식별자(editionId)와 모드(mode)를 읽어 단체 목록 화면에 전달하고, 유형 칩의 `인물` 이동을 처리한다. */
const WikiRegisterGroupPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const editionId = searchParams.get('editionId')

  /** 유형 칩에서 `인물`을 고르면 인물 등록 화면으로 이동한다. */
  const handleCategoryChange = (value) => {
    if (value === 'person') navigate(getPersonRegisterPath(editionId))
  }

  return (
    <GroupListContainer
      editionId={editionId}
      mode={searchParams.get('mode')}
      onCategoryChange={handleCategoryChange}
    />
  )
}

export default WikiRegisterGroupPage
