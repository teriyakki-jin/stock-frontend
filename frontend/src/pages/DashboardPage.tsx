import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { getAccount, deposit } from '../api/accounts'
import { getOrderHistory } from '../api/orders'
import { getPortfolioSummary } from '../api/portfolio'
import { useOrderFillSse } from '../hooks/useOrderFillSse'
import type { OrderResponse, HoldingDetail } from '../types'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts'

const fmt = (n: number) => n.toLocaleString('ko-KR')
const fmtRate = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`

const PIE_COLORS = [
  '#00ff88', '#00d4ff', '#ffaa00', '#ff6688', '#aa88ff',
  '#44ffcc', '#ff8844', '#88aaff', '#ffdd44', '#ff44aa',
]

export default function DashboardPage() {
  const { accountId, accessToken } = useAuthStore()
  const qc = useQueryClient()

  const lastFill = useOrderFillSse(accessToken)

  const [fillToast, setFillToast] = useState<string | null>(null)

  useEffect(() => {
    if (!lastFill) return
    const side = lastFill.orderType.startsWith('BUY') ? '매수' : '매도'
    setFillToast(
      `[체결] ${lastFill.stockName}(${lastFill.ticker}) ${side} ${lastFill.quantity}주 @₩${fmt(lastFill.fillPrice)}`
    )
    const t = setTimeout(() => setFillToast(null), 5000)
    qc.invalidateQueries({ queryKey: ['portfolio', accountId] })
    qc.invalidateQueries({ queryKey: ['account', accountId] })
    return () => clearTimeout(t)
  }, [lastFill, accountId, qc])

  const { data: accountRes } = useQuery({
    queryKey: ['account', accountId],
    queryFn: () => getAccount(accountId!),
    enabled: !!accountId,
    refetchInterval: 15_000,
  })

  const { data: portfolioRes } = useQuery({
    queryKey: ['portfolio', accountId],
    queryFn: () => getPortfolioSummary(accountId!),
    enabled: !!accountId,
    refetchInterval: 15_000,
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
  const portfolio = portfolioRes?.data
  const holdings: HoldingDetail[] = portfolio?.holdings ?? []
  const orders: OrderResponse[] = ordersRes?.data?.content ?? []

  const pieData = holdings.map((h) => ({
    name: h.ticker,
    value: parseFloat(h.allocationPct.toFixed(2)),
    stockName: h.stockName,
  }))

  const barData = holdings.map((h) => ({
    name: h.ticker,
    value: parseFloat(h.profitRate.toFixed(2)),
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Order fill toast */}
      {fillToast && (
        <div className="fixed top-4 right-4 z-50 bg-terminal-green/10 border border-terminal-green/40
                        text-terminal-green font-mono text-xs px-4 py-3 rounded-sm shadow-lg
                        animate-fade-in flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse" />
          {fillToast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="label-tag">PORTFOLIO DASHBOARD</p>
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
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="BALANCE" value={`₩${fmt(account?.balance ?? 0)}`} accent="green" />
        <KpiCard
          label="PORTFOLIO VALUE"
          value={`₩${fmt(portfolio?.currentValue ?? 0)}`}
          accent="amber"
        />
        <KpiCard
          label="TOTAL P&L"
          value={portfolio ? `${portfolio.totalPnl >= 0 ? '+' : ''}₩${fmt(portfolio.totalPnl)}` : '—'}
          accent={(portfolio?.totalPnl ?? 0) >= 0 ? 'green' : 'red'}
        />
        <KpiCard
          label="RETURN RATE"
          value={portfolio ? fmtRate(portfolio.pnlRate) : '—'}
          accent={(portfolio?.pnlRate ?? 0) >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Allocation Pie */}
        <div className="terminal-card">
          <div className="border-b border-terminal-border px-4 py-2.5">
            <span className="label-tag">ALLOCATION</span>
          </div>
          <div className="p-4 h-[240px]">
            {pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center font-mono text-xs text-terminal-muted">
                NO POSITIONS
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} opacity={0.85} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#0f0f0f',
                      border: '1px solid #1a1a1a',
                      borderRadius: '2px',
                      fontFamily: 'JetBrains Mono',
                      fontSize: 11,
                      color: '#e0e0e0',
                    }}
                    formatter={(v: number, name: string) => [
                      `${(v as number).toFixed(1)}%`,
                      name,
                    ]}
                  />
                  <Legend
                    formatter={(value) => (
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#888' }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Return Rate Bar */}
        <div className="terminal-card">
          <div className="border-b border-terminal-border px-4 py-2.5">
            <span className="label-tag">RETURN BY STOCK</span>
          </div>
          <div className="p-4 h-[240px]">
            {barData.length === 0 ? (
              <div className="h-full flex items-center justify-center font-mono text-xs text-terminal-muted">
                NO DATA
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barSize={22}>
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
                    {barData.map((entry, i) => (
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

      {/* Holdings table */}
      <div className="terminal-card">
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
                {['TICKER', 'NAME', 'QTY', 'AVG COST', 'CURRENT', 'VALUE', 'P&L %', 'WEIGHT'].map((h) => (
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
                  <td className="px-4 py-2.5 font-mono text-xs text-terminal-dim max-w-[120px] truncate">
                    {h.stockName}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-terminal-text">
                    {h.quantity.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-terminal-dim">
                    ₩{fmt(h.avgPrice)}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-terminal-text">
                    ₩{fmt(h.currentPrice)}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-terminal-amber">
                    ₩{fmt(h.evaluatedAmount)}
                  </td>
                  <td className={`px-4 py-2.5 font-mono text-xs font-semibold ${h.profitRate >= 0 ? 'price-up' : 'price-down'}`}>
                    {fmtRate(h.profitRate)}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-terminal-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-terminal-green/70 rounded-full"
                          style={{ width: `${Math.min(h.allocationPct, 100)}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-terminal-muted w-10 text-right">
                        {h.allocationPct.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
                  {['TIME', 'TICKER', 'TYPE', 'QTY', 'AMOUNT', 'STATUS'].map((h) => (
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
                        o.orderType.startsWith('BUY')
                          ? 'bg-terminal-green/10 text-terminal-green border border-terminal-green/30'
                          : 'bg-terminal-red/10 text-terminal-red border border-terminal-red/30'
                      }`}>
                        {o.orderType}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-terminal-text">
                      {o.quantity.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-terminal-text">
                      ₩{fmt(o.totalAmount)}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-sm ${
                        o.status === 'EXECUTED'
                          ? 'bg-terminal-green/10 text-terminal-green border border-terminal-green/30'
                          : o.status === 'PENDING'
                          ? 'bg-terminal-amber/10 text-terminal-amber border border-terminal-amber/30'
                          : 'bg-terminal-muted/10 text-terminal-muted border border-terminal-muted/30'
                      }`}>
                        {o.status}
                      </span>
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
