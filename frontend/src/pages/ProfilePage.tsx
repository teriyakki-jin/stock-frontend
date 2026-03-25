import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMyProfile, updateProfile } from '../api/profile'

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ nickname: '', bio: '' })
  const [saved, setSaved] = useState(false)

  const { data: profileRes, isLoading } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn:  getMyProfile,
    staleTime: 300_000,
  })

  const profile = profileRes?.data

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
        {/* Avatar + Basic */}
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
          <div>
            <p className="font-mono text-lg font-bold text-terminal-text">
              {profile?.nickname ?? '–'}
            </p>
            <p className="font-mono text-xs text-terminal-muted">ID #{profile?.localMemberId}</p>
          </div>
        </div>

        {/* Bio */}
        {!editing && (
          <div>
            <p className="label-tag mb-1">BIO</p>
            <p className="font-mono text-sm text-terminal-dim">
              {profile?.bio || '소개가 없습니다.'}
            </p>
          </div>
        )}

        {/* Edit form */}
        {editing ? (
          <div className="space-y-4 border-t border-terminal-border pt-4">
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
          <div className="border-t border-terminal-border pt-4 flex gap-2">
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
      </div>

      {/* Info */}
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
