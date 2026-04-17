import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { getErrorMessage } from '@/lib/utils/error';
import { getPersistedBlogEntityLinkDiscardStats } from '@/lib/services/blog-entity-links';

const log = createLogger('METRICS');

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type DiscardCounter = { artists: number; groups: number; productions: number; total: number }

function toDiscardCounter(value: unknown): DiscardCounter {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return { artists: 0, groups: 0, productions: 0, total: 0 }
    }

    const record = value as Record<string, unknown>
    const artists = typeof record.artists === 'number' ? record.artists : 0
    const groups = typeof record.groups === 'number' ? record.groups : 0
    const productions = typeof record.productions === 'number' ? record.productions : 0
    const total = typeof record.total === 'number' ? record.total : artists + groups + productions

    return { artists, groups, productions, total }
}

// Metricas no formato Prometheus — protegido por bearer token (PROMETHEUS_TOKEN)
export async function GET(request: Request) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    const expected = process.env.PROMETHEUS_TOKEN
    if (!expected || token !== expected) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const startTime = Date.now();

    try {
        // Coleta metricas do banco
        const [
            artistCount,
            productionCount,
            newsCount,
            agencyCount,
            activeUsersRaw,
        ] = await Promise.all([
            prisma.artist.count(),
            prisma.production.count(),
            prisma.news.count(),
            prisma.agency.count(),
            prisma.$queryRaw<{ c5m: bigint; c15m: bigint; c1h: bigint }[]>`
                SELECT
                    COUNT(DISTINCT CASE WHEN "createdAt" >= NOW() - INTERVAL '5 minutes'  THEN "userId" END) AS c5m,
                    COUNT(DISTINCT CASE WHEN "createdAt" >= NOW() - INTERVAL '15 minutes' THEN "userId" END) AS c15m,
                    COUNT(DISTINCT CASE WHEN "createdAt" >= NOW() - INTERVAL '1 hour'     THEN "userId" END) AS c1h
                FROM "Activity"
                WHERE "createdAt" >= NOW() - INTERVAL '1 hour'
                  AND "userId" IS NOT NULL
            `,
        ]);

        const dbLatency = Date.now() - startTime;
        const uptime = process.uptime();
        const memUsage = process.memoryUsage();
        const { c5m, c15m, c1h } = activeUsersRaw[0];
        const discardStats = await getPersistedBlogEntityLinkDiscardStats();
        const discardToday = await getPersistedBlogEntityLinkDiscardStats(discardStats.today);
        const discardTotals = toDiscardCounter((discardStats as { totals?: unknown }).totals)
        const discardTodayStats = toDiscardCounter((discardToday as { stats?: unknown }).stats)

        // Formato Prometheus
        const metrics = `
# HELP hallyuhub_up Application is up
# TYPE hallyuhub_up gauge
hallyuhub_up 1

# HELP hallyuhub_info Application information
# TYPE hallyuhub_info gauge
hallyuhub_info{version="1.0.0",environment="${process.env.DEPLOY_ENV || 'unknown'}",node_env="${process.env.NODE_ENV}"} 1

# HELP hallyuhub_uptime_seconds Application uptime in seconds
# TYPE hallyuhub_uptime_seconds gauge
hallyuhub_uptime_seconds ${uptime.toFixed(2)}

# HELP hallyuhub_db_latency_ms Database query latency in milliseconds
# TYPE hallyuhub_db_latency_ms gauge
hallyuhub_db_latency_ms ${dbLatency}

# HELP hallyuhub_memory_heap_used_bytes Heap memory used
# TYPE hallyuhub_memory_heap_used_bytes gauge
hallyuhub_memory_heap_used_bytes ${memUsage.heapUsed}

# HELP hallyuhub_memory_heap_total_bytes Total heap memory
# TYPE hallyuhub_memory_heap_total_bytes gauge
hallyuhub_memory_heap_total_bytes ${memUsage.heapTotal}

# HELP hallyuhub_memory_rss_bytes Resident set size
# TYPE hallyuhub_memory_rss_bytes gauge
hallyuhub_memory_rss_bytes ${memUsage.rss}

# HELP hallyuhub_entities_total Total count of entities by type
# TYPE hallyuhub_entities_total gauge
hallyuhub_entities_total{type="artist"} ${artistCount}
hallyuhub_entities_total{type="production"} ${productionCount}
hallyuhub_entities_total{type="news"} ${newsCount}
hallyuhub_entities_total{type="agency"} ${agencyCount}

# HELP hallyuhub_active_users Unique logged-in users with activity by time window
# TYPE hallyuhub_active_users gauge
hallyuhub_active_users{window="5m"} ${Number(c5m)}
hallyuhub_active_users{window="15m"} ${Number(c15m)}
hallyuhub_active_users{window="1h"} ${Number(c1h)}

# HELP hallyuhub_blog_entity_invalid_discards_total Total invalid blog entity IDs discarded by type
# TYPE hallyuhub_blog_entity_invalid_discards_total gauge
hallyuhub_blog_entity_invalid_discards_total{type="artist",scope="process"} ${discardTotals.artists}
hallyuhub_blog_entity_invalid_discards_total{type="group",scope="process"} ${discardTotals.groups}
hallyuhub_blog_entity_invalid_discards_total{type="production",scope="process"} ${discardTotals.productions}
hallyuhub_blog_entity_invalid_discards_total{type="all",scope="process"} ${discardTotals.total}

# HELP hallyuhub_blog_entity_invalid_discards_today Total invalid blog entity IDs discarded today
# TYPE hallyuhub_blog_entity_invalid_discards_today gauge
hallyuhub_blog_entity_invalid_discards_today{type="artist"} ${discardTodayStats.artists}
hallyuhub_blog_entity_invalid_discards_today{type="group"} ${discardTodayStats.groups}
hallyuhub_blog_entity_invalid_discards_today{type="production"} ${discardTodayStats.productions}
hallyuhub_blog_entity_invalid_discards_today{type="all"} ${discardTodayStats.total}
`.trim();

        return new NextResponse(metrics, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });

    } catch (err) {
        log.error('Metrics collection error', { error: getErrorMessage(err) });
        // Retorna metricas de erro
        const errorMetrics = `
# HELP hallyuhub_up Application is up
# TYPE hallyuhub_up gauge
hallyuhub_up 0

# HELP hallyuhub_errors_total Total errors
# TYPE hallyuhub_errors_total counter
hallyuhub_errors_total{type="metrics_collection"} 1
`.trim();

        return new NextResponse(errorMetrics, {
            status: 200, // Prometheus espera 200 mesmo com erros
            headers: {
                'Content-Type': 'text/plain; version=0.0.4; charset=utf-8'
            }
        });
    }
}
