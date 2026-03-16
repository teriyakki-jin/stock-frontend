import client from './client'
import type { ApiResponse, TokenResponse } from '../types'

export const signUp = (data: {
  email: string
  password: string
  name: string
  phone: string
}) => client.post<ApiResponse<void>>('/auth/sign-up', data).then((r) => r.data)

export const login = (data: { email: string; password: string }) =>
  client
    .post<ApiResponse<TokenResponse>>('/auth/login', data)
    .then((r) => r.data)

export const logout = () =>
  client.post<ApiResponse<void>>('/auth/logout').then((r) => r.data)
