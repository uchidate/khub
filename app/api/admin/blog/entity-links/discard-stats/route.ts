import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import {
  getBlogEntityLinkDiscardStats,
  getPersistedBlogEntityLinkDiscardStatsByRange,
  getPersistedBlogEntityLinkDiscardStats,
} from '@/lib/services/blog-entity-links'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const dayParam = (searchParams.get('day') || '').trim()
  const fromParam = (searchParams.get('from') || '').trim()
  const toParam = (searchParams.get('to') || '').trim()
  const pageParam = parseInt(searchParams.get('page') || '1', 10)
  const limitParam = parseInt(searchParams.get('limit') || '30', 10)
  const orderParam = (searchParams.get('order') || 'desc').toLowerCase()
  const day = /^\d{4}-\d{2}-\d{2}$/.test(dayParam) ? dayParam : undefined
  const from = /^\d{4}-\d{2}-\d{2}$/.test(fromParam) ? fromParam : undefined
  const to = /^\d{4}-\d{2}-\d{2}$/.test(toParam) ? toParam : undefined
  const page = Number.isFinite(pageParam) ? Math.max(1, pageParam) : 1
  const limit = Number.isFinite(limitParam) ? Math.min(365, Math.max(1, limitParam)) : 30
  const order = orderParam === 'asc' ? 'asc' : 'desc'

  const database = day
    ? await getPersistedBlogEntityLinkDiscardStats(day)
    : await getPersistedBlogEntityLinkDiscardStatsByRange(from, to)

  const processMemory = day
    ? getBlogEntityLinkDiscardStats(day)
    : getBlogEntityLinkDiscardStats()

  const paginatedDatabase = day ? database : paginateByDay(database, { page, limit, order })
  const paginatedProcessMemory = day ? processMemory : paginateByDay(processMemory, { page, limit, order })

  return NextResponse.json({
    ok: true,
    filters: {
      day: day ?? null,
      from: from ?? null,
      to: to ?? null,
      page: day ? null : page,
      limit: day ? null : limit,
      order: day ? null : order,
    },
    metrics: {
      database: paginatedDatabase,
      processMemory: paginatedProcessMemory,
    },
  })
}

function paginateByDay(
  payload: unknown,
  options: { page: number; limit: number; order: 'asc' | 'desc' },
) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload

  const record = payload as Record<string, unknown>
  const byDay = Array.isArray(record.byDay) ? record.byDay : null
  if (!byDay) return payload

  const ordered = [...byDay].sort((a, b) => {
    const dayA = typeof (a as { day?: unknown }).day === 'string' ? (a as { day: string }).day : ''
    const dayB = typeof (b as { day?: unknown }).day === 'string' ? (b as { day: string }).day : ''
    return options.order === 'asc' ? dayA.localeCompare(dayB) : dayB.localeCompare(dayA)
  })

  const totalDays = ordered.length
  const totalPages = Math.max(1, Math.ceil(totalDays / options.limit))
  const page = Math.min(options.page, totalPages)
  const start = (page - 1) * options.limit
  const items = ordered.slice(start, start + options.limit)

  return {
    ...record,
    byDay: items,
    pagination: {
      page,
      limit: options.limit,
      totalDays,
      totalPages,
      order: options.order,
    },
  }
}
