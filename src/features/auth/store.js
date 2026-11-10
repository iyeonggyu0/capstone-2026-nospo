import { create } from 'zustand'
import { apiClient, refreshAccessToken } from '@/lib/api-client'

/** 로그인 결과를 메모리에 보관하고 이후 API 요청에 인증 헤더를 설정한다. */
export const useAuth = create((set, get) => ({
  member: null,
  status: 'unknown',
  preview: false,
  enablePreview: () => set({ preview: true }),
  setSession: ({ accessToken, member }) => {
    apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`
    set({ member, status: 'authenticated' })
  },
  clearSession: () => {
    delete apiClient.defaults.headers.common.Authorization
    set({ member: null, status: 'anonymous' })
  },
  restoreSession: async () => {
    if (!['unknown', 'error'].includes(get().status)) return
    set({ status: 'checking' })
    try {
      const accessToken = await refreshAccessToken()
      if (get().status !== 'checking') return
      apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`
      const response = await apiClient.get('/v1/me')
      if (get().status === 'checking') set({ member: response.data.data, status: 'authenticated' })
    } catch (error) {
      if (get().status !== 'checking') return
      if (error.response?.status === 401) {
        get().clearSession()
      } else {
        delete apiClient.defaults.headers.common.Authorization
        set({ status: 'error' })
      }
    }
  },
}))
