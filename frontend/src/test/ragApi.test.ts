import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

vi.mock('axios', () => {
  const post = vi.fn()
  const get = vi.fn()
  const create = vi.fn(() => ({ post, get }))
  return { default: { create } }
})

// 환경변수 모킹
vi.stubEnv('VITE_RAG_API_KEY', 'test-key-123')
vi.stubEnv('VITE_RAG_BASE_URL', 'http://localhost:8090')

describe('rag API client', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('axios.create가 X-API-Key 헤더와 함께 호출된다', async () => {
    await import('../api/rag')
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-API-Key': 'test-key-123' }),
      }),
    )
  })

  it('VITE_RAG_BASE_URL이 baseURL로 설정된다', async () => {
    await import('../api/rag')
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: 'http://localhost:8090' }),
    )
  })

  it('API Key 없으면 헤더 없이 생성된다', async () => {
    vi.stubEnv('VITE_RAG_API_KEY', '')
    await import('../api/rag')
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({ headers: {} }),
    )
  })
})
