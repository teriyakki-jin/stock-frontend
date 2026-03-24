import client from './client'
import type {
  ApiResponse,
  OrderResponse,
  HoldingResponse,
  PageResponse,
} from '../types'

interface OrderPayload {
  ticker: string
  orderType: string
  quantity: number
  limitPrice?: number | null
}

export const buyOrder = (accountId: number, data: OrderPayload) =>
  client
    .post<ApiResponse<OrderResponse>>(`/accounts/${accountId}/orders/buy`, data)
    .then((r) => r.data)

export const sellOrder = (accountId: number, data: OrderPayload) =>
  client
    .post<ApiResponse<OrderResponse>>(`/accounts/${accountId}/orders/sell`, data)
    .then((r) => r.data)

export const cancelOrder = (accountId: number, orderId: number) =>
  client
    .delete(`/accounts/${accountId}/orders/${orderId}`)
    .then((r) => r.data)

export const getPendingOrders = (accountId: number) =>
  client
    .get<ApiResponse<OrderResponse[]>>(`/accounts/${accountId}/orders/pending`)
    .then((r) => r.data)

export const getHoldings = (accountId: number) =>
  client
    .get<ApiResponse<HoldingResponse[]>>(`/accounts/${accountId}/orders/holdings`)
    .then((r) => r.data)

export const getOrderHistory = (accountId: number, page = 0) =>
  client
    .get<ApiResponse<PageResponse<OrderResponse>>>(`/accounts/${accountId}/orders`, {
      params: { page, size: 10 },
    })
    .then((r) => r.data)
