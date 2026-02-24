import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') ?? 'all'
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
  const q = searchParams.get('q')?.trim()

  try {
    const where: Record<string, unknown> = {}

    if (filter === 'confirmed') {
      where.artistMatchReason = 'user_confirmed'
    } else if (filter === 'rejected') {
      where.artistMatchReason = 'user_rejected'
    } else if (filter === 'auto') {
      where.artistMatchReason = { notIn: ['user_confirmed', 'user_rejected'] }
      where.artistId = { not: null }
    } else if (filter === 'unmatched') {
      where.artistId = null
    }

    if (q) {
      where.OR = [
        { idolName: { contains: q, mode: 'insensitive' } },
        { idolNameHangul: { contains: q, mode: 'insensitive' } },
      ]
    }

    // Get all distinct idol IDs with their best match score for ordering/pagination
    const allGroups = await prisma.kpoppingMembershipSuggestion.groupBy({
      by: ['kpoppingIdolId'],
      where,
      _max: { artistMatchScore: true },
      orderBy: { _max: { artistMatchScore: 'desc' } },
    })

    const total = allGroups.length
    const pagedGroups = allGroups.slice((page - 1) * limit, page * limit)
    const idolIds = pagedGroups.map(g => g.kpoppingIdolId)

    if (idolIds.length === 0) {
      return NextResponse.json({ items: [], total, page, totalPages: Math.ceil(total / limit) })
    }

    // Fetch one representative suggestion per idol (highest match score)
    const suggestions = await prisma.kpoppingMembershipSuggestion.findMany({
      where: { kpoppingIdolId: { in: idolIds } },
      distinct: ['kpoppingIdolId'],
      orderBy: [{ artistMatchScore: 'desc' }],
      select: {
        kpoppingIdolId: true,
        idolName: true,
        idolNameHangul: true,
        idolBirthday: true,
        idolImageUrl: true,
        idolHeight: true,
        idolBloodType: true,
        idolProfileUrl: true,
        artistId: true,
        artistMatchScore: true,
        artistMatchReason: true,
        artist: {
          select: {
            id: true,
            nameRomanized: true,
            nameHangul: true,
            primaryImageUrl: true,
            birthDate: true,
          },
        },
      },
    })

    // Get group counts per idol
    const groupCounts = await prisma.kpoppingMembershipSuggestion.groupBy({
      by: ['kpoppingIdolId'],
      where: { kpoppingIdolId: { in: idolIds } },
      _count: { kpoppingGroupId: true },
    })
    const countMap = Object.fromEntries(
      groupCounts.map(g => [g.kpoppingIdolId, g._count.kpoppingGroupId])
    )

    // Re-order to match the paged/sorted order
    const idolMap = Object.fromEntries(suggestions.map(s => [s.kpoppingIdolId, s]))
    const items = idolIds
      .filter(id => idolMap[id])
      .map(id => ({ ...idolMap[id], groupCount: countMap[id] ?? 0 }))

    return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
