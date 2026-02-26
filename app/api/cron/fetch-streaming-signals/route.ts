/**
 * POST /api/cron/fetch-streaming-signals
 *
 * Ingestão de sinais de trending de streaming:
 *   1. InternalProductionProvider: top produções do banco (garantia de match)
 *   2. TMDBTrendingProvider: K-dramas populares via TMDB /discover/tv
 *
 * Ao final, recalcula automaticamente o trendingScore dos artistas afetados
 * (sem precisar disparar o cron update-trending separadamente).
 *
 * Auth:  Bearer CRON_SECRET
 * Cron:  1x por dia (ex: 03:00 UTC)
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'
import {
    getSignalProviders,
    rankToScore,
    signalExpiresAt,
    computeStreamingBoost,
    SignalIngestionResult,
} from '@/lib/services/streaming-signal-service'

export const maxDuration = 120

const log = createLogger('CRON-STREAMING-SIGNALS')

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

// ─── Ingestão de signals ──────────────────────────────────────────────────────

async function runFetchStreamingSignals(): Promise<{
    ingestion: SignalIngestionResult[]
    trendingUpdated: number
}> {
    const providers = getSignalProviders()
    const results: SignalIngestionResult[] = []
    const affectedArtistIds = new Set<string>()

    // Limpar TODOS os signals ativos antes de re-popular.
    // Garante que sinais de não-protagonistas (gerados antes da regra de castOrder)
    // sejam removidos imediatamente em vez de esperarem expirar em 7 dias.
    const deleted = await prisma.streamingTrendSignal.deleteMany({})
    log.info('Signals cleared (full refresh)', { count: deleted.count })

    for (const provider of providers) {
        const result: SignalIngestionResult = {
            source: provider.name,
            signalsFetched: 0,
            artistsMatched: 0,
            upserted: 0,
            errors: [],
        }

        try {
            const signals = await provider.fetchSignals()
            result.signalsFetched = signals.length

            // Deduplica por (artistId|tmdbPersonId, showTmdbId)
            const deduped = new Map<string, typeof signals[0]>()
            for (const signal of signals) {
                const personKey = signal.artistId ?? String(signal.tmdbPersonId ?? '')
                const key = `${personKey}:${signal.showTmdbId}`
                const existing = deduped.get(key)
                if (!existing || signal.rank < existing.rank) {
                    deduped.set(key, signal)
                }
            }

            // Resolver artistId para signals externos (via tmdbId lookup em batch)
            const externalSignals = Array.from(deduped.values()).filter(s => !s.artistId && s.tmdbPersonId)
            if (externalSignals.length > 0) {
                const tmdbIds = Array.from(new Set(externalSignals.map(s => String(s.tmdbPersonId))))
                const matched = await prisma.artist.findMany({
                    where: { tmdbId: { in: tmdbIds } },
                    select: { id: true, tmdbId: true },
                })
                const tmdbToId = new Map(matched.map(a => [a.tmdbId!, a.id]))
                for (const signal of externalSignals) {
                    const resolved = tmdbToId.get(String(signal.tmdbPersonId))
                    if (resolved) signal.artistId = resolved
                }
                result.artistsMatched += matched.length
            }

            // Contar artistas diretos (InternalProductionProvider)
            const directMatches = Array.from(deduped.values()).filter(s => s.artistId).length
            result.artistsMatched += directMatches

            const now = new Date()

            for (const signal of Array.from(deduped.values())) {
                const artistId = signal.artistId
                if (!artistId) continue

                const score = rankToScore(signal.rank)
                const expiresAt = signalExpiresAt(now)

                try {
                    await prisma.streamingTrendSignal.upsert({
                        where: {
                            artistId_showTmdbId_source: {
                                artistId,
                                showTmdbId: signal.showTmdbId,
                                source: signal.source,
                            },
                        },
                        create: {
                            artistId,
                            source: signal.source,
                            showTitle: signal.showTitle,
                            showTmdbId: signal.showTmdbId,
                            rank: signal.rank,
                            score,
                            fetchedAt: now,
                            expiresAt,
                        },
                        update: {
                            rank: signal.rank,
                            score,
                            fetchedAt: now,
                            expiresAt,
                        },
                    })
                    result.upserted++
                    affectedArtistIds.add(artistId)
                } catch (err) {
                    result.errors.push(`artistId=${artistId}: ${getErrorMessage(err)}`)
                }
            }
        } catch (err) {
            result.errors.push(getErrorMessage(err))
            log.error(`Provider ${provider.name} failed`, { error: getErrorMessage(err) })
        }

        results.push(result)
        log.info(`Provider ${provider.name} done`, {
            signalsFetched: result.signalsFetched,
            artistsMatched: result.artistsMatched,
            upserted: result.upserted,
            errors: result.errors.length,
        })
    }

    // ─── Auto-atualizar trendingScore dos artistas afetados ───────────────────
    const trendingUpdated = await refreshArtistTrending(Array.from(affectedArtistIds))
    log.info('Artist trending refreshed', { count: trendingUpdated })

    return { ingestion: results, trendingUpdated }
}

/**
 * Recalcula o trendingScore apenas para os artistas que tiveram signals alterados.
 * Aplica boost relativo: normaliza dentro do subconjunto afetado e soma ao score base.
 */
async function refreshArtistTrending(artistIds: string[]): Promise<number> {
    if (artistIds.length === 0) return 0

    const artists = await prisma.artist.findMany({
        where: { id: { in: artistIds } },
        select: {
            id: true,
            viewCount: true,
            favoriteCount: true,
            streamingSignals: {
                where: { expiresAt: { gt: new Date() } },
                select: { score: true },
            },
        },
    })

    let updated = 0
    for (const artist of artists) {
        const base = artist.viewCount * 0.6 + artist.favoriteCount * 0.3
        const boost = computeStreamingBoost(artist.streamingSignals)
        // Aplica boost diretamente (normalização global fica para o cron update-trending)
        const newScore = base + boost
        await prisma.artist.update({
            where: { id: artist.id },
            data: { trendingScore: newScore },
        })
        updated++
    }

    return updated
}

// ─── Route handlers ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    if (!verifyToken(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestId = `streaming-signals-${Date.now()}`
    log.info('Fetch streaming signals started', { requestId })

    runFetchStreamingSignals()
        .then(result => log.info('Fetch streaming signals completed', { requestId, ...result }))
        .catch(err => log.error('Fetch streaming signals failed', { requestId, error: getErrorMessage(err) }))

    return NextResponse.json({ success: true, status: 'accepted', requestId }, { status: 202 })
}

export async function GET(request: NextRequest) {
    return POST(request)
}
