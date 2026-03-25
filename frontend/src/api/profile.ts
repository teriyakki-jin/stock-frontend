import client from './client'
import type { ApiResponse, Profile } from '../types'

export function getMyProfile(): Promise<ApiResponse<Profile>> {
  return client.get<ApiResponse<Profile>>('/profile/me').then(r => r.data)
}

export function updateProfile(data: {
  nickname?: string
  bio?: string
}): Promise<ApiResponse<void>> {
  return client.patch<ApiResponse<void>>('/profile/me', data).then(r => r.data)
}
