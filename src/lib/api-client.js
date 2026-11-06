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

// 인증 요청은 재시도하지 않고, 보호된 요청의 만료 토큰만 한 번 갱신한다.
apiClient.interceptors.response.use(undefined, async (error) => {
  const request = error.config
  if (
    error.response?.status !== 401 ||
    !request ||
    request._retried ||
    request.url?.startsWith('/v1/auth/')
  ) {
    return Promise.reject(error)
  }
  request._retried = true
  try {
    refreshPromise ||= axios
      .post(`${API_BASE_URL}/v1/auth/token/refresh`, null, {
        withCredentials: true,
        timeout: apiClient.defaults.timeout,
      })
      .then((response) => response.data.data.accessToken)
      .finally(() => {
        refreshPromise = null
      })
    const token = await refreshPromise
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`
    request.headers.Authorization = `Bearer ${token}`
    return apiClient(request)
  } catch {
    delete apiClient.defaults.headers.common.Authorization
    return Promise.reject(error)
  }
})
