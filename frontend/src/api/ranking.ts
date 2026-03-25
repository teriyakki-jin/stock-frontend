import client from './client'
import type { ApiResponse, RankingEntry, MyRanking } from '../types'

export type RankingPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME'

export function getLeaderboard(
  period: RankingPeriod = 'ALL_TIME',
  page = 0,
  size = 20,
): Promise<ApiResponse<RankingEntry[]>> {
  return client
    .get<ApiResponse<RankingEntry[]>>(`/ranking?period=${period}&page=${page}&size=${size}`)
    .then(r => r.data)
}

export function getMyRanking(period: RankingPeriod = 'ALL_TIME'): Promise<ApiResponse<MyRanking>> {
  return client
    .get<ApiResponse<MyRanking>>(`/ranking/me?period=${period}`)
    .then(r => r.data)
}
