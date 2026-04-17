import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import OpenAI from 'openai'
import { z } from 'zod'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('ADULT_CHECK')

export const dynamic = 'force-dynamic'
// Permitir até 5 min para análise em lote
export const maxDuration = 300

/**
 * GET /api/admin/productions/adult-check
 * Retorna contagem de registros verificados vs. não verificados
 */
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const [total, noRating, checked, uncheckedNoRating, isAdult, notAdult] = await Promise.all([
      prisma.production.count(),
      prisma.production.count({ where: { ageRating: null } }),
      prisma.production.count({ where: { adultCheckedAt: { not: null } } }),
      prisma.production.count({ where: { adultCheckedAt: null, ageRating: null } }),
      prisma.production.count({ where: { isAdultContent: true } }),
      prisma.production.count({ where: { isAdultContent: false } }),
    ])
    return NextResponse.json({
      total, noRating, checked, unchecked: total - checked,
      uncheckedNoRating, isAdult, notAdult,
    })
  } catch (err) {
    log.error('Failed to fetch adult-check stats', { error: getErrorMessage(err) })
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
  }
}

const bodySchema = z.object({
  /** Quantos registros analisar nesta chamada (máx 50) */
  limit: z.number().int().min(1).max(50).default(20),
  /** true = só os não verificados ainda, false = todos (re-verificar tudo) */
  onlyUnchecked: z.boolean().default(true),
  /** true = só as sem classificação etária (economiza tokens: classificadas pelo DJCTQ já foram avaliadas) */
  onlyNoRating: z.boolean().default(true),
})

/**
 * POST /api/admin/productions/adult-check
 * Analisa produções via DeepSeek e marca isAdultContent + adultCheckedAt
 *
 * Body: { limit: number; onlyUnchecked: boolean }
 *
 * Retorna SSE (text/event-stream):
 *   data: { type: 'progress', done: n, total: n, id, title, isAdult }
 *   data: { type: 'done', results: [...] }
 *   data: { type: 'error', message: string }
 */
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  if (!process.env.DEEPSEEK_API_KEY) {
    return NextResponse.json({ error: 'DEEPSEEK_API_KEY não configurada' }, { status: 503 })
  }

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await request.json())
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: err.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { limit, onlyUnchecked, onlyNoRating } = body

  const productions = await prisma.production.findMany({
    where: {
      ...(onlyUnchecked ? { adultCheckedAt: null } : {}),
      ...(onlyNoRating ? { ageRating: null } : {}),
    },
    select: {
      id: true,
      titlePt: true,
      titleKr: true,
      synopsis: true,
      tags: true,
      type: true,
    },
    take: limit,
    orderBy: { createdAt: 'asc' },
  })

  if (productions.length === 0) {
    return NextResponse.json({ message: 'Nenhum registro para verificar', results: [] })
  }

  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
  })

  // SSE stream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      const results: { id: string; title: string; isAdult: boolean }[] = []

      for (let i = 0; i < productions.length; i++) {
        const prod = productions[i]
        const title = prod.titlePt
        const extra = [
          prod.titleKr ? `Título coreano: ${prod.titleKr}` : '',
          prod.synopsis ? `Sinopse: ${prod.synopsis.slice(0, 400)}` : '',
          prod.tags.length ? `Tags: ${prod.tags.join(', ')}` : '',
        ].filter(Boolean).join('\n')

        const prompt = `Você é um moderador de conteúdo. Analise se a produção abaixo é conteúdo adulto explícito (pornografia, filmes para adultos, AV, JAV, gravure, conteúdo sexual explícito).

Produção: "${title}"
${extra}

Responda APENAS com JSON: {"isAdult": true} ou {"isAdult": false}
Não inclua mais nada.`

        try {
          const response = await client.chat.completions.create({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0,
            max_tokens: 20,
            response_format: { type: 'json_object' },
          })

          const raw = response.choices[0]?.message?.content?.trim() ?? '{}'
          let isAdult = false
          try {
            isAdult = JSON.parse(raw).isAdult === true
          } catch { /* default false */ }

          await prisma.production.update({
            where: { id: prod.id },
            data: { isAdultContent: isAdult, adultCheckedAt: new Date() },
          })

          results.push({ id: prod.id, title, isAdult })
          send({ type: 'progress', done: i + 1, total: productions.length, id: prod.id, title, isAdult })
        } catch (err) {
          log.error('DeepSeek adult check failed for production', { id: prod.id, error: getErrorMessage(err) })
          send({ type: 'progress', done: i + 1, total: productions.length, id: prod.id, title, isAdult: null, error: true })
        }
      }

      send({ type: 'done', results })
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
