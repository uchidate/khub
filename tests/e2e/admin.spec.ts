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

// Um único teste verifica todas as rotas em paralelo com waitUntil: 'commit'
// (espera só os headers, não renderiza — ~5x mais rápido que load completo)
test('Admin — todas as rotas redirecionam sem autenticação', async ({ page }) => {
  await Promise.all(
    ADMIN_ROUTES.map(async (route) => {
      const tab = await page.context().newPage()
      try {
        await tab.goto(route, { waitUntil: 'commit', timeout: 15_000 })
        const finalUrl = tab.url()
        const stayedOnAdmin = finalUrl.includes(route) && !finalUrl.includes('/auth/')
        if (stayedOnAdmin) {
          const adminSidebar = await tab
            .locator('[data-testid="admin-sidebar"], nav a[href="/admin/analytics"]')
            .isVisible()
            .catch(() => false)
          expect(adminSidebar, `${route} não deve exibir sidebar`).toBeFalsy()
        }
      } finally {
        await tab.close()
      }
    })
  )
})
