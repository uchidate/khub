/**
 * Bookmarklet para importar produto Shopee para o HallyuHub.
 *
 * COMO USAR:
 * 1. Crie um bookmark no browser com qualquer URL
 * 2. Edite o bookmark e cole o conteúdo de shopee-bookmarklet.min.txt como URL
 * 3. Abra um produto Shopee no browser (via seu link de afiliado)
 * 4. Clique o bookmark → abre o admin do HallyuHub com tudo pré-preenchido
 * 5. Revise e clique "Criar produto"
 *
 * O link de afiliado (s.shopee.com.br/xxx) deve ser aberto no browser primeiro.
 * O bookmarklet captura a URL atual (com params de rastreio do afiliado).
 */

;(function () {
    const ADMIN = 'https://www.hallyuhub.com.br/admin/loja/import'

    function getText(selectors) {
        for (const sel of selectors) {
            const el = document.querySelector(sel)
            if (el?.textContent?.trim()) return el.textContent.trim()
        }
        return ''
    }

    function getAttr(selectors, attr) {
        for (const sel of selectors) {
            const el = document.querySelector(sel)
            const val = el?.getAttribute?.(attr) || el?.content || ''
            if (val) return val
        }
        return ''
    }

    // Nome
    const name = getText([
        '[class*="product-title"]',
        '[data-sqe="name"] span',
        'h1',
    ]) || document.title.replace(/\s*\|\s*Shopee.*$/, '').trim()

    // Preços — pega todos os textos "R$ X,XX" da página
    const allPrices = [...document.querySelectorAll('*')]
        .filter(e => e.childElementCount === 0)
        .map(e => e.textContent.trim())
        .filter(t => /^R\$\s*[\d.,]+$/.test(t))
        .map(t => ({
            text: t,
            val: parseFloat(t.replace('R$', '').replace(/\./g, '').replace(',', '.').trim())
        }))
        .filter(p => p.val > 0)
        .sort((a, b) => a.val - b.val)

    const price = allPrices[0]?.text ?? ''
    const originalPrice = allPrices.length > 1 ? allPrices[allPrices.length - 1].text : ''

    // Imagem — tenta og:image, depois img da área do produto
    const imageUrl = getAttr(['meta[property="og:image"]'], 'content')
        || getAttr(['[class*="product-image__image"]', '[class*="main-image"] img', '[class*="pdp-main"] img'], 'src')
        // fallback: primeira imagem do domínio susercontent
        || [...document.images].find(i => i.src.includes('susercontent'))?.src
        || ''

    // Rating e vendidos
    const ratingText = getText(['[class*="rating-average"]', '[class*="rating-stars__stars--sum"]'])
    const rating = parseFloat(ratingText) || ''
    const soldCount = getText(['[class*="sold-count"]', '[class*="product-rating__count"]'])

    // Categoria
    function guessCategory(n) {
        const l = n.toLowerCase()
        if (/album|álbum|\bcd\b|\blp\b/.test(l)) return 'kpop_album'
        if (/lightstick|light stick/.test(l)) return 'lightstick'
        if (/photocard|photo card/.test(l)) return 'photocard'
        if (/camiseta|moletom|hoodie|tshirt|t-shirt/.test(l)) return 'clothing'
        if (/protetor|sérum|hidratante|esfoliante|toner|cleanser|moistur/.test(l)) return 'kbeauty'
        if (/drama|blu-ray|dvd/.test(l)) return 'kdrama'
        if (/pulseira|colar|anel|brinco|mochila|bolsa|keychain|chaveiro/.test(l)) return 'acessorios'
        return 'outros'
    }

    // Abre o admin com dados pré-preenchidos (evita CORS)
    const params = new URLSearchParams({
        name,
        price,
        originalPrice,
        imageUrl,
        affiliateUrl: location.href,
        store: 'shopee',
        category: guessCategory(name),
        rating: String(rating),
        soldCount,
    })

    window.open(`${ADMIN}?${params}`, '_blank')
})()
