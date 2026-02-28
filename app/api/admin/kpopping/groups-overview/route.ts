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
      where.groupMatchReason = 'user_confirmed'
    } else if (filter === 'rejected') {
      where.groupMatchReason = 'user_rejected'
    } else if (filter === 'auto') {
      where.groupMatchReason = { notIn: ['user_confirmed', 'user_rejected'] }
      where.musicalGroupId = { not: null }
    } else if (filter === 'unmatched') {
      where.musicalGroupId = null
    }

    if (q) {
      // Also search by the linked HallyuHub musical group name
      const matchingGroups = await prisma.musicalGroup.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { nameHangul: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      })
      const matchingGroupIds = matchingGroups.map(g => g.id)

      where.OR = [
        { groupName: { contains: q, mode: 'insensitive' } },
        { groupNameHangul: { contains: q, mode: 'insensitive' } },
        ...(matchingGroupIds.length > 0 ? [{ musicalGroupId: { in: matchingGroupIds } }] : []),
      ]
    }

    // Get all distinct group IDs with their best match score
    const allGroups = await prisma.kpoppingMembershipSuggestion.groupBy({
      by: ['kpoppingGroupId'],
      where,
      _max: { groupMatchScore: true },
      orderBy: { _max: { groupMatchScore: 'desc' } },
    })

    const total = allGroups.length
    const pagedGroups = allGroups.slice((page - 1) * limit, page * limit)
    const groupIds = pagedGroups.map(g => g.kpoppingGroupId)

    if (groupIds.length === 0) {
      return NextResponse.json({ items: [], total, page, totalPages: Math.ceil(total / limit) })
    }

    // Fetch one representative suggestion per group (highest match score)
    const suggestions = await prisma.kpoppingMembershipSuggestion.findMany({
      where: { kpoppingGroupId: { in: groupIds } },
      distinct: ['kpoppingGroupId'],
      orderBy: [{ groupMatchScore: 'desc' }],
      select: {
        kpoppingGroupId: true,
        groupName: true,
        groupNameHangul: true,
        groupImageUrl: true,
        groupDebutDate: true,
        groupAgency: true,
        groupStatus: true,
        musicalGroupId: true,
        groupMatchScore: true,
        groupMatchReason: true,
        musicalGroup: {
          select: {
            id: true,
            name: true,
            nameHangul: true,
            profileImageUrl: true,
            debutDate: true,
            agency: { select: { name: true } },
          },
        },
      },
    })

    // Get member counts per group
    const memberCounts = await prisma.kpoppingMembershipSuggestion.groupBy({
      by: ['kpoppingGroupId'],
      where: { kpoppingGroupId: { in: groupIds } },
      _count: { kpoppingIdolId: true },
    })
    const countMap = Object.fromEntries(
      memberCounts.map(g => [g.kpoppingGroupId, g._count.kpoppingIdolId])
    )

    // Re-order to match paged order
    const groupMap = Object.fromEntries(suggestions.map(s => [s.kpoppingGroupId, s]))
    const items = groupIds
      .filter(id => groupMap[id])
      .map(id => ({ ...groupMap[id], memberCount: countMap[id] ?? 0 }))

    return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
