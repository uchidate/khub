/**
 * POST /api/admin/sync-artist-groups
 *
 * Busca o grupo musical atual de cada artista via MusicBrainz.
 * Para cada artista:
 *   1. Usa mbid salvo, OU busca no MusicBrainz por nameRomanized → nameHangul
 *   2. Usa a relação "member of band" para obter o grupo
 *   3. Faz upsert em MusicalGroup e cria ArtistGroupMembership
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

    const where = onlyMissing
        ? { groupSyncAt: { equals: null as null } }
        : {}

    const artists = await prisma.artist.findMany({
        where,
        select: { id: true, nameRomanized: true, nameHangul: true, mbid: true },
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

                    if (!mbid) {
                        // 1st attempt: romanized name
                        mbid = await mb.searchArtist(artist.nameRomanized)
                        if (mbid) searchedBy = artist.nameRomanized

                        // 2nd attempt: Korean hangul name
                        if (!mbid && artist.nameHangul) {
                            mbid = await mb.searchArtist(artist.nameHangul)
                            if (mbid) searchedBy = artist.nameHangul
                        }

                        if (mbid) {
                            send(`MB_FOUND:${artist.nameRomanized}:${searchedBy}`)
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

                    const groupData = await mb.getArtistGroup(mbid)

                    if (groupData) {
                        // Upsert the MusicalGroup entity
                        const group = await prisma.musicalGroup.upsert({
                            where: { mbid: groupData.mbid },
                            create: { name: groupData.name, mbid: groupData.mbid },
                            update: { name: groupData.name },
                        })

                        // Create or update the membership
                        await prisma.artistGroupMembership.upsert({
                            where: { artistId_groupId: { artistId: artist.id, groupId: group.id } },
                            create: { artistId: artist.id, groupId: group.id, isActive: true },
                            update: { isActive: true, leaveDate: null },
                        })

                        send(`FOUND:${artist.nameRomanized}:${groupData.name}`)
                        found++
                    } else {
                        send(`SOLO:${artist.nameRomanized}`)
                        notFound++
                    }

                    await prisma.artist.update({
                        where: { id: artist.id },
                        data: { groupSyncAt: new Date() },
                    })
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
