import axios, { AxiosError } from 'axios'
import { useAuthStore } from '../store/authStore'

const client = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/auth'
    }
    // 서버 에러 메시지를 Error 객체 message로 정규화
    const serverMessage = error.response?.data?.message
    if (serverMessage) {
      return Promise.reject(new Error(serverMessage))
    }
    return Promise.reject(error)
  }
)

export default client
