import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from './store'

/** 로그인 여부를 반환하고 필요한 경우 쿠키로 세션을 복원한다. */
export const useIsLoggedIn = () => {
  const { search } = useLocation()
  const preview = import.meta.env.DEV && new URLSearchParams(search).has('preview')
  const status = useAuth((state) => state.status)
  const restoreSession = useAuth((state) => state.restoreSession)

  useEffect(() => {
    if (!preview) restoreSession()
  }, [preview, restoreSession])

  return preview || status === 'authenticated'
}
