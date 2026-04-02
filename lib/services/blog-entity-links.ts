import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

type UnknownBlock = Record<string, unknown>

type BlogEntityIds = {
  artistIds: string[]
  groupIds: string[]
  productionIds: string[]
}

type DiscardStats = {
  artists: number
  groups: number
  productions: number
  total: number
}

const discardStatsByDay = new Map<string, DiscardStats>()
const MAX_DAYS_IN_MEMORY = 30
const BLOG_ENTITY_LINKS_EVENT_SOURCE = 'blog-entity-links'

function toUniqueIds(values: unknown[]): string[] {
  const ids = new Set<string>()
  for (const value of values) {
    if (typeof value !== 'string') continue
    const id = value.trim()
    if (id) ids.add(id)
  }
  return Array.from(ids)
}

export function extractBlogEntityIdsFromBlocks(blocks: unknown): BlogEntityIds {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { artistIds: [], groupIds: [], productionIds: [] }
  }

  const normalized = blocks.filter(
    (block): block is UnknownBlock => !!block && typeof block === 'object'
  )

  const artistIds = toUniqueIds(
    normalized
      .filter(block => block.type === 'blog_artist_card')
      .map(block => block.artistId)
  )

  const groupIds = toUniqueIds(
    normalized
      .filter(block => block.type === 'blog_group_card')
      .map(block => block.groupId)
  )

  const productionIds = toUniqueIds(
    normalized
      .filter(block => block.type === 'blog_production_card')
      .map(block => block.productionId)
  )

  return { artistIds, groupIds, productionIds }
}

export async function syncBlogPostEntityLinks(postId: string, blocks: unknown): Promise<BlogEntityIds> {
  const ids = extractBlogEntityIdsFromBlocks(blocks)
  const requestedIds = {
    artistIds: [...ids.artistIds],
    groupIds: [...ids.groupIds],
    productionIds: [...ids.productionIds],
  }

  await prisma.$transaction(async tx => {
    const existing = await resolveExistingEntityIds(tx, ids)

    await tx.blogPostArtist.deleteMany({ where: { blogPostId: postId } })
    await tx.blogPostGroup.deleteMany({ where: { blogPostId: postId } })
    await tx.blogPostProduction.deleteMany({ where: { blogPostId: postId } })

    if (existing.artistIds.length > 0) {
      await tx.blogPostArtist.createMany({
        data: existing.artistIds.map(artistId => ({ blogPostId: postId, artistId })),
        skipDuplicates: true,
      })
    }

    if (existing.groupIds.length > 0) {
      await tx.blogPostGroup.createMany({
        data: existing.groupIds.map(groupId => ({ blogPostId: postId, groupId })),
        skipDuplicates: true,
      })
    }

    if (existing.productionIds.length > 0) {
      await tx.blogPostProduction.createMany({
        data: existing.productionIds.map(productionId => ({ blogPostId: postId, productionId })),
        skipDuplicates: true,
      })
    }

    ids.artistIds = existing.artistIds
    ids.groupIds = existing.groupIds
    ids.productionIds = existing.productionIds
  })

  await logDiscardedEntityIds(postId, requestedIds, ids)

  return ids
}

async function logDiscardedEntityIds(
  postId: string,
  requested: BlogEntityIds,
  persisted: BlogEntityIds,
) {
  const discardedArtists = requested.artistIds.filter(id => !persisted.artistIds.includes(id))
  const discardedGroups = requested.groupIds.filter(id => !persisted.groupIds.includes(id))
  const discardedProductions = requested.productionIds.filter(id => !persisted.productionIds.includes(id))

  if (discardedArtists.length === 0 && discardedGroups.length === 0 && discardedProductions.length === 0) {
    return
  }

  const dailyStats = bumpDailyDiscardStats(
    discardedArtists.length,
    discardedGroups.length,
    discardedProductions.length,
  )

  await persistDiscardStatsToDatabase(postId, {
    artists: discardedArtists,
    groups: discardedGroups,
    productions: discardedProductions,
  }, dailyStats)

  console.warn('[blog-entity-links] discarded invalid entity ids', {
    postId,
    discarded: {
      artists: discardedArtists,
      groups: discardedGroups,
      productions: discardedProductions,
    },
    aggregateDaily: dailyStats,
  })
}

async function persistDiscardStatsToDatabase(
  postId: string,
  discarded: { artists: string[]; groups: string[]; productions: string[] },
  aggregateDaily: { day: string; stats: DiscardStats },
) {
  try {
    await prisma.systemEvent.create({
      data: {
        level: 'WARN',
        source: BLOG_ENTITY_LINKS_EVENT_SOURCE,
        message: 'Discarded invalid blog entity ids',
        metadata: {
          postId,
          day: aggregateDaily.day,
          counts: {
            artists: discarded.artists.length,
            groups: discarded.groups.length,
            productions: discarded.productions.length,
            total: discarded.artists.length + discarded.groups.length + discarded.productions.length,
          },
          discarded,
        } as Prisma.InputJsonValue,
      },
    })
  } catch (error) {
    console.error('[blog-entity-links] failed to persist discard stats', { postId, error })
  }
}

function bumpDailyDiscardStats(
  artists: number,
  groups: number,
  productions: number,
): { day: string; stats: DiscardStats } {
  const day = new Date().toISOString().slice(0, 10)
  const current = discardStatsByDay.get(day) ?? { artists: 0, groups: 0, productions: 0, total: 0 }

  const next = {
    artists: current.artists + artists,
    groups: current.groups + groups,
    productions: current.productions + productions,
    total: current.total + artists + groups + productions,
  }

  discardStatsByDay.set(day, next)
  pruneDiscardStatsHistory()
  return { day, stats: next }
}

function pruneDiscardStatsHistory() {
  if (discardStatsByDay.size <= MAX_DAYS_IN_MEMORY) return

  const sortedDays = Array.from(discardStatsByDay.keys()).sort()
  const overflow = sortedDays.length - MAX_DAYS_IN_MEMORY
  for (let i = 0; i < overflow; i += 1) {
    discardStatsByDay.delete(sortedDays[i])
  }
}

export function getBlogEntityLinkDiscardStats(day?: string) {
  if (day) {
    const stats = discardStatsByDay.get(day) ?? { artists: 0, groups: 0, productions: 0, total: 0 }
    return { day, stats }
  }

  const byDay = Array.from(discardStatsByDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({ day: key, stats: value }))

  const totals = byDay.reduce(
    (acc, entry) => ({
      artists: acc.artists + entry.stats.artists,
      groups: acc.groups + entry.stats.groups,
      productions: acc.productions + entry.stats.productions,
      total: acc.total + entry.stats.total,
    }),
    { artists: 0, groups: 0, productions: 0, total: 0 }
  )

  return {
    today: new Date().toISOString().slice(0, 10),
    totals,
    byDay,
  }
}

export async function getPersistedBlogEntityLinkDiscardStats(day?: string) {
  const normalizedDay = day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : undefined
  const now = new Date()
  const fallbackFrom = new Date(now)
  fallbackFrom.setUTCDate(fallbackFrom.getUTCDate() - MAX_DAYS_IN_MEMORY)
  fallbackFrom.setUTCHours(0, 0, 0, 0)

  const startDate = normalizedDay
    ? new Date(`${normalizedDay}T00:00:00.000Z`)
    : fallbackFrom

  const endDate = normalizedDay
    ? new Date(`${normalizedDay}T23:59:59.999Z`)
    : undefined

  const events = await prisma.systemEvent.findMany({
    where: {
      source: BLOG_ENTITY_LINKS_EVENT_SOURCE,
      createdAt: {
        gte: startDate,
        ...(endDate ? { lte: endDate } : {}),
      },
    },
    select: {
      createdAt: true,
      metadata: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  const byDayMap = new Map<string, DiscardStats>()

  for (const event of events) {
    const dayKey = event.createdAt.toISOString().slice(0, 10)
    const current = byDayMap.get(dayKey) ?? { artists: 0, groups: 0, productions: 0, total: 0 }
    const counts = readCountsFromMetadata(event.metadata)

    byDayMap.set(dayKey, {
      artists: current.artists + counts.artists,
      groups: current.groups + counts.groups,
      productions: current.productions + counts.productions,
      total: current.total + counts.total,
    })
  }

  if (normalizedDay) {
    return {
      day: normalizedDay,
      stats: byDayMap.get(normalizedDay) ?? { artists: 0, groups: 0, productions: 0, total: 0 },
    }
  }

  const byDay = Array.from(byDayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({ day: key, stats: value }))

  const totals = byDay.reduce(
    (acc, entry) => ({
      artists: acc.artists + entry.stats.artists,
      groups: acc.groups + entry.stats.groups,
      productions: acc.productions + entry.stats.productions,
      total: acc.total + entry.stats.total,
    }),
    { artists: 0, groups: 0, productions: 0, total: 0 }
  )

  return {
    today: new Date().toISOString().slice(0, 10),
    totals,
    byDay,
  }
}

export async function getPersistedBlogEntityLinkDiscardStatsByRange(
  from?: string,
  to?: string,
) {
  const normalizedFrom = from && /^\d{4}-\d{2}-\d{2}$/.test(from) ? from : undefined
  const normalizedTo = to && /^\d{4}-\d{2}-\d{2}$/.test(to) ? to : undefined

  const now = new Date()
  const startDate = normalizedFrom
    ? new Date(`${normalizedFrom}T00:00:00.000Z`)
    : (() => {
        const d = new Date(now)
        d.setUTCDate(d.getUTCDate() - MAX_DAYS_IN_MEMORY)
        d.setUTCHours(0, 0, 0, 0)
        return d
      })()

  const endDate = normalizedTo
    ? new Date(`${normalizedTo}T23:59:59.999Z`)
    : now

  if (startDate.getTime() > endDate.getTime()) {
    return {
      range: {
        from: normalizedFrom ?? startDate.toISOString().slice(0, 10),
        to: normalizedTo ?? endDate.toISOString().slice(0, 10),
      },
      totals: { artists: 0, groups: 0, productions: 0, total: 0 },
      byDay: [],
    }
  }

  const events = await prisma.systemEvent.findMany({
    where: {
      source: BLOG_ENTITY_LINKS_EVENT_SOURCE,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      createdAt: true,
      metadata: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  const byDayMap = new Map<string, DiscardStats>()

  for (const event of events) {
    const dayKey = event.createdAt.toISOString().slice(0, 10)
    const current = byDayMap.get(dayKey) ?? { artists: 0, groups: 0, productions: 0, total: 0 }
    const counts = readCountsFromMetadata(event.metadata)

    byDayMap.set(dayKey, {
      artists: current.artists + counts.artists,
      groups: current.groups + counts.groups,
      productions: current.productions + counts.productions,
      total: current.total + counts.total,
    })
  }

  const byDay = Array.from(byDayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({ day: key, stats: value }))

  const totals = byDay.reduce(
    (acc, entry) => ({
      artists: acc.artists + entry.stats.artists,
      groups: acc.groups + entry.stats.groups,
      productions: acc.productions + entry.stats.productions,
      total: acc.total + entry.stats.total,
    }),
    { artists: 0, groups: 0, productions: 0, total: 0 }
  )

  return {
    range: {
      from: normalizedFrom ?? startDate.toISOString().slice(0, 10),
      to: normalizedTo ?? endDate.toISOString().slice(0, 10),
    },
    totals,
    byDay,
  }
}

function readCountsFromMetadata(metadata: Prisma.JsonValue | null | undefined): DiscardStats {
  const fallback = { artists: 0, groups: 0, productions: 0, total: 0 }
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return fallback

  const counts = (metadata as Record<string, unknown>).counts
  if (!counts || typeof counts !== 'object' || Array.isArray(counts)) return fallback

  const record = counts as Record<string, unknown>
  const artists = toSafeInt(record.artists)
  const groups = toSafeInt(record.groups)
  const productions = toSafeInt(record.productions)
  const totalFromRecord = toSafeInt(record.total)
  const total = totalFromRecord > 0 ? totalFromRecord : artists + groups + productions

  return { artists, groups, productions, total }
}

function toSafeInt(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.floor(value))
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return Math.max(0, Math.floor(parsed))
  }
  return 0
}

async function resolveExistingEntityIds(
  tx: Prisma.TransactionClient,
  ids: BlogEntityIds,
): Promise<BlogEntityIds> {
  const [artists, groups, productions] = await Promise.all([
    ids.artistIds.length
      ? tx.artist.findMany({ where: { id: { in: ids.artistIds } }, select: { id: true } })
      : Promise.resolve([]),
    ids.groupIds.length
      ? tx.musicalGroup.findMany({ where: { id: { in: ids.groupIds } }, select: { id: true } })
      : Promise.resolve([]),
    ids.productionIds.length
      ? tx.production.findMany({ where: { id: { in: ids.productionIds } }, select: { id: true } })
      : Promise.resolve([]),
  ])

  return {
    artistIds: artists.map(row => row.id),
    groupIds: groups.map(row => row.id),
    productionIds: productions.map(row => row.id),
  }
}
