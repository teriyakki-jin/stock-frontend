import client from './client'
import type { ApiResponse } from '../types'

export type AlertCondition = 'GTE' | 'LTE'

export interface PriceAlertResponse {
  id: number
  ticker: string
  targetPrice: number
  condition: AlertCondition
  active: boolean
  triggered: boolean
  acknowledged: boolean
  createdAt: string
  triggeredAt: string | null
}

export interface PriceAlertRequest {
  ticker: string
  targetPrice: number
  condition: AlertCondition
}

export const createAlert = (accountId: number, req: PriceAlertRequest) =>
  client
    .post<ApiResponse<PriceAlertResponse>>(`/accounts/${accountId}/alerts`, req)
    .then((r) => r.data)

export const getAlerts = (accountId: number) =>
  client
    .get<ApiResponse<PriceAlertResponse[]>>(`/accounts/${accountId}/alerts`)
    .then((r) => r.data)

export const getPendingAlerts = (accountId: number) =>
  client
    .get<ApiResponse<PriceAlertResponse[]>>(`/accounts/${accountId}/alerts/pending`)
    .then((r) => r.data)

export const deleteAlert = (accountId: number, alertId: number) =>
  client
    .delete<ApiResponse<void>>(`/accounts/${accountId}/alerts/${alertId}`)
    .then((r) => r.data)

export const acknowledgeAlert = (accountId: number, alertId: number) =>
  client
    .patch<ApiResponse<void>>(`/accounts/${accountId}/alerts/${alertId}/acknowledge`)
    .then((r) => r.data)
