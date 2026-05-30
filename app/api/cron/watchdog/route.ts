import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { getSlackService } from '@/lib/services/slack-notification-service'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * Watchdog — roda a cada 30min e verifica:
 * 1. Crons críticos que deveriam ter rodado mas não rodaram (silenciosos)
 * 2. Spike de erros no SystemEvent (>10 ERRORs em 1h)
 * 3. Candidatos de loja acumulando (>5 por mais de 48h)
 */

// Crons críticos com janela máxima esperada em horas
const CRITICAL_CRONS: { jobId: string; label: string; maxSilenceHours: number }[] = [
    { jobId: 'fetch-news', label: 'Buscar notícias', maxSilenceHours: 1 },
    { jobId: 'cast-sync', label: 'Sync de elenco', maxSilenceHours: 4 },
    { jobId: 'production-import', label: 'Import de produções', maxSilenceHours: 6 },
    { jobId: 'update', label: 'Update geral', maxSilenceHours: 6 },
]

export async function POST(request: NextRequest) {
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '') ||
        request.nextUrl.searchParams.get('token')
    const expectedToken = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET

    if (!expectedToken || !authToken ||
        authToken.length !== expectedToken.length ||
        !timingSafeEqual(Buffer.from(authToken), Buffer.from(expectedToken))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const slack = getSlackService()
    const alerts: string[] = []

    // ── 1. Crons silenciosos ────────────────────────────────────────────────
    const since6h = new Date(Date.now() - 6 * 3600_000)
    const recentCronEvents = await prisma.systemEvent.findMany({
        where: { source: 'CRON_RUN', createdAt: { gte: since6h } },
        select: { metadata: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 500,
    })

    const lastRunByJob = new Map<string, Date>()
    for (const ev of recentCronEvents) {
        const meta = ev.metadata as Record<string, unknown> | null
        if (!meta?.jobId) continue
        const jobId = String(meta.jobId)
        if (!lastRunByJob.has(jobId)) lastRunByJob.set(jobId, ev.createdAt)
    }

    const silentCrons: string[] = []
    for (const cron of CRITICAL_CRONS) {
        const lastRun = lastRunByJob.get(cron.jobId)
        const hoursSince = lastRun
            ? (Date.now() - lastRun.getTime()) / 3600_000
            : cron.maxSilenceHours + 1
        if (hoursSince > cron.maxSilenceHours) {
            const label = lastRun
                ? `*${cron.label}*: último run há ${hoursSince.toFixed(1)}h (limite: ${cron.maxSilenceHours}h)`
                : `*${cron.label}*: nenhum run nas últimas 6h`
            silentCrons.push(label)
        }
    }

    if (silentCrons.length > 0) {
        alerts.push('silent_cron')
        await slack.notifyWatchdogAlert({
            type: 'silent_cron',
            title: `Cron silencioso detectado (${silentCrons.length})`,
            details: `Os seguintes jobs não rodaram dentro do intervalo esperado:\n\n${silentCrons.join('\n')}`,
            severity: 'warning',
            actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hallyuhub.com.br'}/admin/cron`,
        })
    }

    // ── 2. Spike de erros ───────────────────────────────────────────────────
    const since1h = new Date(Date.now() - 3600_000)
    const recentErrors = await prisma.systemEvent.count({
        where: { level: 'ERROR', createdAt: { gte: since1h } },
    })

    if (recentErrors >= 10) {
        alerts.push('error_spike')
        await slack.notifyWatchdogAlert({
            type: 'error_spike',
            title: `Spike de erros: ${recentErrors} erros na última hora`,
            details: `Detectados *${recentErrors} erros* no sistema na última hora.\nVerifique os logs para identificar a causa.`,
            severity: recentErrors >= 25 ? 'error' : 'warning',
            actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hallyuhub.com.br'}/admin/server-logs`,
        })
    }

    // ── 3. Candidatos de loja acumulando ────────────────────────────────────
    const since48h = new Date(Date.now() - 48 * 3600_000)
    const oldCandidates = await prisma.storeProductCandidate.count({
        where: { status: 'candidate', createdAt: { lte: since48h } },
    })

    if (oldCandidates >= 5) {
        alerts.push('store_candidates')
        await slack.notifyWatchdogAlert({
            type: 'store_candidates',
            title: `${oldCandidates} candidatos de loja aguardando aprovação`,
            details: `*${oldCandidates} candidatos* estão pendentes há mais de 48h sem revisão.\nAprovar ou descartar para não acumular.`,
            severity: 'warning',
            actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hallyuhub.com.br'}/admin/loja`,
        })
    }

    return NextResponse.json({ ok: true, alerts, silentCrons: silentCrons.length, recentErrors, oldCandidates })
}

export async function GET() {
    return NextResponse.json({ hint: 'POST /api/cron/watchdog' }, { status: 405 })
}
