/**
 * Popula o campo `slug` em todas as Productions a partir do campo `titlePt`.
 * Uso: npx tsx scripts/populate-production-slugs.ts
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
        || 'producao'
}

async function main() {
    const productions = await prisma.production.findMany({
        select: { id: true, titlePt: true, slug: true },
        orderBy: { titlePt: 'asc' },
    })

    console.log(`Total: ${productions.length}, já com slug: ${productions.filter(p => p.slug).length}`)

    const usedSlugs = new Set(productions.filter(p => p.slug).map(p => p.slug!))
    let updated = 0, skipped = 0

    for (const prod of productions) {
        if (prod.slug) { skipped++; continue }

        let base = slugify(prod.titlePt)
        let slug = base, suffix = 2
        while (usedSlugs.has(slug)) slug = `${base}-${suffix++}`
        usedSlugs.add(slug)

        await prisma.production.update({ where: { id: prod.id }, data: { slug } })
        updated++
        if (updated % 200 === 0) console.log(`  ${updated} atualizados...`)
    }

    console.log(`\n✓ ${updated} slugs gerados, ${skipped} pulados`)

    const sample = await prisma.production.findMany({
        where: { slug: { not: null } },
        select: { titlePt: true, slug: true },
        orderBy: { voteAverage: 'desc' },
        take: 10,
    })
    sample.forEach(p => console.log(`  ${p.titlePt} → /productions/${p.slug}`))
}

main().catch(console.error).finally(() => prisma.$disconnect())
