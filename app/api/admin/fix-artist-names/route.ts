/**
 * POST /api/admin/fix-artist-names
 *
 * Dois modos de operação:
 *
 * mode: 'fix-names' (padrão)
 *   Corrige artistas onde nameRomanized contém caracteres coreanos.
 *   1. Move o nome coreano para nameHangul (se estiver vazio)
 *   2. Busca o nome romanizado correto no TMDB via tmdbId
 *   3. Extrai stageNames do also_known_as
 *
 * mode: 'fill-hangul'
 *   Preenche nameHangul para artistas que têm tmdbId mas não têm nameHangul.
 *   1. Busca also_known_as do TMDB
 *   2. Extrai o nome em Hangul (se presente)
 *   3. Atualiza nameHangul e stageNames (se vazio)
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
const CJK_REGEX = /[\uAC00-\uD7AF\u3131-\u314E\u4E00-\u9FFF\u3040-\u30FF]/

async function fetchTMDBPerson(tmdbId: string): Promise<{ name: string; also_known_as: string[] } | null> {
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

function extractHangul(also_known_as: string[]): string | null {
    return also_known_as.find(name => KOREAN_REGEX.test(name)) ?? null
}

function extractStageNames(also_known_as: string[], canonicalName: string): string[] {
    return also_known_as
        .filter(n => !CJK_REGEX.test(n) && n !== canonicalName)
        .map(n => n.trim())
        .filter(n => n.length >= 2 && n.length <= 50)
        .slice(0, 5)
}

export async function POST(req: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    let mode: 'fix-names' | 'fill-hangul' = 'fix-names'
    try {
        const body = await req.json()
        if (body?.mode === 'fill-hangul') mode = 'fill-hangul'
    } catch {
        // sem body — usa padrão
    }

    const encoder = new TextEncoder()

    if (mode === 'fill-hangul') {
        // Artistas com tmdbId mas sem nameHangul
        const artists = await prisma.$queryRaw<{ id: string; nameRomanized: string; nameHangul: string | null; tmdbId: string; stageNames: string[] }[]>`
            SELECT id, "nameRomanized", "nameHangul", "tmdbId", "stageNames"
            FROM "Artist"
            WHERE "tmdbId" IS NOT NULL
              AND ("nameHangul" IS NULL OR "nameHangul" = '')
            ORDER BY "trendingScore" DESC
        `

        const stream = new ReadableStream({
            async start(controller) {
                const send = (line: string) => controller.enqueue(encoder.encode(line + '\n'))

                send(`TOTAL:${artists.length}`)
                let filled = 0
                let notFound = 0
                let errors = 0

                for (let i = 0; i < artists.length; i++) {
                    const artist = artists[i]
                    send(`PROGRESS:${i + 1}/${artists.length}:${artist.nameRomanized}`)

                    try {
                        const tmdb = await fetchTMDBPerson(artist.tmdbId)
                        if (!tmdb) {
                            send(`NOT_FOUND:${artist.nameRomanized}`)
                            notFound++
                            continue
                        }

                        const hangul = extractHangul(tmdb.also_known_as)
                        if (!hangul) {
                            send(`NOT_FOUND:${artist.nameRomanized}`)
                            notFound++
                            continue
                        }

                        const updateData: Record<string, unknown> = { nameHangul: hangul }

                        // Preencher stageNames se ainda estiver vazio
                        if (!artist.stageNames || artist.stageNames.length === 0) {
                            const stageNames = extractStageNames(tmdb.also_known_as, tmdb.name)
                            if (stageNames.length > 0) updateData.stageNames = stageNames
                        }

                        await prisma.artist.update({
                            where: { id: artist.id },
                            data: updateData,
                        })

                        send(`FILLED:${artist.nameRomanized}:${hangul}`)
                        filled++
                    } catch (e) {
                        send(`ERROR:${artist.nameRomanized}:${String(e)}`)
                        errors++
                    }

                    if (i < artists.length - 1) {
                        await new Promise(r => setTimeout(r, 300))
                    }
                }

                send(`DONE:filled=${filled},notFound=${notFound},errors=${errors}`)
                controller.close()
            },
        })

        return new Response(stream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
    }

    // mode === 'fix-names' (padrão)
    const artists = await prisma.$queryRaw<{ id: string; nameRomanized: string; nameHangul: string | null; tmdbId: string | null }[]>`
        SELECT id, "nameRomanized", "nameHangul", "tmdbId"
        FROM "Artist"
        WHERE "nameRomanized" ~ E'[\\uAC00-\\uD7AF\\u3131-\\u314E\\u314F-\\u3163]'
        ORDER BY "trendingScore" DESC
    `

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
                    if (!artist.tmdbId) {
                        send(`NO_TMDB:${artist.nameRomanized}`)
                        noTmdb++
                        continue
                    }

                    const tmdb = await fetchTMDBPerson(artist.tmdbId)
                    if (!tmdb || !tmdb.name || KOREAN_REGEX.test(tmdb.name)) {
                        send(`NO_TMDB:${artist.nameRomanized}`)
                        noTmdb++
                        continue
                    }

                    const koreanName = artist.nameHangul || artist.nameRomanized
                    const stageNames = extractStageNames(tmdb.also_known_as, tmdb.name)

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
