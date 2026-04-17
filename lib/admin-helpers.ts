import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

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
// Whitelist of allowed sort fields — prevents remote property injection
const ALLOWED_SORT_FIELDS = new Set([
  'createdAt', 'updatedAt', 'publishedAt', 'title', 'name', 'nameRomanized',
  'viewCount', 'rank', 'readingTimeMin', 'status', 'featured',
])

export function buildQueryOptions(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const search = searchParams.get('search') || ''
  const requestedSort = searchParams.get('sortBy') ?? ''
  const sortBy = ALLOWED_SORT_FIELDS.has(requestedSort) ? requestedSort : 'createdAt'
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
 * Require any authenticated user. Returns session or 401.
 */
export async function requireAuth() {
  const session = await auth()
  if (!session) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null }
  }
  return { error: null, session }
}

/**
 * Require admin or editor role. Returns session or 401.
 */
export async function requireEditorOrAdmin() {
  const session = await auth()
  const role = session?.user.role?.toLowerCase()
  if (!session || (role !== 'admin' && role !== 'editor')) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null }
  }
  return { error: null, session }
}

/**
 * Require contributor role or above (contributor, editor, admin).
 */
export async function requireContributorOrAbove() {
  const session = await auth()
  const role = session?.user.role?.toLowerCase()
  const allowed = ['admin', 'editor', 'contributor']
  if (!session || !allowed.includes(role ?? '')) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null }
  }
  return { error: null, session }
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

/**
 * Autenticação por API key para acesso programático (agentes, scripts, Copilot Chat).
 * Valida o header Authorization: Bearer <INTERNAL_API_KEY> usando timingSafeEqual.
 * Retorna o primeiro usuário com role ADMIN para usar como autor.
 */
export async function requireApiKeyAuth(request: NextRequest): Promise<
  | { error: NextResponse; adminUser: null }
  | { error: null; adminUser: { id: string; name: string | null; email: string } }
> {
  const envKey = process.env.INTERNAL_API_KEY
  if (!envKey) {
    return { error: NextResponse.json({ error: 'Internal API key not configured' }, { status: 500 }), adminUser: null }
  }

  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  // Timing-safe comparison to prevent timing attacks
  const keyBuf   = Buffer.from(envKey, 'utf8')
  const tokenBuf = Buffer.from(token.padEnd(envKey.length, '\0'), 'utf8')
  const valid = keyBuf.length === tokenBuf.length &&
    crypto.timingSafeEqual(keyBuf, tokenBuf) &&
    token.length === envKey.length

  if (!valid) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), adminUser: null }
  }

  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true, name: true, email: true },
    orderBy: { createdAt: 'asc' },
  })

  if (!adminUser) {
    return { error: NextResponse.json({ error: 'No admin user found' }, { status: 500 }), adminUser: null }
  }

  return { error: null, adminUser }
}
