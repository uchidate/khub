/**
 * GET /api/admin/artists/stats
 * Returns artist counts for the stats bar, including sub-breakdowns.
 * See ArtistRepository.stats() for full documentation of each metric.
 */
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { ArtistRepository } from '@/lib/repositories/ArtistRepository'
import { toHttpError } from '@/lib/repositories/base'

export const dynamic = 'force-dynamic'

export async function GET() {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const stats = await ArtistRepository.stats()
        return NextResponse.json(stats, {
            headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
        })
    } catch (error) {
        return toHttpError(error)
    }
}
