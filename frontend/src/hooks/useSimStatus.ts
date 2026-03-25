import { useQuery } from '@tanstack/react-query'
import { getSimStatus } from '../api/stocks'

export function useSimStatus() {
  const { data } = useQuery({
    queryKey: ['simStatus'],
    queryFn: getSimStatus,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
  })

  return {
    isSimulation: data?.simulation ?? false,
    isMarketOpen: data?.marketOpen ?? false,
    mode: data?.mode ?? 'LIVE',
    calibrated: data?.calibrated ?? false,
  }
}
