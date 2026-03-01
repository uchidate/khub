/**
 * POST /api/admin/sync-tmdb-data
 *
 * Sincroniza dados biográficos do TMDB para artistas que já têm tmdbId
 * mas possuem campos vazios: foto, bio, data de nascimento, local de nascimento,
 * nome em Hangul e stageNames.
 *
 * Parâmetros body (opcionais):
 *   mode: 'empty_only' (padrão) | 'all'   — processar só incompletos ou todos (sobrescreve)
 *   limit: number                           — máximo de artistas (padrão: 200, max: 500)
 *
 * Retorna stream de texto com progresso linha a linha.
 */

import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500'
const KOREAN_REGEX = /[\uAC00-\uD7AF\u3131-\u314E\u314F-\u3163]/
const CJK_REGEX = /[\uAC00-\uD7AF\u3131-\u314E\u4E00-\u9FFF\u3040-\u30FF]/

interface TMDBPerson {
    name: string
    biography: string
    birthday: string | null
    place_of_birth: string | null
    profile_path: string | null
    gender: number // 0=not set, 1=female, 2=male, 3=non-binary
    also_known_as: string[]
}

async function fetchTMDBPerson(tmdbId: string): Promise<TMDBPerson | null> {
    if (!TMDB_API_KEY) return null
    try {
        const res = await fetch(
            `${TMDB_BASE}/person/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`,
            { signal: AbortSignal.timeout(8000) }
        )
        if (!res.ok) return null
        return await res.json() as TMDBPerson
    } catch {
        return null
    }
}

function extractHangul(alsoKnownAs: string[]): string | null {
    return alsoKnownAs.find(n => KOREAN_REGEX.test(n)) ?? null
}

function extractStageNames(alsoKnownAs: string[], canonicalName: string): string[] {
    return alsoKnownAs
        .filter(n => !CJK_REGEX.test(n) && n !== canonicalName)
        .map(n => n.trim())
        .filter(n => n.length >= 2 && n.length <= 50)
        .slice(0, 5)
}

export async function POST(req: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    let mode: 'empty_only' | 'all' = 'empty_only'
    let limit = 200

    try {
        const body = await req.json()
        if (body?.mode === 'all') mode = 'all'
        if (body?.limit && typeof body.limit === 'number') {
            limit = Math.min(Math.max(body.limit, 1), 500)
        }
    } catch {
        // sem body — usa padrão
    }

    // Busca artistas com tmdbId, priorizando os com mais campos vazios
    const artists = await prisma.artist.findMany({
        where: {
            tmdbId: { not: null },
            flaggedAsNonKorean: false,
            ...(mode === 'empty_only'
                ? {
                    OR: [
                        { primaryImageUrl: null },
                        { bio: null },
                        { birthDate: null },
                        { placeOfBirth: null },
                        { nameHangul: null },
                    ],
                }
                : {}),
        },
        select: {
            id: true,
            nameRomanized: true,
            nameHangul: true,
            tmdbId: true,
            primaryImageUrl: true,
            bio: true,
            birthDate: true,
            placeOfBirth: true,
            gender: true,
            stageNames: true,
        },
        orderBy: { trendingScore: 'desc' },
        take: limit,
    })

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
        async start(controller) {
            const send = (line: string) => controller.enqueue(encoder.encode(line + '\n'))

            send(`TOTAL:${artists.length}`)
            let enriched = 0
            let complete = 0
            let noData = 0
            let errors = 0

            for (let i = 0; i < artists.length; i++) {
                const artist = artists[i]
                send(`PROGRESS:${i + 1}/${artists.length}:${artist.nameRomanized}`)

                try {
                    const tmdb = await fetchTMDBPerson(artist.tmdbId!)
                    if (!tmdb) {
                        send(`NO_DATA:${artist.nameRomanized}:${artist.id}`)
                        noData++
                        continue
                    }

                    const updates: Record<string, unknown> = {}
                    const updatedFields: string[] = []

                    // Foto
                    if (tmdb.profile_path && (mode === 'all' || !artist.primaryImageUrl)) {
                        updates.primaryImageUrl = `${TMDB_IMG}${tmdb.profile_path}`
                        updatedFields.push('foto')
                    }

                    // Bio — em mode=all sempre sobrescreve; em empty_only só se vazia
                    if (tmdb.biography && (mode === 'all' || !artist.bio)) {
                        updates.bio = tmdb.biography
                        updatedFields.push('bio')
                    }

                    // Data de nascimento
                    if (tmdb.birthday && (mode === 'all' || !artist.birthDate)) {
                        const d = new Date(tmdb.birthday)
                        if (!isNaN(d.getTime())) {
                            updates.birthDate = d
                            updatedFields.push('nascimento')
                        }
                    }

                    // Local de nascimento
                    if (tmdb.place_of_birth && (mode === 'all' || !artist.placeOfBirth)) {
                        updates.placeOfBirth = tmdb.place_of_birth
                        updatedFields.push('local')
                    }

                    // Nome em Hangul (se vazio)
                    if (!artist.nameHangul) {
                        const hangul = extractHangul(tmdb.also_known_as)
                        if (hangul) {
                            updates.nameHangul = hangul
                            updatedFields.push('hangul')
                        }
                    }

                    // stageNames (se vazio)
                    if (!artist.stageNames || artist.stageNames.length === 0) {
                        const stageNames = extractStageNames(tmdb.also_known_as, tmdb.name)
                        if (stageNames.length > 0) {
                            updates.stageNames = stageNames
                            updatedFields.push('aliases')
                        }
                    }

                    // Gênero (se 0/null e TMDB tem valor)
                    if ((!artist.gender || artist.gender === 0) && tmdb.gender && tmdb.gender > 0) {
                        updates.gender = tmdb.gender
                        updatedFields.push('gênero')
                    }

                    if (Object.keys(updates).length === 0) {
                        send(`COMPLETE:${artist.nameRomanized}`)
                        complete++
                        continue
                    }

                    // Marcar como sincronizado
                    updates.tmdbSyncStatus = 'SYNCED'
                    updates.tmdbLastSync = new Date()

                    await prisma.artist.update({
                        where: { id: artist.id },
                        data: updates,
                    })

                    send(`ENRICHED:${artist.nameRomanized}:${updatedFields.join(',')}`)
                    enriched++
                } catch (e) {
                    send(`ERROR:${artist.nameRomanized}:${String(e)}`)
                    errors++
                }

                if (i < artists.length - 1) {
                    await new Promise(r => setTimeout(r, 250))
                }
            }

            send(`DONE:enriched=${enriched},complete=${complete},noData=${noData},errors=${errors}`)
            controller.close()
        },
    })

    return new Response(stream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
}
