/**
 * Wikidata Social Links Service
 *
 * Shared utility for searching artist social media profiles via Wikidata.
 * Used by:
 *  - POST /api/admin/sync-social-links (manual, streaming, admin-only)
 *  - POST /api/cron/sync-social-links-wikidata (automatic cron)
 *  - ProductionCastService (enriching newly created artists)
 */

const WD_PROPS: Record<string, { label: string; buildUrl: (v: string) => string }> = {
    P2003: { label: 'instagram', buildUrl: v => `https://www.instagram.com/${v}` },
    P2002: { label: 'twitter',   buildUrl: v => `https://x.com/${v}` },
    P2397: { label: 'youtube',   buildUrl: v => {
        if (v.startsWith('UC')) return `https://www.youtube.com/channel/${v}`
        return `https://www.youtube.com/@${v}`
    }},
    P7085: { label: 'tiktok',   buildUrl: v => `https://www.tiktok.com/@${v}` },
}

const KPOP_KEYWORDS = ['singer', 'rapper', 'actress', 'actor', 'idol', 'k-pop', 'korean', 'south korean', 'entertainer']

/**
 * Search Wikidata for an entity by name.
 * Returns the Wikidata entity ID (e.g. "Q12345") or null if not found.
 */
export async function searchWikidata(name: string): Promise<string | null> {
    const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&limit=5&format=json`
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'HallyuHub/1.0 (+https://hallyuhub.com.br)' },
            signal: AbortSignal.timeout(8000),
        })
        if (!res.ok) return null
        const data: any = await res.json()
        if (!data.search?.length) return null

        const best = data.search.find((r: any) => {
            const desc = (r.description || '').toLowerCase()
            return KPOP_KEYWORDS.some(kw => desc.includes(kw))
        }) || data.search[0]

        return best?.id || null
    } catch {
        return null
    }
}

/**
 * Get social media links from a Wikidata entity.
 * Returns a map of platform → URL.
 */
export async function getWikidataSocialLinks(entityId: string): Promise<Record<string, string>> {
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&props=claims&format=json`
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'HallyuHub/1.0 (+https://hallyuhub.com.br)' },
            signal: AbortSignal.timeout(8000),
        })
        if (!res.ok) return {}
        const data: any = await res.json()
        const claims = data.entities?.[entityId]?.claims
        if (!claims) return {}

        const links: Record<string, string> = {}
        for (const [propId, config] of Object.entries(WD_PROPS)) {
            const claimArr = claims[propId]
            if (!claimArr?.length) continue
            const claim = claimArr.find((c: any) => c.rank === 'preferred') || claimArr[0]
            const value = claim?.mainsnak?.datavalue?.value
            if (value && typeof value === 'string') {
                links[config.label] = config.buildUrl(value)
            }
        }
        return links
    } catch {
        return {}
    }
}

/**
 * Find social links for an artist by trying their romanized and hangul names.
 * Adds a 300ms delay between name attempts to respect Wikidata rate limits.
 */
export async function findArtistSocialLinks(
    nameRomanized: string,
    nameHangul: string | null
): Promise<Record<string, string>> {
    for (const name of [nameRomanized, nameHangul].filter(Boolean) as string[]) {
        const entityId = await searchWikidata(name)
        if (entityId) {
            const links = await getWikidataSocialLinks(entityId)
            if (Object.keys(links).length > 0) return links
        }
        await new Promise(r => setTimeout(r, 300))
    }
    return {}
}
