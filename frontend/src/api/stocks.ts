import client from './client'
import type { ApiResponse, StockResponse } from '../types'

export const getStock = (ticker: string) =>
  client
    .get<ApiResponse<StockResponse>>(`/stocks/${ticker}`)
    .then((r) => r.data)

export const searchStocks = (keyword: string) =>
  client
    .get<ApiResponse<StockResponse[]>>('/stocks/search', {
      params: { keyword },
    })
    .then((r) => r.data)
