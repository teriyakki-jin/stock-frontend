import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { getPortfolioAnalysis } from '../api/portfolio'

const SECTOR_COLORS = [
  '#00ff88', '#00ccff', '#ff6b6b', '#ffd93d', '#a29bfe',
  '#fd79a8', '#55efc4', '#fdcb6e', '#74b9ff', '#e17055',
]

const PERIODS = [
  { label: '7일',  value: 7 },
  { label: '30일', value: 30 },
  { label: '90일', value: 90 },
]

interface Props {
  accountId: number
}

export default function PortfolioAnalysisPanel({ accountId }: Props) {
  const [days, setDays] = useState(30)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['portfolio-analysis', accountId, days],
    queryFn: () => getPortfolioAnalysis(accountId, days),
    select: r => r.data,
    refetchInterval: 30_000,
  })

  if (isLoading) return (
    <div className="text-green-400 font-mono text-sm animate-pulse">
      LOADING ANALYSIS...
    </div>
  )

  if (isError || !data) return (
    <div className="text-red-400 font-mono text-sm">ANALYSIS UNAVAILABLE</div>
  )

  return (
    <div className="space-y-6">
      {/* 기간 선택 */}
      <div className="flex gap-2">
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => setDays(p.value)}
            className={`px-3 py-1 text-xs font-mono border transition-colors ${
              days === p.value
                ? 'bg-green-400 text-black border-green-400'
                : 'text-green-400 border-green-800 hover:border-green-400'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 핵심 지표 4개 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="승률" value={`${data.winRate.toFixed(1)}%`} positive={data.winRate >= 50} />
        <Metric label="최대낙폭(MDD)" value={`-${data.mdd.toFixed(2)}%`} positive={false} warn />
        <Metric label="총 거래" value={`${data.totalTrades}건`} />
        <Metric label="수익/손실" value={`${data.profitTrades}W / ${data.lossTrades}L`}
                positive={data.profitTrades >= data.lossTrades} />
      </div>

      {/* 수익률 곡선 */}
      {data.pnlCurve.length > 0 ? (
        <div>
          <div className="text-green-400 font-mono text-xs mb-2">■ 누적 수익률 곡선</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.pnlCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2a1a" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#4ade80', fontSize: 10, fontFamily: 'monospace' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={v => `${v.toFixed(1)}%`}
                tick={{ fill: '#4ade80', fontSize: 10, fontFamily: 'monospace' }}
              />
              <Tooltip
                formatter={(v: number) => [`${v.toFixed(2)}%`, '누적수익률']}
                contentStyle={{ background: '#0a0a0a', border: '1px solid #00ff88', fontFamily: 'monospace' }}
                labelStyle={{ color: '#4ade80' }}
              />
              <Line
                type="monotone"
                dataKey="cumulativeRate"
                stroke="#00ff88"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-gray-600 font-mono text-xs">
          아직 체결 주문이 없습니다. 거래 후 수익률 곡선이 표시됩니다.
        </div>
      )}

      {/* 섹터 비중 */}
      {data.sectorWeights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-green-400 font-mono text-xs mb-2">■ 섹터 비중</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.sectorWeights}
                  dataKey="weightPct"
                  nameKey="sector"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ sector, weightPct }) => `${sector} ${weightPct.toFixed(1)}%`}
                  labelLine={{ stroke: '#4ade80' }}
                >
                  {data.sectorWeights.map((_, i) => (
                    <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => [`${v.toFixed(1)}%`, '비중']}
                  contentStyle={{ background: '#0a0a0a', border: '1px solid #00ff88', fontFamily: 'monospace' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 섹터 목록 */}
          <div className="space-y-1">
            {data.sectorWeights.map((s, i) => (
              <div key={s.sector} className="flex items-center gap-2 font-mono text-xs">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: SECTOR_COLORS[i % SECTOR_COLORS.length] }}
                />
                <span className="text-gray-300 flex-1">{s.sector}</span>
                <span
                  className="font-bold"
                  style={{ color: SECTOR_COLORS[i % SECTOR_COLORS.length] }}
                >
                  {s.weightPct.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Metric({
  label, value, positive, warn,
}: {
  label: string
  value: string
  positive?: boolean
  warn?: boolean
}) {
  const color = warn ? 'text-yellow-400' : positive === undefined
    ? 'text-green-400'
    : positive
      ? 'text-green-400'
      : 'text-red-400'

  return (
    <div className="border border-green-900 bg-black/30 p-3">
      <div className="text-gray-500 font-mono text-xs mb-1">{label}</div>
      <div className={`font-mono text-base font-bold ${color}`}>{value}</div>
    </div>
  )
}
