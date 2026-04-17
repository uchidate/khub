import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'
import { assertBudgetAvailable, getBudgetStatus } from '@/lib/ai/budget-guard'
import {
    generateNewsEditorialNote,
    EDITORIAL_COST_ESTIMATES,
} from '@/lib/ai/generators/editorial-generator'

export const dynamic = 'force-dynamic'

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params

    const news = await prisma.news.findUnique({
        where: { id },
        select: { title: true, editorialNote: true, editorialNoteGeneratedAt: true },
    })

    if (!news) return NextResponse.json({ error: 'Notícia não encontrada' }, { status: 404 })

    const budget = await getBudgetStatus('news_editorial_note')

    return NextResponse.json({
        hasNote: !!news.editorialNote,
        editorialNoteGeneratedAt: news.editorialNoteGeneratedAt,
        estimate: EDITORIAL_COST_ESTIMATES.news_editorial_note,
        budget,
    })
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const body = await req.json() as { overwrite?: boolean }

    const news = await prisma.news.findUnique({
        where: { id },
        select: { title: true, contentMd: true, source: true, editorialNote: true },
    })

    if (!news) return NextResponse.json({ error: 'Notícia não encontrada' }, { status: 404 })

    if (!body.overwrite && news.editorialNote) {
        return NextResponse.json({ error: 'Já possui nota. Use overwrite: true para substituir.' }, { status: 409 })
    }

    try {
        await assertBudgetAvailable('news_editorial_note')
        const r = await generateNewsEditorialNote(news)

        await prisma.news.update({
            where: { id },
            data: { editorialNote: r.editorialNote, editorialNoteGeneratedAt: new Date() },
        })

        return NextResponse.json({ editorialNote: r.editorialNote, totalCostUsd: r.cost })
    } catch (err) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
    }
}
