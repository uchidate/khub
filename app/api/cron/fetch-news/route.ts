/**
 * POST/GET /api/cron/fetch-news
 *
 * Cron de busca de notícias via WordPress REST API.
 * Usa a mesma lógica do import manual (/api/admin/news/import):
 *   - WP API (date_gmt) como fonte authoritative — sem derivação de datas via RSS
 *   - importOne() com correção automática de publishedAt quando necessário
 *   - Delay de 1500ms apenas para artigos realmente novos (não para os que já existem)
 *
 * Query params:
 *   ?source=Soompi   → busca apenas essa fonte (case-sensitive, conforme WP_API_BASES)
 *   (sem source)     → busca todas as fontes sequencialmente
 *   ?daysBack=N      → busca artigos dos últimos N dias (padrão: 1)
 *   ?dry=true        → descobre artigos sem importar (só conta)
 *
 * Auth: Bearer token via Authorization header ou ?token=
 *
 * Fontes disponíveis: Soompi, Koreaboo, Dramabeans, Asian Junkie, HelloKpop, Kpopmap
 *
 * Exemplos de cron-job.org:
 *   POST .../fetch-news?source=Soompi&token=...      (a cada 30 min)
 *   POST .../fetch-news?source=Koreaboo&token=...    (a cada 30 min)
 *   POST .../fetch-news?source=Dramabeans&token=...  (a cada 2 horas)
 *   POST .../fetch-news?source=Asian+Junkie&token=...  (a cada 2 horas)
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createLogger } from '@/lib/utils/logger'
import { onCronError } from '@/lib/utils/cron-logger'
import { WP_API_BASES, discoverViaWPAPI, importOne } from '@/lib/services/news-import-service'

export const maxDuration = 300

const log = createLogger('CRON-FETCH-NEWS')
const IMPORT_DELAY_MS = 1500 // respeitado apenas para artigos realmente novos

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

interface SourceResult {
    source:    string
    discovered: number
    imported:  number
    exists:    number
    errors:    number
    duration_ms: number
}

async function fetchSourceNews(
    sourceName: string,
    dateFrom: Date,
    dateTo: Date,
    dryRun: boolean,
): Promise<SourceResult> {
    const t = Date.now()
    const result: SourceResult = { source: sourceName, discovered: 0, imported: 0, exists: 0, errors: 0, duration_ms: 0 }

    const articles = await discoverViaWPAPI(sourceName, dateFrom, dateTo, 500)
    result.discovered = articles.length

    if (dryRun) {
        result.duration_ms = Date.now() - t
        return result
    }

    for (let i = 0; i < articles.length; i++) {
        try {
            const r = await importOne(articles[i], sourceName)
            if (r === 'imported') {
                result.imported++
                // Delay apenas para artigos realmente importados (evita rate limiting)
                if (i < articles.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, IMPORT_DELAY_MS))
                }
            } else if (r === 'exists') {
                result.exists++
            } else {
                result.errors++
            }
        } catch {
            result.errors++
        }
    }

    result.duration_ms = Date.now() - t
    return result
}

/** Sanitiza nome de fonte para logs — remove caracteres de controle (newline injection) */
function sanitizeForLog(value: string): string {
    return value.replace(/[\r\n\t\x00-\x1f\x7f]/g, '')
}

async function runFetchNews(
    source: string | null,
    daysBack: number,
    dryRun: boolean,
): Promise<SourceResult[]> {
    const sources = source ? [source] : Object.keys(WP_API_BASES)
    const dateTo   = new Date()
    const dateFrom = new Date(dateTo.getTime() - daysBack * 86_400_000)

    const results: SourceResult[] = []

    for (const src of sources) {
        const safeSrc = sanitizeForLog(src)
        if (!WP_API_BASES[src]) {
            log.warn(`Fonte desconhecida: ${safeSrc}`)
            continue
        }
        log.info(`Buscando ${safeSrc} (últimos ${daysBack} dia(s))`)
        try {
            const result = await fetchSourceNews(src, dateFrom, dateTo, dryRun)
            log.info(`${safeSrc}: discovered=${result.discovered} imported=${result.imported} exists=${result.exists} errors=${result.errors} (${result.duration_ms}ms)`)
            results.push(result)
        } catch (err) {
            log.error(`${safeSrc} falhou: ${String(err)}`)
            results.push({ source: src, discovered: 0, imported: 0, exists: 0, errors: 1, duration_ms: 0 })
        }
    }

    return results
}

export async function POST(request: NextRequest) {
    if (!verifyToken(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sp = request.nextUrl.searchParams
    const source   = sp.get('source') || null
    const daysBack = Math.min(30, Math.max(1, parseInt(sp.get('daysBack') ?? '1')))
    const dryRun   = sp.get('dry') === 'true'
    const requestId = `fetch-news-${Date.now()}`

    log.info('News fetch cron started', { source: source ?? 'all', daysBack, dryRun, requestId })

    runFetchNews(source, daysBack, dryRun)
        .then(results => {
            const totalImported = results.reduce((s, r) => s + r.imported, 0)
            const totalErrors   = results.reduce((s, r) => s + r.errors,  0)
            log.info('News fetch completed', { requestId, totalImported, totalErrors, results })
        })
        .catch(onCronError(log, 'cron-fetch-news', 'News fetch fatal error'))

    return NextResponse.json({
        success: true,
        status: 'accepted',
        message: `Buscando notícias de: ${source ?? 'todas as fontes'} (últimos ${daysBack} dia(s))`,
        requestId,
        dryRun,
    }, { status: 202 })
}

// GET suportado (cron-job.org pode usar GET)
export async function GET(request: NextRequest) {
    return POST(request)
}
