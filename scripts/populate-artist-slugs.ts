/**
 * Popula o campo `slug` em todos os Artist a partir do campo `nameRomanized`.
 * Uso: npx tsx scripts/populate-artist-slugs.ts
 * Em produção: docker exec <container> npx tsx scripts/populate-artist-slugs.ts
 */
import prisma from '@/lib/prisma'

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        || 'artista'
}

async function main() {
    const artists = await prisma.artist.findMany({
        select: { id: true, nameRomanized: true, slug: true },
        orderBy: { nameRomanized: 'asc' },
    })

    console.log(`Total de artistas: ${artists.length}`)
    console.log(`Já com slug: ${artists.filter(a => a.slug).length}`)

    const usedSlugs = new Set(artists.filter(a => a.slug).map(a => a.slug!))
    let updated = 0, skipped = 0
    const conflicts: string[] = []

    for (const artist of artists) {
        if (artist.slug) { skipped++; continue }

        let baseSlug = slugify(artist.nameRomanized)
        let slug = baseSlug
        let suffix = 2

        while (usedSlugs.has(slug)) {
            slug = `${baseSlug}-${suffix++}`
        }

        if (slug !== baseSlug) {
            conflicts.push(`  CONFLITO: "${artist.nameRomanized}" → "${slug}"`)
        }

        usedSlugs.add(slug)
        await prisma.artist.update({ where: { id: artist.id }, data: { slug } })
        updated++

        if (updated % 500 === 0) console.log(`  ${updated} atualizados...`)
    }

    console.log(`\n✓ Concluído: ${updated} slugs gerados, ${skipped} pulados`)

    if (conflicts.length > 0) {
        console.log(`\nConflitos resolvidos (${conflicts.length}):`)
        conflicts.slice(0, 20).forEach(c => console.log(c))
        if (conflicts.length > 20) console.log(`  ... e mais ${conflicts.length - 20}`)
    }

    const sample = await prisma.artist.findMany({
        where: { slug: { not: null } },
        select: { nameRomanized: true, slug: true },
        orderBy: { trendingScore: 'desc' },
        take: 10,
    })
    console.log('\nAmostra (top trending):')
    sample.forEach(a => console.log(`  ${a.nameRomanized} → /artists/${a.slug}`))
}

main().catch(console.error).finally(() => prisma.$disconnect())
