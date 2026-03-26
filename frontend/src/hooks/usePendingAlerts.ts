import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPendingAlerts, acknowledgeAlert } from '../api/alerts'
import { useAuthStore } from '../store/authStore'

/**
 * 발동된 미확인 알림을 폴링하고 토스트 콜백으로 전달
 */
export function usePendingAlerts(onAlert: (msg: string) => void) {
  const { accountId } = useAuthStore()
  const qc = useQueryClient()

  const { data } = useQuery({
    queryKey: ['alerts-pending', accountId],
    queryFn: () => (accountId ? getPendingAlerts(accountId) : Promise.resolve({ data: [] })),
    enabled: !!accountId,
    refetchInterval: 10_000,
    staleTime: 0,
  })

  const ackMut = useMutation({
    mutationFn: ({ alertId }: { alertId: number }) =>
      acknowledgeAlert(accountId!, alertId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts-pending', accountId] })
      qc.invalidateQueries({ queryKey: ['alerts', accountId] })
    },
  })

  useEffect(() => {
    const pending = data?.data ?? []
    if (pending.length === 0) return

    pending.forEach((alert) => {
      const condLabel = alert.condition === 'GTE' ? '이상' : '이하'
      onAlert(`[알림] ${alert.ticker} ${alert.targetPrice.toLocaleString('ko-KR')}원 ${condLabel} 도달!`)
      ackMut.mutate({ alertId: alert.id })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const pendingCount = data?.data?.length ?? 0
  return { pendingCount }
}
