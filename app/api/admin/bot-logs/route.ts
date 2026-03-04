/**
 * GET /api/admin/bot-logs
 * Lista logs de crawls de robôs com paginação, filtros e stats.
 *
 * Query params:
 *   bot    - filtrar por nome do bot
 *   path   - filtrar por path (contém)
 *   days   - janela de dias (default: 7)
 *   page   - página (default: 1)
 *   limit  - itens por página (default: 50, max: 200)
 *   stats  - se '1', retorna apenas aggregates (sem lista)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const sp = request.nextUrl.searchParams
    const bot = sp.get('bot') || ''
    const path = sp.get('path') || ''
    const days = Math.min(90, Math.max(1, parseInt(sp.get('days') || '7')))
    const page = Math.max(1, parseInt(sp.get('page') || '1'))
    const limit = Math.min(200, Math.max(1, parseInt(sp.get('limit') || '50')))
    const statsOnly = sp.get('stats') === '1'

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const where = {
        createdAt: { gte: since },
        ...(bot ? { bot } : {}),
        ...(path ? { path: { contains: path } } : {}),
    }

    if (statsOnly) {
        const botCondition = bot ? Prisma.sql`AND bot = ${bot}` : Prisma.empty
        const pathCondition = path ? Prisma.sql`AND path ILIKE ${`%${path}%`}` : Prisma.empty

        const [total, byBot, topPaths, timeline] = await Promise.all([
            prisma.botCrawlLog.count({ where }),
            prisma.botCrawlLog.groupBy({
                by: ['bot'],
                where,
                _count: { bot: true },
                orderBy: { _count: { bot: 'desc' } },
            }),
            prisma.botCrawlLog.groupBy({
                by: ['path'],
                where,
                _count: { path: true },
                orderBy: { _count: { path: 'desc' } },
                take: 10,
            }),
            prisma.$queryRaw<{ date: Date; count: bigint }[]>(
                Prisma.sql`
                    SELECT DATE_TRUNC('day', "createdAt")::date AS date, COUNT(*) AS count
                    FROM bot_crawl_log
                    WHERE "createdAt" >= ${since} ${botCondition} ${pathCondition}
                    GROUP BY 1
                    ORDER BY 1 ASC
                `
            ),
        ])

        return NextResponse.json({
            total,
            byBot: byBot.map((r: { bot: string; _count: { bot: number } }) => ({ bot: r.bot, count: r._count.bot })),
            topPaths: topPaths.map((r: { path: string; _count: { path: number } }) => ({ path: r.path, count: r._count.path })),
            timeline: timeline.map(r => ({
                date: r.date.toISOString().split('T')[0],
                count: Number(r.count),
            })),
            days,
        })
    }

    const [logs, total] = await Promise.all([
        prisma.botCrawlLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.botCrawlLog.count({ where }),
    ])

    return NextResponse.json({
        logs,
        total,
        page,
        pages: Math.ceil(total / limit),
        days,
    })
}
