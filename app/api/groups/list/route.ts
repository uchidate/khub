import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/groups/list
 * Public endpoint — returns musical groups.
 *
 * Query params:
 *   ?full=true  → returns all fields (agency, _count, dates) for the groups page
 *   (default)   → returns { id, name }[] for filter dropdowns
 */
export async function GET(request: NextRequest) {
    const full = request.nextUrl.searchParams.get('full') === 'true'

    if (full) {
        const groups = await prisma.musicalGroup.findMany({
            select: {
                id: true,
                name: true,
                nameHangul: true,
                profileImageUrl: true,
                debutDate: true,
                disbandDate: true,
                agency: { select: { id: true, name: true } },
                _count: { select: { members: true } },
            },
            orderBy: { name: 'asc' },
        })
        return NextResponse.json({ groups })
    }

    // Simple list for dropdowns
    const groups = await prisma.musicalGroup.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
    })

    return NextResponse.json({ groups })
}
