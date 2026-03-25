import client from './client'
import type { ApiResponse, SimStatus, StockResponse, StockTechnicalResponse } from '../types'

export const getStock = (ticker: string) =>
  client
    .get<ApiResponse<StockResponse>>(`/stocks/${ticker}`)
    .then((r) => r.data)

export const searchStocks = (keyword: string) =>
  client
    .get<ApiResponse<StockResponse[]>>('/stocks', {
      params: { keyword },
    })
    .then((r) => r.data)

export const getStockTechnicals = (ticker: string) =>
  client
    .get<ApiResponse<StockTechnicalResponse>>(`/stocks/${ticker}/technicals`)
    .then((r) => r.data)

export const getSimStatus = () =>
  client.get<SimStatus>('/stocks/sim/status').then((r) => r.data)
