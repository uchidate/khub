/**
 * POST /api/cron/tag-news
 *
 * Cron para enriquecimento de tags de notícias via Ollama.
 * Processa notícias com translationStatus='pending' e gera tags semânticas.
 *
 * Query params:
 *   ?limit=N    → máximo de notícias por execução (padrão: 20)
 *   ?dry=true   → testa sem salvar
 *
 * Auth: Bearer token via Authorization header ou ?token=
 *
 * Exemplo de cron-job.org:
 *   POST .../tag-news?limit=20&token=...   (a cada 15 min)
 */
import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/utils/logger'
import { onCronError } from '@/lib/utils/cron-logger'
import { getNewsTaggingService } from '@/lib/services/news-tagging-service'

export const maxDuration = 120

const log = createLogger('CRON-TAG-NEWS')

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

async function runTagNews(limit: number): Promise<{ tagged: number; failed: number; skipped: number }> {
  const service = getNewsTaggingService(prisma)
  const result = await service.translatePendingNews(limit)
  return { tagged: result.translated, failed: result.failed, skipped: result.skipped }
}

export async function POST(request: NextRequest) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limit = Math.min(50, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') ?? '20')))
  const dryRun = request.nextUrl.searchParams.get('dry') === 'true'
  const requestId = `tag-news-${Date.now()}`

  log.info('News tagging cron started', { limit, dryRun, requestId })

  if (dryRun) {
    const pending = await prisma.news.count({ where: { translationStatus: 'pending' } })
    return NextResponse.json({ success: true, status: 'dry-run', pending, requestId })
  }

  runTagNews(limit)
    .then(result => {
      log.info('News tagging completed', { requestId, ...result })
    })
    .catch(onCronError(log, 'cron-tag-news', 'News tagging fatal error'))

  return NextResponse.json({
    success: true,
    status: 'accepted',
    message: `Enriquecendo tags de até ${limit} notícias pendentes`,
    requestId,
  }, { status: 202 })
}

export async function GET(request: NextRequest) {
  return POST(request)
}
