import { create } from 'zustand'
import { apiClient } from '@/lib/api-client'

/** 로그인 결과를 메모리에 보관하고 이후 API 요청에 인증 헤더를 설정한다. */
export const useAuth = create((set) => ({
  member: null,
  setSession: ({ accessToken, member }) => {
    apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`
    set({ member })
  },
}))
