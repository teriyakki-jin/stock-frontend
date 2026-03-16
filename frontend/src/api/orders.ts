import client from './client'
import type {
  ApiResponse,
  OrderResponse,
  HoldingResponse,
  PageResponse,
} from '../types'

export const buyOrder = (
  accountId: number,
  data: { ticker: string; quantity: number }
) =>
  client
    .post<ApiResponse<OrderResponse>>(
      `/accounts/${accountId}/orders/buy`,
      { ...data, orderType: 'BUY' }
    )
    .then((r) => r.data)

export const sellOrder = (
  accountId: number,
  data: { ticker: string; quantity: number }
) =>
  client
    .post<ApiResponse<OrderResponse>>(
      `/accounts/${accountId}/orders/sell`,
      { ...data, orderType: 'SELL' }
    )
    .then((r) => r.data)

export const getHoldings = (accountId: number) =>
  client
    .get<ApiResponse<HoldingResponse[]>>(
      `/accounts/${accountId}/orders/holdings`
    )
    .then((r) => r.data)

export const getOrderHistory = (accountId: number, page = 0) =>
  client
    .get<ApiResponse<PageResponse<OrderResponse>>>(
      `/accounts/${accountId}/orders`,
      { params: { page, size: 10 } }
    )
    .then((r) => r.data)
