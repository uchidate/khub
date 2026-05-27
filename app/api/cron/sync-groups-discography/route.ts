import { NextRequest, NextResponse } from 'next/server'
import { onCronError } from '@/lib/utils/cron-logger'
import { timingSafeEqual } from 'crypto'
import { acquireCronLock, releaseCronLock } from '@/lib/services/cron-lock-service'
import { syncSpotifyCatalogForGroup } from '@/lib/services/spotify-catalog-sync-service'
import { logSystemEvent } from '@/lib/services/system-event-service'
import { logCronRun } from '@/lib/services/cron-execution-service'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/cron/sync-groups-discography
 * Sincroniza discografia Spotify para todos os grupos com perfil vinculado.
 * Processa em background — retorna 202 imediatamente.
 */
export async function POST(request: NextRequest) {
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '') ||
                     request.nextUrl.searchParams.get('token')
    const expectedToken = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET

    if (!expectedToken) {
        return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
    }

    const tokenValid = authToken !== null
        && authToken.length === expectedToken.length
        && timingSafeEqual(Buffer.from(authToken), Buffer.from(expectedToken))

    if (!tokenValid) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const lockId = await acquireCronLock('cron-sync-groups-discography')
    if (!lockId) {
        return NextResponse.json({ skipped: true, reason: 'already_running' }, { status: 409 })
    }

    const log = {
        info: (msg: string, ctx?: any) => console.log(JSON.stringify({ level: 'info', service: 'CRON_SYNC_GROUPS_DISCOGRAPHY', message: msg, ...ctx })),
        error: (msg: string, ctx?: any) => console.error(JSON.stringify({ level: 'error', service: 'CRON_SYNC_GROUPS_DISCOGRAPHY', message: msg, ...ctx })),
    }

    runSync(lockId, log).catch(err => {
        logCronRun('sync-groups-discography', 'failed', 'Sincronização de grupos falhou').catch(() => {})
        onCronError(log, 'cron-sync-groups-discography', 'Unhandled error')(err)
    })

    return NextResponse.json({ status: 'accepted', message: 'Group discography sync started' }, { status: 202 })
}

async function runSync(lockId: string, log: { info: (m: string, c?: any) => void; error: (m: string, c?: any) => void }) {
    const start = Date.now()
    try {
        const groups = await prisma.musicalGroup.findMany({
            where: {
                isHidden: false,
                musicCatalogArtist: { isNot: null },
            },
            select: { id: true, name: true },
            orderBy: { trendingScore: 'desc' },
        })

        log.info(`Starting group discography sync`, { total: groups.length })

        let ok = 0, fail = 0, totalReleases = 0, totalTracks = 0

        for (const group of groups) {
            try {
                const result = await syncSpotifyCatalogForGroup(group.id)
                ok++
                totalReleases += result.releasesSynced
                totalTracks += result.tracksSynced
                log.info(`Synced ${group.name}`, { releases: result.releasesSynced, tracks: result.tracksSynced })
            } catch (err: any) {
                fail++
                log.error(`Failed ${group.name}: ${err.message}`)
            }
        }

        const duration = Math.round((Date.now() - start) / 1000)
        log.info('Group discography sync completed', { ok, fail, totalReleases, totalTracks, duration_s: duration })
        await logCronRun(
            'sync-groups-discography',
            fail > 0 ? 'partial' : 'success',
            `${ok} grupo(s) sincronizado(s), ${totalReleases} lançamento(s), ${fail} falha(s)`,
            { ok, fail, totalReleases, totalTracks, durationSeconds: duration },
        )
        if (fail > 0) {
            await logSystemEvent('ERROR', 'cron-sync-groups-discography', `Discografia de grupos concluída com ${fail} falha(s)`, {
                ok,
                fail,
                totalReleases,
                totalTracks,
            })
        }
    } finally {
        await releaseCronLock('cron-sync-groups-discography', lockId)
    }
}

export async function GET() {
    return NextResponse.json({ error: 'Use POST' }, { status: 405 })
}
