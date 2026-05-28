import prisma from '@/lib/prisma'

type DayCount = { day: string; count: number }

function toSparkArray(rows: DayCount[]): number[] {
  const map = new Map(rows.map(r => [r.day.slice(0, 10), r.count]))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return map.get(d.toISOString().slice(0, 10)) ?? 0
  })
}

export async function getAdminDashboardStats() {
  const now   = new Date()
  const ago30 = new Date(Date.now() - 30 * 86400_000)
  const ago7  = new Date(Date.now() - 7  * 86400_000)
  const today = new Date(now); today.setHours(0, 0, 0, 0)

  const [
    totalUsers, totalArtists, totalProductions, totalNews, totalGroups,
    newUsers, newArtists, newProductions, newNews, newGroups,
    newUsers7d,
    newsImportedToday, newsPublishedToday, newsQueueToday, newsHiddenToday,
    pendingProductionTranslations,
    artistsWithoutBio, artistsWithoutImage, groupsWithoutBio,
    pendingReports, flaggedComments,
    systemErrors24h, aiFailures24h,
    recentUsers, recentNews, recentArtists, recentProductions,
    artistsWithBio, artistBioTranslated,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.artist.count(),
    prisma.production.count(),
    prisma.news.count(),
    prisma.musicalGroup.count(),
    prisma.user.count({ where: { createdAt: { gte: ago30 } } }),
    prisma.artist.count({ where: { createdAt: { gte: ago30 } } }),
    prisma.production.count({ where: { createdAt: { gte: ago30 } } }),
    prisma.news.count({ where: { createdAt: { gte: ago30 } } }),
    prisma.musicalGroup.count({ where: { createdAt: { gte: ago30 } } }),
    prisma.user.count({ where: { createdAt: { gte: ago7 } } }),
    prisma.news.count({ where: { createdAt: { gte: today } } }),
    prisma.news.count({ where: { publishedAt: { gte: today }, isHidden: false } }),
    prisma.news.count({ where: { createdAt: { gte: today }, status: { in: ['draft', 'ready'] }, isHidden: false } }),
    prisma.news.count({ where: { createdAt: { gte: today }, isHidden: true } }),
    prisma.production.count({ where: { isHidden: false, synopsis: { not: null }, translationStatus: 'pending' } }),
    prisma.artist.count({ where: { bio: null, isHidden: false } }),
    prisma.artist.count({ where: { primaryImageUrl: null, isHidden: false } }),
    prisma.musicalGroup.count({ where: { bio: null, isHidden: false } }),
    prisma.report.count({ where: { status: 'PENDING' } }),
    prisma.comment.count({ where: { status: 'FLAGGED' } }),
    prisma.systemEvent.count({ where: { level: 'ERROR', createdAt: { gte: new Date(Date.now() - 86400_000) } } }),
    prisma.aiUsageLog.count({ where: { status: { in: ['error', 'circuit_open'] }, createdAt: { gte: new Date(Date.now() - 86400_000) } } }),
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 4, select: { email: true, name: true, createdAt: true } }),
    prisma.news.findMany({ orderBy: { createdAt: 'desc' }, take: 4, select: { id: true, title: true, createdAt: true } }),
    prisma.artist.findMany({ orderBy: { createdAt: 'desc' }, take: 4, select: { id: true, nameRomanized: true, createdAt: true } }),
    prisma.production.findMany({ orderBy: { createdAt: 'desc' }, take: 4, select: { id: true, titlePt: true, createdAt: true } }),
    prisma.artist.count({ where: { bio: { not: null }, isHidden: false } }),
    prisma.contentTranslation.count({ where: { entityType: 'artist', field: 'bio', locale: 'pt-BR' } }),
  ])

  const [usersSparkRaw, artistsSparkRaw, productionsSparkRaw, newsSparkRaw, groupsSparkRaw] = await Promise.all([
    prisma.$queryRaw<DayCount[]>`SELECT "createdAt"::date::text as day, count(*)::int as count FROM "User"        WHERE "createdAt" >= NOW() - INTERVAL '7 days' GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<DayCount[]>`SELECT "createdAt"::date::text as day, count(*)::int as count FROM "Artist"      WHERE "createdAt" >= NOW() - INTERVAL '7 days' GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<DayCount[]>`SELECT "createdAt"::date::text as day, count(*)::int as count FROM "Production"  WHERE "createdAt" >= NOW() - INTERVAL '7 days' GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<DayCount[]>`SELECT "createdAt"::date::text as day, count(*)::int as count FROM "News"        WHERE "createdAt" >= NOW() - INTERVAL '7 days' GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<DayCount[]>`SELECT "createdAt"::date::text as day, count(*)::int as count FROM "MusicalGroup" WHERE "createdAt" >= NOW() - INTERVAL '7 days' GROUP BY 1 ORDER BY 1`,
  ])

  return {
    totals: { users: totalUsers, artists: totalArtists, productions: totalProductions, news: totalNews, groups: totalGroups },
    new30d: { users: newUsers, artists: newArtists, productions: newProductions, news: newNews, groups: newGroups },
    newUsers7d,
    pipeline: { imported: newsImportedToday, published: newsPublishedToday, queue: newsQueueToday, hidden: newsHiddenToday },
    pending: {
      productionTranslations: pendingProductionTranslations,
      artistBio: Math.max(0, artistsWithBio - artistBioTranslated),
      artistsWithoutBio,
      artistsWithoutImage,
      groupsWithoutBio,
      reports: pendingReports,
      flaggedComments,
      systemErrors24h,
      aiFailures24h,
    },
    recent: { users: recentUsers, news: recentNews, artists: recentArtists, productions: recentProductions },
    sparks: {
      users:       toSparkArray(usersSparkRaw),
      artists:     toSparkArray(artistsSparkRaw),
      productions: toSparkArray(productionsSparkRaw),
      news:        toSparkArray(newsSparkRaw),
      groups:      toSparkArray(groupsSparkRaw),
    },
    now,
  }
}

export async function getAdminDatabaseCounts() {
  const [users, artists, agencies, productions, groups, news, albums, blogPosts] = await Promise.all([
    prisma.user.count(),
    prisma.artist.count(),
    prisma.agency.count(),
    prisma.production.count(),
    prisma.musicalGroup.count(),
    prisma.news.count(),
    prisma.album.count(),
    prisma.blogPost.count(),
  ])
  return { users, artists, agencies, productions, groups, news, albums, blogPosts }
}
