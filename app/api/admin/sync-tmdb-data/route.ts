/**
 * POST /api/admin/sync-tmdb-data
 *
 * Sincroniza dados biográficos do TMDB para artistas que já têm tmdbId
 * mas possuem campos vazios: foto, bio, data de nascimento, local de nascimento,
 * nome em Hangul e stageNames.
 *
 * Parâmetros body (opcionais):
 *   mode: 'empty_only' (padrão) | 'all'   — processar só incompletos ou todos (sobrescreve)
 *   limit: number                           — máximo de artistas por lote (padrão: 200, max: 500)
 *   offset: number                          — pular N artistas (para paginação de lotes)
 *
 * Retorna stream de texto com progresso linha a linha.
 * O stream inclui TOTAL_GLOBAL:<n> com o total de artistas elegíveis (sem offset).
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

async function fetchTMDBPerson(tmdbId: string, lang = 'en-US'): Promise<TMDBPerson | null> {
    if (!TMDB_API_KEY) return null
    try {
        const res = await fetch(
            `${TMDB_BASE}/person/${tmdbId}?api_key=${TMDB_API_KEY}&language=${lang}`,
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

    let mode: 'empty_only' | 'smart' | 'all' = 'empty_only'
    let limit = 200
    let offset = 0

    try {
        const body = await req.json()
        if (body?.mode === 'all') mode = 'all'
        else if (body?.mode === 'smart') mode = 'smart'
        if (body?.limit && typeof body.limit === 'number') {
            limit = Math.min(Math.max(body.limit, 1), 500)
        }
        if (body?.offset && typeof body.offset === 'number') {
            offset = Math.max(body.offset, 0)
        }
    } catch {
        // sem body — usa padrão
    }

    const whereClause = {
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
        // smart e all processam todos os artistas com tmdbId
    }

    // Conta o total elegível (sem offset) para a UI montar o progresso global
    const totalGlobal = await prisma.artist.count({ where: whereClause })

    // Busca artistas com tmdbId, priorizando os com mais campos vazios
    const artists = await prisma.artist.findMany({
        where: whereClause,
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
            fieldSources: true,
        },
        orderBy: { trendingScore: 'desc' },
        skip: offset,
        take: limit,
    })

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
        async start(controller) {
            const send = (line: string) => controller.enqueue(encoder.encode(line + '\n'))

            send(`TOTAL_GLOBAL:${totalGlobal}`)
            send(`TOTAL:${artists.length}`)
            let enriched = 0
            let complete = 0
            let noData = 0
            let errors = 0

            for (let i = 0; i < artists.length; i++) {
                const artist = artists[i]
                send(`PROGRESS:${i + 1}/${artists.length}:${artist.nameRomanized}`)

                try {
                    const [tmdb, tmdbPt] = await Promise.all([
                        fetchTMDBPerson(artist.tmdbId!),
                        fetchTMDBPerson(artist.tmdbId!, 'pt-BR'),
                    ])
                    if (!tmdb) {
                        send(`NO_DATA:${artist.nameRomanized}:${artist.id}`)
                        noData++
                        continue
                    }

                    const updates: Record<string, unknown> = {}
                    const updatedFields: string[] = []
                    const now = new Date().toISOString()

                    // fieldSources: carrega estado atual e respeita edições manuais
                    const sources = (artist.fieldSources as Record<string, { source: string; at?: string }> | null) ?? {}
                    const isManual = (field: string) => sources[field]?.source === 'manual'
                    // Em mode=smart: atualiza se vazio OU se não for manual
                    // Em mode=empty_only: só atualiza se vazio
                    // Em mode=all: sempre atualiza (ignora fieldSources)
                    const canUpdate = (isEmpty: boolean, field: string) => {
                        if (mode === 'all') return true
                        if (isManual(field)) return false // smart e empty_only respeitam manual
                        if (mode === 'smart') return true  // smart atualiza qualquer não-manual
                        return isEmpty                      // empty_only: só se vazio
                    }
                    const updatedSources = { ...sources }

                    // Foto
                    if (tmdb.profile_path && canUpdate(!artist.primaryImageUrl, 'primaryImageUrl')) {
                        updates.primaryImageUrl = `${TMDB_IMG}${tmdb.profile_path}`
                        updatedSources.primaryImageUrl = { source: 'tmdb', at: now }
                        updatedFields.push('foto')
                    }

                    // Bio — prioridade: pt-BR → en-US → coreano (qualquer coisa)
                    const bioPt = tmdbPt?.biography?.trim() || null
                    const bioEn = tmdb.biography?.trim() || null
                    const bioValue = bioPt || bioEn || null
                    if (bioValue && canUpdate(!artist.bio, 'bio')) {
                        updates.bio = bioValue
                        updatedSources.bio = { source: bioPt ? 'tmdb_pt' : 'tmdb_en', at: now }
                        updatedFields.push('bio')
                    }

                    // Data de nascimento
                    if (tmdb.birthday && canUpdate(!artist.birthDate, 'birthDate')) {
                        const d = new Date(tmdb.birthday)
                        if (!isNaN(d.getTime())) {
                            updates.birthDate = d
                            updatedSources.birthDate = { source: 'tmdb', at: now }
                            updatedFields.push('nascimento')
                        }
                    }

                    // Local de nascimento
                    if (tmdb.place_of_birth && canUpdate(!artist.placeOfBirth, 'placeOfBirth')) {
                        updates.placeOfBirth = tmdb.place_of_birth
                        updatedSources.placeOfBirth = { source: 'tmdb', at: now }
                        updatedFields.push('local')
                    }

                    // Nome em Hangul (só se vazio — nunca sobrescreve)
                    if (!artist.nameHangul) {
                        const hangul = extractHangul(tmdb.also_known_as)
                        if (hangul) {
                            updates.nameHangul = hangul
                            updatedSources.nameHangul = { source: 'tmdb', at: now }
                            updatedFields.push('hangul')
                        }
                    }

                    // stageNames (só se vazio)
                    if (!artist.stageNames || artist.stageNames.length === 0) {
                        const stageNames = extractStageNames(tmdb.also_known_as, tmdb.name)
                        if (stageNames.length > 0) {
                            updates.stageNames = stageNames
                            updatedSources.stageNames = { source: 'tmdb', at: now }
                            updatedFields.push('aliases')
                        }
                    }

                    // Gênero (se 0/null e TMDB tem valor)
                    if ((!artist.gender || artist.gender === 0) && tmdb.gender && tmdb.gender > 0) {
                        if (canUpdate(!artist.gender, 'gender')) {
                            updates.gender = tmdb.gender
                            updatedSources.gender = { source: 'tmdb', at: now }
                            updatedFields.push('gênero')
                        }
                    }

                    if (Object.keys(updates).length === 0) {
                        send(`COMPLETE:${artist.nameRomanized}`)
                        complete++
                        continue
                    }

                    // Persistir fieldSources atualizado + status TMDB
                    updates.fieldSources = updatedSources
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
