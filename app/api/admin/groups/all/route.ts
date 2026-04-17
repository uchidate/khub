import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { MusicalGroupRepository } from '@/lib/repositories/MusicalGroupRepository'

export const dynamic = 'force-dynamic'

/** GET /api/admin/groups/all — all groups for select dropdowns */
export async function GET() {
    const { error } = await requireAdmin()
    if (error) return error

    const groups = await MusicalGroupRepository.findAllSimple()
    return NextResponse.json({ data: groups })
}
