import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PriceAlertPanel from '../components/PriceAlertPanel'
import * as alertsApi from '../api/alerts'

vi.mock('../api/alerts')

const mockAlerts = [
  {
    id: 1,
    ticker: 'AAPL',
    targetPrice: 200,
    condition: 'GTE' as const,
    active: true,
    triggered: false,
    acknowledged: false,
    createdAt: '2026-01-01T00:00:00',
    triggeredAt: null,
  },
  {
    id: 2,
    ticker: 'AAPL',
    targetPrice: 150,
    condition: 'LTE' as const,
    active: false,
    triggered: true,
    acknowledged: false,
    createdAt: '2026-01-01T00:00:00',
    triggeredAt: '2026-01-02T00:00:00',
  },
]

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

beforeEach(() => {
  vi.mocked(alertsApi.getAlerts).mockResolvedValue({
    success: true,
    data: mockAlerts,
  } as any)
  vi.mocked(alertsApi.createAlert).mockResolvedValue({ success: true, data: mockAlerts[0] } as any)
  vi.mocked(alertsApi.deleteAlert).mockResolvedValue({ success: true, data: undefined } as any)
})

describe('PriceAlertPanel', () => {
  it('헤더에 종목코드를 표시한다', () => {
    render(<PriceAlertPanel accountId={1} ticker="AAPL" />, { wrapper })
    expect(screen.getByText(/PRICE ALERTS — AAPL/i)).toBeDefined()
  })

  it('알림 목록이 렌더링된다', async () => {
    render(<PriceAlertPanel accountId={1} ticker="AAPL" />, { wrapper })
    await waitFor(() => {
      expect(screen.getAllByText(/이상|이하/)).toHaveLength(4) // 버튼 2 + 목록 2
    })
  })

  it('대기 중 알림에 대기 배지를 표시한다', async () => {
    render(<PriceAlertPanel accountId={1} ticker="AAPL" />, { wrapper })
    await waitFor(() => {
      expect(screen.getByText('대기')).toBeDefined()
    })
  })

  it('발동된 알림에 발동 배지를 표시한다', async () => {
    render(<PriceAlertPanel accountId={1} ticker="AAPL" />, { wrapper })
    await waitFor(() => {
      expect(screen.getByText('발동')).toBeDefined()
    })
  })

  it('목표가 없으면 등록 버튼이 비활성화된다', () => {
    render(<PriceAlertPanel accountId={1} ticker="AAPL" />, { wrapper })
    const btn = screen.getByRole('button', { name: '등록' })
    expect((btn as HTMLButtonElement).disabled).toBe(true)
  })

  it('유효하지 않은 목표가(-1) 입력 시 유효성 에러를 표시한다', async () => {
    render(<PriceAlertPanel accountId={1} ticker="AAPL" />, { wrapper })

    const input = screen.getByPlaceholderText('목표가')
    fireEvent.change(input, { target: { value: '-1' } })

    const btn = screen.getByRole('button', { name: '등록' })
    fireEvent.click(btn)

    await waitFor(() => {
      expect(screen.getByText(/0보다 큰 값/)).toBeDefined()
    })
  })

  it('현재가를 힌트로 표시한다', () => {
    render(<PriceAlertPanel accountId={1} ticker="AAPL" currentPrice={180000} />, { wrapper })
    expect(screen.getByText(/현재가/)).toBeDefined()
    expect(screen.getByText(/180,000원/)).toBeDefined()
  })

  it('ticker가 다른 알림은 목록에 표시하지 않는다', async () => {
    vi.mocked(alertsApi.getAlerts).mockResolvedValue({
      success: true,
      data: [{ ...mockAlerts[0], ticker: 'TSLA' }],
    } as any)

    render(<PriceAlertPanel accountId={1} ticker="AAPL" />, { wrapper })
    await waitFor(() => {
      expect(screen.getByText('등록된 알림 없음')).toBeDefined()
    })
  })

  it('✕ 클릭 시 deleteAlert를 호출한다', async () => {
    render(<PriceAlertPanel accountId={1} ticker="AAPL" />, { wrapper })

    await waitFor(() => screen.getAllByRole('button', { name: '✕' }))
    const deleteBtn = screen.getAllByRole('button', { name: '✕' })[0]
    fireEvent.click(deleteBtn)

    await waitFor(() => {
      expect(alertsApi.deleteAlert).toHaveBeenCalledWith(1, mockAlerts[0].id)
    })
  })
})
