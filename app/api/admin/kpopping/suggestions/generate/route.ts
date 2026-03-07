import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { getErrorMessage } from '@/lib/utils/error'
import { createLogger } from '@/lib/utils/logger'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 min timeout

const log = createLogger('ADMIN-KPOPPING-GENERATE')

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

function matchName(
  kpoppingName: string | null | undefined,
  kpoppingHangul: string | null | undefined,
  dbRomanized: string,
  dbHangul: string | null | undefined
): { score: number; reason: string } | null {
  if (!kpoppingName) return null

  if (kpoppingHangul && dbHangul && kpoppingHangul.trim() === dbHangul.trim())
    return { score: 1.0, reason: 'exact_hangul' }
  if (kpoppingName.trim() === dbRomanized.trim())
    return { score: 1.0, reason: 'exact_romanized' }
  if (kpoppingName.toLowerCase().trim() === dbRomanized.toLowerCase().trim())
    return { score: 0.95, reason: 'icase_romanized' }
  if (normalizeName(kpoppingName) === normalizeName(dbRomanized))
    return { score: 0.85, reason: 'normalized_romanized' }
  if (kpoppingHangul && dbHangul &&
    kpoppingHangul.toLowerCase().trim() === dbHangul.toLowerCase().trim())
    return { score: 0.9, reason: 'icase_hangul' }

  return null
}

export async function POST(_req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const kpoppingUrl = process.env.KPOPPING_DATABASE_URL
  if (!kpoppingUrl) {
    return NextResponse.json({ error: 'KPOPPING_DATABASE_URL não configurado' }, { status: 500 })
  }

  try {
    // Importação dinâmica para evitar erro no build quando KPOPPING_DATABASE_URL não está definido
    const { default: kpoppingPrisma } = await import('@/lib/prisma-kpopping')

    log.info('Iniciando geração de sugestões via kpopping...')

    // Busca todos os vínculos
    const idolInGroups = await kpoppingPrisma.idolInGroup.findMany({
      include: { idol: true, group: true },
      orderBy: [{ groupId: 'asc' }, { idolId: 'asc' }],
    })

    // Carrega artistas e grupos do banco principal em memória para matching eficiente
    const [artists, groups] = await Promise.all([
      prisma.artist.findMany({ select: { id: true, nameRomanized: true, nameHangul: true } }),
      prisma.musicalGroup.findMany({ select: { id: true, name: true, nameHangul: true } }),
    ])

    const stats = { processed: 0, created: 0, updated: 0, skipped: 0, errors: 0 }

    for (const link of idolInGroups) {
      try {
        const { idol, group } = link

        // Match artista
        let artistMatch: { score: number; reason: string } | null = null
        let matchedArtistId: string | null = null
        for (const a of artists) {
          const r = matchName(idol.nameRomanized, idol.nameHangul, a.nameRomanized, a.nameHangul)
          if (r && (!artistMatch || r.score > artistMatch.score)) {
            artistMatch = r
            matchedArtistId = a.id
            if (r.score === 1.0) break
          }
        }

        // Match grupo
        let groupMatch: { score: number; reason: string } | null = null
        let matchedGroupId: string | null = null
        for (const g of groups) {
          const r = matchName(group.name, group.nameHangul, g.name, g.nameHangul)
          if (r && (!groupMatch || r.score > groupMatch.score)) {
            groupMatch = r
            matchedGroupId = g.id
            if (r.score === 1.0) break
          }
        }

        const suggestionData = {
          idolName: idol.nameRomanized,
          idolNameHangul: idol.nameHangul ?? null,
          idolBirthday: idol.birthday ?? null,
          idolImageUrl: idol.imageUrl ?? null,
          idolHeight: idol.height ?? null,
          idolBloodType: idol.bloodType ?? null,
          idolPosition: link.position ?? null,
          idolIsActive: link.isActive,
          idolProfileUrl: idol.profileUrl,
          groupName: group.name,
          groupNameHangul: group.nameHangul ?? null,
          groupImageUrl: group.imageUrl ?? null,
          groupDebutDate: group.debutDate ?? null,
          groupAgency: group.agency ?? null,
          groupStatus: group.status ?? null,
          artistId: matchedArtistId,
          artistMatchScore: artistMatch?.score ?? null,
          artistMatchReason: artistMatch?.reason ?? null,
          musicalGroupId: matchedGroupId,
          groupMatchScore: groupMatch?.score ?? null,
          groupMatchReason: groupMatch?.reason ?? null,
        }

        // Não sobrescreve sugestões já revisadas (APPROVED / REJECTED)
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

        if (existing) { stats.updated++ } else { stats.created++ }
        stats.processed++
      } catch {
        stats.errors++
      }
    }

    log.info(`Geração concluída: ${JSON.stringify(stats)}`)
    return NextResponse.json({ success: true, stats })
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
