/**
 * Add missing K-pop groups with members via MusicBrainz.
 * Usage: DATABASE_URL=... npx tsx scripts/add-missing-groups-mb.ts
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

const KOREAN = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/
const CJK = /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/
const isNonLatin = (s: string) => KOREAN.test(s) || CJK.test(s)

async function getRomanized(mbid: string): Promise<string | null> {
    const data = await mbGet(`/artist/${mbid}?inc=aliases&fmt=json`)
    const aliases: any[] = data.aliases ?? []
    const latin = aliases.find(a => a.locale?.startsWith('en') || (!isNonLatin(a.name) && a.name))
    return latin?.name ?? null
}

async function getMembers(mbid: string) {
    const data = await mbGet(`/artist/${mbid}?inc=artist-rels&fmt=json`)
    return (data.relations ?? [])
        .filter((r: any) => r.type === 'member of band' && r.direction === 'backward')
        .map((r: any) => ({ name: r.artist.name, mbid: r.artist.id, begin: r.begin ?? null, end: r.end ?? null }))
}

async function searchGroup(name: string) {
    const data = await mbGet(`/artist?query=${encodeURIComponent(name)}+AND+type:group&fmt=json&limit=5`)
    const artists: any[] = data.artists ?? []
    const match = artists.find(a => a.name.toLowerCase() === name.toLowerCase()) ?? artists[0]
    if (!match || match.score < 60) return null
    return { id: match.id, name: match.name, begin: match['life-span']?.begin ?? null }
}

async function processGroup(canonical: string, searchName: string, agencyId: string) {
    console.log(`\n🔍 ${canonical}`)

    // Check if group already exists (by exact name OR case-insensitive)
    const existing = await prisma.musicalGroup.findFirst({
        where: { name: { equals: canonical, mode: 'insensitive' } },
        include: { _count: { select: { members: true } } }
    })
    if (existing) {
        console.log(`  ✓ Already exists: ${existing.name} (${existing._count.members} members) — skipping`)
        return
    }

    const mb = await searchGroup(searchName)
    if (!mb) { console.log('  ✗ Not found on MusicBrainz'); return }
    console.log(`  ✓ Found: ${mb.name} (debut: ${mb.begin ?? 'unknown'})`)

    const group = await prisma.musicalGroup.create({
        data: { name: canonical, agencyId, debutDate: mb.begin ? new Date(mb.begin) : null },
    })

    const members = await getMembers(mb.id)
    console.log(`  📋 ${members.length} members found`)

    let added = 0, skipped = 0
    for (const member of members) {
        let nameRomanized = member.name
        let nameHangul: string | undefined
        if (isNonLatin(member.name)) {
            const rom = await getRomanized(member.mbid)
            if (!rom) { skipped++; console.log(`    ⚠ ${member.name} — no romanized`); continue }
            nameRomanized = rom; nameHangul = member.name
        }

        let artist = await prisma.artist.findFirst({
            where: { OR: [{ nameRomanized: { equals: nameRomanized, mode: 'insensitive' } }, ...(nameHangul ? [{ nameHangul }] : [])] }
        })
        if (!artist) {
            artist = await prisma.artist.create({ data: { nameRomanized, nameHangul, agencyId, roles: ['CANTOR'] } })
            added++
            console.log(`    + ${nameRomanized}`)
        } else {
            console.log(`    ✓ ${nameRomanized} (exists)`)
        }

        const existingMem = await prisma.artistGroupMembership.findFirst({ where: { artistId: artist.id, groupId: group.id } })
        if (!existingMem) {
            await prisma.artistGroupMembership.create({
                data: {
                    artistId: artist.id,
                    groupId: group.id,
                    joinDate: member.begin ? new Date(member.begin) : null,
                    leaveDate: member.end ? new Date(member.end) : null,
                    isActive: !member.end,
                }
            })
        }
    }
    console.log(`  → ${added} artists added, ${skipped} skipped`)
}

async function main() {
    const agencies = await prisma.agency.findMany({ select: { id: true, name: true } })
    const ag = (name: string) => agencies.find(a => a.name.toLowerCase() === name.toLowerCase())?.id

    const YG       = ag('YG Entertainment')!
    const SM       = ag('SM Entertainment')!
    const CUBE     = ag('Cube Entertainment') ?? ag('CUBE Entertainment')!
    const PLEDIS   = ag('Pledis Entertainment')!
    const SOURCE   = ag('Source Music')!
    const JYP      = ag('JYP Entertainment')!
    const RBW      = ag('RBW Entertainment')!
    const JELLYFISH = ag('Jellyfish Entertainment')!

    console.log('Agencies:', { YG: !!YG, SM: !!SM, CUBE: !!CUBE, PLEDIS: !!PLEDIS, SOURCE: !!SOURCE, JYP: !!JYP, RBW: !!RBW, JELLYFISH: !!JELLYFISH })

    const GROUPS: [string, string, string][] = [
        ['2NE1',       '2NE1',       YG],
        ['BIGBANG',    'BIGBANG',    YG],
        ['WINNER',     'WINNER',     YG],
        ['iKON',       'iKON',       YG],
        ['BTOB',       'BTOB',       CUBE],
        ['(G)I-DLE',   '(G)I-DLE',   CUBE],
        ["NU'EST",     "NU'EST",     PLEDIS],
        ['fromis_9',   'fromis_9',   PLEDIS],
        ['GFriend',    'GFriend',    SOURCE],
        ['TVXQ',       'TVXQ',       SM],
        ['RIIZE',      'RIIZE',      SM],
        ['Red Velvet', 'Red Velvet', SM],
        ['DAY6',       'DAY6',       JYP],
        ['GOT7',       'GOT7',       JYP],
        ['2PM',        '2PM',        JYP],
        ['MAMAMOO',    'MAMAMOO',    RBW],
        ['VIXX',       'VIXX',       JELLYFISH],
    ]

    for (const [canonical, search, agencyId] of GROUPS) {
        if (!agencyId) { console.log(`\n⚠ No agency for ${canonical}`); continue }
        await processGroup(canonical, search, agencyId)
    }

    console.log('\n✅ All done!')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
