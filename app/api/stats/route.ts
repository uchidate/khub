import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // Cache por 5 minutos

export async function GET() {
    try {
        const [artistCount, productionCount, newsCount, totalViews] = await Promise.all([
            prisma.artist.count(),
            prisma.production.count(),
            prisma.news.count(),
            prisma.artist.aggregate({
                _sum: {
                    viewCount: true
                }
            })
        ])

        return NextResponse.json({
            artists: artistCount,
            productions: productionCount,
            news: newsCount,
            views: totalViews._sum.viewCount || 0
        })
    } catch (error: any) {
        console.error('Error fetching stats:', error)
        return NextResponse.json(
            {
                artists: 0,
                productions: 0,
                news: 0,
                views: 0
            },
            { status: 500 }
        )
    }
}
