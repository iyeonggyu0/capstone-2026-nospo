import { create } from 'zustand'
import { apiClient, refreshAccessToken } from '@/lib/api-client'

/** 로그인 결과를 메모리에 보관하고 이후 API 요청에 인증 헤더를 설정한다. */
export const useAuth = create((set, get) => ({
  member: null,
  status: 'unknown',
  setSession: ({ accessToken, member }) => {
    apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`
    set({ member, status: 'authenticated' })
  },
  clearSession: () => {
    delete apiClient.defaults.headers.common.Authorization
    set({ member: null, status: 'anonymous' })
  },
  restoreSession: async () => {
    if (get().status !== 'unknown') return
    set({ status: 'checking' })
    try {
      const accessToken = await refreshAccessToken()
      if (get().status !== 'checking') return
      apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`
      const response = await apiClient.get('/v1/me')
      if (get().status === 'checking') set({ member: response.data.data, status: 'authenticated' })
    } catch {
      if (get().status === 'checking') get().clearSession()
    }
  },
}))
