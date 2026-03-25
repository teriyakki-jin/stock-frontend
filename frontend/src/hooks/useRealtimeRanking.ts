import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

/**
 * Supabase Realtime 구독 — ranking_snapshots 변경 시 React Query 캐시 무효화
 * RankingPage에서 마운트되며, 다른 유저 거래 후 순위가 자동 갱신됩니다.
 */
export function useRealtimeRanking() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('ranking-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ranking_snapshots' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ranking'] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
