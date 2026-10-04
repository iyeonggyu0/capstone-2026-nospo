import axios from 'axios'

const API_BASE_URL = import.meta.env.DEV
  ? '/api'
  : import.meta.env.VITE_API_PRODUCTION_URL || '/api'

/** feature의 API 요청에서 공통으로 사용하는 Axios 인스턴스다. */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
})
