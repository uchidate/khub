/**
 * Script: Gera sugestões de vínculos artista-grupo a partir da base kpopping
 *
 * Uso:
 *   npx tsx scripts/kpopping-generate-suggestions.ts          # Processa todos
 *   npx tsx scripts/kpopping-generate-suggestions.ts --dry-run # Simula sem salvar
 *   npx tsx scripts/kpopping-generate-suggestions.ts --limit=100 # Limita N IdolInGroup
 *
 * Lógica:
 *   1. Lê todos os IdolInGroup do banco kpopping
 *   2. Para cada vínculo, tenta encontrar Artist e MusicalGroup no banco principal
 *   3. Cria/atualiza KpoppingMembershipSuggestion com os dados e score de match
 *   4. Não sobrescreve sugestões já revisadas (APPROVED / REJECTED)
 */

import 'dotenv/config'
import { PrismaClient as KpoppingClient } from '../node_modules/.prisma/kpopping-client'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// ============================================================================
// Config
// ============================================================================
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const limitArg = args.find(a => a.startsWith('--limit='))?.split('=')[1]
const LIMIT = limitArg ? parseInt(limitArg, 10) : undefined

// ============================================================================
// Clientes de banco
// ============================================================================
function createKpoppingClient() {
  const url = process.env.KPOPPING_DATABASE_URL
  if (!url) throw new Error('KPOPPING_DATABASE_URL não configurado')
  const adapter = new PrismaPg({ connectionString: url })
  return new KpoppingClient({ adapter })
}

function createMainClient() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL não configurado')
  const adapter = new PrismaPg({ connectionString: url })
  return new PrismaClient({ adapter })
}

// ============================================================================
// Algoritmo de matching por nome
// ============================================================================
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[-_\s.]/g, '')
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
}

interface MatchResult {
  score: number
  reason: string
}

function matchName(
  kpoppingName: string | null | undefined,
  kpoppingHangul: string | null | undefined,
  dbRomanized: string,
  dbHangul: string | null | undefined
): MatchResult | null {
  if (!kpoppingName) return null

  // 1. Hangul exato
  if (kpoppingHangul && dbHangul && kpoppingHangul.trim() === dbHangul.trim()) {
    return { score: 1.0, reason: 'exact_hangul' }
  }

  // 2. Nome romanizado exato
  if (kpoppingName.trim() === dbRomanized.trim()) {
    return { score: 1.0, reason: 'exact_romanized' }
  }

  // 3. Case-insensitive
  if (kpoppingName.toLowerCase().trim() === dbRomanized.toLowerCase().trim()) {
    return { score: 0.95, reason: 'icase_romanized' }
  }

  // 4. Normalizado (sem espaços, hífens, acentos)
  if (normalizeName(kpoppingName) === normalizeName(dbRomanized)) {
    return { score: 0.85, reason: 'normalized_romanized' }
  }

  // 5. Hangul case-insensitive
  if (kpoppingHangul && dbHangul &&
    kpoppingHangul.toLowerCase().trim() === dbHangul.toLowerCase().trim()) {
    return { score: 0.9, reason: 'icase_hangul' }
  }

  return null
}

// ============================================================================
// Main
// ============================================================================
async function main() {
  console.log(`🔍 Iniciando geração de sugestões kpopping${isDryRun ? ' [DRY RUN]' : ''}`)
  if (LIMIT) console.log(`   Limite: ${LIMIT} vínculos`)

  const kpopping = createKpoppingClient()
  const prisma = createMainClient()

  // Busca todos os vínculos IdolInGroup no kpopping
  const idolInGroups = await kpopping.idolInGroup.findMany({
    take: LIMIT,
    include: {
      idol: true,
      group: true,
    },
    orderBy: [
      { groupId: 'asc' },
      { idolId: 'asc' },
    ],
  })

  console.log(`\n📦 Vínculos encontrados no kpopping: ${idolInGroups.length}`)

  // Busca todos os Artist e MusicalGroup do banco principal para matching em memória
  console.log('📚 Carregando artistas e grupos do banco principal...')
  const [artists, groups] = await Promise.all([
    prisma.artist.findMany({
      select: { id: true, nameRomanized: true, nameHangul: true },
    }),
    prisma.musicalGroup.findMany({
      select: { id: true, name: true, nameHangul: true },
    }),
  ])
  console.log(`   ${artists.length} artistas | ${groups.length} grupos`)

  const stats = { processed: 0, created: 0, updated: 0, skipped: 0, errors: 0 }

  for (const link of idolInGroups) {
    try {
      const { idol, group } = link

      // Tenta encontrar artista correspondente
      let artistMatch: MatchResult | null = null
      let matchedArtist: (typeof artists)[0] | null = null

      for (const artist of artists) {
        const result = matchName(idol.nameRomanized, idol.nameHangul, artist.nameRomanized, artist.nameHangul)
        if (result && (!artistMatch || result.score > artistMatch.score)) {
          artistMatch = result
          matchedArtist = artist
          if (result.score === 1.0) break // perfeito, para
        }
      }

      // Tenta encontrar grupo correspondente
      let groupMatch: MatchResult | null = null
      let matchedGroup: (typeof groups)[0] | null = null

      for (const g of groups) {
        const result = matchName(group.name, group.nameHangul, g.name, g.nameHangul)
        if (result && (!groupMatch || result.score > groupMatch.score)) {
          groupMatch = result
          matchedGroup = g
          if (result.score === 1.0) break
        }
      }

      // Dados para salvar
      const suggestionData = {
        // Snapshot kpopping - idol
        idolName: idol.nameRomanized,
        idolNameHangul: idol.nameHangul ?? null,
        idolBirthday: idol.birthday ?? null,
        idolImageUrl: idol.imageUrl ?? null,
        idolHeight: idol.height ?? null,
        idolBloodType: idol.bloodType ?? null,
        idolPosition: link.position ?? null,
        idolIsActive: link.isActive,
        idolProfileUrl: idol.profileUrl,
        // Snapshot kpopping - group
        groupName: group.name,
        groupNameHangul: group.nameHangul ?? null,
        groupImageUrl: group.imageUrl ?? null,
        groupDebutDate: group.debutDate ?? null,
        groupAgency: group.agency ?? null,
        groupStatus: group.status ?? null,
        // Match
        artistId: matchedArtist?.id ?? null,
        artistMatchScore: artistMatch?.score ?? null,
        artistMatchReason: artistMatch?.reason ?? null,
        musicalGroupId: matchedGroup?.id ?? null,
        groupMatchScore: groupMatch?.score ?? null,
        groupMatchReason: groupMatch?.reason ?? null,
      }

      if (!isDryRun) {
        // Upsert — não sobrescreve status de sugestões já revisadas
        const existing = await prisma.kpoppingMembershipSuggestion.findUnique({
          where: {
            kpoppingIdolId_kpoppingGroupId: {
              kpoppingIdolId: idol.id,
              kpoppingGroupId: group.id,
            },
          },
          select: { id: true, status: true },
        })

        if (existing && existing.status !== 'PENDING') {
          stats.skipped++
          continue
        }

        await prisma.kpoppingMembershipSuggestion.upsert({
          where: {
            kpoppingIdolId_kpoppingGroupId: {
              kpoppingIdolId: idol.id,
              kpoppingGroupId: group.id,
            },
          },
          create: {
            kpoppingIdolId: idol.id,
            kpoppingGroupId: group.id,
            ...suggestionData,
          },
          update: suggestionData,
        })

        if (existing) {
          stats.updated++
        } else {
          stats.created++
        }
      } else {
        // Dry run: só exibe
        const artistLabel = matchedArtist
          ? `${matchedArtist.nameRomanized} (${(artistMatch!.score * 100).toFixed(0)}% - ${artistMatch!.reason})`
          : '❌ sem match'
        const groupLabel = matchedGroup
          ? `${matchedGroup.name} (${(groupMatch!.score * 100).toFixed(0)}% - ${groupMatch!.reason})`
          : '❌ sem match'
        console.log(`   ${idol.nameRomanized} → ${artistLabel} | ${group.name} → ${groupLabel}`)
        stats.created++
      }

      stats.processed++
    } catch (err) {
      stats.errors++
      console.error(`   ⚠ Erro ao processar ${link.idolId}/${link.groupId}:`, err)
    }
  }

  console.log(`\n✅ Concluído:`)
  console.log(`   Processados : ${stats.processed}`)
  console.log(`   Criados     : ${stats.created}`)
  console.log(`   Atualizados : ${stats.updated}`)
  console.log(`   Ignorados   : ${stats.skipped} (já revisados)`)
  console.log(`   Erros       : ${stats.errors}`)

  await kpopping.$disconnect()
  await prisma.$disconnect()
}

main().catch(err => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
