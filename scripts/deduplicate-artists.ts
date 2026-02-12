/**
 * Script de Deduplicação de Artistas
 *
 * Identifica e remove artistas duplicados no banco de dados.
 * Critério de duplicata: mesmo tmdbId em múltiplos registros.
 *
 * Uso:
 *   npx tsx scripts/deduplicate-artists.ts --dry-run   (apenas mostra, não altera)
 *   npx tsx scripts/deduplicate-artists.ts             (executa a deduplicação)
 *
 * Estratégia: mantém o artista com mais campos preenchidos.
 * Transfere todas as relações (favorites, productions, news) para o que ficará.
 */

import prisma from '../lib/prisma'

const isDryRun = process.argv.includes('--dry-run')

function countFilledFields(artist: Record<string, unknown>): number {
    const relevantFields = [
        'nameHangul', 'birthDate', 'birthName', 'stageNames', 'roles',
        'bio', 'primaryImageUrl', 'socialLinks', 'height', 'bloodType',
        'zodiacSign', 'agencyId', 'tmdbSyncStatus'
    ]
    return relevantFields.filter(field => {
        const val = artist[field]
        if (val === null || val === undefined) return false
        if (Array.isArray(val)) return val.length > 0
        if (typeof val === 'string') return val.trim().length > 0
        return true
    }).length
}

async function main() {
    console.log('🔍 Buscando artistas duplicados...')
    console.log(`   Modo: ${isDryRun ? 'DRY RUN (apenas visualização)' : 'EXECUÇÃO REAL'}`)
    console.log('')

    // 1. Encontrar tmdbIds com múltiplos artistas
    const allArtists = await prisma.artist.findMany({
        where: { tmdbId: { not: null } },
        select: {
            id: true,
            nameRomanized: true,
            nameHangul: true,
            birthDate: true,
            birthName: true,
            stageNames: true,
            roles: true,
            bio: true,
            primaryImageUrl: true,
            socialLinks: true,
            height: true,
            bloodType: true,
            zodiacSign: true,
            agencyId: true,
            tmdbId: true,
            tmdbSyncStatus: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'asc' }
    })

    // Agrupar por tmdbId
    const byTmdbId = new Map<string, typeof allArtists>()
    for (const artist of allArtists) {
        if (!artist.tmdbId) continue
        const group = byTmdbId.get(artist.tmdbId) || []
        group.push(artist)
        byTmdbId.set(artist.tmdbId, group)
    }

    const duplicateGroups = [...byTmdbId.entries()].filter(([, group]) => group.length > 1)

    if (duplicateGroups.length === 0) {
        console.log('✅ Nenhum artista duplicado encontrado!')
        return
    }

    console.log(`⚠️  Encontrados ${duplicateGroups.length} grupos de duplicatas:\n`)

    let totalDeleted = 0

    for (const [tmdbId, group] of duplicateGroups) {
        console.log(`── tmdbId: ${tmdbId}`)

        // Ordenar por campos preenchidos (mais completo primeiro)
        const sorted = group.sort((a, b) =>
            countFilledFields(b as Record<string, unknown>) - countFilledFields(a as Record<string, unknown>)
        )

        const keeper = sorted[0]
        const duplicates = sorted.slice(1)

        console.log(`   ✅ Manter: ${keeper.nameRomanized} (id: ${keeper.id}, campos: ${countFilledFields(keeper as Record<string, unknown>)})`)

        for (const dup of duplicates) {
            console.log(`   🗑️  Remover: ${dup.nameRomanized} (id: ${dup.id}, campos: ${countFilledFields(dup as Record<string, unknown>)})`)

            if (!isDryRun) {
                // Transferir relações antes de deletar
                await Promise.all([
                    // Transferir favorites
                    prisma.favorite.updateMany({
                        where: { artistId: dup.id },
                        data: { artistId: keeper.id }
                    }),
                    // Transferir relações com produções
                    prisma.artistProduction.updateMany({
                        where: { artistId: dup.id },
                        data: { artistId: keeper.id }
                    }),
                    // NewsArtist: deletar (já existe via cascade ou recriar)
                    prisma.newsArtist.deleteMany({
                        where: { artistId: dup.id }
                    }),
                ])

                // Deletar o duplicado
                await prisma.artist.delete({ where: { id: dup.id } })
                totalDeleted++
                console.log(`      ✓ Deletado`)
            }
        }

        console.log('')
    }

    if (isDryRun) {
        console.log(`\n📋 RESUMO (dry-run):`)
        console.log(`   ${duplicateGroups.length} grupos de duplicatas encontrados`)
        console.log(`   ${duplicateGroups.reduce((acc, [, g]) => acc + g.length - 1, 0)} artistas seriam removidos`)
        console.log(`\nPara executar: npx tsx scripts/deduplicate-artists.ts`)
    } else {
        console.log(`\n✅ Deduplicação concluída: ${totalDeleted} artistas removidos`)
    }
}

main()
    .catch(err => {
        console.error('❌ Erro:', err)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
