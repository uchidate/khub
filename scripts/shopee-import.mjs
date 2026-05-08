#!/usr/bin/env node
/**
 * Importa produtos Shopee via links de afiliado.
 * Usa Playwright para extrair dados (SPA — requer browser real).
 *
 * Uso:
 *   npx playwright install chromium   # apenas 1ª vez
 *   node scripts/shopee-import.mjs https://s.shopee.com.br/xxx [url2] [url3]
 *
 * Por padrão insere em http://localhost:3000 (dev local).
 * Para produção: API_BASE=https://www.hallyuhub.com.br node scripts/shopee-import.mjs ...
 */

import { chromium } from 'playwright'

const API_BASE = process.env.API_BASE ?? 'http://localhost:3000'
const LINKS = process.argv.slice(2)

if (!LINKS.length) {
    console.error('Uso: node scripts/shopee-import.mjs <link1> [link2] ...')
    process.exit(1)
}

/** Converte preço em centavos para string "R$ X,XX" */
function formatPrice(cents) {
    if (!cents) return ''
    return `R$ ${(cents / 100000).toFixed(2).replace('.', ',')}`
}

/** Detecta categoria a partir do nome/tags do produto */
function guessCategory(name) {
    const n = name.toLowerCase()
    if (n.includes('album') || n.includes('álbum') || n.includes('cd') || n.includes('lp')) return 'kpop_album'
    if (n.includes('lightstick') || n.includes('light stick') || n.includes('bomb')) return 'lightstick'
    if (n.includes('photocard') || n.includes('photo card') || n.includes('pob card')) return 'photocard'
    if (n.includes('camiseta') || n.includes('moletom') || n.includes('hoodie') || n.includes('tshirt')) return 'clothing'
    if (n.includes('protetor solar') || n.includes('sérum') || n.includes('hidratante') || n.includes('esfoliante')) return 'kbeauty'
    if (n.includes('drama') || n.includes('blu-ray') || n.includes('dvd')) return 'kdrama'
    if (n.includes('pulseira') || n.includes('colar') || n.includes('anel') || n.includes('brinco') || n.includes('mochila')) return 'acessorios'
    return 'outros'
}

async function scrapeProduct(browser, affiliateUrl) {
    console.log(`\n🔍 Processando: ${affiliateUrl}`)
    const page = await browser.newPage()

    try {
        await page.goto(affiliateUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })

        // Aguarda o conteúdo carregar
        await page.waitForSelector('[class*="product-title"], [data-sqe="name"], h1', { timeout: 15000 }).catch(() => {})
        await page.waitForTimeout(2000)

        const data = await page.evaluate(() => {
            // Nome
            const nameEl = document.querySelector('[data-sqe="name"] span, [class*="product-title"], h1')
            const name = nameEl?.textContent?.trim() ?? ''

            // Preço atual
            const priceEl = document.querySelector('[class*="price-current"], [data-sqe="price"] [class*="price--"]')
            const priceText = priceEl?.textContent?.trim() ?? ''

            // Preço original
            const origEl = document.querySelector('[class*="price-previous"], [class*="price-strike"]')
            const origText = origEl?.textContent?.trim() ?? ''

            // Imagem principal
            const imgEl = document.querySelector('[class*="product-image__image"], [class*="main-image"] img, [data-sqe="image"] img')
            const imageUrl = imgEl?.src ?? ''

            // Rating
            const ratingEl = document.querySelector('[class*="shopee-rating"] [class*="rating-stars__stars--sum"], [class*="rating-average"]')
            const ratingText = ratingEl?.textContent?.trim() ?? ''

            // Vendidos
            const soldEl = document.querySelector('[class*="sold-count"], [class*="product-rating__count"]')
            const soldText = soldEl?.textContent?.trim() ?? ''

            return { name, priceText, origText, imageUrl, ratingText, soldText }
        })

        const finalUrl = page.url()
        console.log(`  ✓ Nome: ${data.name || '(não encontrado)'}`)
        console.log(`  ✓ Preço: ${data.priceText}`)
        console.log(`  ✓ Imagem: ${data.imageUrl ? 'ok' : '(não encontrada)'}`)

        if (!data.name) {
            console.log('  ⚠ Produto não carregou — pulando.')
            return null
        }

        return {
            affiliateUrl,
            name: data.name,
            price: data.priceText || 'Ver na Shopee',
            originalPrice: data.origText || null,
            imageUrl: data.imageUrl || '',
            store: 'shopee',
            category: guessCategory(data.name),
            rating: parseFloat(data.ratingText) || null,
            soldCount: data.soldText || null,
            isActive: true,
            featured: false,
            position: 0,
            tags: ['shopee'],
        }
    } catch (err) {
        console.error(`  ✗ Erro: ${err.message}`)
        return null
    } finally {
        await page.close()
    }
}

async function insertProduct(product) {
    const res = await fetch(`${API_BASE}/api/admin/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? `HTTP ${res.status}`)
    }
    return res.json()
}

async function main() {
    const browser = await chromium.launch({ headless: true })

    const results = []
    for (const link of LINKS) {
        const product = await scrapeProduct(browser, link)
        if (!product) continue

        try {
            const created = await insertProduct(product)
            console.log(`  ✅ Inserido: ${created.id}`)
            results.push({ link, status: 'ok', name: product.name })
        } catch (err) {
            console.error(`  ✗ Falha ao inserir: ${err.message}`)
            results.push({ link, status: 'erro', error: err.message })
        }
    }

    await browser.close()

    console.log('\n─── Resumo ───────────────────────────')
    for (const r of results) {
        console.log(`${r.status === 'ok' ? '✅' : '❌'} ${r.name ?? r.link} — ${r.status === 'ok' ? 'inserido' : r.error}`)
    }
    console.log('─────────────────────────────────────')
    console.log(`\n🛍 Acesse ${API_BASE}/admin/loja para revisar e ajustar os produtos.`)
}

main().catch(err => { console.error(err); process.exit(1) })
