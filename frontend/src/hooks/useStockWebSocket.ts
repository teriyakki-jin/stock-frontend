import { useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import type { StockPriceData } from '../types'

interface UseStockWebSocketResult {
  priceData: StockPriceData | null
  connected: boolean
}

/**
 * STOMP/WebSocket으로 특정 종목의 실시간 시세를 구독한다.
 * 연결: /ws → 구독: /topic/prices/{ticker}
 */
export function useStockWebSocket(ticker: string | null): UseStockWebSocketResult {
  const [priceData, setPriceData] = useState<StockPriceData | null>(null)
  const [connected, setConnected] = useState(false)
  const clientRef = useRef<Client | null>(null)

  useEffect(() => {
    if (!ticker) {
      setPriceData(null)
      return
    }

    const client = new Client({
      brokerURL: `ws://${window.location.host}/ws`,
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true)
        client.subscribe(`/topic/prices/${ticker}`, (msg) => {
          try {
            const data = JSON.parse(msg.body) as StockPriceData
            setPriceData(data)
          } catch {
            // ignore malformed messages
          }
        })
      },
      onDisconnect: () => {
        setConnected(false)
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
      clientRef.current = null
      setConnected(false)
    }
  }, [ticker])

  return { priceData, connected }
}
