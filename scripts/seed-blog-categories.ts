/**
 * Seed das categorias canônicas do blog.
 * Seguro para re-executar (upsert por slug).
 * Categorias legadas (analise, ranking) são mantidas se já existirem.
 *
 * Uso: npx tsx scripts/seed-blog-categories.ts
 */

import prisma from '../lib/prisma'
import { BLOG_CATEGORIES } from '../lib/config/categories'

async function main() {
    console.log(`Seeding ${BLOG_CATEGORIES.length} blog categories...`)

    for (const { name, slug } of BLOG_CATEGORIES) {
        await prisma.blogCategory.upsert({
            where:  { slug },
            create: { name, slug },
            update: { name },
        })
        console.log(`  ✓ ${name} (${slug})`)
    }

    console.log('Done.')
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
