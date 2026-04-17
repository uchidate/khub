/**
 * GET /api/admin/artists/tmdb-preview?tmdbId={id}
 *
 * Retorna dados da pessoa no TMDB para preview/verificação antes de salvar.
 * Usado na página de edição do artista para confirmar que o tmdbId está correto.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'

export const dynamic = 'force-dynamic'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMG = 'https://image.tmdb.org/t/p/w185'
const KOREAN_REGEX = /[\uAC00-\uD7AF\u3131-\u314E\u314F-\u3163]/

export async function GET(req: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const tmdbId = new URL(req.url).searchParams.get('tmdbId')
    if (!tmdbId || !/^\d+$/.test(tmdbId)) {
        return NextResponse.json({ error: 'tmdbId inválido — deve ser numérico' }, { status: 400 })
    }

    if (!TMDB_API_KEY) {
        return NextResponse.json({ error: 'TMDB_API_KEY não configurada' }, { status: 500 })
    }

    try {
        const [resEn, resPt] = await Promise.all([
            fetch(`${TMDB_BASE}/person/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`, { signal: AbortSignal.timeout(8000) }),
            fetch(`${TMDB_BASE}/person/${tmdbId}?api_key=${TMDB_API_KEY}&language=pt-BR`, { signal: AbortSignal.timeout(8000) }),
        ])

        if (resEn.status === 404) {
            return NextResponse.json({ error: 'Pessoa não encontrada no TMDB' }, { status: 404 })
        }
        if (!resEn.ok) {
            return NextResponse.json({ error: `Erro TMDB: ${resEn.status}` }, { status: 502 })
        }

        type PersonData = {
            id: number
            name: string
            biography: string
            birthday: string | null
            place_of_birth: string | null
            profile_path: string | null
            gender: number
            known_for_department: string
            popularity: number
            also_known_as: string[]
        }

        const data = await resEn.json() as PersonData
        const dataPt = resPt.ok ? await resPt.json() as PersonData : null

        const hangulName = data.also_known_as.find(n => KOREAN_REGEX.test(n)) ?? null
        const photoUrl = data.profile_path ? `${TMDB_IMG}${data.profile_path}` : null

        return NextResponse.json({
            tmdbId: String(data.id),
            name: data.name,
            hangulName,
            biography: data.biography || null,
            biographyPt: dataPt?.biography || null,
            biographyEn: data.biography || null,
            birthday: data.birthday || null,
            placeOfBirth: data.place_of_birth || null,
            photoUrl,
            gender: data.gender, // 0=not set, 1=female, 2=male, 3=non-binary
            knownFor: data.known_for_department || null,
            popularity: data.popularity,
            alsoKnownAs: data.also_known_as,
        })
    } catch (e) {
        return NextResponse.json({ error: `Erro ao buscar TMDB: ${String(e)}` }, { status: 500 })
    }
}
