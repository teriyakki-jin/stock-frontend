import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { getLeaderboard, getMyRanking } from '../api/ranking'
import { useRealtimeRanking } from '../hooks/useRealtimeRanking'
import type { RankingPeriod } from '../types'

const PERIODS: { key: RankingPeriod; label: string }[] = [
  { key: 'DAILY',     label: '일간' },
  { key: 'WEEKLY',    label: '주간' },
  { key: 'MONTHLY',   label: '월간' },
  { key: 'ALL_TIME',  label: '전체' },
]

export default function RankingPage() {
  const { isAuthenticated } = useAuthStore()
  const [period, setPeriod] = useState<RankingPeriod>('ALL_TIME')
  const [page, setPage]     = useState(0)

  // Realtime 구독
  useRealtimeRanking()

  const { data: lbRes, isLoading } = useQuery({
    queryKey: ['ranking', period, page],
    queryFn:  () => getLeaderboard(period, page, 20),
    staleTime: 60_000,
  })

  const { data: myRes } = useQuery({
    queryKey: ['ranking', 'me', period],
    queryFn:  () => getMyRanking(period),
    enabled:  isAuthenticated,
    staleTime: 60_000,
  })

  const entries = lbRes?.data ?? []
  const myRank  = myRes?.data

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-lg font-bold text-terminal-green tracking-widest">
            LEADERBOARD
          </h1>
          <p className="font-mono text-xs text-terminal-muted mt-0.5">
            수익률 기반 실시간 랭킹 — Supabase Realtime 구독 중
          </p>
        </div>
        {/* Period tabs */}
        <div className="flex gap-1 border border-terminal-border rounded-sm overflow-hidden">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => { setPeriod(p.key); setPage(0) }}
              className={`px-3 py-1.5 font-mono text-xs transition-all ${
                period === p.key
                  ? 'bg-terminal-green text-terminal-bg'
                  : 'text-terminal-dim hover:text-terminal-text'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* My ranking card */}
      {myRank && (
        <div className="terminal-card p-4 border-terminal-green/40 bg-terminal-green/5">
          <p className="font-mono text-xs text-terminal-muted mb-2">MY RANKING</p>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <span className="font-mono text-2xl font-bold text-terminal-green">
                #{myRank.rank || '–'}
              </span>
              <p className="font-mono text-xs text-terminal-muted">순위</p>
            </div>
            <div className="text-center">
              <span className={`font-mono text-lg font-bold ${
                myRank.pnlRate >= 0 ? 'text-terminal-green' : 'text-terminal-red'
              }`}>
                {myRank.pnlRate >= 0 ? '+' : ''}{myRank.pnlRate.toFixed(2)}%
              </span>
              <p className="font-mono text-xs text-terminal-muted">수익률</p>
            </div>
            <div className="text-center">
              <span className={`font-mono text-lg font-bold ${
                myRank.totalPnl >= 0 ? 'text-terminal-green' : 'text-terminal-red'
              }`}>
                {myRank.totalPnl >= 0 ? '+' : ''}
                {Number(myRank.totalPnl).toLocaleString()}원
              </span>
              <p className="font-mono text-xs text-terminal-muted">평가손익</p>
            </div>
            <div className="text-center">
              <span className="font-mono text-lg font-bold text-terminal-text">
                {myRank.totalTrades}
              </span>
              <p className="font-mono text-xs text-terminal-muted">거래 수</p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard table */}
      <div className="terminal-card overflow-hidden">
        <div className="grid grid-cols-[2rem_1fr_6rem_7rem_5rem] px-4 py-2 border-b border-terminal-border">
          {['#', 'TRADER', 'PNL%', 'PROFIT', 'TRADES'].map(h => (
            <span key={h} className="font-mono text-xs text-terminal-muted uppercase tracking-widest">
              {h}
            </span>
          ))}
        </div>

        {isLoading ? (
          <div className="py-12 text-center">
            <div className="inline-block w-6 h-6 border-2 border-terminal-green border-t-transparent rounded-full animate-spin" />
            <p className="font-mono text-xs text-terminal-muted mt-3">LOADING...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-mono text-sm text-terminal-dim">랭킹 데이터가 없습니다</p>
            <p className="font-mono text-xs text-terminal-muted mt-1">
              거래를 시작하면 5분 후 랭킹에 반영됩니다
            </p>
          </div>
        ) : (
          entries.map((entry, i) => {
            const isTop3 = entry.rank <= 3
            return (
              <div
                key={i}
                className={`grid grid-cols-[2rem_1fr_6rem_7rem_5rem] px-4 py-3 border-b border-terminal-border/50
                  hover:bg-terminal-surface/50 transition-colors ${
                  isTop3 ? 'bg-terminal-amber/5' : ''
                }`}
              >
                {/* Rank */}
                <span className={`font-mono text-sm font-bold ${
                  entry.rank === 1 ? 'text-terminal-amber' :
                  entry.rank === 2 ? 'text-terminal-dim' :
                  entry.rank === 3 ? 'text-terminal-amber/60' :
                  'text-terminal-muted'
                }`}>
                  {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                </span>

                {/* Trader */}
                <div className="flex items-center gap-2 min-w-0">
                  {entry.avatarUrl ? (
                    <img src={entry.avatarUrl} alt="" className="w-5 h-5 rounded-full border border-terminal-border" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-terminal-border bg-terminal-surface flex items-center justify-center">
                      <span className="font-mono text-[8px] text-terminal-dim">
                        {entry.nickname?.[0]?.toUpperCase() ?? '?'}
                      </span>
                    </div>
                  )}
                  <span className="font-mono text-sm text-terminal-text truncate">
                    {entry.nickname}
                  </span>
                </div>

                {/* PnL% */}
                <span className={`font-mono text-sm font-medium ${
                  entry.pnlRate >= 0 ? 'text-terminal-green' : 'text-terminal-red'
                }`}>
                  {entry.pnlRate >= 0 ? '+' : ''}{entry.pnlRate.toFixed(2)}%
                </span>

                {/* Total PnL */}
                <span className={`font-mono text-sm ${
                  entry.totalPnl >= 0 ? 'text-terminal-green/80' : 'text-terminal-red/80'
                }`}>
                  {entry.totalPnl >= 0 ? '+' : ''}{Number(entry.totalPnl).toLocaleString()}
                </span>

                {/* Trades */}
                <span className="font-mono text-sm text-terminal-muted">{entry.totalTrades}</span>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {entries.length === 20 || page > 0 ? (
        <div className="flex justify-center gap-3">
          {page > 0 && (
            <button
              onClick={() => setPage(p => p - 1)}
              className="font-mono text-xs text-terminal-dim hover:text-terminal-text border border-terminal-border px-3 py-1.5 rounded-sm"
            >
              ← PREV
            </button>
          )}
          {entries.length === 20 && (
            <button
              onClick={() => setPage(p => p + 1)}
              className="font-mono text-xs text-terminal-dim hover:text-terminal-text border border-terminal-border px-3 py-1.5 rounded-sm"
            >
              NEXT →
            </button>
          )}
        </div>
      ) : null}

      <p className="text-center font-mono text-xs text-terminal-muted/50">
        ⚡ Supabase Realtime 구독 중 — 순위 변경 시 자동 갱신
      </p>
    </div>
  )
}
