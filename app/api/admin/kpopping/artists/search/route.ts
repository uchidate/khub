import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''

  if (q.length < 2) {
    return NextResponse.json({ items: [] })
  }

  try {
    const items = await prisma.artist.findMany({
      where: {
        OR: [
          { nameRomanized: { contains: q, mode: 'insensitive' } },
          { nameHangul: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        nameRomanized: true,
        nameHangul: true,
        birthDate: true,
        primaryImageUrl: true,
        height: true,
        bloodType: true,
      },
      orderBy: { nameRomanized: 'asc' },
      take: 10,
    })

    return NextResponse.json({ items })
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
