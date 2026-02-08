import { NextResponse } from 'next/server'
import { requireAdmin, getDashboardStats } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

// Force dynamic rendering (uses auth/headers)
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 *
 * Auth: Admin only
 */
export async function GET() {
  try {
    // Check authentication
    const { error, session } = await requireAdmin()
    if (error) return error

    // Get basic counts
    const stats = await getDashboardStats()

    // Get recent activity
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    })

    // Calculate growth (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [
      newUsersCount,
      newArtistsCount,
      newProductionsCount,
      newNewsCount,
    ] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.artist.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.production.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.news.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    ])

    // Calculate growth percentages
    const calculateGrowth = (current: number, newCount: number) => {
      const previous = current - newCount
      if (previous === 0) return '+100'
      const percentage = ((newCount / previous) * 100).toFixed(0)
      return `+${percentage}`
    }

    return NextResponse.json({
      counts: stats,
      growth: {
        users: calculateGrowth(stats.users, newUsersCount),
        artists: calculateGrowth(stats.artists, newArtistsCount),
        productions: calculateGrowth(stats.productions, newProductionsCount),
        news: calculateGrowth(stats.news, newNewsCount),
      },
      recentUsers: recentUsers.map(u => ({
        email: u.email,
        name: u.name,
        createdAt: u.createdAt,
      })),
    })
  } catch (error) {
    console.error('Get admin stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
