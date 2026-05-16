import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { getSiteMetrics, getActiveUsers, getTopBlogPosts, getTopProductions, getTopArtists, getTopCountries, getDeviceBreakdown, getTrafficSources, getNewVsReturning, getTopSearchTerms, getSectionEngagement, getLandingPages, getSearchConsoleMetrics, getDailyMetrics, getPreviousPeriodMetrics } from '@/lib/analytics-client'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = req.nextUrl
    const days = Math.min(90, Math.max(1, parseInt(searchParams.get('days') ?? '30')))

    try {
        const [metrics, prevMetrics, dailyTrend, activeUsers, blogPosts, productions, artists, countries, devices, sources, newVsReturning, searchTerms, sectionEngagement, landingPages, gsc] = await Promise.all([
            getSiteMetrics(days),
            getPreviousPeriodMetrics(days),
            getDailyMetrics(days),
            getActiveUsers(),
            getTopBlogPosts(days),
            getTopProductions(days),
            getTopArtists(days),
            getTopCountries(days),
            getDeviceBreakdown(days),
            getTrafficSources(days),
            getNewVsReturning(days),
            getTopSearchTerms(days),
            getSectionEngagement(days),
            getLandingPages(days),
            getSearchConsoleMetrics(days).catch(() => null),
        ])

        return NextResponse.json({ metrics, prevMetrics, dailyTrend, activeUsers, blogPosts, productions, artists, countries, devices, sources, newVsReturning, searchTerms, sectionEngagement, landingPages, gsc, days })
    } catch (err) {
        const e = err as Record<string, unknown>
        const message = (
            (e?.message as string) ||
            (e?.details as string) ||
            (Array.isArray(e?.errors) ? JSON.stringify(e.errors) : null) ||
            JSON.stringify(err) ||
            'Erro desconhecido'
        )
        console.error('[GA4]', message, JSON.stringify(err, null, 2))
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
