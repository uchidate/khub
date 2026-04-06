import { test, expect } from '@playwright/test'

/**
 * Testes de proteção de rotas admin.
 * Admin redireciona usuários não autenticados para / (homepage),
 * não para /auth/login diretamente.
 */

const ADMIN_ROUTES = [
  '/admin',
  '/admin/analytics',
  '/admin/blog',
  '/admin/artists',
  '/admin/productions',
  '/admin/users',
  '/admin/settings',
  '/admin/pipeline',
  '/admin/enrichment',
]

test.describe('Admin — proteção de rotas', () => {
  for (const route of ADMIN_ROUTES) {
    test(`${route} não exibe painel sem autenticação`, async ({ page }) => {
      await page.goto(route)
      await page.waitForLoadState('domcontentloaded')
      const finalUrl = page.url()
      // Não deve permanecer na rota admin
      const stayedOnAdmin = finalUrl.includes(route) && !finalUrl.includes('/auth/')
      // Se ficou na rota, não deve exibir menu de admin (sidebar)
      if (stayedOnAdmin) {
        const adminSidebar = await page.locator('[data-testid="admin-sidebar"], nav a[href="/admin/analytics"]').isVisible().catch(() => false)
        expect(adminSidebar, `${route} não deve exibir admin sidebar sem autenticação`).toBeFalsy()
      } else {
        // Redirecionou — ok
        expect(finalUrl).not.toContain(route.replace('/admin', '/admin/') + 'dashboard')
      }
    })
  }
})

test.describe('Admin — health da interface', () => {
  test('sem sessão, /admin não exibe dados sensíveis', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).not.toMatch(/password|senha|secret|token.*=\w{20,}/i)
  })
})
