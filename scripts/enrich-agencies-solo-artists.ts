/**
 * Enrich agencies with solo artists.
 * Uses MusicBrainz for music artists (type:person) and hardcoded data for actors.
 *
 * Usage: DATABASE_URL=$(grep "^DATABASE_URL" .env | head -1 | cut -d= -f2- | tr -d '"') npx tsx scripts/enrich-agencies-solo-artists.ts
 */

import prisma from '../lib/prisma'

const MB = 'https://musicbrainz.org/ws/2'
const HEADERS = { 'User-Agent': 'HallyuHub/1.0 (hallyuhub.com.br)' }

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function mbGet(path: string) {
    await sleep(1100)
    const res = await fetch(`${MB}${path}`, { headers: HEADERS })
    if (!res.ok) throw new Error(`MB ${res.status}: ${path}`)
    return res.json() as Promise<any>
}

const KOREAN_REGEX = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/
const CJK_REGEX = /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/
function isNonLatin(s: string) {
    return KOREAN_REGEX.test(s) || CJK_REGEX.test(s)
}

async function searchSoloArtist(name: string): Promise<{ id: string; name: string; begin: string | null } | null> {
    try {
        const data = await mbGet(`/artist?query=${encodeURIComponent(name)}+AND+type:person&fmt=json&limit=5`)
        const artists: any[] = data.artists ?? []
        const match = artists.find(a =>
            a.name.toLowerCase() === name.toLowerCase() ||
            a['sort-name']?.toLowerCase() === name.toLowerCase()
        ) ?? artists[0]
        if (!match || match.score < 70) return null
        return {
            id: match.id,
            name: match.name,
            begin: match['life-span']?.begin ?? null,
        }
    } catch {
        return null
    }
}

async function getRomanizedAlias(mbid: string): Promise<string | null> {
    try {
        const data = await mbGet(`/artist/${mbid}?inc=aliases&fmt=json`)
        const aliases: any[] = data.aliases ?? []
        const latin = aliases.find(a => a.locale?.startsWith('en') || (!isNonLatin(a.name) && a.name))
        return latin?.name ?? null
    } catch {
        return null
    }
}

// ─── Music artists to search via MusicBrainz ────────────────────────────────
const AGENCY_MUSIC_ARTISTS: Record<string, string[]> = {
    'The Black Label': ['Zion.T', 'VINCE'],
    'LLOUD':           ['Lee Hyori'],
    'Mystic Story':    ['Wheesung', 'Yoon Jong-shin'],
    '9ato Entertainment': [],
}

// ─── Actors / talent added directly (MusicBrainz has poor K-drama coverage) ─
interface ManualArtist {
    nameRomanized: string
    nameHangul?: string
    roles: string[]
    gender?: number // 1=female, 2=male
}

const AGENCY_MANUAL_ARTISTS: Record<string, ManualArtist[]> = {
    'Management SOOP': [
        { nameRomanized: 'Hyun Bin',       nameHangul: '현빈',   roles: ['ATOR'], gender: 2 },
        { nameRomanized: 'Son Ye-jin',     nameHangul: '손예진', roles: ['ACTRIZ'], gender: 1 },
        { nameRomanized: 'Gong Yoo',       nameHangul: '공유',   roles: ['ATOR'], gender: 2 },
        { nameRomanized: 'Jung Woo-sung',  nameHangul: '정우성', roles: ['ATOR'], gender: 2 },
        { nameRomanized: 'Jang Dong-gun',  nameHangul: '장동건', roles: ['ATOR'], gender: 2 },
    ],
    'Namoo Actors': [
        { nameRomanized: 'Lee Jong-suk',   nameHangul: '이종석', roles: ['ATOR'], gender: 2 },
        { nameRomanized: 'Kim Go-eun',     nameHangul: '김고은', roles: ['ACTRIZ'], gender: 1 },
        { nameRomanized: 'Im Siwan',       nameHangul: '임시완', roles: ['ATOR', 'CANTOR'], gender: 2 },
        { nameRomanized: 'Ha Jung-woo',    nameHangul: '하정우', roles: ['ATOR'], gender: 2 },
    ],
}

async function upsertArtist(data: ManualArtist & { agencyId: string }): Promise<{ created: boolean }> {
    const existing = await prisma.artist.findFirst({
        where: {
            OR: [
                { nameRomanized: { equals: data.nameRomanized, mode: 'insensitive' } },
                ...(data.nameHangul ? [{ nameHangul: data.nameHangul }] : []),
            ],
        },
    })

    if (existing) {
        if (!existing.agencyId) {
            await prisma.artist.update({
                where: { id: existing.id },
                data: { agencyId: data.agencyId },
            })
        }
        return { created: false }
    }

    await prisma.artist.create({
        data: {
            nameRomanized: data.nameRomanized,
            nameHangul:    data.nameHangul,
            roles:         data.roles,
            gender:        data.gender,
            agencyId:      data.agencyId,
        },
    })
    return { created: true }
}

async function main() {
    console.log('🎤 Starting solo artist enrichment...\n')

    const agencies = await prisma.agency.findMany({
        select: { id: true, name: true, _count: { select: { artists: true } } },
    })
    const agencyMap = new Map(agencies.map(a => [a.name, a]))

    let artistsAdded = 0
    let artistsLinked = 0

    // ── Music artists via MusicBrainz ────────────────────────────────────────
    for (const [agencyName, artistNames] of Object.entries(AGENCY_MUSIC_ARTISTS)) {
        if (artistNames.length === 0) continue

        const agency = agencyMap.get(agencyName)
        if (!agency) {
            console.log(`⚠️  Agency not found: ${agencyName}`)
            continue
        }

        console.log(`\n🏢 ${agencyName}`)

        for (const artistName of artistNames) {
            console.log(`  🔍 Searching MusicBrainz for: ${artistName}`)
            const mb = await searchSoloArtist(artistName)

            if (!mb) {
                console.log(`  ✗  ${artistName} — not found on MusicBrainz`)
                continue
            }

            let nameRomanized = mb.name
            let nameHangul: string | undefined

            if (isNonLatin(mb.name)) {
                const romanized = await getRomanizedAlias(mb.id)
                if (!romanized) {
                    console.log(`  ⚠  ${mb.name} — no romanized alias found, skipping`)
                    continue
                }
                nameRomanized = romanized
                nameHangul = mb.name
            }

            const result = await upsertArtist({
                nameRomanized,
                nameHangul,
                roles: ['CANTOR'],
                agencyId: agency.id,
            })

            if (result.created) {
                artistsAdded++
                console.log(`  ➕ Added: ${nameRomanized}${nameHangul ? ` (${nameHangul})` : ''}`)
            } else {
                artistsLinked++
                console.log(`  🔗 Linked: ${nameRomanized}`)
            }
        }
    }

    // ── Actors / talent via hardcoded list ───────────────────────────────────
    for (const [agencyName, artistList] of Object.entries(AGENCY_MANUAL_ARTISTS)) {
        const agency = agencyMap.get(agencyName)
        if (!agency) {
            console.log(`\n⚠️  Agency not found: ${agencyName}`)
            continue
        }

        console.log(`\n🏢 ${agencyName}`)

        for (const artist of artistList) {
            const result = await upsertArtist({ ...artist, agencyId: agency.id })
            if (result.created) {
                artistsAdded++
                console.log(`  ➕ Added: ${artist.nameRomanized}${artist.nameHangul ? ` (${artist.nameHangul})` : ''}`)
            } else {
                artistsLinked++
                console.log(`  ✓  Already exists: ${artist.nameRomanized}`)
            }
        }
    }

    console.log('\n─────────────────────────────────')
    console.log(`✅ Done!`)
    console.log(`   Artists added:  ${artistsAdded}`)
    console.log(`   Artists linked: ${artistsLinked}`)

    await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
