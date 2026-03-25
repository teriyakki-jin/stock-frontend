import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMyProfile, updateProfile } from '../api/profile'
import { getFollowCounts, getMyFollowers, getMyFollowings } from '../api/social'
import type { FollowUser } from '../api/social'

type Tab = 'profile' | 'followers' | 'followings'

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ nickname: '', bio: '' })
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState<Tab>('profile')

  const { data: profileRes, isLoading } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn:  getMyProfile,
    staleTime: 300_000,
  })

  const profile = profileRes?.data
  const myMemberId = profile?.localMemberId ?? null

  const { data: counts } = useQuery({
    queryKey: ['follow-counts', myMemberId],
    queryFn:  () => getFollowCounts(myMemberId!),
    enabled:  !!myMemberId,
  })

  const { data: followers = [] } = useQuery({
    queryKey: ['followers', 'me'],
    queryFn:  () => getMyFollowers(),
    enabled:  tab === 'followers',
  })

  const { data: followings = [] } = useQuery({
    queryKey: ['followings', 'me'],
    queryFn:  () => getMyFollowings(),
    enabled:  tab === 'followings',
  })

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] })
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  const startEdit = () => {
    setForm({ nickname: profile?.nickname ?? '', bio: profile?.bio ?? '' })
    setEditing(true)
  }

  const handleSave = () => {
    const data: { nickname?: string; bio?: string } = {}
    if (form.nickname.trim()) data.nickname = form.nickname.trim()
    if (form.bio.trim() !== undefined) data.bio = form.bio.trim()
    mutation.mutate(data)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-terminal-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-mono text-lg font-bold text-terminal-green tracking-widest">PROFILE</h1>
        <p className="font-mono text-xs text-terminal-muted mt-0.5">계정 정보 및 공개 프로필 관리</p>
      </div>

      {/* Profile Card */}
      <div className="terminal-card p-6 space-y-5">
        {/* Avatar + Basic + 팔로워 수 */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full border-2 border-terminal-green/40 bg-terminal-surface flex items-center justify-center">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="font-mono text-2xl text-terminal-green">
                {profile?.nickname?.[0]?.toUpperCase() ?? '?'}
              </span>
            )}
          </div>
          <div className="flex-1">
            <p className="font-mono text-lg font-bold text-terminal-text">
              {profile?.nickname ?? '–'}
            </p>
            <p className="font-mono text-xs text-terminal-muted">ID #{profile?.localMemberId}</p>
          </div>
          {/* 팔로워/팔로잉 수 */}
          <div className="flex gap-4">
            <button onClick={() => setTab('followers')} className="text-center hover:opacity-80">
              <p className="font-mono text-lg font-bold text-terminal-green">
                {counts?.followerCount ?? 0}
              </p>
              <p className="font-mono text-[10px] text-terminal-muted">FOLLOWERS</p>
            </button>
            <button onClick={() => setTab('followings')} className="text-center hover:opacity-80">
              <p className="font-mono text-lg font-bold text-terminal-green">
                {counts?.followingCount ?? 0}
              </p>
              <p className="font-mono text-[10px] text-terminal-muted">FOLLOWING</p>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-terminal-border gap-4">
          {(['profile', 'followers', 'followings'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2 font-mono text-xs tracking-widest transition-colors ${
                tab === t
                  ? 'text-terminal-green border-b border-terminal-green'
                  : 'text-terminal-muted hover:text-terminal-text'
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === 'profile' && (
          <>
            {!editing && (
              <div>
                <p className="label-tag mb-1">BIO</p>
                <p className="font-mono text-sm text-terminal-dim">
                  {profile?.bio || '소개가 없습니다.'}
                </p>
              </div>
            )}

            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="label-tag block mb-1">NICKNAME</label>
                  <input
                    type="text"
                    value={form.nickname}
                    onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))}
                    maxLength={30}
                    className="terminal-input"
                    placeholder="닉네임 (2~30자)"
                  />
                </div>
                <div>
                  <label className="label-tag block mb-1">BIO</label>
                  <textarea
                    value={form.bio}
                    onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                    maxLength={200}
                    rows={3}
                    className="terminal-input resize-none w-full"
                    placeholder="소개를 입력하세요 (200자 이하)"
                  />
                  <p className="font-mono text-xs text-terminal-muted text-right mt-0.5">
                    {form.bio.length} / 200
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={mutation.isPending}
                    className="btn-primary flex-1 py-2 font-mono text-xs tracking-widest"
                  >
                    {mutation.isPending ? 'SAVING...' : 'SAVE'}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="flex-1 py-2 font-mono text-xs border border-terminal-border text-terminal-dim hover:text-terminal-text rounded-sm tracking-widest"
                  >
                    CANCEL
                  </button>
                </div>
                {mutation.isError && (
                  <p className="font-mono text-xs text-terminal-red">
                    ✗ {(mutation.error as Error).message}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={startEdit}
                  className="btn-secondary flex-1 py-2 font-mono text-xs tracking-widest"
                >
                  EDIT PROFILE
                </button>
              </div>
            )}

            {saved && (
              <p className="font-mono text-xs text-terminal-green bg-terminal-green/10 border border-terminal-green/30 rounded-sm px-3 py-2">
                ✓ 프로필이 저장되었습니다
              </p>
            )}
          </>
        )}

        {/* Followers / Followings Tab */}
        {(tab === 'followers' || tab === 'followings') && (
          <FollowList users={tab === 'followers' ? followers : followings} />
        )}
      </div>

      {/* Account Info */}
      <div className="terminal-card p-4 space-y-2">
        <p className="label-tag">ACCOUNT INFO</p>
        <div className="grid grid-cols-2 gap-y-2 mt-2">
          <span className="font-mono text-xs text-terminal-muted">Provider</span>
          <span className="font-mono text-xs text-terminal-text uppercase">–</span>
          <span className="font-mono text-xs text-terminal-muted">Profile ID</span>
          <span className="font-mono text-xs text-terminal-dim truncate">{profile?.id ?? '–'}</span>
        </div>
      </div>
    </div>
  )
}

function FollowList({ users }: { users: FollowUser[] }) {
  if (users.length === 0) {
    return (
      <div className="py-8 text-center font-mono text-xs text-terminal-muted">
        아직 없습니다
      </div>
    )
  }
  return (
    <div className="space-y-2">
      {users.map(u => (
        <div key={u.local_member_id}
          className="flex items-center gap-3 p-2 border border-terminal-border/50 hover:border-terminal-green/30 transition-colors">
          <div className="w-8 h-8 rounded-full bg-terminal-surface border border-terminal-green/30 flex items-center justify-center flex-shrink-0">
            {u.avatar_url
              ? <img src={u.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              : <span className="font-mono text-xs text-terminal-green">{u.nickname?.[0]?.toUpperCase()}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-sm text-terminal-text truncate">{u.nickname}</p>
            <p className="font-mono text-[10px] text-terminal-muted">ID #{u.local_member_id}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
