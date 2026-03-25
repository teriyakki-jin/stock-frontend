import {
  Area,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { OhlcvBar, TechnicalData } from '../types'

interface Props {
  history: OhlcvBar[]
  technicals: TechnicalData
}

const fmt = (n: number) => n.toLocaleString('ko-KR')

export default function StockChart({ history, technicals }: Props) {
  const data = history.map((bar) => ({
    date: bar.date.slice(5),   // MM-DD
    close: bar.close,
    bbUpper: Number(technicals.bbUpper),
    bbLower: Number(technicals.bbLower),
    bbMiddle: Number(technicals.bbMiddle),
  }))

  const prices = history.map((b) => b.close)
  const minPrice = Math.min(...prices, Number(technicals.bbLower)) * 0.995
  const maxPrice = Math.max(...prices, Number(technicals.bbUpper)) * 1.005

  const signalColor =
    technicals.signal === 'BUY' ? '#00ff88' :
    technicals.signal === 'SELL' ? '#ff4466' : '#888'

  return (
    <div className="bg-terminal-surface border border-terminal-border rounded p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-terminal-muted uppercase tracking-widest">
          Price · Bollinger Bands (20, ±2σ)
        </span>
        <span
          className="font-mono text-xs px-2 py-0.5 rounded border"
          style={{ color: signalColor, borderColor: signalColor + '55' }}
        >
          {technicals.signal}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }}
            tickLine={false}
            interval={Math.floor(data.length / 6)}
          />
          <YAxis
            domain={[minPrice, maxPrice]}
            tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }}
            tickLine={false}
            tickFormatter={(v) => (v / 1000).toFixed(0) + 'k'}
            width={38}
          />
          <Tooltip
            contentStyle={{
              background: '#0d1117', border: '1px solid #333',
              borderRadius: 4, fontFamily: 'monospace', fontSize: 11,
            }}
            labelStyle={{ color: '#888' }}
            formatter={(v: number) => [fmt(Math.round(v)) + '원', '']}
          />

          {/* 볼린저밴드 채우기 */}
          <Area
            type="monotone"
            dataKey="bbUpper"
            stroke="none"
            fill="#00ff8822"
            fillOpacity={1}
          />
          <Area
            type="monotone"
            dataKey="bbLower"
            stroke="none"
            fill="#0d1117"
            fillOpacity={1}
          />

          {/* 볼린저밴드 선 */}
          <Line type="monotone" dataKey="bbUpper"  stroke="#00ff8855" strokeWidth={1} dot={false} />
          <Line type="monotone" dataKey="bbMiddle" stroke="#44aaff55" strokeWidth={1} dot={false} strokeDasharray="3 3" />
          <Line type="monotone" dataKey="bbLower"  stroke="#00ff8855" strokeWidth={1} dot={false} />

          {/* 종가 선 */}
          <Line
            type="monotone"
            dataKey="close"
            stroke="#00ff88"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: '#00ff88' }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* 지표 요약 */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="font-mono text-[10px] text-terminal-muted">BB UPPER</p>
          <p className="font-mono text-xs text-terminal-green">{fmt(Number(technicals.bbUpper))}</p>
        </div>
        <div>
          <p className="font-mono text-[10px] text-terminal-muted">BB MID</p>
          <p className="font-mono text-xs text-terminal-text">{fmt(Number(technicals.bbMiddle))}</p>
        </div>
        <div>
          <p className="font-mono text-[10px] text-terminal-muted">BB LOWER</p>
          <p className="font-mono text-xs text-terminal-red">{fmt(Number(technicals.bbLower))}</p>
        </div>
      </div>
    </div>
  )
}
