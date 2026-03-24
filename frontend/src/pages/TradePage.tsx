import { useState, useCallback, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { getStock } from '../api/stocks'
import { buyOrder, sellOrder, getPendingOrders, cancelOrder } from '../api/orders'
import { useStockWebSocket } from '../hooks/useStockWebSocket'
import type { StockResponse } from '../types'

const POPULAR = ['005930', '000660', '035720', '005380', '051910']
const LABELS: Record<string, string> = {
  '005930': '삼성전자', '000660': 'SK하이닉스', '035720': '카카오',
  '005380': '현대차', '051910': 'LG화학',
}
const fmt = (n: number) => n.toLocaleString('ko-KR')

export default function TradePage() {
  const { accountId } = useAuthStore()
  const qc = useQueryClient()

  const [ticker, setTicker] = useState('')
  const [activeTicker, setActiveTicker] = useState('')
  const [quantity, setQuantity] = useState('')
  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY')
  const [orderMode, setOrderMode] = useState<'MARKET' | 'LIMIT'>('MARKET')
  const [limitPrice, setLimitPrice] = useState('')
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null)
  const prevPriceRef = useRef<number | null>(null)

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const { data: stockRes, isLoading, error } = useQuery({
    queryKey: ['stock', activeTicker],
    queryFn: () => getStock(activeTicker),
    enabled: !!activeTicker,
    staleTime: 60_000,
  })

  const { priceData, connected } = useStockWebSocket(activeTicker || null)

  const { data: pendingRes } = useQuery({
    queryKey: ['pending-orders', accountId],
    queryFn: () => getPendingOrders(accountId!),
    enabled: !!accountId,
    refetchInterval: 10_000,
  })

  const baseStock: StockResponse | undefined = stockRes?.data
  const displayPrice = priceData?.price ?? baseStock?.currentPrice ?? null
  const displayChange = priceData?.changePercent ?? baseStock?.changeRate ?? 0
  const displayVolume = priceData?.volume ?? baseStock?.volume ?? null
  const displayHigh = priceData?.dayHigh ?? baseStock?.dayHigh ?? null
  const displayLow = priceData?.dayLow ?? baseStock?.dayLow ?? null
  const changePositive = displayChange >= 0
  const pendingOrders = pendingRes?.data ?? []

  useEffect(() => {
    if (displayPrice == null) return
    if (prevPriceRef.current != null) {
      setPriceFlash(displayPrice > prevPriceRef.current ? 'up' : displayPrice < prevPriceRef.current ? 'down' : null)
      setTimeout(() => setPriceFlash(null), 600)
    }
    prevPriceRef.current = displayPrice
  }, [displayPrice])

  const search = useCallback(() => {
    const t = ticker.trim().toUpperCase()
    if (t) { setActiveTicker(t); prevPriceRef.current = null }
  }, [ticker])

  const orderMut = useMutation({
    mutationFn: (side: 'BUY' | 'SELL') => {
      const qty = parseInt(quantity)
      if (!accountId || !activeTicker || !qty) throw new Error('입력값 확인')
      if (orderMode === 'LIMIT' && !limitPrice) throw new Error('지정가를 입력해주세요')

      const payload = {
        ticker: activeTicker,
        orderType: orderMode === 'LIMIT' ? `${side}_LIMIT` : side,
        quantity: qty,
        limitPrice: orderMode === 'LIMIT' ? parseFloat(limitPrice) : null,
      }
      return side === 'BUY' ? buyOrder(accountId, payload) : sellOrder(accountId, payload)
    },
    onSuccess: (_, side) => {
      qc.invalidateQueries({ queryKey: ['account'] })
      qc.invalidateQueries({ queryKey: ['holdings'] })
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['pending-orders'] })
      const msg = orderMode === 'LIMIT'
        ? `${side === 'BUY' ? '매수' : '매도'} 지정가 주문 접수`
        : `${side === 'BUY' ? '매수' : '매도'} 체결 완료`
      showToast(msg, true)
      setQuantity('')
      setLimitPrice('')
    },
    onError: (e: Error) => showToast(e.message ?? '주문 실패', false),
  })

  const cancelMut = useMutation({
    mutationFn: (orderId: number) => cancelOrder(accountId!, orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-orders'] })
      qc.invalidateQueries({ queryKey: ['account'] })
      showToast('주문 취소 완료', true)
    },
    onError: () => showToast('취소 실패', false),
  })

  const qty = parseInt(quantity) || 0
  const effectivePrice = orderMode === 'LIMIT' && limitPrice ? parseFloat(limitPrice) : (displayPrice ?? 0)
  const total = effectivePrice * qty

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="label-tag">ORDER TERMINAL</p>
        <p className="font-mono text-xs text-terminal-muted mt-0.5">실시간 종목 조회 · 시장가/지정가 주문</p>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* Left */}
        <div className="col-span-3 space-y-4">
          {/* Search */}
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
              <button onClick={search} className="btn-primary px-6 font-mono text-xs tracking-widest">SEARCH</button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {POPULAR.map((t) => (
                <button
                  key={t}
                  onClick={() => { setTicker(t); setActiveTicker(t); prevPriceRef.current = null }}
                  className={`px-2.5 py-1 font-mono text-[10px] rounded-sm border transition-colors ${
                    activeTicker === t
                      ? 'border-terminal-green text-terminal-green bg-terminal-green/5'
                      : 'border-terminal-border text-terminal-muted hover:border-terminal-dim hover:text-terminal-text'
                  }`}
                >
                  {t} <span className="opacity-60">{LABELS[t]}</span>
                </button>
              ))}
            </div>
          </div>

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

          {baseStock && !isLoading && (
            <div className="terminal-card animate-slide-up">
              <div className="border-b border-terminal-border px-5 py-3 flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs text-terminal-green font-bold tracking-widest">{baseStock.ticker}</span>
                  <span className="font-mono text-xs text-terminal-dim ml-3">{baseStock.name}</span>
                  <span className="ml-2 font-mono text-[10px] text-terminal-muted border border-terminal-border px-1.5 py-0.5 rounded-sm">{baseStock.market}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${connected ? 'bg-terminal-green' : 'bg-terminal-amber'}`} />
                  <span className="font-mono text-[10px] text-terminal-muted">{connected ? 'LIVE' : 'POLLING'}</span>
                </div>
              </div>
              <div className="px-5 py-5 space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="label-tag mb-1">CURRENT PRICE</p>
                    <p className={`font-mono text-4xl font-bold transition-colors duration-300 ${
                      priceFlash === 'up' ? 'text-terminal-green' : priceFlash === 'down' ? 'text-terminal-red' : 'text-terminal-text'
                    }`}>₩{fmt(displayPrice ?? 0)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`font-mono text-sm font-semibold ${changePositive ? 'price-up' : 'price-down'}`}>
                        {changePositive ? '▲' : '▼'} {Math.abs(displayChange).toFixed(2)}%
                      </span>
                      <span className="font-mono text-xs text-terminal-muted">전일 대비</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="label-tag mb-0.5">MARKET</p>
                    <p className="font-mono text-sm text-terminal-dim">{baseStock.market}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-terminal-border">
                  <div>
                    <p className="label-tag mb-0.5">HIGH</p>
                    <p className={`font-mono text-sm ${displayHigh ? 'text-terminal-red' : 'text-terminal-muted'}`}>
                      {displayHigh ? `₩${fmt(displayHigh)}` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="label-tag mb-0.5">LOW</p>
                    <p className={`font-mono text-sm ${displayLow ? 'price-up' : 'text-terminal-muted'}`}>
                      {displayLow ? `₩${fmt(displayLow)}` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="label-tag mb-0.5">VOLUME</p>
                    <p className="font-mono text-sm text-terminal-dim">
                      {displayVolume != null ? `${(displayVolume / 1000).toFixed(0)}K` : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pending orders */}
          {pendingOrders.length > 0 && (
            <div className="terminal-card">
              <div className="border-b border-terminal-border px-4 py-2.5 flex items-center justify-between">
                <span className="label-tag">PENDING ORDERS</span>
                <span className="font-mono text-[10px] text-terminal-amber">{pendingOrders.length} 미체결</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-terminal-border/50">
                    {['TICKER', 'TYPE', 'QTY', 'LIMIT PRICE', ''].map((h) => (
                      <th key={h} className="px-4 py-2 font-mono text-[10px] text-terminal-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders.map((o) => (
                    <tr key={o.orderId} className="border-b border-terminal-border/30 hover:bg-terminal-border/10 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-xs text-terminal-green font-semibold">{o.ticker}</td>
                      <td className="px-4 py-2.5">
                        <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-sm border ${
                          o.orderType.startsWith('BUY')
                            ? 'bg-terminal-green/10 text-terminal-green border-terminal-green/30'
                            : 'bg-terminal-red/10 text-terminal-red border-terminal-red/30'
                        }`}>{o.orderType}</span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-terminal-text">{o.remainingQty ?? o.quantity}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-terminal-amber">
                        {o.limitPrice ? `₩${fmt(o.limitPrice)}` : '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => cancelMut.mutate(o.orderId)}
                          className="font-mono text-[10px] text-terminal-red hover:text-red-300 border border-terminal-red/40 px-2 py-0.5 rounded-sm hover:border-red-300 transition-colors"
                        >
                          취소
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              {/* BUY / SELL */}
              <div className="flex rounded-sm overflow-hidden border border-terminal-border">
                {(['BUY', 'SELL'] as const).map((side) => (
                  <button
                    key={side}
                    onClick={() => setOrderSide(side)}
                    className={`flex-1 py-2.5 font-mono text-xs uppercase tracking-widest transition-all ${
                      orderSide === side
                        ? side === 'BUY' ? 'bg-terminal-green text-terminal-bg font-bold' : 'bg-terminal-red text-white font-bold'
                        : 'text-terminal-dim hover:text-terminal-text'
                    }`}
                  >{side}</button>
                ))}
              </div>

              {/* MARKET / LIMIT toggle */}
              <div className="flex rounded-sm overflow-hidden border border-terminal-border">
                {(['MARKET', 'LIMIT'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setOrderMode(mode)}
                    className={`flex-1 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-all ${
                      orderMode === mode
                        ? 'bg-terminal-border text-terminal-text font-bold'
                        : 'text-terminal-muted hover:text-terminal-text'
                    }`}
                  >{mode}</button>
                ))}
              </div>

              {/* Symbol */}
              <div>
                <p className="label-tag mb-1">SYMBOL</p>
                <div className="terminal-input flex items-center gap-2 cursor-default">
                  <span className={`font-mono text-sm font-bold ${activeTicker ? 'text-terminal-green' : 'text-terminal-muted'}`}>
                    {activeTicker || '—'}
                  </span>
                  {baseStock && <span className="text-terminal-dim font-mono text-xs">{baseStock.name}</span>}
                </div>
              </div>

              {/* Price */}
              {orderMode === 'MARKET' ? (
                <div>
                  <p className="label-tag mb-1">UNIT PRICE (MARKET)</p>
                  <div className="terminal-input cursor-default">
                    <span className={`font-mono text-sm ${priceFlash === 'up' ? 'text-terminal-green' : priceFlash === 'down' ? 'text-terminal-red' : 'text-terminal-amber'}`}>
                      {displayPrice ? `₩${fmt(displayPrice)}` : '—'}
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="label-tag mb-1">LIMIT PRICE</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-terminal-muted">₩</span>
                    <input
                      type="number"
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(e.target.value)}
                      placeholder="0"
                      min="1"
                      className="terminal-input pl-7"
                    />
                  </div>
                  {displayPrice && limitPrice && (
                    <p className="mt-1 font-mono text-[10px] text-terminal-muted">
                      현재가 ₩{fmt(displayPrice)} 대비{' '}
                      <span className={parseFloat(limitPrice) < displayPrice ? 'price-up' : 'price-down'}>
                        {((parseFloat(limitPrice) - displayPrice) / displayPrice * 100).toFixed(2)}%
                      </span>
                    </p>
                  )}
                </div>
              )}

              {/* Quantity */}
              <div>
                <p className="label-tag mb-1">QUANTITY</p>
                <input
                  type="number" value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0" min="1" className="terminal-input"
                />
                <div className="flex gap-1 mt-2">
                  {[1, 5, 10, 100].map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuantity(String(q))}
                      className="flex-1 py-1 font-mono text-[10px] border border-terminal-border text-terminal-muted
                                 hover:border-terminal-dim hover:text-terminal-text transition-colors rounded-sm"
                    >{q}주</button>
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
                {orderMut.isPending
                  ? <span className="animate-blink">■ PROCESSING</span>
                  : `${orderSide} ${orderMode === 'LIMIT' ? '지정가' : ''} ${quantity || 0}주`}
              </button>

              {!accountId && (
                <p className="font-mono text-xs text-terminal-red text-center">계좌 연결 필요</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 font-mono text-sm rounded-sm border animate-slide-up z-50 ${
          toast.ok
            ? 'bg-terminal-green/10 border-terminal-green/40 text-terminal-green'
            : 'bg-terminal-red/10 border-terminal-red/40 text-terminal-red'
        }`}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}
    </div>
  )
}
