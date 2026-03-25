import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { followUser, unfollowUser, checkFollowing } from '../api/social'

interface Props {
  targetMemberId: number
  myMemberId: number | null
}

export default function FollowButton({ targetMemberId, myMemberId }: Props) {
  const qc = useQueryClient()
  const enabled = !!myMemberId && myMemberId !== targetMemberId

  const { data: isFollowing = false } = useQuery({
    queryKey: ['following', targetMemberId],
    queryFn: () => checkFollowing(targetMemberId),
    enabled,
  })

  const followMut = useMutation({
    mutationFn: () => followUser(targetMemberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['following', targetMemberId] })
      qc.invalidateQueries({ queryKey: ['follow-counts', targetMemberId] })
    },
  })

  const unfollowMut = useMutation({
    mutationFn: () => unfollowUser(targetMemberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['following', targetMemberId] })
      qc.invalidateQueries({ queryKey: ['follow-counts', targetMemberId] })
    },
  })

  if (!enabled) return null

  const isPending = followMut.isPending || unfollowMut.isPending

  return (
    <button
      onClick={() => isFollowing ? unfollowMut.mutate() : followMut.mutate()}
      disabled={isPending}
      className={`px-4 py-1.5 font-mono text-xs border transition-all ${
        isFollowing
          ? 'border-green-600 text-green-400 hover:border-red-500 hover:text-red-400'
          : 'border-green-400 bg-green-400/10 text-green-400 hover:bg-green-400/20'
      } disabled:opacity-50`}
    >
      {isPending ? '...' : isFollowing ? 'FOLLOWING' : '+ FOLLOW'}
    </button>
  )
}
