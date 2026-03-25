import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { exchangeSupabaseToken } from '../api/oauth'
import { getMyAccounts, openAccount } from '../api/accounts'

/**
 * Supabase OAuth 리디렉션 콜백 페이지 (/auth/callback)
 * URL 해시에서 Supabase 세션을 추출 → Spring Boot에 자체 JWT 교환 요청
 */
export default function AuthCallbackPage() {
  const navigate    = useNavigate()
  const { setTokens, setAccountId } = useAuthStore()
  const [error, setError] = useState('')
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const handleCallback = async () => {
      try {
        // Supabase가 URL 해시(#access_token=...)를 자동으로 세션에 저장
        // 잠시 대기 후 세션 교환
        await new Promise(r => setTimeout(r, 500))

        const res = await exchangeSupabaseToken()
        if (!res.success || !res.data) throw new Error(res.message ?? 'OAuth 교환 실패')

        setTokens(res.data.accessToken)

        // 계좌 조회 또는 자동 개설
        const accounts = await getMyAccounts()
        if (accounts.data && accounts.data.length > 0) {
          setAccountId(accounts.data[0].id)
        } else {
          const newAcc = await openAccount()
          if (newAcc.data) setAccountId(newAcc.data.id)
        }

        navigate('/dashboard', { replace: true })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'OAuth 인증에 실패했습니다'
        setError(msg)
        setTimeout(() => navigate('/auth', { replace: true }), 3000)
      }
    }

    handleCallback()
  }, [navigate, setTokens, setAccountId])

  return (
    <div className="min-h-screen bg-terminal-bg flex items-center justify-center">
      <div className="terminal-card p-8 text-center space-y-4 w-80">
        {error ? (
          <>
            <p className="font-mono text-sm text-terminal-red">✗ {error}</p>
            <p className="font-mono text-xs text-terminal-muted">3초 후 로그인 페이지로 이동합니다</p>
          </>
        ) : (
          <>
            <div className="flex justify-center">
              <div className="w-8 h-8 border-2 border-terminal-green border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="font-mono text-sm text-terminal-text animate-pulse">AUTHENTICATING...</p>
            <p className="font-mono text-xs text-terminal-muted">OAuth 세션을 처리하는 중입니다</p>
          </>
        )}
      </div>
    </div>
  )
}
