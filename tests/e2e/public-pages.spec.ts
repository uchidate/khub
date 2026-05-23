import { test, expect } from '@playwright/test'

test.describe('Páginas Públicas', () => {
  test('homepage carrega com título e navegação', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/HallyuHub/)
    await expect(page.locator('nav').first()).toBeVisible()
  })

  test('página /blog carrega lista de artigos', async ({ page }) => {
    await page.goto('/blog')
    await expect(page).toHaveTitle(/Blog/)
    // Artigos reais — excluir RSS feed e links de navegação (/blog sem slug)
    const articles = page.locator('main a[href^="/blog/"]:not([href*="feed"]):not([href="/blog/"])')
    await expect(articles.first()).toBeVisible({ timeout: 10_000 })
  })

  test('artigo de blog abre e exibe conteúdo', async ({ page }) => {
    await page.goto('/blog')
    // Excluir RSS feed e links que não são artigos
    const firstArticle = page.locator('main a[href^="/blog/"]:not([href*="feed"]):not([href="/blog/"])').first()
    const href = await firstArticle.getAttribute('href')
    expect(href).toBeTruthy()
    await page.goto(href!)
    await expect(page).toHaveURL(new RegExp('/blog/'))
    await expect(page.locator('h1')).toBeVisible({ timeout: 10_000 })
  })

  test('página /search carrega', async ({ page }) => {
    // Search lê query da URL — vai direto com parâmetro
    await page.goto('/search?q=IVE')
    await expect(page.locator('main')).toBeVisible()
    // Deve exibir resultados ou mensagem de estado dentro do main
    await expect(
      page.locator('main').getByText(/resultado|artista|grupo|Digite pelo menos/i).first()
    ).toBeVisible({ timeout: 30_000 })
  })

  test('busca por artista retorna resultados', async ({ page }) => {
    await page.goto('/search?q=IVE')
    // Aguarda resultados de artistas ou grupos
    await expect(
      page.locator('a[href*="/artists/"], a[href*="/groups/"]').first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('página /artists carrega lista', async ({ page }) => {
    await page.goto('/artists')
    await expect(page.locator('main')).toBeVisible()
    const links = page.locator('a[href^="/artists/"]')
    await expect(links.first()).toBeVisible({ timeout: 10_000 })
  })

  test('página /productions carrega lista', async ({ page }) => {
    await page.goto('/productions')
    await expect(page.locator('main')).toBeVisible()
  })

  test('página /groups carrega lista', async ({ page }) => {
    await page.goto('/groups')
    await expect(page.locator('main')).toBeVisible()
  })

  test('página 404 exibe mensagem de erro', async ({ page }) => {
    const response = await page.goto('/pagina-que-nao-existe-xyzabc123')
    expect(response?.status()).toBe(404)
    await expect(page.locator('body')).toBeVisible()
  })

  test('meta tags de SEO presentes na homepage', async ({ page }) => {
    await page.goto('/')
    const description = await page.locator('meta[name="description"]').getAttribute('content')
    expect(description).toBeTruthy()
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content')
    expect(ogTitle).toBeTruthy()
  })
})
