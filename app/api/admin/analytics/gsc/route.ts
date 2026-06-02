import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { getSearchConsoleMetrics } from '@/lib/analytics-client'

export const dynamic = 'force-dynamic'

export async function GET() {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const data = await getSearchConsoleMetrics(28)
        return NextResponse.json(data, {
            headers: { 'Cache-Control': 's-maxage=21600, stale-while-revalidate=3600' },
        })
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
