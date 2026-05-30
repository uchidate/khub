/**
 * POST /api/cron/update-trending
 *
 * Recalcula trendingScore para Artist, MusicalGroup e News
 * com base em atividade dos últimos 7 dias + streaming signals ativos.
 *
 * Fórmula Artist:
 *   base    = viewCount * 0.6 + favoriteCount * 0.3 + recentFavs * 0.3
 *   boost   = Σ StreamingTrendSignal.score × STREAMING_WEIGHT (signals não expirados)
 *   score   = normalize(base + boost)  →  [0, 100]
 *
 * STREAMING_WEIGHT garante peso alto mesmo quando viewCount cresce:
 *   rank 1 numa plataforma  = 30 × 200 = 6.000 pts
 *   rank 10 numa plataforma = 10 × 200 = 2.000 pts
 *   Ator em rank 1 de 2 plataformas = 12.000 pts — equivalente a ~20k views orgânicos
 *
 * Implementação: 3 batch UPDATEs via SQL (evita N+1 — era N×3 queries individuais)
 *
 * Auth: Bearer CRON_SECRET
 * Cron sugerido: a cada 6 horas
 */
import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { timingSafeEqual } from 'crypto'
import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/utils/logger'
import { onCronError } from '@/lib/utils/cron-logger'
import { HOME_CACHE_TAG } from '@/app/(site)/page'
import { logCronRun } from '@/lib/services/cron-execution-service'
import { updateArtistTrendingScores } from '@/lib/trending/artist-trending-score'

export const maxDuration = 120

const log = createLogger('CRON-UPDATE-TRENDING')

function verifyToken(request: NextRequest): boolean {
    const authToken =
        request.headers.get('authorization')?.replace('Bearer ', '') ||
        request.nextUrl.searchParams.get('token')
    const expectedToken = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET
    if (!expectedToken || !authToken) return false
    if (authToken.length !== expectedToken.length) return false
    try {
        return timingSafeEqual(Buffer.from(authToken), Buffer.from(expectedToken))
    } catch {
        return false
    }
}

/**
 * Batch UPDATE MusicalGroup.trendingScore — 1 query em vez de N.
 *
 * Score = normalize(viewCount * 0.6 + favoriteCount * 0.3 + recentFavs * 0.3)
 */
async function updateGroupTrending(since7d: Date): Promise<number> {
    const result = await prisma.$executeRaw`
        UPDATE "MusicalGroup" g
        SET "trendingScore" = scores.normalized,
            "updatedAt"     = NOW()
        FROM (
            SELECT id,
                ROUND(
                    (raw / NULLIF(MAX(raw) OVER (), 0)) * 100 * 100
                ) / 100.0 AS normalized
            FROM (
                SELECT
                    g.id,
                    (COALESCE(g."viewCount", 0) * 0.6
                        + COALESCE(g."favoriteCount", 0) * 0.3
                        + COALESCE((
                            SELECT COUNT(*) * 0.3
                            FROM "Favorite" f
                            WHERE f."groupId" = g.id
                              AND f."createdAt" >= ${since7d}
                          ), 0)
                    ) AS raw
                FROM "MusicalGroup" g
            ) raw_scores
        ) scores
        WHERE g.id = scores.id
    `
    return result
}

/**
 * Batch UPDATE News.trendingScore — 1 query em vez de N.
 *
 * Score = normalize(viewCount * 0.6 + recentFavs * 0.3 + recentComments * 0.1)
 */
async function updateNewsTrending(since7d: Date): Promise<number> {
    const result = await prisma.$executeRaw`
        UPDATE "News" n
        SET "trendingScore" = scores.normalized,
            "updatedAt"     = NOW()
        FROM (
            SELECT id,
                ROUND(
                    (raw / NULLIF(MAX(raw) OVER (), 0)) * 100 * 100
                ) / 100.0 AS normalized
            FROM (
                SELECT
                    n.id,
                    (COALESCE(n."viewCount", 0) * 0.6
                        + COALESCE((
                            SELECT COUNT(*) * 0.3
                            FROM "Favorite" f
                            WHERE f."newsId" = n.id
                              AND f."createdAt" >= ${since7d}
                          ), 0)
                        + COALESCE((
                            SELECT COUNT(*) * 0.1
                            FROM "Comment" c
                            WHERE c."newsId" = n.id
                              AND c."createdAt" >= ${since7d}
                          ), 0)
                    ) AS raw
                FROM "News" n
            ) raw_scores
        ) scores
        WHERE n.id = scores.id
    `
    return result
}

async function runUpdateTrending() {
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [artistResult, groupsUpdated, newsUpdated] = await Promise.all([
        updateArtistTrendingScores(),
        updateGroupTrending(since7d),
        updateNewsTrending(since7d),
    ])

    return {
        artistsUpdated: artistResult.artistsUpdated,
        artistSnapshotsCreated: artistResult.snapshotsCreated,
        groupsUpdated,
        newsUpdated,
    }
}

export async function POST(request: NextRequest) {
    if (!verifyToken(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestId = `update-trending-${Date.now()}`
    log.info('Trending update started', { requestId })

    runUpdateTrending()
        .then(result => {
            log.info('Trending update completed', { requestId, ...result })
            logCronRun('update-trending', 'success', 'Rankings recalculados', { requestId, ...result }).catch(() => {})
            revalidateTag(HOME_CACHE_TAG, { expire: 0 })
        })
        .catch(err => {
            const errorMsg = err instanceof Error ? err.message : String(err)
            const errorStack = err instanceof Error ? err.stack?.slice(0, 500) : undefined
            log.error('Trending update failed', { requestId, error: errorMsg, stack: errorStack })
            logCronRun('update-trending', 'failed', 'Atualização de trending falhou', {
                requestId,
                error: errorMsg,
            }).catch(() => {})
            onCronError(log, 'cron-update-trending', 'Trending update failed')(err)
        })

    return NextResponse.json({ success: true, status: 'accepted', requestId }, { status: 202 })
}

export async function GET(request: NextRequest) {
    return POST(request)
}
