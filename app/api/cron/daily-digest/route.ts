import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { getSlackService } from '@/lib/services/slack-notification-service'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function healthScore(openIssues: number, total: number): number {
    if (!total) return 100
    return Math.max(0, Math.round(100 - (openIssues / total) * 100))
}

export async function POST(request: NextRequest) {
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '') ||
        request.nextUrl.searchParams.get('token')
    const expectedToken = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET

    if (!expectedToken || !authToken ||
        authToken.length !== expectedToken.length ||
        !timingSafeEqual(Buffer.from(authToken), Buffer.from(expectedToken))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const since24h = new Date(Date.now() - 86400_000)
    const todayBRT = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' })

    const [
        postsPublished,
        newsImported,
        newUsers,
        cronEvents,
        artistsTotal, groupsTotal, productionsTotal,
        artistsMissingBio, artistsMissingImage, artistsMissingHangul,
        groupsMissingBio, groupsMissingMembers,
        productionsMissingSynopsis, productionsMissingCast,
        newsPublished, newsDraftReady, blogPublished, blogDraft, blogPendingReview,
        pendingCandidates,
    ] = await Promise.all([
        prisma.blogPost.count({ where: { status: 'PUBLISHED', publishedAt: { gte: since24h } } }),
        prisma.news.count({ where: { createdAt: { gte: since24h } } }),
        prisma.user.count({ where: { createdAt: { gte: since24h } } }),
        prisma.systemEvent.findMany({
            where: { source: 'CRON_RUN', createdAt: { gte: since24h } },
            select: { metadata: true },
            take: 500,
        }),
        prisma.artist.count({ where: { isHidden: false } }),
        prisma.musicalGroup.count({ where: { isHidden: false } }),
        prisma.production.count({ where: { isHidden: false, isTakenDown: false } }),
        prisma.artist.count({ where: { isHidden: false, bio: null } }),
        prisma.artist.count({ where: { isHidden: false, primaryImageUrl: null } }),
        prisma.artist.count({ where: { isHidden: false, nameHangul: null } }),
        prisma.musicalGroup.count({ where: { isHidden: false, bio: null } }),
        prisma.musicalGroup.count({ where: { isHidden: false, members: { none: {} } } }),
        prisma.production.count({ where: { isHidden: false, isTakenDown: false, synopsis: null } }),
        prisma.production.count({ where: { isHidden: false, isTakenDown: false, artists: { none: {} } } }),
        prisma.news.count({ where: { status: 'published', isHidden: false } }),
        prisma.news.count({ where: { status: { in: ['draft', 'ready'] }, isHidden: false } }),
        prisma.blogPost.count({ where: { status: 'PUBLISHED', isPrivate: false } }),
        prisma.blogPost.count({ where: { status: 'DRAFT' } }),
        prisma.blogPost.count({ where: { status: 'PENDING_REVIEW' } }),
        prisma.storeProductCandidate.count({ where: { status: 'candidate' } }),
    ])

    // Cron health: último run por job nas últimas 24h
    const latestByJob = new Map<string, string>()
    for (const ev of cronEvents) {
        const meta = ev.metadata as Record<string, unknown> | null
        if (!meta?.jobId) continue
        const jobId = String(meta.jobId)
        if (!latestByJob.has(jobId)) latestByJob.set(jobId, String(meta.status ?? 'unknown'))
    }
    const cronJobs = Array.from(latestByJob.values())
    const cronsOk = cronJobs.filter(s => s === 'success' || s === 'partial').length
    const cronsFailed = cronJobs.filter(s => s === 'failed').length

    // Health scores
    const catalogIssues = artistsMissingBio + artistsMissingImage + artistsMissingHangul +
        groupsMissingBio + groupsMissingMembers +
        productionsMissingSynopsis + productionsMissingCast
    const editorialIssues = newsDraftReady + blogDraft + blogPendingReview
    const catalogHealth = healthScore(catalogIssues, artistsTotal + groupsTotal + productionsTotal)
    const editorialHealth = healthScore(editorialIssues, newsPublished + blogPublished + newsDraftReady + blogDraft + blogPendingReview)
    const openIssues = catalogIssues + editorialIssues

    const slack = getSlackService()
    await slack.notifyDailyDigest({
        postsPublished,
        newsImported,
        newUsers,
        cronsOk,
        cronsFailed,
        openIssues,
        catalogHealth,
        editorialHealth,
        pendingCandidates,
        date: todayBRT,
    })

    return NextResponse.json({ ok: true, date: todayBRT, cronsOk, cronsFailed, openIssues })
}

export async function GET() {
    return NextResponse.json({ hint: 'POST /api/cron/daily-digest' }, { status: 405 })
}
