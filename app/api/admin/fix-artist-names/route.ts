/**
 * POST /api/admin/fix-artist-names
 *
 * Corrige artistas onde nameRomanized contém caracteres coreanos.
 * Para cada artista afetado:
 *   1. Move o nome coreano para nameHangul (se estiver vazio)
 *   2. Busca o nome romanizado correto no TMDB via tmdbId
 *   3. Atualiza o banco
 *
 * Retorna stream de texto com progresso linha a linha.
 */

import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const KOREAN_REGEX = /[\uAC00-\uD7AF\u3131-\u314E\u314F-\u3163]/

async function fetchTMDBName(tmdbId: string): Promise<{ name: string; also_known_as: string[] } | null> {
    if (!TMDB_API_KEY) return null
    try {
        const res = await fetch(
            `${TMDB_BASE_URL}/person/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`,
            { signal: AbortSignal.timeout(8000) }
        )
        if (!res.ok) return null
        const data = await res.json()
        return { name: data.name, also_known_as: data.also_known_as || [] }
    } catch {
        return null
    }
}

export async function POST(_request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    // Buscar artistas com caracteres coreanos em nameRomanized
    const artists = await prisma.$queryRaw<{ id: string; nameRomanized: string; nameHangul: string | null; tmdbId: string | null }[]>`
        SELECT id, "nameRomanized", "nameHangul", "tmdbId"
        FROM "Artist"
        WHERE "nameRomanized" ~ E'[\\uAC00-\\uD7AF\\u3131-\\u314E\\u314F-\\u3163]'
        ORDER BY "trendingScore" DESC
    `

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
        async start(controller) {
            const send = (line: string) => controller.enqueue(encoder.encode(line + '\n'))

            send(`TOTAL:${artists.length}`)

            let fixed = 0
            let noTmdb = 0
            let errors = 0

            for (let i = 0; i < artists.length; i++) {
                const artist = artists[i]
                send(`PROGRESS:${i + 1}/${artists.length}:${artist.nameRomanized}`)

                try {
                    // Se não tem tmdbId, não tem como buscar o nome certo
                    if (!artist.tmdbId) {
                        send(`NO_TMDB:${artist.nameRomanized}`)
                        noTmdb++
                        continue
                    }

                    const tmdb = await fetchTMDBName(artist.tmdbId)
                    if (!tmdb || !tmdb.name || KOREAN_REGEX.test(tmdb.name)) {
                        send(`NO_TMDB:${artist.nameRomanized}`)
                        noTmdb++
                        continue
                    }

                    // Determinar nameHangul: usar o existente ou o nameRomanized atual (que é coreano)
                    const koreanName = artist.nameHangul || artist.nameRomanized

                    // Extrair stageNames do also_known_as
                    const isCJK = /[\uAC00-\uD7AF\u3131-\u314E\u4E00-\u9FFF\u3040-\u30FF]/
                    const stageNames = tmdb.also_known_as
                        .filter(n => !isCJK.test(n) && n !== tmdb.name)
                        .map(n => n.trim())
                        .filter(n => n.length >= 2 && n.length <= 50)
                        .slice(0, 5)

                    await prisma.artist.update({
                        where: { id: artist.id },
                        data: {
                            nameRomanized: tmdb.name,
                            nameHangul: koreanName,
                            stageNames: stageNames.length > 0 ? stageNames : undefined,
                        },
                    })

                    send(`FIXED:${artist.nameRomanized}→${tmdb.name}`)
                    fixed++
                } catch (e) {
                    send(`ERROR:${artist.nameRomanized}:${String(e)}`)
                    errors++
                }

                // Rate limit TMDB
                if (i < artists.length - 1) {
                    await new Promise(r => setTimeout(r, 300))
                }
            }

            send(`DONE:fixed=${fixed},noTmdb=${noTmdb},errors=${errors}`)
            controller.close()
        },
    })

    return new Response(stream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
}
