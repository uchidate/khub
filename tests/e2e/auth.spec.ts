import { test, expect } from '@playwright/test'

test.describe('Autenticação', () => {
  test('página de login carrega', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('login com credenciais inválidas exibe erro', async ({ page }) => {
    await page.goto('/auth/login')
    await page.locator('input[type="email"]').fill('invalido@teste.com')
    await page.locator('input[type="password"]').fill('senhaerrada123')
    await page.locator('button[type="submit"]').click()
    await expect(page).not.toHaveURL(/\/dashboard/, { timeout: 8_000 })
    const error = page.locator('[role="alert"], .error, [class*="error"], [class*="Error"]')
    await expect(error.first()).toBeVisible({ timeout: 8_000 })
  })

  test('página de registro carrega', async ({ page }) => {
    await page.goto('/auth/register')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('link "esqueci a senha" funciona', async ({ page }) => {
    await page.goto('/auth/login')
    const forgotLink = page.locator('a[href*="forgot"], a[href*="esqueci"], a:has-text("Esqueci"), a:has-text("Esqueceu")')
    await expect(forgotLink.first()).toBeVisible()
    await forgotLink.first().click()
    await expect(page).toHaveURL(/forgot|esqueci|reset/)
  })

  test('rota /dashboard redireciona para login sem autenticação', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth\/login|\/login|\/signin/, { timeout: 8_000 })
  })

  test('rota /favorites mostra prompt de login sem autenticação', async ({ page }) => {
    await page.goto('/favorites')
    // Pode redirecionar para login OU mostrar inline prompt — aguardar client-side render
    const url = page.url()
    const isAuthPage = /login|signin|auth/.test(url)
    if (!isAuthPage) {
      // Página usa useSession() — aguardar status unauthenticated ser renderizado
      await expect(page.locator('text=/login|entrar/i').first()).toBeVisible({ timeout: 10_000 })
    }
  })

  test('rota /settings redireciona para login sem autenticação', async ({ page }) => {
    await page.goto('/settings')
    await expect(page).toHaveURL(/\/auth\/login|\/login|\/signin/, { timeout: 8_000 })
  })
})
