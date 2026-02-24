import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json()
  const { name, nameHangul, imagePath, firstAirDate, kpoppingGroupId } = body

  if (!name || !kpoppingGroupId) {
    return NextResponse.json(
      { error: 'name e kpoppingGroupId são obrigatórios' },
      { status: 400 }
    )
  }

  try {
    // Check if MusicalGroup already exists by name
    const existing = await prisma.musicalGroup.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    })

    let group = existing
    let created = false

    if (!group) {
      const profileImageUrl = imagePath
        ? imagePath.startsWith('http') ? imagePath : `${TMDB_IMAGE_BASE}${imagePath}`
        : null

      group = await prisma.musicalGroup.create({
        data: {
          name,
          nameHangul: nameHangul ?? null,
          profileImageUrl,
          debutDate: firstAirDate ? new Date(firstAirDate) : null,
        },
      })
      created = true
    }

    // Confirm group mapping for all suggestions with this kpoppingGroupId
    const { count } = await prisma.kpoppingMembershipSuggestion.updateMany({
      where: { kpoppingGroupId },
      data: {
        musicalGroupId: group.id,
        groupMatchReason: 'user_confirmed',
        groupMatchScore: 1.0,
      },
    })

    return NextResponse.json({
      ok: true,
      group: {
        id: group.id,
        name: group.name,
        nameHangul: group.nameHangul,
        profileImageUrl: group.profileImageUrl,
      },
      created,
      updated: count,
    })
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
