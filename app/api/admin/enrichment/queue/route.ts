import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { EDITORIAL_COST_ESTIMATES } from '@/lib/ai/generators/editorial-generator'

export const dynamic = 'force-dynamic'

export type QueueTab = 'artists' | 'productions' | 'news'

export interface QueueItem {
    id:               string
    name:             string
    imageUrl?:        string
    subtitle?:        string
    missingFields:    string[]
    presentFields:    string[]
    totalFields:      number
    completenessScore: number   // 0-100
    priority:         number
    estimatedCost:    number
}

export interface QueueResponse {
    items:             QueueItem[]
    total:             number
    totalCostEstimate: number
}

export async function GET(req: Request) {
    const { error } = await requireAdmin()
    if (error) return error

    const url   = new URL(req.url)
    const tab   = (url.searchParams.get('tab') ?? 'artists') as QueueTab
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '30'), 100)

    let items: QueueItem[] = []
    let total = 0
    let totalCostEstimate = 0

    if (tab === 'artists') {
        const artists = await prisma.artist.findMany({
            where: {
                isHidden:           false,
                flaggedAsNonKorean: false,
                OR: [
                    { bio:             null },
                    { analiseEditorial: null },
                    { curiosidades:    { isEmpty: true } },
                ],
            },
            select: {
                id:              true,
                nameRomanized:   true,
                nameHangul:      true,
                primaryImageUrl: true,
                roles:           true,
                bio:             true,
                analiseEditorial: true,
                curiosidades:    true,
                trendingScore:   true,
            },
            orderBy: { trendingScore: 'desc' },
            take: limit,
        })

        total = await prisma.artist.count({
            where: {
                isHidden:           false,
                flaggedAsNonKorean: false,
                OR: [
                    { bio:             null },
                    { analiseEditorial: null },
                    { curiosidades:    { isEmpty: true } },
                ],
            },
        })

        items = artists.map(a => {
            const missingFields: string[] = []
            const presentFields: string[] = []

            if (!a.bio)             missingFields.push('bio')
            else                    presentFields.push('bio')
            if (!a.analiseEditorial) missingFields.push('editorial')
            else                    presentFields.push('editorial')
            if (!a.curiosidades?.length) missingFields.push('curiosidades')
            else                    presentFields.push('curiosidades')

            const totalFields = 3
            const completenessScore = Math.round((presentFields.length / totalFields) * 100)

            const costMap: Record<string, number> = {
                bio:          EDITORIAL_COST_ESTIMATES.artist_bio_enrichment,
                editorial:    EDITORIAL_COST_ESTIMATES.artist_editorial,
                curiosidades: EDITORIAL_COST_ESTIMATES.artist_curiosidades,
            }
            const estimatedCost = missingFields.reduce((sum, f) => sum + (costMap[f] ?? 0), 0)

            return {
                id:               a.id,
                name:             a.nameRomanized,
                imageUrl:         a.primaryImageUrl ?? undefined,
                subtitle:         [a.roles?.[0], a.nameHangul].filter(Boolean).join(' · '),
                missingFields,
                presentFields,
                totalFields,
                completenessScore,
                priority:         a.trendingScore,
                estimatedCost,
            }
        })

        totalCostEstimate = items.reduce((sum, i) => sum + i.estimatedCost, 0)
    }

    if (tab === 'productions') {
        const productions = await prisma.production.findMany({
            where: {
                isHidden:           false,
                flaggedAsNonKorean: false,
                editorialReview:    null,
            },
            select: {
                id:           true,
                titlePt:      true,
                titleKr:      true,
                type:         true,
                year:         true,
                imageUrl:     true,
                voteAverage:  true,
                editorialReview: true,
            },
            orderBy: { voteAverage: 'desc' },
            take: limit,
        })

        total = await prisma.production.count({
            where: {
                isHidden:           false,
                flaggedAsNonKorean: false,
                editorialReview:    null,
            },
        })

        items = productions.map(p => ({
            id:               p.id,
            name:             p.titlePt,
            imageUrl:         p.imageUrl ?? undefined,
            subtitle:         [p.type, p.year?.toString()].filter(Boolean).join(' · '),
            missingFields:    ['review'],
            presentFields:    [],
            totalFields:      1,
            completenessScore: 0,
            priority:         p.voteAverage ?? 0,
            estimatedCost:    EDITORIAL_COST_ESTIMATES.production_review,
        }))

        totalCostEstimate = items.reduce((sum, i) => sum + i.estimatedCost, 0)
    }

    if (tab === 'news') {
        const newsList = await prisma.news.findMany({
            where: {
                isHidden: false,
                status:   'published',
                OR: [
                    { editorialNote:      null },
                    { blogPostGeneratedAt: null },
                ],
            },
            select: {
                id:                  true,
                title:               true,
                imageUrl:            true,
                source:              true,
                contentType:         true,
                publishedAt:         true,
                editorialNote:       true,
                blogPostGeneratedAt: true,
            },
            orderBy: { publishedAt: 'desc' },
            take: limit,
        })

        total = await prisma.news.count({
            where: {
                isHidden: false,
                status:   'published',
                OR: [
                    { editorialNote:      null },
                    { blogPostGeneratedAt: null },
                ],
            },
        })

        items = newsList.map(n => {
            const missingFields: string[] = []
            const presentFields: string[] = []

            if (!n.editorialNote)      missingFields.push('nota')
            else                       presentFields.push('nota')
            if (!n.blogPostGeneratedAt) missingFields.push('blog')
            else                       presentFields.push('blog')

            const totalFields = 2
            const completenessScore = Math.round((presentFields.length / totalFields) * 100)

            const costMap: Record<string, number> = {
                nota: EDITORIAL_COST_ESTIMATES.news_editorial_note,
                blog: EDITORIAL_COST_ESTIMATES.blog_post_generation,
            }
            const estimatedCost = missingFields.reduce((sum, f) => sum + (costMap[f] ?? 0), 0)

            const pubDate = new Date(n.publishedAt)
            const now     = new Date()
            const ageHours = (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60)
            const recencyScore = Math.max(0, 100 - ageHours / 24) // more recent = higher priority

            return {
                id:               n.id,
                name:             n.title,
                imageUrl:         n.imageUrl ?? undefined,
                subtitle:         [n.source, n.contentType].filter(Boolean).join(' · '),
                missingFields,
                presentFields,
                totalFields,
                completenessScore,
                priority:         recencyScore,
                estimatedCost,
            }
        })

        totalCostEstimate = items.reduce((sum, i) => sum + i.estimatedCost, 0)
    }

    return NextResponse.json({ items, total, totalCostEstimate } satisfies QueueResponse)
}
