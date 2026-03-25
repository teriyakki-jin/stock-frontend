import { supabase } from '../lib/supabase'
import client from './client'
import type { ApiResponse, TokenResponse } from '../types'

type OAuthProvider = 'google' | 'github'

/**
 * Supabase OAuth 로그인 시작 (리디렉션)
 * 완료 후 /auth/callback 으로 리디렉션됩니다.
 */
export async function signInWithOAuth(provider: OAuthProvider): Promise<void> {
  const redirectTo = `${window.location.origin}/auth/callback`
  const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } })
  if (error) throw new Error(error.message)
}

/**
 * Supabase 세션에서 access_token을 추출하여 Spring Boot에 자체 JWT 교환 요청
 */
export async function exchangeSupabaseToken(): Promise<ApiResponse<TokenResponse>> {
  const { data: sessionData } = await supabase.auth.getSession()
  const supabaseToken = sessionData?.session?.access_token

  if (!supabaseToken) throw new Error('Supabase 세션이 없습니다.')

  return client
    .post<ApiResponse<TokenResponse>>('/auth/oauth', { supabaseAccessToken: supabaseToken })
    .then(r => r.data)
}
