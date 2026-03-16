export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
}

export interface AccountResponse {
  id: number
  accountNumber: string
  balance: number
  status: 'ACTIVE' | 'CLOSED'
}

export interface StockResponse {
  id: number
  ticker: string
  name: string
  market: string
  basePrice: number
  currentPrice: number
  changeRate: number
}

export interface OrderResponse {
  orderId: number
  ticker: string
  stockName: string
  orderType: 'BUY' | 'SELL'
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED'
  quantity: number
  unitPrice: number
  totalAmount: number
  executedAt: string
}

export interface HoldingResponse {
  holdingId: number
  ticker: string
  stockName: string
  quantity: number
  avgPrice: number
  currentPrice: number
  evaluatedAmount: number
  profitRate: number
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}
