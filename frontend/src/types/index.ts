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

export interface HoldingDetail {
  holdingId: number
  ticker: string
  stockName: string
  quantity: number
  avgPrice: number
  currentPrice: number
  evaluatedAmount: number
  profitRate: number
  allocationPct: number
}

export interface PortfolioSummaryResponse {
  totalInvested: number
  currentValue: number
  totalPnl: number
  pnlRate: number
  holdings: HoldingDetail[]
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface OhlcvBar {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface TechnicalData {
  rsi: number
  macd: number
  macdSignal: number
  macdHistogram: number
  bbUpper: number
  bbMiddle: number
  bbLower: number
  signal: 'BUY' | 'SELL' | 'NEUTRAL'
}

export interface StockTechnicalResponse {
  ticker: string
  name: string
  history: OhlcvBar[]
  technicals: TechnicalData
  annualizedVolatility: number
  annualizedReturn: number
}

export interface SimStatus {
  simulation: boolean
  marketOpen: boolean
  calibrated: boolean
  mode: 'LIVE' | 'REALTIME' | 'SIM'
  interval: number
}

// ─── Ranking ──────────────────────────────────────────────

export type RankingPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME'

export interface RankingEntry {
  rank: number
  nickname: string
  avatarUrl: string | null
  pnlRate: number
  totalPnl: number
  totalTrades: number
}

export interface MyRanking {
  rank: number
  pnlRate: number
  totalPnl: number
  totalTrades: number
  period: RankingPeriod
  snapshotDate: string
}

// ─── Profile ──────────────────────────────────────────────

export interface Profile {
  id: string
  localMemberId: number
  nickname: string
  avatarUrl: string | null
  bio: string | null
}
