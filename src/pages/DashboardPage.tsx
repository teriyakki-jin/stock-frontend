import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { getAccount, deposit } from '../api/accounts'
import { getHoldings, getOrderHistory } from '../api/orders'
import type { HoldingResponse, OrderResponse } from '../types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

const fmt = (n: number) => n.toLocaleString('ko-KR')
const fmtRate = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`

export default function DashboardPage() {
  const { accountId } = useAuthStore()
  const qc = useQueryClient()

  const { data: accountRes } = useQuery({
    queryKey: ['account', accountId],
    queryFn: () => getAccount(accountId!),
    enabled: !!accountId,
    refetchInterval: 10_000,
  })

  const { data: holdingsRes } = useQuery({
    queryKey: ['holdings', accountId],
    queryFn: () => getHoldings(accountId!),
    enabled: !!accountId,
    refetchInterval: 10_000,
  })

  const { data: ordersRes } = useQuery({
    queryKey: ['orders', accountId],
    queryFn: () => getOrderHistory(accountId!),
    enabled: !!accountId,
  })

  const [depositAmount, setDepositAmount] = useState('')
  const [depositError, setDepositError] = useState('')

  const depositMut = useMutation({
    mutationFn: (amount: number) => deposit(accountId!, amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['account'] })
      setDepositAmount('')
      setDepositError('')
    },
    onError: () => setDepositError('입금에 실패했습니다'),
  })

  const account = accountRes?.data
  const holdings: HoldingResponse[] = holdingsRes?.data ?? []
  const orders: OrderResponse[] = ordersRes?.data?.content ?? []

  const totalPL = holdings.reduce((s, h) => s + (h.evaluatedAmount - h.avgPrice * h.quantity), 0)
  const totalInvested = holdings.reduce((s, h) => s + h.avgPrice * h.quantity, 0)

  const chartData = holdings.map((h) => ({
    name: h.ticker,
    value: h.profitRate,
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="label-tag">ACCOUNT OVERVIEW</p>
          <h2 className="font-mono text-terminal-dim text-sm mt-0.5">
            {account?.accountNumber ?? '—'}
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse" />
          <span className="font-mono text-xs text-terminal-muted">LIVE</span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard
          label="BALANCE"
          value={`₩${fmt(account?.balance ?? 0)}`}
          accent="green"
        />
        <KpiCard
          label="TOTAL P&L"
          value={`${totalPL >= 0 ? '+' : ''}₩${fmt(totalPL)}`}
          accent={totalPL >= 0 ? 'green' : 'red'}
        />
        <KpiCard
          label="INVESTED"
          value={`₩${fmt(totalInvested)}`}
          accent="amber"
        />
      </div>

      {/* Holdings + Chart */}
      <div className="grid grid-cols-5 gap-4">
        {/* Holdings table */}
        <div className="col-span-3 terminal-card">
          <div className="border-b border-terminal-border px-4 py-2.5 flex items-center justify-between">
            <span className="label-tag">HOLDINGS</span>
            <span className="font-mono text-xs text-terminal-muted">{holdings.length} POSITIONS</span>
          </div>

          {holdings.length === 0 ? (
            <div className="px-4 py-10 text-center font-mono text-xs text-terminal-muted">
              NO OPEN POSITIONS
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-terminal-border/50">
                  {['TICKER', 'QTY', 'AVG', 'CURRENT', 'P&L'].map((h) => (
                    <th key={h} className="px-4 py-2 font-mono text-[10px] text-terminal-muted uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr
                    key={h.holdingId}
                    className="border-b border-terminal-border/30 hover:bg-terminal-border/20 transition-colors"
                  >
                    <td className="px-4 py-2.5 font-mono text-xs text-terminal-green font-semibold">
                      {h.ticker}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-terminal-text">
                      {h.quantity}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-terminal-dim">
                      {fmt(h.avgPrice)}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-terminal-text">
                      {fmt(h.currentPrice)}
                    </td>
                    <td className={`px-4 py-2.5 font-mono text-xs font-semibold ${h.profitRate >= 0 ? 'price-up' : 'price-down'}`}>
                      {fmtRate(h.profitRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Chart */}
        <div className="col-span-2 terminal-card">
          <div className="border-b border-terminal-border px-4 py-2.5">
            <span className="label-tag">RETURN RATE</span>
          </div>
          <div className="p-4 h-[200px]">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center font-mono text-xs text-terminal-muted">
                NO DATA
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={20}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#888', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#888', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0f0f0f',
                      border: '1px solid #1a1a1a',
                      borderRadius: '2px',
                      fontFamily: 'JetBrains Mono',
                      fontSize: 11,
                      color: '#e0e0e0',
                    }}
                    formatter={(v: number) => [`${v.toFixed(2)}%`, 'Return']}
                  />
                  <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.value >= 0 ? '#00ff88' : '#ff4444'}
                        opacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Deposit + Order history */}
      <div className="grid grid-cols-5 gap-4">
        {/* Deposit */}
        <div className="col-span-2 terminal-card p-4 space-y-3">
          <span className="label-tag block">DEPOSIT FUNDS</span>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-terminal-muted">₩</span>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0"
                className="terminal-input pl-7"
                min="1"
              />
            </div>
            <button
              onClick={() => {
                const amt = parseInt(depositAmount)
                if (!amt || amt <= 0) { setDepositError('금액을 입력해주세요'); return }
                depositMut.mutate(amt)
              }}
              disabled={depositMut.isPending}
              className="btn-primary px-5 font-mono text-xs tracking-widest"
            >
              {depositMut.isPending ? '...' : 'SEND'}
            </button>
          </div>
          {/* Quick amounts */}
          <div className="flex gap-2">
            {[100_000, 500_000, 1_000_000].map((amt) => (
              <button
                key={amt}
                onClick={() => setDepositAmount(String(amt))}
                className="flex-1 py-1 font-mono text-[10px] border border-terminal-border text-terminal-muted
                           hover:border-terminal-green hover:text-terminal-green transition-colors rounded-sm"
              >
                +{amt >= 1_000_000 ? '100만' : `${amt / 10000}만`}
              </button>
            ))}
          </div>
          {depositError && (
            <p className="font-mono text-xs text-terminal-red">{depositError}</p>
          )}
          {depositMut.isSuccess && (
            <p className="font-mono text-xs text-terminal-green">✓ 입금 완료</p>
          )}
        </div>

        {/* Recent orders */}
        <div className="col-span-3 terminal-card">
          <div className="border-b border-terminal-border px-4 py-2.5">
            <span className="label-tag">RECENT ORDERS</span>
          </div>
          {orders.length === 0 ? (
            <div className="px-4 py-10 text-center font-mono text-xs text-terminal-muted">
              NO ORDER HISTORY
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-terminal-border/50">
                  {['TIME', 'TICKER', 'TYPE', 'QTY', 'AMOUNT'].map((h) => (
                    <th key={h} className="px-4 py-2 font-mono text-[10px] text-terminal-muted uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 6).map((o) => (
                  <tr
                    key={o.orderId}
                    className="border-b border-terminal-border/30 hover:bg-terminal-border/20 transition-colors"
                  >
                    <td className="px-4 py-2 font-mono text-[10px] text-terminal-muted">
                      {new Date(o.executedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-terminal-text font-semibold">
                      {o.ticker}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-sm ${
                        o.orderType === 'BUY'
                          ? 'bg-terminal-green/10 text-terminal-green border border-terminal-green/30'
                          : 'bg-terminal-red/10 text-terminal-red border border-terminal-red/30'
                      }`}>
                        {o.orderType}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-terminal-text">
                      {o.quantity}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-terminal-text">
                      ₩{fmt(o.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, accent }: { label: string; value: string; accent: 'green' | 'red' | 'amber' }) {
  const colorMap = {
    green: 'text-terminal-green',
    red: 'text-terminal-red',
    amber: 'text-terminal-amber',
  }
  return (
    <div className="terminal-card px-4 py-3">
      <p className="label-tag mb-1">{label}</p>
      <p className={`font-mono text-xl font-bold ${colorMap[accent]} truncate`}>
        {value}
      </p>
    </div>
  )
}
