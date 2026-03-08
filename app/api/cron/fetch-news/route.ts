/**
 * POST /api/cron/fetch-news
 *
 * Cron dedicado para busca de notícias RSS por fonte.
 * Substitui (ou complementa) a lógica de news do /api/cron/update,
 * permitindo chamar cada fonte independentemente para isolamento de falhas.
 *
 * Query params:
 *   ?source=Soompi    → busca apenas dessa fonte (case-insensitive)
 *   (sem source)      → busca de todas as fontes, uma por vez
 *   ?limit=N          → máximo de itens por fonte (padrão: 20)
 *   ?dry=true         → testa RSS sem salvar no banco
 *
 * Auth: Bearer token via Authorization header ou ?token=
 *
 * Fontes disponíveis:
 *   Soompi, Koreaboo, KpopStarz, Dramabeans, Asian Junkie
 *
 * Exemplos de cron-job.org:
 *   POST .../fetch-news?source=Soompi&token=...     (a cada 30 min)
 *   POST .../fetch-news?source=Koreaboo&token=...   (a cada 30 min)
 *   POST .../fetch-news?source=Dramabeans&token=... (a cada 2 horas)
 *   POST .../fetch-news?source=Asian+Junkie&token=... (a cada 2 horas)
 *
 * Retorno: 202 Accepted — processamento em background.
 */
import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/utils/logger'
import { onCronError } from '@/lib/utils/cron-logger'
import { normalizeSourceUrl } from '@/lib/utils/url'
import { getErrorMessage } from '@/lib/utils/error'

export const maxDuration = 120

const log = createLogger('CRON-FETCH-NEWS')

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
  source: string
  fetched: number
  saved: number
  skipped: number
  errors: string[]
  duration_ms: number
}

async function fetchAndSaveNewsFromSource(
  sourceName: string,
  maxItems: number,
  existingUrls: Set<string>,
  dryRun: boolean,
): Promise<SourceResult> {
  const t = Date.now()
  const result: SourceResult = {
    source: sourceName,
    fetched: 0,
    saved: 0,
    skipped: 0,
    errors: [],
    duration_ms: 0,
  }

  const { getRSSNewsService } = await import('@/lib/services/rss-news-service')
  const { getNewsArtistExtractionService } = await import('@/lib/services/news-artist-extraction-service')
  const rssService = getRSSNewsService()
  const extractionService = getNewsArtistExtractionService(prisma)

  const items = await rssService.fetchFromSource(sourceName, maxItems)
  result.fetched = items.length

  if (dryRun) {
    result.skipped = items.filter(i => existingUrls.has(normalizeSourceUrl(i.link))).length
    result.saved = items.length - result.skipped
    result.duration_ms = Date.now() - t
    return result
  }

  for (const item of items) {
    const canonicalUrl = normalizeSourceUrl(item.link)
    if (existingUrls.has(canonicalUrl)) {
      result.skipped++
      continue
    }

    try {
      const content = item.content || item.description || ''

      const savedNews = await prisma.news.upsert({
        where: { sourceUrl: canonicalUrl },
        // Não atualiza publishedAt no upsert — evita derivação de datas via RSS
        // A data só é definida na criação (authoritative: WP API date_gmt via import)
        update: {
          imageUrl: item.imageUrl ?? null,
        },
        create: {
          title: item.title,
          contentMd: content,
          sourceUrl: canonicalUrl,
          originalTitle: item.title,
          originalContent: content,
          imageUrl: item.imageUrl ?? null,
          tags: item.categories ?? [],
          publishedAt: item.publishedAt,
          source: sourceName,
          translationStatus: 'pending',
          author:         item.author         ?? null,
          contentType:    item.contentType    ?? null,
          readingTimeMin: item.readingTimeMin ?? null,
        },
      })

      existingUrls.add(canonicalUrl)
      result.saved++

      // Vincular artistas mencionados (falha graciosamente)
      try {
        const mentions = await extractionService.extractArtists(item.title, content)
        for (const mention of mentions) {
          await prisma.newsArtist.upsert({
            where: { newsId_artistId: { newsId: savedNews.id, artistId: mention.artistId } },
            update: {},
            create: { newsId: savedNews.id, artistId: mention.artistId },
          })
        }
      } catch {
        // artist extraction is best-effort
      }
    } catch (saveErr) {
      result.errors.push(getErrorMessage(saveErr))
    }
  }

  result.duration_ms = Date.now() - t
  return result
}

async function runFetchNews(
  source: string | null,
  maxItems: number,
  dryRun: boolean,
): Promise<SourceResult[]> {
  const { getRSSNewsService } = await import('@/lib/services/rss-news-service')
  const rssService = getRSSNewsService()
  const availableFeeds = rssService.getAvailableFeeds()

  const sourcesToFetch = source
    ? availableFeeds.filter(f => f.name.toLowerCase() === source.toLowerCase())
    : availableFeeds

  if (sourcesToFetch.length === 0) {
    throw new Error(
      `Fonte desconhecida: "${source}". Disponíveis: ${availableFeeds.map(f => f.name).join(', ')}`
    )
  }

  // Buscar URLs já salvas para deduplicação
  const existingUrls = dryRun
    ? new Set<string>()
    : new Set(
        (await prisma.news.findMany({ select: { sourceUrl: true } })).map(n => n.sourceUrl)
      )

  const results: SourceResult[] = []

  for (const feed of sourcesToFetch) {
    log.info(`Processing source: ${feed.name}`)
    try {
      const result = await fetchAndSaveNewsFromSource(feed.name, maxItems, existingUrls, dryRun)
      log.info(`${feed.name}: saved=${result.saved} skipped=${result.skipped} errors=${result.errors.length} (${result.duration_ms}ms)`)
      results.push(result)
    } catch (err) {
      const msg = getErrorMessage(err)
      log.error(`${feed.name} failed: ${msg}`)
      results.push({
        source: feed.name,
        fetched: 0,
        saved: 0,
        skipped: 0,
        errors: [msg],
        duration_ms: 0,
      })
    }
  }

  return results
}

export async function POST(request: NextRequest) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const source = request.nextUrl.searchParams.get('source') || null
  const maxItems = Math.min(50, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') ?? '20')))
  const dryRun = request.nextUrl.searchParams.get('dry') === 'true'
  const requestId = `fetch-news-${Date.now()}`

  log.info('News fetch cron started', { source: source ?? 'all', maxItems, dryRun, requestId })

  runFetchNews(source, maxItems, dryRun)
    .then(results => {
      const totalSaved = results.reduce((s, r) => s + r.saved, 0)
      const totalErrors = results.flatMap(r => r.errors).length
      log.info('News fetch completed', { requestId, totalSaved, totalErrors, results })
    })
    .catch(onCronError(log, 'cron-fetch-news', 'News fetch fatal error'))

  return NextResponse.json({
    success: true,
    status: 'accepted',
    message: `Buscando notícias de: ${source ?? 'todas as fontes'}`,
    requestId,
    dryRun,
  }, { status: 202 })
}

// GET suportado (cron-job.org pode usar GET)
export async function GET(request: NextRequest) {
  return POST(request)
}
