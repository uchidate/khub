import { NextRequest, NextResponse } from 'next/server'
import { onCronError } from '@/lib/utils/cron-logger'
import { timingSafeEqual } from 'crypto'
import { acquireCronLock, releaseCronLock } from '@/lib/services/cron-lock-service'
import { syncSpotifyCatalogForArtist } from '@/lib/services/spotify-catalog-sync-service'
import { logSystemEvent } from '@/lib/services/system-event-service'
import { logCronRun } from '@/lib/services/cron-execution-service'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Artistas por execução — Spotify tem rate limit; 25 com delay de 2s = ~50s por run
const BATCH_SIZE = 25
const DELAY_MS = 2000

/**
 * POST /api/cron/sync-artists-discography
 * Sincroniza discografia Spotify para artistas com perfil vinculado mas sem releases.
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

    const lockId = await acquireCronLock('cron-sync-artists-discography')
    if (!lockId) {
        return NextResponse.json({ skipped: true, reason: 'already_running' }, { status: 409 })
    }

    const log = {
        info: (msg: string, ctx?: object) => console.log(JSON.stringify({ level: 'info', service: 'CRON_SYNC_ARTISTS_DISCOGRAPHY', message: msg, ...ctx })),
        error: (msg: string, ctx?: object) => console.error(JSON.stringify({ level: 'error', service: 'CRON_SYNC_ARTISTS_DISCOGRAPHY', message: msg, ...ctx })),
    }

    runSync(lockId, log).catch(err => {
        logCronRun('sync-artists-discography', 'failed', 'Sincronização de artistas falhou').catch(() => {})
        onCronError(log, 'cron-sync-artists-discography', 'Unhandled error')(err)
    })

    return NextResponse.json({ status: 'accepted', message: 'Artist discography sync started' }, { status: 202 })
}

async function runSync(lockId: string, log: { info: (m: string, c?: object) => void; error: (m: string, c?: object) => void }) {
    const start = Date.now()
    try {
        // Busca artistas com Spotify vinculado mas sem releases, priorizando trending
        const artists = await prisma.$queryRaw<{ id: string; nameRomanized: string }[]>`
            SELECT DISTINCT a.id, a."nameRomanized"
            FROM "Artist" a
            JOIN "MusicCatalogArtist" mca ON mca."artistId" = a.id
            JOIN "ExternalMusicEntity" eme ON eme."musicCatalogArtistId" = mca.id
                AND eme."entityType" = 'ARTIST'
            JOIN "StreamingPlatform" sp ON sp.id = eme."platformId" AND sp.slug = 'spotify'
            WHERE a."isHidden" = false
              AND NOT EXISTS (
                SELECT 1 FROM "MusicReleaseCredit" mrc WHERE mrc."musicCatalogArtistId" = mca.id
              )
            ORDER BY a."trendingScore" DESC
            LIMIT ${BATCH_SIZE}
        `

        log.info(`Starting artist discography sync`, { total: artists.length })

        let ok = 0, skip = 0, fail = 0, totalReleases = 0, totalTracks = 0

        for (const artist of artists) {
            try {
                const result = await syncSpotifyCatalogForArtist(artist.id)
                ok++
                totalReleases += result.releasesSynced
                totalTracks += result.tracksSynced
                log.info(`Synced ${artist.nameRomanized}`, { releases: result.releasesSynced, tracks: result.tracksSynced })
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err)
                if (msg.includes('não tem perfil Spotify') || msg.includes('No Spotify') || msg.includes('No external link')) {
                    skip++
                } else {
                    fail++
                    log.error(`Failed ${artist.nameRomanized}: ${msg}`)
                }
            }

            // Delay entre requests para respeitar rate limit do Spotify
            await new Promise(r => setTimeout(r, DELAY_MS))
        }

        const duration = Math.round((Date.now() - start) / 1000)
        log.info('Artist discography sync completed', { ok, skip, fail, totalReleases, totalTracks, duration_s: duration })
        await logCronRun(
            'sync-artists-discography',
            fail > 0 ? 'partial' : 'success',
            `${ok} artista(s) sincronizado(s), ${totalReleases} lançamento(s), ${skip} sem Spotify, ${fail} falha(s)`,
            { ok, skip, fail, totalReleases, totalTracks, durationSeconds: duration },
        )
        if (fail > 0) {
            await logSystemEvent('ERROR', 'cron-sync-artists-discography', `Discografia de artistas concluída com ${fail} falha(s)`, {
                ok, skip, fail, totalReleases, totalTracks,
            })
        }
    } finally {
        await releaseCronLock('cron-sync-artists-discography', lockId)
    }
}

export async function GET() {
    return NextResponse.json({ error: 'Use POST' }, { status: 405 })
}
