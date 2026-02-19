import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/agencies/list
 * Public endpoint — returns agencies for filter dropdowns.
 * Only returns agencies that have at least one artist.
 */
export async function GET() {
    const agencies = await prisma.agency.findMany({
        where: { artists: { some: {} } },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
    })

    return NextResponse.json({ agencies }, {
        headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' },
    })
}
