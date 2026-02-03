import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Metricas no formato Prometheus
export async function GET() {
    const startTime = Date.now();

    try {
        // Coleta metricas do banco
        const [
            artistCount,
            productionCount,
            newsCount,
            agencyCount
        ] = await Promise.all([
            prisma.artist.count(),
            prisma.production.count(),
            prisma.news.count(),
            prisma.agency.count()
        ]);

        const dbLatency = Date.now() - startTime;
        const uptime = process.uptime();
        const memUsage = process.memoryUsage();

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
`.trim();

        return new NextResponse(metrics, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });

    } catch (error) {
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
