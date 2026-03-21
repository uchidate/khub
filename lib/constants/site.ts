/**
 * URL canônica do site — usada em sitemaps, OG tags e links absolutos.
 * Intencionalmente hardcoded (não usa NEXTAUTH_URL) para que páginas de
 * staging nunca gerem canonical URLs apontando para o ambiente de staging.
 */
export const SITE_URL = 'https://www.hallyuhub.com.br'
