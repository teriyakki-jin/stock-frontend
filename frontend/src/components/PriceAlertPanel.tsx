import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import {
  createAlert,
  getAlerts,
  deleteAlert,
  type AlertCondition,
  type PriceAlertResponse,
} from '../api/alerts'

interface Props {
  accountId: number
  ticker: string
  currentPrice?: number
}

const alertSchema = z.object({
  targetPrice: z
    .number()
    .positive('0보다 큰 값을 입력하세요')
    .finite('유효한 숫자를 입력하세요'),
})

const COND_LABEL: Record<AlertCondition, string> = {
  GTE: '이상 ▲',
  LTE: '이하 ▼',
}
const COND_COLOR: Record<AlertCondition, string> = {
  GTE: 'text-terminal-green',
  LTE: 'text-terminal-red',
}

export default function PriceAlertPanel({ accountId, ticker, currentPrice }: Props) {
  const qc = useQueryClient()
  const [targetPrice, setTargetPrice] = useState(currentPrice ? String(currentPrice) : '')
  const [condition, setCondition] = useState<AlertCondition>('GTE')
  const [validationError, setValidationError] = useState<string | null>(null)

  const { data: alertsRes } = useQuery({
    queryKey: ['alerts', accountId],
    queryFn: () => getAlerts(accountId),
    staleTime: 15_000,
  })

  const alerts = (alertsRes?.data ?? []).filter((a) => a.ticker === ticker)

  const createMut = useMutation({
    mutationFn: (price: number) =>
      createAlert(accountId, {
        ticker,
        targetPrice: price,
        condition,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts', accountId] })
      setTargetPrice(currentPrice ? String(currentPrice) : '')
      setValidationError(null)
    },
  })

  const deleteMut = useMutation({
    mutationFn: (alertId: number) => deleteAlert(accountId, alertId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts', accountId] }),
  })

  const handleCreate = () => {
    const parsed = alertSchema.safeParse({ targetPrice: Number(targetPrice) })
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? '입력값을 확인하세요')
      return
    }
    setValidationError(null)
    createMut.mutate(parsed.data.targetPrice)
  }

  const statusBadge = (alert: PriceAlertResponse) => {
    if (alert.triggered)
      return <span className="font-mono text-xs text-terminal-amber border border-terminal-amber/40 px-1.5 py-0.5 rounded-sm">발동</span>
    if (alert.active)
      return <span className="font-mono text-xs text-terminal-green border border-terminal-green/40 px-1.5 py-0.5 rounded-sm">대기</span>
    return <span className="font-mono text-xs text-terminal-muted border border-terminal-border px-1.5 py-0.5 rounded-sm">비활성</span>
  }

  return (
    <div className="border border-terminal-border bg-terminal-surface rounded-sm p-3">
      <div className="font-mono text-xs text-terminal-muted uppercase tracking-widest mb-3">
        PRICE ALERTS — {ticker}
      </div>

      {/* 등록 폼 */}
      <div className="flex gap-2 mb-3">
        {/* 조건 토글 */}
        <div className="flex border border-terminal-border rounded-sm overflow-hidden shrink-0">
          {(['GTE', 'LTE'] as AlertCondition[]).map((c) => (
            <button
              key={c}
              onClick={() => setCondition(c)}
              className={`font-mono text-xs px-2 py-1 transition-colors ${
                condition === c
                  ? c === 'GTE'
                    ? 'bg-terminal-green/10 text-terminal-green'
                    : 'bg-terminal-red/10 text-terminal-red'
                  : 'text-terminal-dim hover:text-terminal-text'
              }`}
            >
              {COND_LABEL[c]}
            </button>
          ))}
        </div>

        {/* 목표가 입력 */}
        <input
          type="number"
          value={targetPrice}
          onChange={(e) => setTargetPrice(e.target.value)}
          placeholder="목표가"
          className="flex-1 bg-terminal-bg border border-terminal-border font-mono text-xs text-terminal-text placeholder:text-terminal-dim px-2 py-1 rounded-sm focus:outline-none focus:border-terminal-green min-w-0"
        />

        {/* 등록 버튼 */}
        <button
          onClick={handleCreate}
          disabled={!targetPrice || createMut.isPending}
          className="font-mono text-xs border border-terminal-green text-terminal-green hover:bg-terminal-green/10 disabled:opacity-40 px-3 py-1 rounded-sm transition-colors shrink-0"
        >
          {createMut.isPending ? '...' : '등록'}
        </button>
      </div>

      {/* 유효성 에러 */}
      {validationError && (
        <div className="font-mono text-xs text-terminal-red mb-2">
          ⚠ {validationError}
        </div>
      )}

      {/* 현재가 힌트 */}
      {currentPrice && (
        <div className="font-mono text-xs text-terminal-muted mb-3">
          현재가: <span className="text-terminal-text">{currentPrice.toLocaleString('ko-KR')}원</span>
        </div>
      )}

      {/* 알림 목록 */}
      {alerts.length === 0 ? (
        <div className="font-mono text-xs text-terminal-dim text-center py-3">
          등록된 알림 없음
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between border border-terminal-border/50 rounded-sm px-2 py-1.5"
            >
              <div className="flex items-center gap-2">
                <span className={`font-mono text-xs font-bold ${COND_COLOR[alert.condition]}`}>
                  {COND_LABEL[alert.condition]}
                </span>
                <span className="font-mono text-xs text-terminal-text">
                  {alert.targetPrice.toLocaleString('ko-KR')}원
                </span>
                {statusBadge(alert)}
              </div>
              <button
                onClick={() => deleteMut.mutate(alert.id)}
                disabled={deleteMut.isPending}
                className="font-mono text-xs text-terminal-muted hover:text-terminal-red transition-colors ml-2"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
