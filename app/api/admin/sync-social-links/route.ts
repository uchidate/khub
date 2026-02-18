/**
 * POST /api/admin/sync-social-links
 *
 * Busca redes sociais dos artistas via Wikidata e salva no banco.
 * Apenas admins podem acionar.
 *
 * Body (JSON):
 *   { "limit": 20, "dryRun": false, "all": false }
 *
 * Retorna stream de texto com progresso linha a linha (text/plain).
 */

import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
// Timeout generoso para processar muitos artistas
export const maxDuration = 300

const WD_PROPS: Record<string, { label: string; buildUrl: (v: string) => string }> = {
    P2003: { label: 'instagram',  buildUrl: v => `https://www.instagram.com/${v}` },
    P2002: { label: 'twitter',    buildUrl: v => `https://x.com/${v}` },
    P2397: { label: 'youtube',    buildUrl: v => {
        if (v.startsWith('UC')) return `https://www.youtube.com/channel/${v}`
        return `https://www.youtube.com/@${v}`
    }},
    P7085: { label: 'tiktok',     buildUrl: v => `https://www.tiktok.com/@${v}` },
}

const KPOP_KEYWORDS = ['singer', 'rapper', 'actress', 'actor', 'idol', 'k-pop', 'korean', 'south korean', 'entertainer']

async function searchWikidata(name: string): Promise<string | null> {
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

async function getWikidataSocialLinks(entityId: string): Promise<Record<string, string>> {
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

async function findArtistSocialLinks(nameRomanized: string, nameHangul: string | null): Promise<Record<string, string>> {
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

export async function POST(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await request.json().catch(() => ({}))
    const limit: number = Math.min(body.limit ?? 30, 100)
    const dryRun: boolean = body.dryRun ?? false
    const all: boolean = body.all ?? false

    const artists = await prisma.artist.findMany({
        where: all ? {} : { socialLinksUpdatedAt: null },
        orderBy: { trendingScore: 'desc' },
        take: limit,
        select: {
            id: true,
            nameRomanized: true,
            nameHangul: true,
            socialLinks: true,
        },
    })

    // Streaming response so the UI can show live progress
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
        async start(controller) {
            const send = (line: string) => {
                controller.enqueue(encoder.encode(line + '\n'))
            }

            send(`TOTAL:${artists.length}`)

            let found = 0
            let notFound = 0
            let errors = 0

            for (let i = 0; i < artists.length; i++) {
                const artist = artists[i]
                send(`PROGRESS:${i + 1}/${artists.length}:${artist.nameRomanized}`)

                try {
                    const links = await findArtistSocialLinks(artist.nameRomanized, artist.nameHangul)

                    if (Object.keys(links).length === 0) {
                        send(`NOT_FOUND:${artist.nameRomanized}`)
                        notFound++
                    } else {
                        const platformNames = Object.keys(links).join(',')
                        send(`FOUND:${artist.nameRomanized}:${platformNames}`)

                        if (!dryRun) {
                            const existing = (artist.socialLinks as Record<string, string> | null) || {}
                            const merged = { ...links, ...existing } // existing takes priority
                            await prisma.artist.update({
                                where: { id: artist.id },
                                data: { socialLinks: merged, socialLinksUpdatedAt: new Date() },
                            })
                            send(`SAVED:${artist.id}`)
                        }
                        found++
                    }
                } catch (e) {
                    send(`ERROR:${artist.nameRomanized}:${String(e)}`)
                    errors++
                }

                // Respeitar rate limit da Wikidata
                if (i < artists.length - 1) {
                    await new Promise(r => setTimeout(r, 1200))
                }
            }

            send(`DONE:found=${found},notFound=${notFound},errors=${errors}`)
            controller.close()
        },
    })

    return new Response(stream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
}
