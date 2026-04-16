import { test, expect } from '@playwright/test'

test.describe('인증 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // 외부 폰트 요청 차단 (React 마운트 블로킹 방지)
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort())

    // 기타 API catch-all (먼저 등록 → 낮은 우선순위, 구체적 mock이 덮어씀)
    await page.route(/\/api\/v1\//, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: null }),
      }),
    )

    // 구체적 mock (나중에 등록 → 높은 우선순위 — Playwright LIFO)
    await page.route(/\/api\/v1\/auth\/signup/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: null }),
      }),
    )
    await page.route(/\/api\/v1\/accounts/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: 1, accountNumber: 'NH-TEST0001', balance: 10000000, status: 'ACTIVE' }],
        }),
      }),
    )
    await page.route(/\/api\/v1\/auth\/login/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { accessToken: 'mock-token', refreshToken: 'mock-refresh' },
        }),
      }),
    )
  })

  test('로그인 페이지에 NEXUS 로고와 입력 필드가 렌더링된다', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#root > *', { timeout: 5000 })
    await expect(page.getByRole('heading', { name: 'NEXUS' })).toBeVisible()
    await expect(page.getByPlaceholder('user@example.com')).toBeVisible()
    await expect(page.getByPlaceholder('••••••••')).toBeVisible()
  })

  test('로그인 성공 시 /dashboard로 이동한다', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#root > *', { timeout: 5000 })
    await page.getByPlaceholder('user@example.com').fill('test@test.com')
    await page.getByPlaceholder('••••••••').fill('password123')
    await page.getByRole('button', { name: 'ACCESS TERMINAL' }).click()

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 })
  })

  test('REGISTER 버튼 클릭 시 회원가입 폼이 펼쳐진다', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#root > *', { timeout: 5000 })
    await page.getByRole('button', { name: 'REGISTER' }).click()

    await expect(page.getByPlaceholder('홍길동')).toBeVisible()
    await expect(page.getByPlaceholder('010-0000-0000')).toBeVisible()
  })

  test('로그인 실패 시 에러 메시지가 표시된다', async ({ page }) => {
    // 400으로 덮어씀 (401은 axios interceptor가 /auth로 hard redirect하므로 400 사용)
    await page.route(/\/api\/v1\/auth\/login/, (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다' }),
      }),
    )

    await page.goto('/auth', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#root > *', { timeout: 5000 })
    await page.getByPlaceholder('user@example.com').fill('wrong@test.com')
    await page.getByPlaceholder('••••••••').fill('wrongpass')
    await page.getByRole('button', { name: 'ACCESS TERMINAL' }).click()

    await expect(page.getByText(/올바르지 않/)).toBeVisible({ timeout: 3000 })
  })

  test('로그인 중 ACCESS TERMINAL 버튼이 비활성화된다', async ({ page }) => {
    await page.route(/\/api\/v1\/auth\/login/, async (route) => {
      await new Promise((r) => setTimeout(r, 800))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { accessToken: 'tok', refreshToken: 'ref' } }),
      })
    })

    await page.goto('/auth', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#root > *', { timeout: 5000 })
    await page.getByPlaceholder('user@example.com').fill('test@test.com')
    await page.getByPlaceholder('••••••••').fill('password123')

    const submitBtn = page.locator('button[type="submit"]')
    await submitBtn.click()
    // loading 중엔 버튼 텍스트가 'PROCESSING'으로 바뀌므로 submit 타입으로 찾음
    await expect(submitBtn).toBeDisabled({ timeout: 1000 })
  })
})
