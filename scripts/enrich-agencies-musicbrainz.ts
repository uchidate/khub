/**
 * Enrich agencies with groups and artists from MusicBrainz.
 * Rate limit: 1 req/s (unauthenticated).
 *
 * Usage: npx ts-node scripts/enrich-agencies-musicbrainz.ts
 */

import prisma from '../lib/prisma'

const MB = 'https://musicbrainz.org/ws/2'
const HEADERS = { 'User-Agent': 'HallyuHub/1.0 (hallyuhub.com.br)' }

// ─── Known K-pop groups per agency ──────────────────────────────────────────
// Key = agency name as stored in DB, value = array of group names to check/add
const AGENCY_GROUPS: Record<string, string[]> = {
    'JYP Entertainment':   ['TWICE', 'Stray Kids', 'ITZY', 'DAY6', '2PM', 'GOT7', 'NMIXX'],
    'SM Entertainment':    ['aespa', 'Red Velvet', 'EXO', 'NCT 127', 'NCT Dream', 'SHINee', 'Girls Generation', 'Super Junior', 'TVXQ', 'RIIZE', 'WayV'],
    'YG Entertainment':    ['BLACKPINK', 'BIGBANG', 'WINNER', 'iKON', 'TREASURE', 'BABYMONSTER', '2NE1'],
    'BIGHIT MUSIC':        ['BTS'],
    'Pledis Entertainment':['SEVENTEEN', "NU'EST", 'fromis_9'],
    'Source Music':        ['LE SSERAFIM', 'GFriend'],
    'BELIFT LAB':          ['ENHYPEN'],
    'ADOR':                ['NewJeans'],
    'Starship Entertainment': ['IVE', 'MONSTA X', 'CRAVITY', 'WJSN', 'SISTAR'],
    'Cube Entertainment':  ['(G)I-DLE', 'BTOB', 'Pentagon', 'CLC', 'LIGHTSUM'],
    'CUBE Entertainment':  ['(G)I-DLE', 'BTOB', 'Pentagon', 'CLC'],
    'Fantagio':            ['ASTRO', 'Weki Meki', 'VERIVERY'],
    'Jellyfish Entertainment': ['VIXX', 'GUGUDAN', 'VERIVERY'],
    'RBW Entertainment':   ['MAMAMOO', 'ONEWE', 'Purple Kiss', 'ONEWE'],
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function mbGet(path: string) {
    await sleep(1100) // respect 1 req/s
    const res = await fetch(`${MB}${path}`, { headers: HEADERS })
    if (!res.ok) throw new Error(`MB ${res.status}: ${path}`)
    return res.json() as Promise<any>
}

async function searchGroup(name: string): Promise<{ id: string; name: string; begin: string | null } | null> {
    try {
        const data = await mbGet(`/artist?query=${encodeURIComponent(name)}+AND+type:group&fmt=json&limit=5`)
        const artists: any[] = data.artists ?? []
        // Find best match: exact name, Korean area preferred
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

const KOREAN_REGEX = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/
const CJK_REGEX = /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/

function isNonLatin(s: string) {
    return KOREAN_REGEX.test(s) || CJK_REGEX.test(s)
}

async function getArtistRomanized(mbid: string): Promise<string | null> {
    try {
        const data = await mbGet(`/artist/${mbid}?inc=aliases&fmt=json`)
        const aliases: any[] = data.aliases ?? []
        // Look for Latin alias
        const latin = aliases.find(a => a.locale?.startsWith('en') || (!isNonLatin(a.name) && a.name))
        return latin?.name ?? null
    } catch {
        return null
    }
}

async function getGroupMembers(mbid: string): Promise<{ name: string; nameHangul?: string; mbid: string; begin: string | null; end: string | null }[]> {
    try {
        const data = await mbGet(`/artist/${mbid}?inc=artist-rels&fmt=json`)
        const rels: any[] = data.relations ?? []
        return rels
            .filter(r => r.type === 'member of band' && r.direction === 'backward')
            .map(r => ({
                name: r.artist.name,
                mbid: r.artist.id,
                begin: r['begin'] ?? null,
                end: r['end'] ?? null,
            }))
    } catch {
        return []
    }
}

async function main() {
    console.log('🎵 Starting agency enrichment from MusicBrainz...\n')

    const agencies = await prisma.agency.findMany({
        include: {
            musicalGroups: { select: { name: true } },
            artists: { select: { nameRomanized: true } },
        },
    })

    const agencyMap = new Map(agencies.map(a => [a.name, a]))

    let groupsAdded = 0
    let artistsAdded = 0
    let membershipsAdded = 0

    for (const [agencyName, expectedGroups] of Object.entries(AGENCY_GROUPS)) {
        const agency = agencyMap.get(agencyName)
        if (!agency) {
            console.log(`⚠️  Agency not found: ${agencyName}`)
            continue
        }

        const existingGroupNames = new Set(agency.musicalGroups.map(g => g.name.toLowerCase()))

        console.log(`\n🏢 ${agencyName} (${expectedGroups.length} expected groups)`)

        for (const groupName of expectedGroups) {
            if (existingGroupNames.has(groupName.toLowerCase())) {
                console.log(`  ✓ ${groupName} — already linked`)
                continue
            }

            // Check if group exists in DB under different agency
            const existingGroup = await prisma.musicalGroup.findFirst({
                where: { name: { equals: groupName, mode: 'insensitive' } },
                include: { members: { select: { id: true } } },
            })

            if (existingGroup) {
                // Group exists, just link to agency
                await prisma.musicalGroup.update({
                    where: { id: existingGroup.id },
                    data: { agencyId: agency.id },
                })
                console.log(`  🔗 ${groupName} — linked to ${agencyName}`)
                groupsAdded++
                continue
            }

            // Search MusicBrainz
            console.log(`  🔍 Searching MusicBrainz for: ${groupName}`)
            const mbGroup = await searchGroup(groupName)

            if (!mbGroup) {
                console.log(`  ✗  ${groupName} — not found on MusicBrainz`)
                continue
            }

            console.log(`  ➕ Adding group: ${mbGroup.name} (debut: ${mbGroup.begin ?? 'unknown'})`)

            // Upsert group (handles case where name differs slightly from search term)
            const newGroup = await prisma.musicalGroup.upsert({
                where: { name: mbGroup.name },
                create: {
                    name: mbGroup.name,
                    agencyId: agency.id,
                    debutDate: mbGroup.begin ? new Date(mbGroup.begin) : null,
                },
                update: {
                    agencyId: agency.id,
                    debutDate: mbGroup.begin ? new Date(mbGroup.begin) : null,
                },
            })
            groupsAdded++

            // Get members from MusicBrainz
            console.log(`     📋 Fetching members for ${mbGroup.name}...`)
            const members = await getGroupMembers(mbGroup.id)
            console.log(`     Found ${members.length} members on MusicBrainz`)

            for (const member of members) {
                // If name is non-Latin, fetch romanized alias from MusicBrainz
                let nameRomanized = member.name
                let nameHangul: string | undefined

                if (isNonLatin(member.name)) {
                    const romanized = await getArtistRomanized(member.mbid)
                    if (!romanized) {
                        console.log(`     ⚠ Skipping ${member.name} — no romanized name found`)
                        continue
                    }
                    nameRomanized = romanized
                    nameHangul = member.name
                }

                // Skip if already in DB (check by romanized name or hangul)
                const existingArtist = await prisma.artist.findFirst({
                    where: {
                        OR: [
                            { nameRomanized: { equals: nameRomanized, mode: 'insensitive' } },
                            ...(nameHangul ? [{ nameHangul: { equals: nameHangul } }] : []),
                        ],
                    },
                })

                let artist = existingArtist

                if (!existingArtist) {
                    artist = await prisma.artist.create({
                        data: {
                            nameRomanized,
                            nameHangul,
                            agencyId: agency.id,
                            roles: ['CANTOR'],
                        },
                    })
                    artistsAdded++
                    console.log(`     + Artist: ${nameRomanized}${nameHangul ? ` (${nameHangul})` : ''}`)
                } else if (!existingArtist.agencyId) {
                    await prisma.artist.update({
                        where: { id: existingArtist.id },
                        data: { agencyId: agency.id },
                    })
                }

                if (artist) {
                    // Create membership if it doesn't exist
                    const existingMembership = await prisma.artistGroupMembership.findFirst({
                        where: { artistId: artist.id, groupId: newGroup.id },
                    })

                    if (!existingMembership) {
                        await prisma.artistGroupMembership.create({
                            data: {
                                artistId: artist.id,
                                groupId: newGroup.id,
                                joinDate: member.begin ? new Date(member.begin) : null,
                                leaveDate: member.end ? new Date(member.end) : null,
                            },
                        })
                        membershipsAdded++
                    }
                }
            }
        }
    }

    console.log('\n─────────────────────────────────')
    console.log(`✅ Done!`)
    console.log(`   Groups added/linked: ${groupsAdded}`)
    console.log(`   Artists added: ${artistsAdded}`)
    console.log(`   Memberships created: ${membershipsAdded}`)

    await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
