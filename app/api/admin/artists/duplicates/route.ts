import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function normalize(s: string): string {
    return s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove combining diacritical marks (e.g. é→e, ó→o)
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
}

function nameContainsOther(a: string, b: string): boolean {
    const na = normalize(a)
    const nb = normalize(b)
    if (na === nb) return true
    // Check if shorter is a whole-word match inside longer
    const [shorter, longer] = na.length <= nb.length ? [na, nb] : [nb, na]
    const regex = new RegExp(`(^|\\s)${shorter}(\\s|$)`)
    return regex.test(longer)
}

interface ArtistRow {
    id: string
    nameRomanized: string
    nameHangul: string | null
    birthName: string | null
    birthDate: Date | null
    height: string | null
    bloodType: string | null
    bio: string | null
    primaryImageUrl: string | null
    stageNames: string[]
    mbid: string | null
    tmdbId: string | null
    agency: { id: string; name: string } | null
    agencyId: string | null
    _count: { productions: number; albums: number }
    musicalGroupName: string | null
}

export async function GET() {
    const { error } = await requireAdmin()
    if (error) return error

    const raw = await prisma.artist.findMany({
        select: {
            id: true,
            nameRomanized: true,
            nameHangul: true,
            birthName: true,
            birthDate: true,
            height: true,
            bloodType: true,
            bio: true,
            primaryImageUrl: true,
            stageNames: true,
            mbid: true,
            tmdbId: true,
            agencyId: true,
            agency: { select: { id: true, name: true } },
            _count: { select: { productions: true, albums: true } },
            memberships: {
                where: { isActive: true },
                include: { group: { select: { name: true } } },
                take: 1,
            },
        },
    })

    const artists: ArtistRow[] = raw.map(a => ({
        id: a.id,
        nameRomanized: a.nameRomanized,
        nameHangul: a.nameHangul,
        birthName: a.birthName,
        birthDate: a.birthDate,
        height: a.height,
        bloodType: a.bloodType,
        bio: a.bio,
        primaryImageUrl: a.primaryImageUrl,
        stageNames: a.stageNames,
        mbid: a.mbid,
        tmdbId: a.tmdbId,
        agencyId: a.agencyId,
        agency: a.agency,
        _count: a._count,
        musicalGroupName: a.memberships[0]?.group.name ?? null,
    }))

    type Confidence = 'high' | 'medium'
    type Pair = {
        id: string
        a: ArtistRow
        b: ArtistRow
        reason: string
        confidence: Confidence
    }

    const pairs: Pair[] = []
    const seen = new Set<string>()

    const addPair = (a: ArtistRow, b: ArtistRow, reason: string, confidence: Confidence) => {
        const key = [a.id, b.id].sort().join(':')
        if (seen.has(key)) return
        seen.add(key)
        pairs.push({ id: key, a, b, reason, confidence })
    }

    // Index by tmdbId and mbid for fast lookup
    const byTmdb = new Map<string, ArtistRow[]>()
    const byMbid = new Map<string, ArtistRow[]>()
    const byHangul = new Map<string, ArtistRow[]>()

    for (const artist of artists) {
        if (artist.tmdbId) {
            const list = byTmdb.get(artist.tmdbId) ?? []
            list.push(artist)
            byTmdb.set(artist.tmdbId, list)
        }
        if (artist.mbid) {
            const list = byMbid.get(artist.mbid) ?? []
            list.push(artist)
            byMbid.set(artist.mbid, list)
        }
        if (artist.nameHangul) {
            const list = byHangul.get(artist.nameHangul) ?? []
            list.push(artist)
            byHangul.set(artist.nameHangul, list)
        }
    }

    const compareGroup = (groups: Map<string, ArtistRow[]>, reason: string) => {
        Array.from(groups.values()).forEach(group => {
            for (let i = 0; i < group.length; i++) {
                for (let j = i + 1; j < group.length; j++) {
                    addPair(group[i], group[j], reason, 'high')
                }
            }
        })
    }

    compareGroup(byTmdb, 'Mesmo ID TMDB')
    compareGroup(byMbid, 'Mesmo MusicBrainz ID')
    compareGroup(byHangul, 'Mesmo nome hangul')

    // name similarity (O(n²) but artists count is manageable, cap at 500)
    const sample = artists.slice(0, 500)
    for (let i = 0; i < sample.length; i++) {
        for (let j = i + 1; j < sample.length; j++) {
            const a = sample[i]
            const b = sample[j]
            const key = [a.id, b.id].sort().join(':')
            if (seen.has(key)) continue
            if (nameContainsOther(a.nameRomanized, b.nameRomanized)) {
                addPair(a, b, 'Nomes similares', 'medium')
            }
        }
    }

    // Sort: high confidence first, then by name
    pairs.sort((a, b) => {
        if (a.confidence !== b.confidence) return a.confidence === 'high' ? -1 : 1
        return a.a.nameRomanized.localeCompare(b.a.nameRomanized)
    })

    return NextResponse.json({ pairs, total: pairs.length })
}
