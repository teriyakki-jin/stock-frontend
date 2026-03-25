import axios from 'axios'

const ragClient = axios.create({
  baseURL: 'http://localhost:8090',
  timeout: 30_000,
})

export interface RagQueryRequest {
  query: string
  ticker?: string
  persona?: 'neutral' | 'aggressive' | 'conservative'
  k?: number
  date_from?: string
  date_to?: string
}

export interface RagQueryResponse {
  answer: string
  sources: string[]
  chunk_count: number
  ticker: string | null
}

export interface ReportInfo {
  ticker: string
  filename: string
  date: string | null
  analyst: string | null
}

export const ragQuery = (req: RagQueryRequest) =>
  ragClient.post<RagQueryResponse>('/query', req).then((r) => r.data)

export const getRagReports = () =>
  ragClient.get<ReportInfo[]>('/reports').then((r) => r.data)

export const getRagHealth = () =>
  ragClient.get<{ status: string; chain_ready: boolean }>('/health').then((r) => r.data)
