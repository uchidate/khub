/**
 * import-social-links.ts
 *
 * Importa redes sociais para artistas a partir de um arquivo JSON gerado por
 * export-social-links.ts.
 *
 * Uso:
 *   npx tsx scripts/import-social-links.ts
 *
 * Opções via variável de ambiente:
 *   INPUT=meu-arquivo.json  → arquivo de entrada (padrão: social-links-to-fill.json)
 *   DRY_RUN=true            → mostra o que seria feito SEM gravar no banco
 *
 * Exemplo:
 *   DRY_RUN=true npx tsx scripts/import-social-links.ts
 *   INPUT=social-links-to-fill.json npx tsx scripts/import-social-links.ts
 *
 * O script:
 *   1. Lê o JSON preenchido
 *   2. Para cada artista com pelo menos 1 URL preenchida → faz upsert de socialLinks
 *   3. Skipa artistas sem nenhuma URL preenchida
 *   4. Reporta resultado: atualizados / skippados / erros
 */

import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'
import prisma from '../lib/prisma'

const PLATFORMS = ['instagram', 'twitter', 'youtube', 'tiktok', 'weverse', 'fancafe', 'naverBlog'] as const

interface ArtistEntry {
    id: string
    nameRomanized: string
    nameHangul?: string
    instagram?: string
    twitter?: string
    youtube?: string
    tiktok?: string
    weverse?: string
    fancafe?: string
    naverBlog?: string
}

async function main() {
    const inputFile = process.env.INPUT || 'social-links-to-fill.json'
    const dryRun = process.env.DRY_RUN === 'true'
    const filePath = path.resolve(process.cwd(), inputFile)

    if (!fs.existsSync(filePath)) {
        console.error(`❌ Arquivo não encontrado: ${filePath}`)
        console.error(`   Rode primeiro: npx tsx scripts/export-social-links.ts`)
        process.exit(1)
    }

    const raw = fs.readFileSync(filePath, 'utf-8')
    const entries: ArtistEntry[] = JSON.parse(raw)

    console.log(`📥 Lendo ${entries.length} artistas de "${inputFile}"...`)
    if (dryRun) console.log('🔍 DRY RUN — nenhuma alteração será gravada\n')

    let updated = 0
    let skipped = 0
    let errors = 0

    for (const entry of entries) {
        // Build socialLinks object with only non-empty values
        const links: Record<string, string> = {}
        for (const p of PLATFORMS) {
            const val = entry[p]?.trim()
            if (val) links[p] = val
        }

        if (Object.keys(links).length === 0) {
            skipped++
            continue
        }

        if (dryRun) {
            console.log(`  ✏️  ${entry.nameRomanized}:`, links)
            updated++
            continue
        }

        try {
            // Merge with existing links (preserve keys not in this file)
            const existing = await prisma.artist.findUnique({
                where: { id: entry.id },
                select: { socialLinks: true },
            })
            const existingLinks = (existing?.socialLinks as Record<string, string> | null) || {}
            const merged = { ...existingLinks, ...links }

            await prisma.artist.update({
                where: { id: entry.id },
                data: {
                    socialLinks: merged,
                    socialLinksUpdatedAt: new Date(),
                },
            })

            console.log(`  ✅ ${entry.nameRomanized} → ${Object.keys(links).join(', ')}`)
            updated++
        } catch (e) {
            console.error(`  ❌ ${entry.nameRomanized} (${entry.id}):`, e)
            errors++
        }
    }

    console.log(`\n📊 Resultado:`)
    console.log(`   ✅ Atualizados: ${updated}`)
    console.log(`   ⏭️  Skippados (sem URLs): ${skipped}`)
    if (errors) console.log(`   ❌ Erros: ${errors}`)

    if (dryRun) {
        console.log(`\n💡 Remova DRY_RUN=true para gravar no banco.`)
    }
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
