/**
 * Popula o campo `slug` em todos os MusicalGroup a partir do campo `name`.
 * Executa a geração de slugs com tratamento de conflitos.
 *
 * Uso: npx tsx scripts/populate-group-slugs.ts
 * Em produção: docker exec <container> npx tsx scripts/populate-group-slugs.ts
 */
import prisma from '@/lib/prisma'

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')                        // decompõe acentos
        .replace(/[̀-ͯ]/g, '')         // remove marcas de acento
        .replace(/[^\w\s-]/g, '')                // remove chars especiais (parênteses, pontos, etc)
        .replace(/[\s_]+/g, '-')                 // espaços/underscore → hífen
        .replace(/-+/g, '-')                     // múltiplos hífens → um
        .replace(/^-+|-+$/g, '')                 // remove hífens no início/fim
        || 'grupo'
}

async function main() {
    const groups = await prisma.musicalGroup.findMany({
        select: { id: true, name: true, slug: true },
        orderBy: { name: 'asc' },
    })

    console.log(`Total de grupos: ${groups.length}`)
    console.log(`Já com slug: ${groups.filter(g => g.slug).length}`)

    const usedSlugs = new Set(groups.filter(g => g.slug).map(g => g.slug!))
    let updated = 0
    let skipped = 0
    const conflicts: string[] = []

    for (const group of groups) {
        if (group.slug) { skipped++; continue }

        let baseSlug = slugify(group.name)
        let slug = baseSlug
        let suffix = 2

        // Resolve conflitos adicionando sufixo numérico
        while (usedSlugs.has(slug)) {
            slug = `${baseSlug}-${suffix++}`
        }

        if (slug !== baseSlug) {
            conflicts.push(`  CONFLITO: "${group.name}" → "${slug}" (base: "${baseSlug}")`)
        }

        usedSlugs.add(slug)
        await prisma.musicalGroup.update({ where: { id: group.id }, data: { slug } })
        updated++

        if (updated % 100 === 0) console.log(`  ${updated} atualizados...`)
    }

    console.log(`\n✓ Concluído: ${updated} slugs gerados, ${skipped} pulados`)

    if (conflicts.length > 0) {
        console.log(`\nConflitos resolvidos (${conflicts.length}):`)
        conflicts.forEach(c => console.log(c))
    }

    // Mostra amostra
    const sample = await prisma.musicalGroup.findMany({
        where: { slug: { not: null } },
        select: { name: true, slug: true },
        orderBy: { trendingScore: 'desc' },
        take: 10,
    })
    console.log('\nAmostra (top trending):')
    sample.forEach(g => console.log(`  ${g.name} → /groups/${g.slug}`))
}

main().catch(console.error).finally(() => prisma.$disconnect())
