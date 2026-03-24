export interface StockPriceData {
  price: number
  changePercent: number
  volume: number | null
  dayHigh: number | null
  dayLow: number | null
}

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
  volume: number | null    // 거래량 (null = 시세 미수신)
  dayHigh: number | null   // 당일 고가
  dayLow: number | null    // 당일 저가
}

export interface OrderResponse {
  orderId: number
  ticker: string
  stockName: string
  orderType: 'BUY' | 'SELL' | 'BUY_LIMIT' | 'SELL_LIMIT'
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED'
  quantity: number
  unitPrice: number
  totalAmount: number
  limitPrice: number | null
  remainingQty: number | null
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
