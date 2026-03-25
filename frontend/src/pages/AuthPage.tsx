import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { login, signUp } from '../api/auth'
import { getMyAccounts, openAccount } from '../api/accounts'
import { signInWithOAuth } from '../api/oauth'

type Mode = 'login' | 'signup'

export default function AuthPage() {
  const navigate = useNavigate()
  const { setTokens, setAccountId } = useAuthStore()

  const [mode, setMode] = useState<Mode>('login')
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        await signUp(form)
        setMode('login')
        setError('')
        return
      }

      const res = await login({ email: form.email, password: form.password })
      if (!res.success || !res.data) throw new Error(res.message)

      setTokens(res.data.accessToken)

      // 계좌 조회 또는 자동 개설
      const accounts = await getMyAccounts()
      if (accounts.data && accounts.data.length > 0) {
        setAccountId(accounts.data[0].id)
      } else {
        const newAcc = await openAccount()
        if (newAcc.data) setAccountId(newAcc.data.id)
      }

      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '오류가 발생했습니다'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-terminal-bg scanline flex items-center justify-center px-4">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-5"
        style={{
          backgroundImage:
            'linear-gradient(#00ff88 1px, transparent 1px), linear-gradient(90deg, #00ff88 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-8 h-8 border-2 border-terminal-green rotate-45 flex items-center justify-center">
              <div className="w-3 h-3 bg-terminal-green rotate-[-45deg]" />
            </div>
            <h1 className="font-mono text-2xl font-bold text-terminal-green text-glow-green tracking-[0.3em]">
              NEXUS
            </h1>
          </div>
          <p className="font-mono text-xs text-terminal-muted tracking-widest">
            TRADE TERMINAL v2.4
          </p>
        </div>

        {/* Tab */}
        <div className="flex mb-6 border border-terminal-border rounded-sm overflow-hidden">
          {(['login', 'signup'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError('') }}
              className={`flex-1 py-2 font-mono text-xs uppercase tracking-widest transition-all duration-200 ${
                mode === m
                  ? 'bg-terminal-green text-terminal-bg'
                  : 'text-terminal-dim hover:text-terminal-text'
              }`}
            >
              {m === 'login' ? 'SIGN IN' : 'REGISTER'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="terminal-card p-6 space-y-4 glow-green"
        >
          {mode === 'signup' && (
            <>
              <Field label="NAME" type="text" value={form.name} onChange={update('name')} placeholder="홍길동" />
              <Field label="PHONE" type="text" value={form.phone} onChange={update('phone')} placeholder="010-0000-0000" />
            </>
          )}
          <Field label="EMAIL" type="email" value={form.email} onChange={update('email')} placeholder="user@example.com" />
          <Field label="PASSWORD" type="password" value={form.password} onChange={update('password')} placeholder="••••••••" />

          {error && (
            <p className="font-mono text-xs text-terminal-red bg-terminal-red/10 border border-terminal-red/30 rounded-sm px-3 py-2">
              ✗ {error}
            </p>
          )}

          {mode === 'signup' && !error && (
            <p className="font-mono text-xs text-terminal-green/70 bg-terminal-green/5 border border-terminal-green/20 rounded-sm px-3 py-2">
              ✓ 가입 후 자동으로 계좌가 개설됩니다
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 tracking-widest font-mono text-xs"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="animate-blink">■</span> PROCESSING
              </span>
            ) : mode === 'login' ? (
              'ACCESS TERMINAL'
            ) : (
              'CREATE ACCOUNT'
            )}
          </button>

          {/* OAuth divider */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-terminal-border" />
            <span className="font-mono text-xs text-terminal-muted">OR</span>
            <div className="flex-1 h-px bg-terminal-border" />
          </div>

          {/* Social login buttons */}
          <div className="grid grid-cols-2 gap-2">
            <OAuthButton
              provider="google"
              label="Google"
              icon="G"
              onError={setError}
            />
            <OAuthButton
              provider="github"
              label="GitHub"
              icon="GH"
              onError={setError}
            />
          </div>
        </form>

        {/* Footer */}
        <p className="text-center font-mono text-xs text-terminal-muted mt-6">
          NEXUS TRADE ©{new Date().getFullYear()} · ENCRYPTED · SECURE
        </p>
      </div>
    </div>
  )
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  label: string
  type: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder: string
}) {
  return (
    <div>
      <label className="label-tag block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        className="terminal-input"
      />
    </div>
  )
}

function OAuthButton({
  provider,
  label,
  icon,
  onError,
}: {
  provider: 'google' | 'github'
  label: string
  icon: string
  onError: (msg: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const handleClick = async () => {
    setLoading(true)
    try {
      await signInWithOAuth(provider)
    } catch (err) {
      onError(err instanceof Error ? err.message : `${label} 로그인 실패`)
      setLoading(false)
    }
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex items-center justify-center gap-2 py-2 border border-terminal-border text-terminal-dim hover:text-terminal-text hover:border-terminal-green/40 transition-all rounded-sm font-mono text-xs"
    >
      <span className="text-terminal-green font-bold">{icon}</span>
      {loading ? '...' : label}
    </button>
  )
}
