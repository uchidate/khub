import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/agencies/all
 * Returns all agencies as a simple list for use in select dropdowns.
 * Response: { data: { id, name }[] }
 */
export async function GET() {
    const { error } = await requireAdmin()
    if (error) return error

    const agencies = await prisma.agency.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
    })

    return NextResponse.json({ data: agencies })
}
