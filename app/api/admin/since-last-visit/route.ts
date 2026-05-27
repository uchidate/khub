import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const sinceParam = req.nextUrl.searchParams.get('since')
    const since = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 24 * 3600_000)

    try {
        const [artists, groups, productions, blogPosts, news] = await Promise.all([
            prisma.artist.count({ where: { createdAt: { gte: since } } }),
            prisma.musicalGroup.count({ where: { createdAt: { gte: since } } }),
            prisma.production.count({ where: { createdAt: { gte: since } } }),
            prisma.blogPost.count({ where: { createdAt: { gte: since }, status: 'PUBLISHED' } }),
            prisma.news.count({ where: { createdAt: { gte: since } } }),
        ])

        return NextResponse.json({ artists, groups, productions, blogPosts, news, since: since.toISOString() })
    } catch {
        return NextResponse.json({ artists: 0, groups: 0, productions: 0, blogPosts: 0, news: 0, since: since.toISOString() })
    }
}
