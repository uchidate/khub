import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

/**
 * Check admin authentication. Returns session or error response.
 */
export async function requireAdmin() {
  const session = await auth()
  if (!session || session.user.role?.toLowerCase() !== 'admin') {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null }
  }
  return { error: null, session }
}

/**
 * Build Prisma query options from URL search params.
 */
export function buildQueryOptions(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const search = searchParams.get('search') || ''
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

  return {
    skip: (page - 1) * limit,
    take: limit,
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    orderBy: { [sortBy]: sortOrder },
  }
}

/**
 * Format paginated response.
 */
export function paginatedResponse<T>(data: T[], total: number, page: number, limit: number) {
  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

/**
 * Get dashboard statistics.
 */
export async function getDashboardStats() {
  const [users, artists, productions, news, agencies, albums] = await Promise.all([
    prisma.user.count(),
    prisma.artist.count(),
    prisma.production.count(),
    prisma.news.count(),
    prisma.agency.count(),
    prisma.album.count(),
  ])

  return { users, artists, productions, news, agencies, albums }
}
