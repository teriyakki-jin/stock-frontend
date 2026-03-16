import client from './client'
import type { ApiResponse, AccountResponse } from '../types'

export const openAccount = () =>
  client.post<ApiResponse<AccountResponse>>('/accounts').then((r) => r.data)

export const getMyAccounts = () =>
  client
    .get<ApiResponse<AccountResponse[]>>('/accounts')
    .then((r) => r.data)

export const getAccount = (id: number) =>
  client
    .get<ApiResponse<AccountResponse>>(`/accounts/${id}`)
    .then((r) => r.data)

export const deposit = (id: number, amount: number) =>
  client
    .post<ApiResponse<AccountResponse>>(`/accounts/${id}/deposit`, { amount })
    .then((r) => r.data)
