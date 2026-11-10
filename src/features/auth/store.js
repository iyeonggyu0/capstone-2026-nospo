import { create } from 'zustand'
import {
  apiClient,
  invalidateSessionRequests,
  refreshAccessToken,
  setAuthenticationExpiredHandler,
} from '@/lib/api-client'
import { queryClient } from '@/lib/query-client'

let restoreController

/** 로그인 결과를 메모리에 보관하고 이후 API 요청에 인증 헤더를 설정한다. */
export const useAuth = create((set, get) => ({
  member: null,
  status: 'unknown',
  preview: false,
  enablePreview: () => set({ preview: true }),
  setSession: ({ accessToken, member }) => {
    get().clearSession()
    apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`
    set({ member, status: 'authenticated' })
  },
  clearSession: () => {
    invalidateSessionRequests()
    restoreController?.abort()
    restoreController = null
    delete apiClient.defaults.headers.common.Authorization
    set({ member: null, status: 'anonymous' })
    void queryClient.cancelQueries()
    queryClient.clear()
  },
  restoreSession: async () => {
    if (!['unknown', 'error'].includes(get().status)) return
    const controller = new AbortController()
    restoreController = controller
    const isCurrent = () => get().status === 'checking' && restoreController === controller
    set({ status: 'checking' })
    try {
      const accessToken = await refreshAccessToken()
      if (!isCurrent()) return
      apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`
      const response = await apiClient.get('/v1/me', { signal: controller.signal })
      if (isCurrent()) set({ member: response.data.data, status: 'authenticated' })
    } catch (error) {
      if (!isCurrent()) return
      if (error.response?.status === 401) {
        get().clearSession()
      } else {
        delete apiClient.defaults.headers.common.Authorization
        set({ status: 'error' })
      }
    } finally {
      if (restoreController === controller) restoreController = null
    }
  },
}))

setAuthenticationExpiredHandler(() => useAuth.getState().clearSession())
