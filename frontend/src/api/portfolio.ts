import client from './client'
import type { ApiResponse, PortfolioSummaryResponse, PortfolioAnalysis } from '../types'

export const getPortfolioSummary = (accountId: number) =>
  client
    .get<ApiResponse<PortfolioSummaryResponse>>(`/accounts/${accountId}/portfolio/summary`)
    .then((r) => r.data)

export const getPortfolioAnalysis = (accountId: number, days = 30) =>
  client
    .get<ApiResponse<PortfolioAnalysis>>(`/accounts/${accountId}/portfolio/analysis`, {
      params: { days },
    })
    .then((r) => r.data)
