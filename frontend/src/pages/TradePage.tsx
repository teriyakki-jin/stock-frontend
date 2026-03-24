import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { getStock } from '../api/stocks'
import { buyOrder, sellOrder } from '../api/orders'
import type { StockResponse } from '../types'

const POPULAR = ['005930', '000660', '035720', '005380', '051910']
const LABELS: Record<string, string> = {
  '005930': '삼성전자',
  '000660': 'SK하이닉스',
  '035720': '카카오',
  '005380': '현대차',
  '051910': 'LG화학',
}

const fmt = (n: number) => n.toLocaleString('ko-KR')

export default function TradePage() {
  const { accountId } = useAuthStore()
  const qc = useQueryClient()

  const [ticker, setTicker] = useState('')
  const [activeTicker, setActiveTicker] = useState('')
  const [quantity, setQuantity] = useState('')
  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY')
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const { data: stockRes, isLoading, error } = useQuery({
    queryKey: ['stock', activeTicker],
    queryFn: () => getStock(activeTicker),
    enabled: !!activeTicker,
    refetchInterval: 10_000,
  })

  const stock: StockResponse | undefined = stockRes?.data

  const search = useCallback(() => {
    const t = ticker.trim().toUpperCase()
    if (t) setActiveTicker(t)
  }, [ticker])

  const orderMut = useMutation({
    mutationFn: (side: 'BUY' | 'SELL') => {
      const qty = parseInt(quantity)
      if (!accountId || !activeTicker || !qty) throw new Error('입력값 확인')
      return side === 'BUY'
        ? buyOrder(accountId, { ticker: activeTicker, quantity: qty })
        : sellOrder(accountId, { ticker: activeTicker, quantity: qty })
    },
    onSuccess: (_, side) => {
      qc.invalidateQueries({ queryKey: ['account'] })
      qc.invalidateQueries({ queryKey: ['holdings'] })
      qc.invalidateQueries({ queryKey: ['orders'] })
      showToast(`${side === 'BUY' ? '매수' : '매도'} 체결 완료`, true)
      setQuantity('')
    },
    onError: (e: Error) => showToast(e.message ?? '주문 실패', false),
  })

  const qty = parseInt(quantity) || 0
  const total = stock ? stock.currentPrice * qty : 0
  const changePositive = stock && stock.changeRate >= 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <p className="label-tag">ORDER TERMINAL</p>
        <p className="font-mono text-xs text-terminal-muted mt-0.5">
          실시간 종목 조회 · 매수/매도
        </p>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* Left: Search + Stock Info */}
        <div className="col-span-3 space-y-4">
          {/* Search bar */}
          <div className="terminal-card p-4 space-y-3">
            <span className="label-tag block">STOCK LOOKUP</span>
            <div className="flex gap-2">
              <input
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && search()}
                placeholder="종목코드 (예: 005930)"
                className="terminal-input flex-1 font-mono tracking-widest"
                maxLength={6}
              />
              <button
                onClick={search}
                className="btn-primary px-6 font-mono text-xs tracking-widest"
              >
                SEARCH
              </button>
            </div>

            {/* Popular tickers */}
            <div className="flex gap-2 flex-wrap">
              {POPULAR.map((t) => (
                <button
                  key={t}
                  onClick={() => { setTicker(t); setActiveTicker(t) }}
                  className={`px-2.5 py-1 font-mono text-[10px] rounded-sm border transition-colors ${
                    activeTicker === t
                      ? 'border-terminal-green text-terminal-green bg-terminal-green/5'
                      : 'border-terminal-border text-terminal-muted hover:border-terminal-dim hover:text-terminal-text'
                  }`}
                >
                  {t} <span className="opacity-60">{LABELS[t] ?? ''}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stock detail */}
          {isLoading && (
            <div className="terminal-card p-8 text-center font-mono text-xs text-terminal-muted animate-pulse">
              FETCHING DATA<span className="animate-blink">_</span>
            </div>
          )}

          {error && (
            <div className="terminal-card p-6 text-center font-mono text-xs text-terminal-red">
              ✗ 종목을 찾을 수 없습니다
            </div>
          )}

          {stock && !isLoading && (
            <div className="terminal-card animate-slide-up">
              {/* Top bar */}
              <div className="border-b border-terminal-border px-5 py-3 flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs text-terminal-green font-bold tracking-widest">
                    {stock.ticker}
                  </span>
                  <span className="font-mono text-xs text-terminal-dim ml-3">
                    {stock.name}
                  </span>
                  <span className="ml-2 font-mono text-[10px] text-terminal-muted border border-terminal-border px-1.5 py-0.5 rounded-sm">
                    {stock.market}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse" />
                  <span className="font-mono text-[10px] text-terminal-muted">LIVE</span>
                </div>
              </div>

              <div className="px-5 py-5 space-y-4">
                {/* Price + change */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="label-tag mb-1">CURRENT PRICE</p>
                    <p className="font-mono text-4xl font-bold text-terminal-text">
                      ₩{fmt(stock.currentPrice)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`font-mono text-sm font-semibold ${
                          changePositive ? 'price-up' : 'price-down'
                        }`}
                      >
                        {changePositive ? '▲' : '▼'}{' '}
                        {Math.abs(stock.changeRate).toFixed(2)}%
                      </span>
                      <span className="font-mono text-xs text-terminal-muted">전일 대비</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="label-tag mb-0.5">MARKET</p>
                    <p className="font-mono text-sm text-terminal-dim">{stock.market}</p>
                  </div>
                </div>

                {/* Day stats */}
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-terminal-border">
                  <div>
                    <p className="label-tag mb-0.5">HIGH</p>
                    <p className={`font-mono text-sm ${stock.dayHigh ? 'text-terminal-red' : 'text-terminal-muted'}`}>
                      {stock.dayHigh ? `₩${fmt(stock.dayHigh)}` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="label-tag mb-0.5">LOW</p>
                    <p className={`font-mono text-sm ${stock.dayLow ? 'price-up' : 'text-terminal-muted'}`}>
                      {stock.dayLow ? `₩${fmt(stock.dayLow)}` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="label-tag mb-0.5">VOLUME</p>
                    <p className="font-mono text-sm text-terminal-dim">
                      {stock.volume != null ? `${(stock.volume / 1000).toFixed(0)}K` : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Order form */}
        <div className="col-span-2">
          <div className="terminal-card h-full">
            <div className="border-b border-terminal-border px-4 py-2.5">
              <span className="label-tag">PLACE ORDER</span>
            </div>

            <div className="p-4 space-y-4">
              {/* BUY / SELL toggle */}
              <div className="flex rounded-sm overflow-hidden border border-terminal-border">
                <button
                  onClick={() => setOrderSide('BUY')}
                  className={`flex-1 py-2.5 font-mono text-xs uppercase tracking-widest transition-all ${
                    orderSide === 'BUY'
                      ? 'bg-terminal-green text-terminal-bg font-bold'
                      : 'text-terminal-dim hover:text-terminal-text'
                  }`}
                >
                  BUY
                </button>
                <button
                  onClick={() => setOrderSide('SELL')}
                  className={`flex-1 py-2.5 font-mono text-xs uppercase tracking-widest transition-all ${
                    orderSide === 'SELL'
                      ? 'bg-terminal-red text-white font-bold'
                      : 'text-terminal-dim hover:text-terminal-text'
                  }`}
                >
                  SELL
                </button>
              </div>

              {/* Ticker display */}
              <div>
                <p className="label-tag mb-1">SYMBOL</p>
                <div className="terminal-input flex items-center gap-2 cursor-default">
                  <span className={`font-mono text-sm font-bold ${activeTicker ? 'text-terminal-green' : 'text-terminal-muted'}`}>
                    {activeTicker || '—'}
                  </span>
                  {stock && (
                    <span className="text-terminal-dim font-mono text-xs">{stock.name}</span>
                  )}
                </div>
              </div>

              {/* Price display */}
              <div>
                <p className="label-tag mb-1">UNIT PRICE</p>
                <div className="terminal-input cursor-default">
                  <span className="font-mono text-sm text-terminal-amber">
                    {stock ? `₩${fmt(stock.currentPrice)}` : '—'}
                  </span>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <p className="label-tag mb-1">QUANTITY</p>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  min="1"
                  className="terminal-input"
                />
                {/* Quick qty */}
                <div className="flex gap-1 mt-2">
                  {[1, 5, 10, 100].map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuantity(String(q))}
                      className="flex-1 py-1 font-mono text-[10px] border border-terminal-border
                                 text-terminal-muted hover:border-terminal-dim hover:text-terminal-text
                                 transition-colors rounded-sm"
                    >
                      {q}주
                    </button>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-terminal-border pt-3">
                <div className="flex justify-between items-center">
                  <span className="label-tag">TOTAL AMOUNT</span>
                  <span className="font-mono text-base font-bold text-terminal-amber">
                    {total > 0 ? `₩${fmt(total)}` : '—'}
                  </span>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={() => orderMut.mutate(orderSide)}
                disabled={orderMut.isPending || !activeTicker || !quantity}
                className={`w-full py-3 font-mono text-xs uppercase tracking-widest font-bold rounded-sm
                           transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                  orderSide === 'BUY'
                    ? 'bg-terminal-green text-terminal-bg hover:brightness-110'
                    : 'bg-terminal-red text-white hover:brightness-110'
                }`}
              >
                {orderMut.isPending ? (
                  <span className="animate-blink">■ PROCESSING</span>
                ) : (
                  `${orderSide} ${quantity || 0}주 주문`
                )}
              </button>

              {!accountId && (
                <p className="font-mono text-xs text-terminal-red text-center">
                  계좌 연결 필요
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-5 py-3 font-mono text-sm rounded-sm border animate-slide-up z-50 ${
            toast.ok
              ? 'bg-terminal-green/10 border-terminal-green/40 text-terminal-green'
              : 'bg-terminal-red/10 border-terminal-red/40 text-terminal-red'
          }`}
        >
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}
    </div>
  )
}
