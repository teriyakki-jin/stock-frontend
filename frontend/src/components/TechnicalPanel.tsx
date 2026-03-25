import type { OhlcvBar, TechnicalData } from '../types'

interface Props {
  history: OhlcvBar[]
  technicals: TechnicalData
  annualizedVolatility: number
  annualizedReturn: number
}

/** RSI 레벨에 따른 색상 */
function rsiColor(rsi: number) {
  if (rsi >= 70) return '#ff4466'
  if (rsi <= 30) return '#00ff88'
  return '#44aaff'
}

export default function TechnicalPanel({
  history, technicals, annualizedVolatility, annualizedReturn,
}: Props) {
  // unused — kept for future multi-point series
  void history

  const rc = rsiColor(technicals.rsi)

  return (
    <div className="space-y-3">
      {/* 통계 요약 카드 */}
      <div className="grid grid-cols-4 gap-2">
        <StatCard label="RSI 14" value={technicals.rsi.toFixed(1)}
          sub={technicals.rsi >= 70 ? 'OVERBOUGHT' : technicals.rsi <= 30 ? 'OVERSOLD' : 'NEUTRAL'}
          color={rc} />
        <StatCard label="MACD" value={technicals.macd.toFixed(2)}
          sub={technicals.macdHistogram > 0 ? '▲ BULLISH' : '▼ BEARISH'}
          color={technicals.macdHistogram > 0 ? '#00ff88' : '#ff4466'} />
        <StatCard label="연간 변동성" value={annualizedVolatility.toFixed(1) + '%'}
          sub="HIST. VOL"
          color={annualizedVolatility > 40 ? '#ff4466' : '#44aaff'} />
        <StatCard label="연간 수익률" value={(annualizedReturn > 0 ? '+' : '') + annualizedReturn.toFixed(1) + '%'}
          sub="HIST. RETURN"
          color={annualizedReturn >= 0 ? '#00ff88' : '#ff4466'} />
      </div>

      {/* RSI 패널 */}
      <div className="bg-terminal-surface border border-terminal-border rounded p-3">
        <p className="font-mono text-xs text-terminal-muted mb-2 uppercase tracking-widest">
          RSI (14) — Current: <span style={{ color: rc }}>{technicals.rsi.toFixed(1)}</span>
        </p>
        <div className="flex items-center gap-4">
          {/* RSI 게이지 */}
          <div className="flex-1 relative h-4 bg-terminal-bg rounded overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full transition-all duration-300 rounded"
              style={{ width: `${technicals.rsi}%`, background: rc + '99' }}
            />
            {/* 과매도/과매수 구분선 */}
            <div className="absolute top-0 h-full w-px bg-green-500/40" style={{ left: '30%' }} />
            <div className="absolute top-0 h-full w-px bg-red-500/40"   style={{ left: '70%' }} />
          </div>
          <div className="flex gap-3 text-[10px] font-mono">
            <span className="text-terminal-green">30</span>
            <span className="text-terminal-muted">50</span>
            <span className="text-terminal-red">70</span>
          </div>
        </div>
        {/* RSI 레이블 */}
        <div className="flex justify-between mt-1 px-1">
          <span className="font-mono text-[9px] text-terminal-green">OVERSOLD</span>
          <span className="font-mono text-[9px] text-terminal-muted">NEUTRAL</span>
          <span className="font-mono text-[9px] text-terminal-red">OVERBOUGHT</span>
        </div>
      </div>

      {/* MACD 패널 */}
      <div className="bg-terminal-surface border border-terminal-border rounded p-3">
        <p className="font-mono text-xs text-terminal-muted mb-2 uppercase tracking-widest">
          MACD (12,26,9)
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="font-mono text-[10px] text-terminal-muted">MACD</p>
            <p className={`font-mono text-sm font-bold ${technicals.macd >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
              {technicals.macd.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-terminal-muted">SIGNAL</p>
            <p className="font-mono text-sm text-terminal-amber">{technicals.macdSignal.toFixed(2)}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-terminal-muted">HISTOGRAM</p>
            <p className={`font-mono text-sm font-bold ${technicals.macdHistogram >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
              {technicals.macdHistogram > 0 ? '+' : ''}{technicals.macdHistogram.toFixed(2)}
            </p>
          </div>
        </div>

        {/* MACD 히스토그램 시각화 */}
        <div className="mt-3 flex items-end gap-0.5 h-10">
          {Array.from({ length: 30 }).map((_, i) => {
            const pct = Math.random() * 0.8 + 0.2   // placeholder bars
            const positive = i % 3 !== 0
            return (
              <div
                key={i}
                className={`flex-1 rounded-sm ${positive ? 'bg-terminal-green/40' : 'bg-terminal-red/40'}`}
                style={{ height: `${pct * 100}%` }}
              />
            )
          })}
          {/* 마지막 바 = 실제 값 */}
          <div
            className={`flex-1 rounded-sm ${technicals.macdHistogram >= 0 ? 'bg-terminal-green' : 'bg-terminal-red'}`}
            style={{ height: '100%' }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="font-mono text-[9px] text-terminal-muted">
            {technicals.macd > technicals.macdSignal ? '▲ MACD above Signal — Bullish' : '▼ MACD below Signal — Bearish'}
          </span>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label, value, sub, color,
}: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="bg-terminal-surface border border-terminal-border rounded p-2 text-center">
      <p className="font-mono text-[10px] text-terminal-muted uppercase">{label}</p>
      <p className="font-mono text-base font-bold mt-0.5" style={{ color }}>{value}</p>
      <p className="font-mono text-[9px] text-terminal-dim mt-0.5">{sub}</p>
    </div>
  )
}
