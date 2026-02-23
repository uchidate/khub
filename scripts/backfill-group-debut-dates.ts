/**
 * Script de Backfill: Preencher debutDate dos grupos musicais via MusicBrainz
 *
 * Busca a data de debut (life-span.begin) do MusicBrainz para todos os grupos
 * que têm mbid mas não têm debutDate preenchida.
 *
 * Uso:
 *   npx tsx scripts/backfill-group-debut-dates.ts           # Todos os grupos sem data
 *   npx tsx scripts/backfill-group-debut-dates.ts --dry-run # Simular sem salvar
 *   npx tsx scripts/backfill-group-debut-dates.ts --all     # Re-processar todos (mesmo com data)
 */

import 'dotenv/config'
import prisma from '../lib/prisma'
import { getMusicBrainzService } from '../lib/services/musicbrainz-service'

async function main() {
    const args = process.argv.slice(2)
    const isDryRun = args.includes('--dry-run')
    const processAll = args.includes('--all')

    console.log('🎤 Backfill: Datas de debut dos grupos musicais via MusicBrainz')
    console.log(`   Mode:    ${processAll ? 'ALL groups' : 'Only groups WITHOUT debutDate'}`)
    console.log(`   Dry run: ${isDryRun}`)
    console.log('')

    const groups = await prisma.musicalGroup.findMany({
        where: {
            mbid: { not: null },
            ...(processAll ? {} : { debutDate: null }),
        },
        select: { id: true, name: true, mbid: true, debutDate: true },
        orderBy: { name: 'asc' },
    })

    console.log(`📊 Found ${groups.length} groups to process\n`)

    if (groups.length === 0) {
        console.log('✅ Nada para processar.')
        return
    }

    const mb = getMusicBrainzService()
    let updated = 0
    let skipped = 0
    let errors = 0

    for (let i = 0; i < groups.length; i++) {
        const group = groups[i]
        process.stdout.write(`[${i + 1}/${groups.length}] ${group.name}...`)

        try {
            const debutDate = await mb.getGroupDebutDate(group.mbid!)

            if (!debutDate) {
                console.log(' ⏭️  No debut date in MusicBrainz')
                skipped++
                continue
            }

            const dateStr = debutDate.toISOString().slice(0, 10)
            console.log(` → ${dateStr}`)

            if (!isDryRun) {
                await prisma.musicalGroup.update({
                    where: { id: group.id },
                    data: { debutDate },
                })
            }
            updated++
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            console.log(` ❌ Error: ${msg}`)
            errors++
        }
    }

    console.log('\n=============================')
    console.log('✅ Backfill concluído!')
    console.log(`   Updated: ${updated}`)
    console.log(`   Skipped: ${skipped} (no data in MusicBrainz)`)
    console.log(`   Errors:  ${errors}`)
    if (isDryRun) console.log('   (dry run — nada foi salvo)')
}

main()
    .catch(err => {
        console.error('Fatal:', err)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
