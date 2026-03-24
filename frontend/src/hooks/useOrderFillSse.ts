import { useEffect, useRef, useState } from 'react'

export interface OrderFillEvent {
  event: string
  orderId: number
  ticker: string
  stockName: string
  orderType: string
  quantity: number
  fillPrice: number
}

export function useOrderFillSse(token: string | null) {
  const [lastFill, setLastFill] = useState<OrderFillEvent | null>(null)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!token) return

    const es = new EventSource(`/api/v1/orders/events?token=${encodeURIComponent(token)}`)
    esRef.current = es

    es.addEventListener('order-fill', (e) => {
      try {
        const data = JSON.parse(e.data) as OrderFillEvent
        setLastFill(data)
      } catch {
        // ignore parse errors
      }
    })

    return () => {
      es.close()
      esRef.current = null
    }
  }, [token])

  return lastFill
}
