/**
 * Extrai a cor de marca do site oficial de um grupo K-pop.
 * Tenta múltiplos sinais: meta theme-color, msapplication-TileColor.
 * O fetch é cacheado pelo Next.js por 24h.
 */
export async function fetchGroupThemeColor(websiteUrl: string): Promise<string | null> {
    try {
        const res = await fetch(websiteUrl, {
            next: { revalidate: 86400 }, // cache 24h
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                'Accept': 'text/html',
            },
            signal: AbortSignal.timeout(5000),
        })
        if (!res.ok) return null

        const html = await res.text()

        // 1. <meta name="theme-color" content="...">
        const patterns = [
            /<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i,
            /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']theme-color["']/i,
            /<meta[^>]+property=["']theme-color["'][^>]+content=["']([^"']+)["']/i,
        ]
        for (const pattern of patterns) {
            const m = html.match(pattern)
            if (m?.[1] && isValidColor(m[1])) return m[1].trim()
        }

        // 2. msapplication-TileColor (Windows tile color — frequente em sites K-pop)
        const tileM = html.match(/<meta[^>]+name=["']msapplication-TileColor["'][^>]+content=["']([^"']+)["']/i)
            ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']msapplication-TileColor["']/i)
        if (tileM?.[1] && isValidColor(tileM[1])) return tileM[1].trim()

        // 3. Primeira cor CSS que parece ser primary brand color no :root
        const cssVarM = html.match(/--(?:primary|brand|main|accent|color-primary)[^:]*:\s*(#[0-9a-fA-F]{3,8})/i)
        if (cssVarM?.[1] && isValidColor(cssVarM[1])) return cssVarM[1].trim()

        return null
    } catch {
        return null
    }
}

function isValidColor(str: string): boolean {
    const s = str.trim()
    return /^#[0-9a-fA-F]{3,8}$/.test(s) || /^rgb/.test(s) || /^hsl/.test(s)
}

/**
 * Converte uma cor (hex ou rgb) para rgba com o alpha especificado.
 * Sempre retorna uma string rgba válida.
 */
export function toRgba(color: string, alpha: number): string {
    const s = color.trim()
    // hex 3: #RGB
    if (/^#[0-9a-fA-F]{3}$/.test(s)) {
        const r = parseInt(s[1] + s[1], 16)
        const g = parseInt(s[2] + s[2], 16)
        const b = parseInt(s[3] + s[3], 16)
        return `rgba(${r},${g},${b},${alpha})`
    }
    // hex 6: #RRGGBB
    if (/^#[0-9a-fA-F]{6}$/.test(s)) {
        const r = parseInt(s.slice(1, 3), 16)
        const g = parseInt(s.slice(3, 5), 16)
        const b = parseInt(s.slice(5, 7), 16)
        return `rgba(${r},${g},${b},${alpha})`
    }
    // hex 8: #RRGGBBAA — ignora o AA original
    if (/^#[0-9a-fA-F]{8}$/.test(s)) {
        const r = parseInt(s.slice(1, 3), 16)
        const g = parseInt(s.slice(3, 5), 16)
        const b = parseInt(s.slice(5, 7), 16)
        return `rgba(${r},${g},${b},${alpha})`
    }
    // rgb(r, g, b) → rgba
    const rgbM = s.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/)
    if (rgbM) return `rgba(${rgbM[1]},${rgbM[2]},${rgbM[3]},${alpha})`

    // fallback: devolve a cor original sem alpha
    return s
}

/**
 * Gera o objeto de CSS custom properties para o tema do grupo.
 * Usado como `style={buildGroupThemeVars(color)}` no wrapper da página.
 */
export function buildGroupThemeVars(color: string | null): React.CSSProperties {
    const c = color ?? '#9333ea' // purple-600 fallback
    return {
        '--g-accent':    c,
        '--g-accent-5':  toRgba(c, 0.05),
        '--g-accent-10': toRgba(c, 0.10),
        '--g-accent-20': toRgba(c, 0.20),
        '--g-accent-30': toRgba(c, 0.30),
        '--g-accent-50': toRgba(c, 0.50),
    } as React.CSSProperties
}
