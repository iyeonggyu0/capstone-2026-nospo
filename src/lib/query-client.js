import { QueryClient } from '@tanstack/react-query'

/** 애플리케이션 전역에서 공유할 TanStack Query 클라이언트다. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})
