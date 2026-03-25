import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ragQuery, getRagReports, getRagHealth } from '../api/rag'
import type { RagQueryRequest, RagQueryResponse, ReportInfo } from '../api/rag'

type Persona = 'neutral' | 'aggressive' | 'conservative'

interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
  chunkCount?: number
  ticker?: string | null
}

const PERSONA_LABELS: Record<Persona, string> = {
  neutral: 'NEUTRAL',
  aggressive: 'AGGRESSIVE',
  conservative: 'CONSERVATIVE',
}

const PERSONA_COLORS: Record<Persona, string> = {
  neutral: 'text-terminal-text border-terminal-border',
  aggressive: 'text-terminal-red border-terminal-red/40',
  conservative: 'text-terminal-cyan border-terminal-cyan/40',
}

const QUICK_QUERIES = [
  '삼성전자 목표주가와 투자의견은?',
  'SK하이닉스 실적 전망은?',
  'NAVER 주요 리스크 요인은?',
  '현대차 밸류에이션은?',
  '반도체 섹터 투자 전략은?',
]

let msgId = 0

export default function AiReportPage() {
  const [query, setQuery] = useState('')
  const [ticker, setTicker] = useState('')
  const [persona, setPersona] = useState<Persona>('neutral')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [selectedReport, setSelectedReport] = useState<ReportInfo | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: health } = useQuery({
    queryKey: ['rag-health'],
    queryFn: getRagHealth,
    refetchInterval: 15_000,
    retry: false,
  })

  const { data: reports } = useQuery({
    queryKey: ['rag-reports'],
    queryFn: getRagReports,
    staleTime: 60_000,
    retry: false,
  })

  const mutation = useMutation({
    mutationFn: (req: RagQueryRequest) => ragQuery(req),
    onSuccess: (data: RagQueryResponse, variables) => {
      setMessages((prev) => [
        ...prev,
        {
          id: ++msgId,
          role: 'assistant',
          content: data.answer,
          sources: data.sources,
          chunkCount: data.chunk_count,
          ticker: variables.ticker || null,
        },
      ])
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          id: ++msgId,
          role: 'assistant',
          content: '[ERROR] RAG 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.',
        },
      ])
    },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const trimmed = query.trim()
    if (!trimmed || mutation.isPending) return

    setMessages((prev) => [
      ...prev,
      { id: ++msgId, role: 'user', content: trimmed },
    ])

    mutation.mutate({
      query: trimmed,
      ticker: ticker.trim() || undefined,
      persona,
      k: 5,
    })

    setQuery('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleQuick = (q: string) => {
    if (mutation.isPending) return
    setMessages((prev) => [
      ...prev,
      { id: ++msgId, role: 'user', content: q },
    ])
    mutation.mutate({ query: q, ticker: ticker.trim() || undefined, persona, k: 5 })
  }

  const handleReportClick = (r: ReportInfo) => {
    setSelectedReport(r === selectedReport ? null : r)
    setTicker(r === selectedReport ? '' : r.ticker)
  }

  const chainReady = health?.chain_ready ?? false

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex gap-4 h-[calc(100vh-6rem)]">
      {/* ── 좌측 사이드바 ─────────────────────────────────── */}
      <aside className="w-60 flex flex-col gap-4 shrink-0">
        {/* 상태 패널 */}
        <div className="border border-terminal-border bg-terminal-surface p-3 rounded-sm">
          <div className="font-mono text-xs text-terminal-muted uppercase tracking-widest mb-2">
            RAG STATUS
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${chainReady ? 'bg-terminal-green animate-pulse' : 'bg-terminal-red'}`} />
            <span className={`font-mono text-xs ${chainReady ? 'text-terminal-green' : 'text-terminal-red'}`}>
              {chainReady ? 'CHAIN READY' : 'OFFLINE'}
            </span>
          </div>
          {!chainReady && (
            <p className="font-mono text-xs text-terminal-muted mt-1.5 leading-relaxed">
              uvicorn src.api_server:app --port 8090
            </p>
          )}
        </div>

        {/* Persona 선택 */}
        <div className="border border-terminal-border bg-terminal-surface p-3 rounded-sm">
          <div className="font-mono text-xs text-terminal-muted uppercase tracking-widest mb-2">
            PERSONA
          </div>
          <div className="flex flex-col gap-1">
            {(Object.keys(PERSONA_LABELS) as Persona[]).map((p) => (
              <button
                key={p}
                onClick={() => setPersona(p)}
                className={`font-mono text-xs py-1 px-2 border rounded-sm transition-colors text-left ${
                  persona === p
                    ? `${PERSONA_COLORS[p]} bg-terminal-bg`
                    : 'text-terminal-dim border-transparent hover:text-terminal-text'
                }`}
              >
                {persona === p ? '▶ ' : '  '}{PERSONA_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* 종목 필터 */}
        <div className="border border-terminal-border bg-terminal-surface p-3 rounded-sm">
          <div className="font-mono text-xs text-terminal-muted uppercase tracking-widest mb-2">
            TICKER FILTER
          </div>
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="예: 005930"
            maxLength={6}
            className="w-full bg-terminal-bg border border-terminal-border font-mono text-xs text-terminal-text placeholder:text-terminal-dim px-2 py-1 rounded-sm focus:outline-none focus:border-terminal-green"
          />
          {ticker && (
            <button
              onClick={() => { setTicker(''); setSelectedReport(null) }}
              className="font-mono text-xs text-terminal-muted hover:text-terminal-red mt-1"
            >
              ✕ CLEAR
            </button>
          )}
        </div>

        {/* 인덱싱된 리포트 목록 */}
        <div className="border border-terminal-border bg-terminal-surface p-3 rounded-sm flex-1 overflow-y-auto">
          <div className="font-mono text-xs text-terminal-muted uppercase tracking-widest mb-2">
            INDEXED REPORTS ({reports?.length ?? 0})
          </div>
          {reports && reports.length > 0 ? (
            <div className="flex flex-col gap-1">
              {reports.map((r) => (
                <button
                  key={r.filename}
                  onClick={() => handleReportClick(r)}
                  className={`text-left p-1.5 border rounded-sm transition-colors ${
                    selectedReport?.filename === r.filename
                      ? 'border-terminal-green/40 bg-terminal-green/5'
                      : 'border-transparent hover:border-terminal-border'
                  }`}
                >
                  <div className="font-mono text-xs text-terminal-green">[{r.ticker}]</div>
                  <div className="font-mono text-xs text-terminal-dim truncate">{r.filename.replace('.json', '')}</div>
                  {r.date && <div className="font-mono text-xs text-terminal-muted">{r.date}</div>}
                </button>
              ))}
            </div>
          ) : (
            <p className="font-mono text-xs text-terminal-muted">리포트 없음</p>
          )}
        </div>
      </aside>

      {/* ── 메인 채팅 영역 ────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* 헤더 */}
        <div className="border border-terminal-border bg-terminal-surface p-3 rounded-sm shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-sm font-bold text-terminal-green tracking-widest">
                AI REPORT ANALYST
              </div>
              <div className="font-mono text-xs text-terminal-muted">
                증권사 리서치 리포트 기반 RAG 분석
              </div>
            </div>
            {ticker && (
              <span className="font-mono text-xs border border-terminal-green/40 text-terminal-green px-2 py-0.5 rounded-sm">
                FILTER: {ticker}
              </span>
            )}
          </div>
        </div>

        {/* 메시지 목록 */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div className="text-center">
                <div className="font-mono text-terminal-muted text-sm mb-1">
                  증권사 리서치 리포트에 질문하세요
                </div>
                <div className="font-mono text-terminal-dim text-xs">
                  목표주가·투자의견·실적전망·밸류에이션 분석 가능
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-lg">
                {QUICK_QUERIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleQuick(q)}
                    className="font-mono text-xs text-terminal-dim border border-terminal-border hover:border-terminal-green/40 hover:text-terminal-text px-3 py-2 rounded-sm transition-colors text-left"
                  >
                    ▷ {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className="font-mono text-xs text-terminal-muted px-1">
                  {msg.role === 'user' ? 'YOU' : `AI ANALYST${msg.ticker ? ` [${msg.ticker}]` : ''}`}
                </div>
                <div
                  className={`border rounded-sm p-3 ${
                    msg.role === 'user'
                      ? 'border-terminal-green/30 bg-terminal-green/5 text-terminal-text'
                      : 'border-terminal-border bg-terminal-surface text-terminal-text'
                  }`}
                >
                  <p className="font-mono text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="px-1">
                    <div className="font-mono text-xs text-terminal-muted mb-1">
                      SOURCES ({msg.chunkCount} chunks)
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {msg.sources.map((s, i) => (
                        <span
                          key={i}
                          className="font-mono text-xs border border-terminal-border text-terminal-dim px-1.5 py-0.5 rounded-sm"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {mutation.isPending && (
            <div className="flex justify-start">
              <div className="border border-terminal-border bg-terminal-surface rounded-sm p-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-terminal-green rounded-full animate-pulse" />
                  <div className="w-1.5 h-1.5 bg-terminal-green rounded-full animate-pulse delay-75" />
                  <div className="w-1.5 h-1.5 bg-terminal-green rounded-full animate-pulse delay-150" />
                  <span className="font-mono text-xs text-terminal-muted ml-1">분석 중...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* 입력 영역 */}
        <div className="border border-terminal-border bg-terminal-surface rounded-sm p-3 shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="리서치 리포트에 질문하세요... (Enter로 전송, Shift+Enter 줄바꿈)"
              rows={2}
              className="flex-1 bg-transparent border-none font-mono text-xs text-terminal-text placeholder:text-terminal-dim resize-none focus:outline-none leading-relaxed"
            />
            <button
              onClick={handleSend}
              disabled={!query.trim() || mutation.isPending || !chainReady}
              className="font-mono text-xs border border-terminal-green text-terminal-green hover:bg-terminal-green/10 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-sm transition-colors shrink-0"
            >
              SEND
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-terminal-border/50">
            <div className="font-mono text-xs text-terminal-muted">
              MODE: {PERSONA_LABELS[persona]}
              {ticker && ` · TICKER: ${ticker}`}
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="font-mono text-xs text-terminal-muted hover:text-terminal-red transition-colors"
              >
                CLEAR CHAT
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
