import { test, expect } from '@playwright/test'

// 페이지 로드 전 localStorage에 인증 상태 주입 (addInitScript 사용)
async function injectAuth(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    localStorage.setItem('auth-storage', JSON.stringify({
      state: { accessToken: 'mock-token', isAuthenticated: true, accountId: 1 },
      version: 0,
    }))
  })
}

async function blockFonts(page: import('@playwright/test').Page) {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort())
}

async function mockAllApis(page: import('@playwright/test').Page) {
  await page.route(/\/api\/v1\//, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: null }),
    }),
  )
}

test.describe('보호 라우트 및 네비게이션', () => {
  test('미인증 상태에서 /dashboard 접근 시 /auth로 리다이렉트된다', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth/, { timeout: 3000 })
  })

  test('미인증 상태에서 /trade 접근 시 /auth로 리다이렉트된다', async ({ page }) => {
    await page.goto('/trade')
    await expect(page).toHaveURL(/\/auth/, { timeout: 3000 })
  })

  test('미인증 상태에서 /profile 접근 시 /auth로 리다이렉트된다', async ({ page }) => {
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/auth/, { timeout: 3000 })
  })

  test('/ 접근 시 /dashboard 또는 /auth로 리다이렉트된다', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/dashboard|\/auth/, { timeout: 3000 })
  })

  test('존재하지 않는 경로는 /auth로 폴백된다', async ({ page }) => {
    await page.goto('/nonexistent-page-xyz')
    await expect(page).toHaveURL(/\/auth/, { timeout: 3000 })
  })

  test('/ranking 페이지는 미인증 상태에서도 접근 가능하다', async ({ page }) => {
    await blockFonts(page)
    await page.route(/\/api\/v1\//, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) }),
    )
    await page.goto('/ranking', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#root > *', { timeout: 5000 })
    await expect(page).toHaveURL(/\/ranking/, { timeout: 3000 })
  })

  test('인증 후 네비게이션 바에 TRADE/OVERVIEW 링크가 보인다', async ({ page }) => {
    await blockFonts(page)
    await injectAuth(page)
    await mockAllApis(page)

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#root > *', { timeout: 5000 })
    await expect(page.getByRole('link', { name: 'TRADE' })).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('link', { name: 'OVERVIEW' })).toBeVisible({ timeout: 5000 })
  })

  test('NEXUS 로고 클릭 시 루트로 이동한다', async ({ page }) => {
    await blockFonts(page)
    await mockAllApis(page)
    await page.goto('/ranking', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#root > *', { timeout: 5000 })

    await page.getByRole('link', { name: /NEXUS/ }).click()
    // 루트는 /auth 또는 /dashboard로 리다이렉트됨
    await expect(page).toHaveURL(/\/auth|\/dashboard/, { timeout: 3000 })
  })
})
