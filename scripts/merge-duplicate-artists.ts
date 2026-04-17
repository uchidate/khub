/**
 * Merge confirmed duplicate artists.
 * Usage: DATABASE_URL=... npx tsx scripts/merge-duplicate-artists.ts
 */
import prisma from '../lib/prisma'

async function safeDelete(id: string, label: string) {
    await prisma.artistGroupMembership.deleteMany({ where: { artistId: id } })
    await prisma.$executeRaw`DELETE FROM "ArtistProduction" WHERE "artistId" = ${id}`
    await prisma.$executeRaw`DELETE FROM "Favorite" WHERE "artistId" = ${id}`
    await prisma.$executeRaw`DELETE FROM "InstagramPost" WHERE "artistId" = ${id}`
    await prisma.$executeRaw`DELETE FROM "BlogPostArtist" WHERE "artistId" = ${id}`
    await prisma.$executeRaw`DELETE FROM "NewsArtist" WHERE "artistId" = ${id}`
    await prisma.$executeRaw`DELETE FROM "Album" WHERE "artistId" = ${id}`
    await prisma.$executeRaw`DELETE FROM "kpopping_membership_suggestions" WHERE "artistId" = ${id}`
    await prisma.$executeRaw`DELETE FROM "streaming_trend_signal" WHERE "artistId" = ${id}`
    await prisma.artist.delete({ where: { id } })
    console.log(`✓ Deleted: ${label} (${id})`)
}

async function main() {
    // ── NI-KI: keep 339a... (ENHYPEN + agency), delete cmm16o3fg... (no group) ──
    await safeDelete('cmm16o3fg006k01ntq0t58x5l', 'NI-KI duplicate (no group)')

    // ── Yoona: keep older cml8xavz3... (feb/05), delete cmly8i39k... (feb/22) ──
    const ggGroup = await prisma.musicalGroup.findFirst({ where: { name: { contains: 'Generation', mode: 'insensitive' } } })
    if (ggGroup) {
        const olderMem = await prisma.artistGroupMembership.findFirst({
            where: { artistId: 'cml8xavz30001gaj4k2zy1577', groupId: ggGroup.id }
        })
        if (!olderMem) {
            await prisma.artistGroupMembership.create({ data: { artistId: 'cml8xavz30001gaj4k2zy1577', groupId: ggGroup.id } })
        }
    }
    await safeDelete('cmly8i39k000j01puk33kpeyp', 'Yoona duplicate (feb/22)')

    // ── Bona: delete recent cmn7vu8cf... (wrong Chakra group), keep cmly93f6z... ──
    await safeDelete('cmn7vu8cf02ii01mqanscjc4m', 'Bona duplicate (wrong Chakra group)')

    // ── Stella: keep cmm167od5... (Hearts2Hearts + image), delete other two ──
    await safeDelete('cmlzzkr1t00ie01o0rjwje9cj', 'Stella duplicate 1 (no group)')
    await safeDelete('cmm2m6hiz000801naddweirrk', 'Stella duplicate 2 (MusicBrainz artifact)')

    // ── Ruka: keep cmm2lzmwj... (BABYMONSTER + YG), delete cmm2lgaim... ──
    await safeDelete('cmm2lgaim00bh01mgey5mjb5d', 'Ruka duplicate (no group)')

    // ── Link Bona to WJSN ──────────────────────────────────────────────────
    const wjsn = await prisma.musicalGroup.findFirst({ where: { name: { in: ['WJSN', '우주소녀'], mode: 'insensitive' } } })
    if (wjsn) {
        const mem = await prisma.artistGroupMembership.findFirst({
            where: { artistId: 'cmly93f6z00em01pu7phuasjm', groupId: wjsn.id }
        })
        if (!mem) {
            await prisma.artistGroupMembership.create({ data: { artistId: 'cmly93f6z00em01pu7phuasjm', groupId: wjsn.id } })
            console.log('✓ Bona linked to WJSN')
        }
    } else {
        console.log('⚠ WJSN not found in DB')
    }

    console.log('\n✅ Done!')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
