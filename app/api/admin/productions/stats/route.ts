import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/productions/stats
 * Returns production counts for the stats bar
 */
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const [total, noCast, noRating] = await Promise.all([
    prisma.production.count(),
    prisma.production.count({ where: { artists: { none: {} } } }),
    prisma.production.count({ where: { ageRating: null } }),
  ])

  return NextResponse.json({ total, noCast, noRating })
}
