import axios from 'axios'

const API_BASE_URL = import.meta.env.DEV
  ? '/api'
  : import.meta.env.VITE_API_PRODUCTION_URL || '/api'

/** feature의 API 요청에서 공통으로 사용하는 Axios 인스턴스다. */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 10_000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

let refreshPromise
let refreshController
let onAuthenticationExpired = () => {}
let sessionGeneration = 0

/** 세션 교체 전에 시작된 요청이 새 인증 상태를 바꾸지 못하게 한다. */
export const invalidateSessionRequests = () => {
  sessionGeneration += 1
  refreshController?.abort()
  refreshController = undefined
  refreshPromise = undefined
}

apiClient.interceptors.request.use((config) => {
  config._sessionGeneration ??= sessionGeneration
  return config
})

/** 인증이 만료된 경우 세션을 정리할 함수를 등록한다. */
export const setAuthenticationExpiredHandler = (handler) => {
  onAuthenticationExpired = handler
}

/** Refresh 쿠키로 접근 토큰을 재발급하며 동시 요청을 하나로 합친다. */
export const refreshAccessToken = () => {
  if (refreshPromise) return refreshPromise
  const controller = new AbortController()
  refreshController = controller
  const pending = axios
    .post(`${API_BASE_URL}/v1/auth/token/refresh`, null, {
      withCredentials: true,
      timeout: apiClient.defaults.timeout,
      signal: controller.signal,
    })
    .then((response) => response.data.data.accessToken)
    .finally(() => {
      if (refreshPromise === pending) {
        refreshPromise = undefined
        refreshController = undefined
      }
    })
  refreshPromise = pending
  return refreshPromise
}

// 인증 요청은 재시도하지 않고, 보호된 요청의 만료 토큰만 한 번 갱신한다.
apiClient.interceptors.response.use(undefined, async (error) => {
  const request = error.config
  if (error.response?.status !== 401 || !request || request.url?.startsWith('/v1/auth/')) {
    return Promise.reject(error)
  }
  const generation = request._sessionGeneration ?? sessionGeneration
  const isCurrentSession = () => generation === sessionGeneration
  if (request.signal?.aborted || !isCurrentSession()) {
    return Promise.reject(new axios.CanceledError('Request canceled'))
  }
  if (request._retried) {
    if (!request.signal?.aborted && isCurrentSession()) onAuthenticationExpired()
    return Promise.reject(error)
  }
  request._retried = true
  try {
    const token = await refreshAccessToken()
    if (request.signal?.aborted || !isCurrentSession())
      throw new axios.CanceledError('Request canceled')
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`
    request.headers.Authorization = `Bearer ${token}`
    return apiClient(request)
  } catch (refreshError) {
    if (!request.signal?.aborted && isCurrentSession() && refreshError.response?.status === 401) {
      onAuthenticationExpired()
    }
    return Promise.reject(refreshError)
  }
})
