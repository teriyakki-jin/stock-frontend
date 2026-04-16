import { test, expect } from '@playwright/test'

const MOCK_STOCK = {
  id: 1, ticker: '005930', name: '삼성전자', market: 'KOSPI', sector: '반도체',
  currentPrice: 75000, changeRate: 1.5, volume: 12000000,
  dayHigh: 75500, dayLow: 74000, basePrice: 74000, totalShares: 5969782550,
}

async function setupTradePage(page: import('@playwright/test').Page) {
  // 외부 폰트 요청 차단 (React 마운트 블로킹 방지)
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort())

  // 페이지 로드 전 localStorage에 인증 상태 주입
  await page.addInitScript(() => {
    localStorage.setItem('auth-storage', JSON.stringify({
      state: { accessToken: 'mock-token', isAuthenticated: true, accountId: 1 },
      version: 0,
    }))
  })

  // catch-all 먼저 등록 (낮은 우선순위 — Playwright LIFO)
  await page.route(/\/api\/v1\//, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: null }) }),
  )
  // WebSocket 연결 차단 (테스트 환경에서 백엔드 없음)
  await page.route(/\/ws\//, (route) => route.abort())

  // 구체적 mock (나중에 등록 → 높은 우선순위)
  // 미체결 주문 / 알림
  await page.route(/\/api\/v1\/accounts\/1\/orders\/pending/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) }),
  )
  await page.route(/\/api\/v1\/accounts\/1\/alerts/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) }),
  )
  // 매수/매도 주문
  await page.route(/\/api\/v1\/accounts\/1\/orders\/(buy|sell)/, (route) =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { id: 1001, ticker: '005930', orderType: 'BUY', status: 'EXECUTED', quantity: 5, unitPrice: 75000, totalAmount: 375000 },
      }),
    }),
  )
  // 기술적 분석 (컴포넌트가 techRes.data.technicals, techRes.data.history 구조를 기대함)
  await page.route(/\/api\/v1\/stocks\/005930\/technicals/, (route) =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          history: [],
          technicals: { rsi: 55.2, macd: 120, macdSignal: 100, macdHistogram: 20, bbUpper: 77000, bbMiddle: 75000, bbLower: 73000, signal: 'NEUTRAL' },
          annualizedVolatility: 0.25,
          annualizedReturn: 0.15,
        },
      }),
    }),
  )
  // 주식 조회
  await page.route(/\/api\/v1\/stocks\/005930$/, (route) =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true, data: MOCK_STOCK }),
    }),
  )
}

async function searchStock(page: import('@playwright/test').Page) {
  const input = page.getByPlaceholder('종목코드 (예: 005930)')
  await input.fill('005930')
  await input.press('Enter')
  await expect(page.getByText('삼성전자').first()).toBeVisible({ timeout: 5000 })
}

test.describe('주식 거래 플로우', () => {
  test.beforeEach(async ({ page }) => {
    await setupTradePage(page)
    await page.goto('/trade', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#root > *', { timeout: 5000 })
  })

  test('거래 페이지가 렌더링된다', async ({ page }) => {
    await expect(page.getByPlaceholder('종목코드 (예: 005930)')).toBeVisible({ timeout: 5000 })
  })

  test('종목코드 검색 시 주식 정보가 표시된다', async ({ page }) => {
    await searchStock(page)
    await expect(page.getByText('삼성전자').first()).toBeVisible()
    await expect(page.getByText('75,000').first()).toBeVisible()
  })

  test('인기 종목 버튼 클릭 시 종목이 로드된다', async ({ page }) => {
    const samsungBtn = page.getByRole('button', { name: /삼성전자/ }).first()
    await expect(samsungBtn).toBeVisible({ timeout: 3000 })
    await samsungBtn.click()
    await expect(page.getByText('삼성전자').first()).toBeVisible({ timeout: 5000 })
  })

  test('BUY → SELL 탭 전환 시 SELL 버튼이 활성화된다', async ({ page }) => {
    await searchStock(page)

    // BUY/SELL 탭 버튼 (exact: true로 "SELL 0주" 주문 버튼과 구분)
    const sellTabBtn = page.getByRole('button', { name: 'SELL', exact: true })
    await expect(sellTabBtn).toBeVisible({ timeout: 3000 })
    await sellTabBtn.click()
    await expect(sellTabBtn).toHaveClass(/bg-terminal-red/, { timeout: 2000 })
  })

  test('종목 미선택 상태에서 주문 버튼이 비활성화된다', async ({ page }) => {
    // 종목 검색 없이 바로 확인
    await expect(page.locator('button:disabled').filter({ hasText: /BUY|SELL/ }).first()).toBeVisible({ timeout: 3000 })
  })

  test('ANALYSIS 탭 전환 시 RSI 지표가 표시된다', async ({ page }) => {
    await searchStock(page)

    await page.getByRole('button', { name: /ANALYSIS/ }).click()
    await expect(page.getByText(/RSI/).first()).toBeVisible({ timeout: 5000 })
  })

  test('ALERTS 탭 전환 시 PRICE ALERTS 패널이 표시된다', async ({ page }) => {
    await searchStock(page)

    await page.getByRole('button', { name: /ALERTS/ }).click()
    await expect(page.getByText(/PRICE ALERTS/)).toBeVisible({ timeout: 3000 })
  })

  test('LIMIT 모드 전환 시 지정가 입력 필드가 나타난다', async ({ page }) => {
    await searchStock(page)

    await page.getByRole('button', { name: 'LIMIT' }).click()
    // LIMIT PRICE 입력창 (placeholder="0") 또는 LIMIT PRICE 레이블 확인
    await expect(page.getByText('LIMIT PRICE')).toBeVisible({ timeout: 2000 })
  })
})
