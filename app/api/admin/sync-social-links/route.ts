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
import { findArtistSocialLinks } from '@/lib/services/wikidata-social-links'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
// Timeout generoso para processar muitos artistas
export const maxDuration = 300

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
