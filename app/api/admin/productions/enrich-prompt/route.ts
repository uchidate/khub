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
    const productionId = searchParams.get('productionId')

    const promptPath = join(process.cwd(), 'prompts', 'production-enrich.md')
    const prompt = readFileSync(promptPath, 'utf-8')

    let context = ''
    if (productionId) {
        const prod = await prisma.production.findUnique({
            where: { id: productionId },
            select: {
                titlePt: true,
                titleKr: true,
                year: true,
                network: true,
                type: true,
                episodeCount: true,
                synopsis: true,
                voteAverage: true,
                voteCount: true,
                artists: {
                    include: { artist: { select: { nameRomanized: true } } },
                    orderBy: { castOrder: 'asc' },
                    take: 4,
                },
            },
        })

        if (prod) {
            const cast = prod.artists.map(a => a.artist.nameRomanized).join(', ')
            const parts = [
                prod.titleKr ? `${prod.titlePt} (${prod.titleKr})` : prod.titlePt,
                prod.year ? String(prod.year) : null,
                prod.network ?? null,
                prod.type,
                prod.episodeCount ? `${prod.episodeCount} episódios` : null,
                cast ? `Elenco: ${cast}` : null,
                prod.voteAverage && prod.voteCount && prod.voteCount >= 50 ? `Nota TMDB: ${prod.voteAverage.toFixed(1)}/10 (${prod.voteCount} votos)` : null,
            ].filter(Boolean)
            context = parts.join(' · ')
            if (prod.synopsis) context += `\n\nSinopse atual (pode estar em inglês/coreano — use como referência):\n${prod.synopsis}`
        }
    }

    return NextResponse.json({ prompt, context })
}
