/**
 * Update disbanded groups and departed members based on researched data.
 * Usage: DATABASE_URL=... npx tsx scripts/update-disbands-and-departures.ts
 */
import prisma from '../lib/prisma'

// ─── Disbanded groups ────────────────────────────────────────────────────────
const DISBANDED: { name: string; date: string }[] = [
    { name: 'SISTAR',   date: '2017-06-02' },
    { name: '2NE1',     date: '2016-12-21' },
    { name: "NU'EST",   date: '2022-02-28' },
    { name: 'GFriend',  date: '2021-05-22' },
    { name: 'ASTRO',    date: '2023-12-31' },
]

// ─── Departed members ─────────────────────────────────────────────────────────
// nameRomanized variants to search, groupName, leaveDate
const DEPARTURES: { member: string[]; group: string; leaveDate: string }[] = [
    // EXO
    { member: ['Kris', 'Kris Wu'],              group: 'EXO', leaveDate: '2014-05-15' },
    { member: ['Lu Han', 'Luhan'],              group: 'EXO', leaveDate: '2014-10-10' },
    { member: ['Z.TAO', 'Tao'],                 group: 'EXO', leaveDate: '2015-09-16' },
    // Super Junior
    { member: ['Han Geng', 'Hangeng'],          group: 'Super Junior', leaveDate: '2009-12-21' },
    { member: ['Kangin'],                       group: 'Super Junior', leaveDate: '2019-07-05' },
    // MONSTA X
    { member: ['WONHO', 'Wonho'],               group: 'MONSTA X', leaveDate: '2019-10-31' },
    // iKON
    { member: ["B.I", "B.I (Kim Hanbin)"],      group: 'iKON', leaveDate: '2019-06-12' },
    // WINNER
    { member: ['Nam Taehyun'],                  group: 'WINNER', leaveDate: '2016-11-25' },
    // 2NE1 (before disbandment)
    { member: ['Minzy'],                        group: '2NE1', leaveDate: '2016-04-05' },
    // BIGBANG
    { member: ['Seungri'],                      group: 'BIGBANG', leaveDate: '2019-03-11' },
    // fromis_9
    { member: ['Jisun', 'Lee Jisun'],           group: 'fromis_9', leaveDate: '2023-04-01' },
    { member: ['Gyuri', 'Park Gyuri'],          group: 'fromis_9', leaveDate: '2023-04-01' },
    // LE SSERAFIM
    { member: ['Kim Garam', 'Garam'],           group: 'LE SSERAFIM', leaveDate: '2022-07-19' },
    // BTOB
    { member: ['Ilhoon', 'Jung Ilhoon'],        group: 'BTOB', leaveDate: '2021-01-11' },
    // (G)I-DLE
    { member: ['Soojin', 'Seo Soojin'],         group: '(G)I-DLE', leaveDate: '2021-08-14' },
    // ASTRO
    { member: ['Rocky', 'Park Minhyuk'],        group: 'ASTRO', leaveDate: '2022-11-01' },
    // VIXX
    { member: ['Ravi', 'Kim Won-shik'],         group: 'VIXX', leaveDate: '2022-09-01' },
    // WJSN
    { member: ['Cheng Xiao'],                   group: 'WJSN', leaveDate: '2021-08-01' },
    { member: ['Meiqi', 'Mei Qi'],              group: 'WJSN', leaveDate: '2021-08-01' },
    { member: ['Xuanyi', 'Wu Xuanyi'],          group: 'WJSN', leaveDate: '2021-08-01' },
    // NCT 127
    { member: ['JOHNNY', 'Johnny'],             group: 'NCT 127', leaveDate: '2024-07-01' },
    // RIIZE
    { member: ['Seunghan', 'Im Seunghan'],      group: 'RIIZE', leaveDate: '2024-03-01' },
    // TVXQ (became duo)
    { member: ['Jaejoong', 'Kim Jaejoong'],     group: 'TVXQ', leaveDate: '2010-04-01' },
    { member: ['Yoochun', 'Park Yoochun'],      group: 'TVXQ', leaveDate: '2010-04-01' },
    { member: ['Junsu', 'Kim Junsu'],           group: 'TVXQ', leaveDate: '2010-04-01' },
    // Girls' Generation
    { member: ['Jessica', 'Jessica Jung'],      group: "Girls' Generation", leaveDate: '2014-09-30' },
    // DAY6
    { member: ['Junhyeok'],                     group: 'DAY6', leaveDate: '2016-02-26' },
]

async function main() {
    console.log('🔄 Updating disbanded groups and departed members...\n')

    let groupsUpdated = 0
    let membershipsUpdated = 0

    // ── Update disbanded groups ──────────────────────────────────────────────
    console.log('📅 Disbanded groups:')
    for (const { name, date } of DISBANDED) {
        const group = await prisma.musicalGroup.findFirst({
            where: { name: { equals: name, mode: 'insensitive' } },
        })
        if (!group) { console.log(`  ⚠ Not found: ${name}`); continue }
        if (group.disbandDate) { console.log(`  ✓ ${name} already has disbandDate`); continue }

        await prisma.musicalGroup.update({
            where: { id: group.id },
            data: { disbandDate: new Date(date) },
        })
        groupsUpdated++
        console.log(`  ✓ ${name} → disbanded ${date}`)
    }

    // ── Update departed members ──────────────────────────────────────────────
    console.log('\n👤 Departed members:')
    for (const { member, group: groupName, leaveDate } of DEPARTURES) {
        const group = await prisma.musicalGroup.findFirst({
            where: { name: { equals: groupName, mode: 'insensitive' } },
        })
        if (!group) { console.log(`  ⚠ Group not found: ${groupName}`); continue }

        // Find artist by any of the name variants
        const artist = await prisma.artist.findFirst({
            where: {
                nameRomanized: { in: member, mode: 'insensitive' },
            },
        })
        if (!artist) { console.log(`  ⚠ Artist not found: ${member[0]} (${groupName})`); continue }

        const membership = await prisma.artistGroupMembership.findFirst({
            where: { artistId: artist.id, groupId: group.id },
        })
        if (!membership) { console.log(`  ⚠ No membership: ${member[0]} in ${groupName}`); continue }

        if (membership.leaveDate && !membership.isActive) {
            console.log(`  ✓ ${member[0]} already marked as departed from ${groupName}`)
            continue
        }

        await prisma.artistGroupMembership.update({
            where: { id: membership.id },
            data: { leaveDate: new Date(leaveDate), isActive: false },
        })
        membershipsUpdated++
        console.log(`  ✓ ${member[0]} → left ${groupName} on ${leaveDate}`)
    }

    console.log(`\n─────────────────────────────────`)
    console.log(`✅ Done!`)
    console.log(`   Groups disbanded: ${groupsUpdated}`)
    console.log(`   Memberships updated: ${membershipsUpdated}`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
