import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') ?? 'PENDING'
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
    const hasArtist = searchParams.get('hasArtist') // 'true' | 'false' | null = todos
    const hasGroup = searchParams.get('hasGroup')
    // confirmed=true → both idol and group user_confirmed (used by Memberships tab)
    const confirmed = searchParams.get('confirmed')
    const q = searchParams.get('q')?.trim()

    const where: Record<string, unknown> = {
      status: status.toUpperCase(),
    }

    if (confirmed === 'true') {
      where.artistMatchReason = 'user_confirmed'
      where.groupMatchReason = 'user_confirmed'
    } else {
      if (hasArtist === 'true') where.artistId = { not: null }
      if (hasArtist === 'false') where.artistId = null
      if (hasGroup === 'true') where.musicalGroupId = { not: null }
      if (hasGroup === 'false') where.musicalGroupId = null
    }

    if (q) {
      where.OR = [
        { idolName: { contains: q, mode: 'insensitive' } },
        { idolNameHangul: { contains: q, mode: 'insensitive' } },
        { groupName: { contains: q, mode: 'insensitive' } },
        { groupNameHangul: { contains: q, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      prisma.kpoppingMembershipSuggestion.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { artistMatchScore: 'desc' },
          { groupMatchScore: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          artist: {
            select: {
              id: true,
              nameRomanized: true,
              nameHangul: true,
              birthDate: true,
              primaryImageUrl: true,
              height: true,
              bloodType: true,
              memberships: {
                where: { isActive: true },
                include: { group: { select: { id: true, name: true } } },
              },
            },
          },
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
      }),
      prisma.kpoppingMembershipSuggestion.count({ where }),
    ])

    return NextResponse.json({
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
