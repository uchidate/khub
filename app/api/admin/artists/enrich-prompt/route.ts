import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(req.url)
    const artistId = searchParams.get('artistId')

    const promptPath = join(process.cwd(), 'prompts', 'idol-enrich.md')
    const currentYear = new Date().getFullYear()
    const prompt = readFileSync(promptPath, 'utf-8')
        .replace(/\b2025\b/g, String(currentYear))
        .replace(/\b2023-2025\b/g, `${currentYear - 2}-${currentYear}`)

    let productions: string[] = []
    if (artistId) {
        const prods = await prisma.production.findMany({
            where: {
                artists: { some: { artistId } },
                isHidden: false,
            },
            select: { titlePt: true, year: true },
            orderBy: { year: 'desc' },
            take: 8,
        })
        productions = prods
            .filter((p): p is typeof p & { titlePt: string } => !!p.titlePt)
            .map(p => `${p.titlePt}${p.year ? ` (${p.year})` : ''}`)
            .slice(0, 4)
    }

    return NextResponse.json({ prompt, productions })
}
