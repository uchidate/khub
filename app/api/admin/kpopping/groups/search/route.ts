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
    const items = await prisma.musicalGroup.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { nameHangul: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        nameHangul: true,
        profileImageUrl: true,
        debutDate: true,
        agency: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ items })
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
