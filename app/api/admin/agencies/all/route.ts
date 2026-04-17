import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { AgencyRepository } from '@/lib/repositories/AgencyRepository'

export const dynamic = 'force-dynamic'

/** GET /api/admin/agencies/all — lista para selects/dropdowns */
export async function GET() {
    const { error } = await requireAdmin()
    if (error) return error

    const data = await AgencyRepository.findAllSimple()
    return NextResponse.json({ data })
}
