import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { getSiteMetrics, getActiveUsers, getTopBlogPosts, getTopProductions, getTopArtists } from '@/lib/analytics-client'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(req.url)
    const days = Math.min(90, Math.max(1, parseInt(searchParams.get('days') ?? '30')))

    try {
        const [metrics, activeUsers, blogPosts, productions, artists] = await Promise.all([
            getSiteMetrics(days),
            getActiveUsers(),
            getTopBlogPosts(days),
            getTopProductions(days),
            getTopArtists(days),
        ])

        return NextResponse.json({ metrics, activeUsers, blogPosts, productions, artists, days })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
