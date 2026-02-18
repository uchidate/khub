/**
 * POST /api/admin/sync-artist-groups
 *
 * Busca o grupo musical atual de cada artista via MusicBrainz.
 * Para cada artista:
 *   1. Usa mbid salvo, OU busca no MusicBrainz por:
 *      a. nameRomanized
 *      b. nameHangul (se (a) falhar)
 *   2. Usa a relação "member of band" para obter o grupo
 *   3. Atualiza musicalGroup, musicalGroupMbid e groupSyncAt
 *
 * Retorna stream de texto com progresso linha a linha.
 */

import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getMusicBrainzService } from '@/lib/services/musicbrainz-service'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await request.json().catch(() => ({}))
    const limit: number = Math.min(Number(body.limit) || 50, 200)
    const onlyMissing: boolean = body.onlyMissing !== false // default true

    // Fetch artists that need group sync — include nameHangul for fallback search
    const where = onlyMissing
        ? { groupSyncAt: { equals: null as null } }
        : {}

    const artists = await prisma.artist.findMany({
        where,
        select: { id: true, nameRomanized: true, nameHangul: true, mbid: true, musicalGroup: true },
        orderBy: { trendingScore: 'desc' },
        take: limit,
    })

    const mb = getMusicBrainzService()
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
        async start(controller) {
            const send = (line: string) => controller.enqueue(encoder.encode(line + '\n'))

            send(`TOTAL:${artists.length}`)

            let found = 0
            let notFound = 0
            let errors = 0

            for (let i = 0; i < artists.length; i++) {
                const artist = artists[i]
                send(`PROGRESS:${i + 1}/${artists.length}:${artist.nameRomanized}`)

                try {
                    let mbid = artist.mbid
                    let searchedBy = ''

                    // Search MusicBrainz if no mbid yet
                    if (!mbid) {
                        // 1st attempt: romanized name
                        mbid = await mb.searchArtist(artist.nameRomanized)
                        if (mbid) {
                            searchedBy = artist.nameRomanized
                        }

                        // 2nd attempt: Korean name (hangul) — better match for K-pop artists
                        if (!mbid && artist.nameHangul) {
                            mbid = await mb.searchArtist(artist.nameHangul)
                            if (mbid) {
                                searchedBy = artist.nameHangul
                            }
                        }

                        if (mbid) {
                            send(`MB_FOUND:${artist.nameRomanized}:${searchedBy}`)
                            // Save mbid for future use
                            await prisma.artist.update({
                                where: { id: artist.id },
                                data: { mbid },
                            })
                        }
                    }

                    if (!mbid) {
                        send(`NOT_FOUND:${artist.nameRomanized}`)
                        notFound++
                        await prisma.artist.update({
                            where: { id: artist.id },
                            data: { groupSyncAt: new Date() },
                        })
                        continue
                    }

                    const group = await mb.getArtistGroup(mbid)

                    await prisma.artist.update({
                        where: { id: artist.id },
                        data: {
                            musicalGroup: group?.name ?? null,
                            musicalGroupMbid: group?.mbid ?? null,
                            groupSyncAt: new Date(),
                        },
                    })

                    if (group) {
                        send(`FOUND:${artist.nameRomanized}:${group.name}`)
                        found++
                    } else {
                        send(`SOLO:${artist.nameRomanized}`)
                        notFound++
                    }
                } catch (e) {
                    send(`ERROR:${artist.nameRomanized}:${String(e)}`)
                    errors++
                }
            }

            send(`DONE:found=${found},solo=${notFound},errors=${errors}`)
            controller.close()
        },
    })

    return new Response(stream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
}
