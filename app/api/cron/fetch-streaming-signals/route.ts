/**
 * POST /api/cron/fetch-streaming-signals
 *
 * Busca os shows K-drama mais populares dos streamings (via TMDB trending),
 * extrai o elenco e persiste StreamingTrendSignal para cada ator presente
 * no banco com tmdbId correspondente.
 *
 * Os signals têm TTL de 7 dias e são consumidos pelo cron update-trending
 * para compor o trendingScore final dos artistas.
 *
 * Auth:  Bearer CRON_SECRET
 * Cron:  1x por dia (ex: 03:00 UTC)
 *
 * Returns:
 *   202 Accepted + { success: true, status: 'accepted', requestId }
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

async function runFetchStreamingSignals(): Promise<SignalIngestionResult[]> {
    const providers = getSignalProviders()
    const results: SignalIngestionResult[] = []

    // Limpar signals expirados antes de inserir novos
    const deleted = await prisma.streamingTrendSignal.deleteMany({
        where: { expiresAt: { lt: new Date() } },
    })
    log.info('Expired signals removed', { count: deleted.count })

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

            log.info(`Provider ${provider.name}: ${signals.length} signals fetched`)

            // Deduplica por (tmdbPersonId, showTmdbId): mantém rank do show mais alto (menor número)
            const deduped = new Map<string, typeof signals[0]>()
            for (const signal of signals) {
                const key = `${signal.tmdbPersonId}:${signal.showTmdbId}`
                const existing = deduped.get(key)
                if (!existing || signal.rank < existing.rank) {
                    deduped.set(key, signal)
                }
            }

            // Busca artistas correspondentes em batch (por tmdbId)
            const uniqueTmdbIds = Array.from(
                new Set(Array.from(deduped.values()).map(s => String(s.tmdbPersonId)))
            )

            const artists = await prisma.artist.findMany({
                where: { tmdbId: { in: uniqueTmdbIds } },
                select: { id: true, tmdbId: true },
            })

            const tmdbToArtistId = new Map(
                artists.map(a => [a.tmdbId!, a.id])
            )
            result.artistsMatched = artists.length

            const now = new Date()

            // Upsert signals para artistas encontrados
            for (const signal of Array.from(deduped.values())) {
                const artistId = tmdbToArtistId.get(String(signal.tmdbPersonId))
                if (!artistId) continue

                const score = rankToScore(signal.rank)
                const expiresAt = signalExpiresAt(now)

                try {
                    await prisma.streamingTrendSignal.upsert({
                        where: {
                            artistId_showTmdbId_source: {
                                artistId,
                                showTmdbId: String(signal.showTmdbId),
                                source: signal.source,
                            },
                        },
                        create: {
                            artistId,
                            source: signal.source,
                            showTitle: signal.showTitle,
                            showTmdbId: String(signal.showTmdbId),
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

    return results
}

export async function POST(request: NextRequest) {
    if (!verifyToken(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestId = `streaming-signals-${Date.now()}`
    log.info('Fetch streaming signals started', { requestId })

    runFetchStreamingSignals()
        .then(results => log.info('Fetch streaming signals completed', { requestId, results }))
        .catch(err => log.error('Fetch streaming signals failed', { requestId, error: getErrorMessage(err) }))

    return NextResponse.json({ success: true, status: 'accepted', requestId }, { status: 202 })
}

export async function GET(request: NextRequest) {
    return POST(request)
}
