/**
 * Busca artistas, grupos e produções no banco pelo nome.
 *
 * Uso (local):
 *   npx tsx scripts/search.ts "Gong Yoo"
 *
 * Dentro do container Docker:
 *   npx tsx scripts/search.ts "Gong Yoo"
 *
 * Retorna os IDs e nomes dos resultados encontrados.
 */

import prisma from '../lib/prisma'

async function main() {
    const q = process.argv[2]?.trim()
    if (!q || q.length < 2) {
        console.error('Uso: npx tsx scripts/search.ts "termo de busca"')
        process.exit(1)
    }

    const [artists, groups, productions] = await Promise.all([
        prisma.artist.findMany({
            where: {
                OR: [
                    { nameRomanized: { contains: q, mode: 'insensitive' } },
                    { nameHangul: { contains: q, mode: 'insensitive' } },
                    { stageNames: { has: q } },
                ],
            },
            select: { id: true, nameRomanized: true, nameHangul: true },
            take: 5,
            orderBy: { isHidden: 'asc' },
        }),
        prisma.musicalGroup.findMany({
            where: {
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { nameHangul: { contains: q, mode: 'insensitive' } },
                ],
            },
            select: { id: true, name: true, nameHangul: true },
            take: 5,
            orderBy: { isHidden: 'asc' },
        }),
        prisma.production.findMany({
            where: {
                OR: [
                    { titlePt: { contains: q, mode: 'insensitive' } },
                    { titleKr: { contains: q, mode: 'insensitive' } },
                ],
            },
            select: { id: true, titlePt: true, titleKr: true, type: true, year: true },
            take: 5,
            orderBy: { isHidden: 'asc' },
        }),
    ])

    if (artists.length) {
        console.log('\n🎭 Artistas:')
        artists.forEach(a => console.log(`  ${a.id}  ${a.nameRomanized}${a.nameHangul ? ` (${a.nameHangul})` : ''}`))
    }

    if (groups.length) {
        console.log('\n👥 Grupos:')
        groups.forEach(g => console.log(`  ${g.id}  ${g.name}${g.nameHangul ? ` (${g.nameHangul})` : ''}`))
    }

    if (productions.length) {
        console.log('\n🎬 Produções:')
        productions.forEach(p => console.log(`  ${p.id}  ${p.titlePt}${p.titleKr ? ` / ${p.titleKr}` : ''} [${p.type}, ${p.year}]`))
    }

    if (!artists.length && !groups.length && !productions.length) {
        console.log(`Nenhum resultado para "${q}"`)
    }

    console.log()
}

main().catch(console.error).finally(() => prisma.$disconnect())
