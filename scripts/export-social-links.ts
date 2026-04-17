/**
 * export-social-links.ts
 *
 * Exporta todos os artistas (com e sem redes sociais) para um arquivo JSON
 * pronto para preenchimento manual.
 *
 * Uso:
 *   npx ts-node -e "require('dotenv/config')" scripts/export-social-links.ts
 *   ou
 *   npx tsx scripts/export-social-links.ts
 *
 * Opções via variável de ambiente:
 *   ONLY_MISSING=true  → exporta apenas artistas SEM redes sociais
 *   OUTPUT=meu-arquivo.json  → nome do arquivo de saída
 *
 * Resultado:
 *   social-links-to-fill.json  (ou OUTPUT se definido)
 *
 * Formato do JSON gerado:
 *   [
 *     {
 *       "id": "...",
 *       "nameRomanized": "IU",
 *       "nameHangul": "아이유",
 *       "instagram": "",
 *       "twitter": "",
 *       "youtube": "",
 *       "tiktok": "",
 *       "weverse": "",
 *       "fancafe": "",
 *       "naverBlog": ""
 *     }
 *   ]
 *
 * Após preencher as URLs, rode: npx tsx scripts/import-social-links.ts
 */

import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'
import prisma from '../lib/prisma'

const PLATFORMS = ['instagram', 'twitter', 'youtube', 'tiktok', 'weverse', 'fancafe', 'naverBlog'] as const

async function main() {
    const onlyMissing = process.env.ONLY_MISSING === 'true'
    const outputFile = process.env.OUTPUT || 'social-links-to-fill.json'

    console.log('📋 Buscando artistas...')

    const artists = await prisma.artist.findMany({
        orderBy: { nameRomanized: 'asc' },
        select: {
            id: true,
            nameRomanized: true,
            nameHangul: true,
            socialLinks: true,
        },
    })

    const filtered = onlyMissing
        ? artists.filter(a => {
              const links = a.socialLinks as Record<string, string> | null
              return !links || Object.values(links).every(v => !v)
          })
        : artists

    const output = filtered.map(a => {
        const existing = (a.socialLinks as Record<string, string> | null) || {}
        return {
            id: a.id,
            nameRomanized: a.nameRomanized,
            nameHangul: a.nameHangul || '',
            ...Object.fromEntries(PLATFORMS.map(p => [p, existing[p] || ''])),
        }
    })

    const filePath = path.resolve(process.cwd(), outputFile)
    fs.writeFileSync(filePath, JSON.stringify(output, null, 2), 'utf-8')

    const withLinks = output.filter(a => PLATFORMS.some(p => a[p as keyof typeof a]))
    const withoutLinks = output.length - withLinks.length

    console.log(`\n✅ ${output.length} artistas exportados → ${outputFile}`)
    console.log(`   Com links:  ${withLinks.length}`)
    console.log(`   Sem links:  ${withoutLinks}`)
    console.log(`\n📝 Preencha as URLs no arquivo e depois rode:`)
    console.log(`   npx tsx scripts/import-social-links.ts`)
    if (process.env.OUTPUT) {
        console.log(`   INPUT=${outputFile} npx tsx scripts/import-social-links.ts`)
    }
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
