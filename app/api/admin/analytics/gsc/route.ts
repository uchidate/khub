import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { getSearchConsoleMetrics } from '@/lib/analytics-client'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const days = Math.min(90, Math.max(7, parseInt(new URL(req.url).searchParams.get('days') ?? '28')))

    try {
        const data = await getSearchConsoleMetrics(days)
        return NextResponse.json({ ...data, days }, {
            headers: { 'Cache-Control': 's-maxage=21600, stale-while-revalidate=3600' },
        })
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
