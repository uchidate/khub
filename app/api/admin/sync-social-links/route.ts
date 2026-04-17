/**
 * POST /api/admin/sync-social-links
 *
 * Busca redes sociais dos artistas via Wikidata e salva no banco.
 * Apenas admins podem acionar.
 *
 * Parâmetros body (opcionais):
 *   mode: 'empty_only' (padrão) | 'smart' | 'all'
 *     - empty_only: só artistas nunca sincronizados (socialLinksUpdatedAt: null)
 *     - smart:      artistas sem links (nunca tentados OU tentados sem resultado)
 *     - all:        todos os artistas (Wikidata sobrescreve links existentes)
 *   limit: number   — máximo de artistas por lote (padrão: 50, max: 200)
 *   offset: number  — pular N artistas (para paginação/retomada)
 *
 * Retorna stream de texto com progresso linha a linha.
 * O stream inclui TOTAL_GLOBAL:<n> com o total elegível (sem offset).
 */

import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { findArtistSocialLinks } from '@/lib/services/wikidata-social-links'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    let mode: 'empty_only' | 'smart' | 'all' = 'empty_only'
    let limit = 50
    let offset = 0

    try {
        const body = await request.json()
        if (body?.mode === 'all') mode = 'all'
        else if (body?.mode === 'smart') mode = 'smart'
        if (body?.limit && typeof body.limit === 'number') {
            limit = Math.min(Math.max(body.limit, 1), 200)
        }
        if (body?.offset && typeof body.offset === 'number') {
            offset = Math.max(body.offset, 0)
        }
    } catch { /* sem body — usa padrão */ }

    const whereClause = {
        flaggedAsNonKorean: false,
        ...(mode === 'empty_only'
            ? { socialLinksUpdatedAt: null }
            : mode === 'smart'
            ? { OR: [{ socialLinksUpdatedAt: null }, { socialLinks: { equals: Prisma.DbNull } }] }
            : {}),
    }

    // Conta total elegível (sem offset) para a UI montar o progresso global
    const totalGlobal = await prisma.artist.count({ where: whereClause })

    const artists = await prisma.artist.findMany({
        where: whereClause,
        orderBy: { trendingScore: 'desc' },
        skip: offset,
        take: limit,
        select: {
            id: true,
            nameRomanized: true,
            nameHangul: true,
            socialLinks: true,
        },
    })

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
        async start(controller) {
            const send = (line: string) => controller.enqueue(encoder.encode(line + '\n'))

            send(`TOTAL_GLOBAL:${totalGlobal}`)
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
                        await prisma.artist.update({
                            where: { id: artist.id },
                            data: { socialLinksUpdatedAt: new Date() },
                        })
                    } else {
                        const platformNames = Object.keys(links).join(',')
                        send(`FOUND:${artist.nameRomanized}:${platformNames}`)

                        const existing = (artist.socialLinks as Record<string, string> | null) || {}
                        // mode=all: Wikidata sobrescreve; outros modos: existente tem prioridade
                        const merged = mode === 'all'
                            ? { ...existing, ...links }
                            : { ...links, ...existing }

                        await prisma.artist.update({
                            where: { id: artist.id },
                            data: { socialLinks: merged, socialLinksUpdatedAt: new Date() },
                        })
                        send(`SAVED:${artist.id}`)
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
