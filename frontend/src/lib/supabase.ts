/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnon) {
  throw new Error('Supabase 환경변수가 설정되지 않았습니다. .env.local을 확인하세요.')
}

export const supabase = createClient(supabaseUrl, supabaseAnon)
