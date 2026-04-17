/**
 * URL canônica do site — usada em sitemaps, OG tags e links absolutos.
 * Intencionalmente hardcoded (não usa NEXTAUTH_URL) para que páginas de
 * staging nunca gerem canonical URLs apontando para o ambiente de staging.
 */
export const SITE_URL = 'https://www.hallyuhub.com.br'

export const SITE_NAME = 'HallyuHub'

/**
 * OG image padrão do site (gerada por app/opengraph-image.tsx).
 */
export const OG_IMAGE = { url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630 }

/**
 * Base para openGraph — garante siteName e imagem padrão em toda página.
 * Next.js faz merge raso: quando uma página define seu próprio openGraph,
 * o siteName do root layout é perdido. Este helper evita isso.
 *
 * Uso: openGraph: { ...baseOG(`${SITE_URL}/contato`), title: '...', description: '...' }
 */
export function baseOG(url: string) {
    return {
        siteName: SITE_NAME,
        type: 'website' as const,
        url,
        images: [OG_IMAGE],
    }
}

/**
 * Base para twitter card — garante summary_large_image e imagem padrão.
 */
export function baseTwitter() {
    return {
        card: 'summary_large_image' as const,
        images: [OG_IMAGE.url],
    }
}
