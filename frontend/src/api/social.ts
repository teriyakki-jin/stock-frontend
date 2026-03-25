import client from './client'
import type { ApiResponse } from '../types'

export interface FollowUser {
  local_member_id: number
  nickname: string
  avatar_url: string | null
  created_at: string
}

export interface FollowCounts {
  followerCount: number
  followingCount: number
}

export const followUser = (targetMemberId: number) =>
  client.post<ApiResponse<null>>(`/social/follow/${targetMemberId}`).then(r => r.data)

export const unfollowUser = (targetMemberId: number) =>
  client.delete<ApiResponse<null>>(`/social/follow/${targetMemberId}`).then(r => r.data)

export const checkFollowing = (targetMemberId: number) =>
  client.get<ApiResponse<{ following: boolean }>>(`/social/follow/${targetMemberId}`)
    .then(r => r.data.data?.following ?? false)

export const getMyFollowers = (offset = 0, limit = 20) =>
  client.get<ApiResponse<FollowUser[]>>('/social/followers', { params: { offset, limit } })
    .then(r => r.data.data ?? [])

export const getMyFollowings = (offset = 0, limit = 20) =>
  client.get<ApiResponse<FollowUser[]>>('/social/followings', { params: { offset, limit } })
    .then(r => r.data.data ?? [])

export const getFollowCounts = (memberId: number) =>
  client.get<ApiResponse<FollowCounts>>(`/social/counts/${memberId}`)
    .then(r => r.data.data ?? { followerCount: 0, followingCount: 0 })

export const getFollowersOf = (memberId: number, offset = 0, limit = 20) =>
  client.get<ApiResponse<FollowUser[]>>(`/social/followers/${memberId}`, { params: { offset, limit } })
    .then(r => r.data.data ?? [])
