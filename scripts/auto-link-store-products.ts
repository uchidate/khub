/**
 * Auto-link store products to artists and groups based on name/tag matching.
 *
 * Usage:
 *   npx tsx scripts/auto-link-store-products.ts
 *   npx tsx scripts/auto-link-store-products.ts --dry-run
 *   npx tsx scripts/auto-link-store-products.ts --reset   # apaga links 'auto' e recria
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const DRY_RUN = process.argv.includes('--dry-run')
const RESET   = process.argv.includes('--reset')

function normalize(s: string) {
  return s.toLowerCase()
    .replace(/[''`]/g, "'")
    .replace(/[-–]/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function main() {
  console.log(`\n🔗 Auto-link store products${DRY_RUN ? ' [DRY RUN]' : ''}${RESET ? ' [RESET]' : ''}\n`)

  if (RESET && !DRY_RUN) {
    const deleted = await prisma.storeProductLink.deleteMany({ where: { source: 'auto' } })
    console.log(`🗑  ${deleted.count} link(s) auto removido(s)\n`)
  }

  const [products, groups, artists] = await Promise.all([
    prisma.storeProduct.findMany({
      where: { isActive: true, isHidden: false },
      select: { id: true, name: true, tags: true, category: true },
    }),
    prisma.musicalGroup.findMany({
      where: { isHidden: false },
      select: { id: true, name: true, nameHangul: true },
    }),
    prisma.artist.findMany({
      where: { isHidden: false },
      select: { id: true, nameRomanized: true, nameHangul: true },
      take: 500,
    }),
  ])

  console.log(`📦 ${products.length} produtos · 🎵 ${groups.length} grupos · 👤 ${artists.length} artistas`)

  let linked = 0
  let skipped = 0

  for (const product of products) {
    const haystack = normalize(`${product.name} ${product.tags.join(' ')}`)
    const matches: Array<{ entityType: string; entityId: string; score: number }> = []

    // Match grupos
    for (const group of groups) {
      const variants = [
        normalize(group.name),
        ...(group.nameHangul ? [normalize(group.nameHangul)] : []),
      ]
      for (const v of variants) {
        if (v.length >= 3 && haystack.includes(v)) {
          // Score: grupos mais específicos (nome mais longo) têm prioridade
          matches.push({ entityType: 'group', entityId: group.id, score: Math.min(1, v.length / 12) })
          break
        }
      }
    }

    // Match artistas solo (só se não encontrou grupo — evita duplicidade)
    if (matches.length === 0) {
      for (const artist of artists) {
        const variants = [
          normalize(artist.nameRomanized),
          ...(artist.nameHangul ? [normalize(artist.nameHangul)] : []),
        ]
        for (const v of variants) {
          if (v.length >= 4 && haystack.includes(v)) {
            matches.push({ entityType: 'artist', entityId: artist.id, score: Math.min(1, v.length / 12) })
            break
          }
        }
      }
    }

    if (matches.length === 0) {
      skipped++
      continue
    }

    for (const match of matches) {
      if (DRY_RUN) {
        const label = match.entityType === 'group'
          ? groups.find(g => g.id === match.entityId)?.name
          : artists.find(a => a.id === match.entityId)?.nameRomanized
        console.log(`  [${match.entityType}] ${product.name.slice(0, 45)} → ${label} (score ${match.score.toFixed(2)})`)
        linked++
        continue
      }

      await prisma.storeProductLink.upsert({
        where: {
          productId_entityType_entityId: {
            productId: product.id,
            entityType: match.entityType,
            entityId: match.entityId,
          },
        },
        create: {
          productId: product.id,
          entityType: match.entityType,
          entityId: match.entityId,
          score: match.score,
          source: 'auto',
        },
        update: { score: match.score },
      })
      linked++
    }
  }

  console.log(`\n✅ ${linked} link(s) criado(s) · ${skipped} produto(s) sem match`)
  if (DRY_RUN) console.log('\n(dry run — nada foi salvo)')
}

main().catch(console.error).finally(() => prisma.$disconnect())
