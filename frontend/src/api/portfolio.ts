import client from './client'
import type { ApiResponse, PortfolioSummaryResponse } from '../types'

export const getPortfolioSummary = (accountId: number) =>
  client
    .get<ApiResponse<PortfolioSummaryResponse>>(`/accounts/${accountId}/portfolio/summary`)
    .then((r) => r.data)
