/**
 * POST /api/admin/news/dedup
 *
 * Remove artigos duplicados causados por URLs com/sem parâmetros UTM.
 * Para cada grupo de artigos com a mesma URL canônica (após strip de UTM),
 * mantém o registro com o conteúdo mais completo (maior originalContent).
 * Em caso de empate, mantém o mais antigo (createdAt).
 * Apaga os demais junto com seus vínculos NewsArtist.
 * Também normaliza o sourceUrl do registro mantido (remove UTM).
 *
 * GET /api/admin/news/dedup[?source=<source>]
 *   Retorna { groups: number, duplicates: number } — preview sem remover.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { normalizeSourceUrl } from '@/lib/utils/url'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// ─── GET: preview ──────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const source = new URL(request.url).searchParams.get('source') || undefined

    const allNews = await prisma.news.findMany({
        where: {
            sourceUrl: { not: '' },
            ...(source ? { source } : {}),
        },
        select: { id: true, sourceUrl: true },
    })

    // Agrupa por URL canônica
    const groups = new Map<string, string[]>()
    for (const n of allNews) {
        const canonical = normalizeSourceUrl(n.sourceUrl)
        const group = groups.get(canonical) ?? []
        group.push(n.id)
        groups.set(canonical, group)
    }

    const dupGroups = Array.from(groups.values()).filter(g => g.length > 1)
    const totalDuplicates = dupGroups.reduce((sum, g) => sum + g.length - 1, 0)

    return NextResponse.json({
        groups: dupGroups.length,
        duplicates: totalDuplicates,
    })
}

// ─── POST: remove duplicatas ──────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const source = new URL(request.url).searchParams.get('source') || undefined

    const allNews = await prisma.news.findMany({
        where: {
            sourceUrl: { not: '' },
            ...(source ? { source } : {}),
        },
        select: { id: true, sourceUrl: true, originalContent: true, createdAt: true },
        orderBy: [{ createdAt: 'asc' }],
    })

    // Agrupa por URL canônica
    const groups = new Map<string, typeof allNews>()
    for (const n of allNews) {
        const canonical = normalizeSourceUrl(n.sourceUrl)
        const group = groups.get(canonical) ?? []
        group.push(n)
        groups.set(canonical, group)
    }

    let totalDeleted = 0
    let totalNormalized = 0

    for (const [canonical, records] of Array.from(groups.entries())) {
        if (records.length === 1) {
            // Único — só normaliza o sourceUrl se necessário
            const r = records[0]
            if (r.sourceUrl !== canonical) {
                await prisma.news.update({ where: { id: r.id }, data: { sourceUrl: canonical } })
                totalNormalized++
            }
            continue
        }

        // Múltiplos — ordena: conteúdo mais longo primeiro, depois mais antigo
        type NewsRecord = { id: string; sourceUrl: string; originalContent: string | null; createdAt: Date }
        const sorted = (records as NewsRecord[]).slice().sort((a, b) => {
            const la = (a.originalContent ?? '').length
            const lb = (b.originalContent ?? '').length
            if (la !== lb) return lb - la
            return a.createdAt.getTime() - b.createdAt.getTime()
        })

        const keep = sorted[0]
        const toDelete = sorted.slice(1).map((r: NewsRecord) => r.id)

        // Remove duplicatas primeiro (NewsArtist tem onDelete: Cascade no schema)
        // DEVE ser antes de normalizar o sourceUrl do keep para evitar unique constraint
        // (o duplicado pode já ter a URL canônica, causando violação se atualizar antes de deletar)
        await prisma.news.deleteMany({ where: { id: { in: toDelete } } })
        totalDeleted += toDelete.length

        // Normaliza URL do registro mantido (agora seguro pois duplicados foram removidos)
        if (keep.sourceUrl !== canonical) {
            await prisma.news.update({ where: { id: keep.id }, data: { sourceUrl: canonical } })
            totalNormalized++
        }
    }

    return NextResponse.json({
        ok: true,
        deleted: totalDeleted,
        normalized: totalNormalized,
    })
}
