import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePendingAlerts } from '../hooks/usePendingAlerts'
import * as alertsApi from '../api/alerts'
import * as authStore from '../store/authStore'

vi.mock('../api/alerts')
vi.mock('../store/authStore')

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

const pendingAlert = {
  id: 10,
  ticker: 'AAPL',
  targetPrice: 200,
  condition: 'GTE' as const,
  active: false,
  triggered: true,
  acknowledged: false,
  createdAt: '2026-01-01T00:00:00',
  triggeredAt: '2026-01-02T00:00:00',
}

beforeEach(() => {
  vi.mocked(authStore.useAuthStore).mockReturnValue({ accountId: 1 } as any)
  vi.mocked(alertsApi.acknowledgeAlert).mockResolvedValue({ success: true, data: undefined } as any)
})

describe('usePendingAlerts', () => {
  it('accountId 없으면 쿼리가 비활성화된다 (pendingCount=0)', async () => {
    vi.mocked(authStore.useAuthStore).mockReturnValue({ accountId: null } as any)
    vi.mocked(alertsApi.getPendingAlerts).mockResolvedValue({ success: true, data: [] } as any)

    const onAlert = vi.fn()
    const { result } = renderHook(() => usePendingAlerts(onAlert), { wrapper })

    await waitFor(() => {
      expect(result.current.pendingCount).toBe(0)
    })
    expect(alertsApi.getPendingAlerts).not.toHaveBeenCalled()
  })

  it('발동 알림이 있으면 onAlert 콜백이 호출된다', async () => {
    vi.mocked(alertsApi.getPendingAlerts).mockResolvedValue({
      success: true,
      data: [pendingAlert],
    } as any)

    const onAlert = vi.fn()
    renderHook(() => usePendingAlerts(onAlert), { wrapper })

    await waitFor(() => {
      expect(onAlert).toHaveBeenCalledTimes(1)
      expect(onAlert).toHaveBeenCalledWith(
        expect.stringContaining('AAPL'),
      )
    })
  })

  it('발동 알림이 있으면 acknowledgeAlert가 호출된다', async () => {
    vi.mocked(alertsApi.getPendingAlerts).mockResolvedValue({
      success: true,
      data: [pendingAlert],
    } as any)

    const onAlert = vi.fn()
    renderHook(() => usePendingAlerts(onAlert), { wrapper })

    await waitFor(() => {
      expect(alertsApi.acknowledgeAlert).toHaveBeenCalledWith(1, pendingAlert.id)
    })
  })

  it('발동 알림 없으면 onAlert 콜백이 호출되지 않는다', async () => {
    vi.mocked(alertsApi.getPendingAlerts).mockResolvedValue({
      success: true,
      data: [],
    } as any)

    const onAlert = vi.fn()
    renderHook(() => usePendingAlerts(onAlert), { wrapper })

    await waitFor(() => expect(alertsApi.getPendingAlerts).toHaveBeenCalled())
    expect(onAlert).not.toHaveBeenCalled()
  })

  it('pendingCount는 발동 알림 수를 반환한다', async () => {
    vi.mocked(alertsApi.getPendingAlerts).mockResolvedValue({
      success: true,
      data: [pendingAlert, { ...pendingAlert, id: 11 }],
    } as any)

    const onAlert = vi.fn()
    const { result } = renderHook(() => usePendingAlerts(onAlert), { wrapper })

    await waitFor(() => {
      expect(result.current.pendingCount).toBe(2)
    })
  })

  it('LTE 조건 알림 메시지에 이하가 포함된다', async () => {
    vi.mocked(alertsApi.getPendingAlerts).mockResolvedValue({
      success: true,
      data: [{ ...pendingAlert, condition: 'LTE' as const, targetPrice: 100 }],
    } as any)

    const onAlert = vi.fn()
    renderHook(() => usePendingAlerts(onAlert), { wrapper })

    await waitFor(() => {
      expect(onAlert).toHaveBeenCalledWith(expect.stringContaining('이하'))
    })
  })
})
