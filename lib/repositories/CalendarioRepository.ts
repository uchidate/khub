import prisma from '@/lib/prisma'

export async function getCalendarioData(today: Date, windowEnd: Date, past14: Date) {
  const [artists, upcomingProductions, recentProductions, storePool] = await Promise.all([
    prisma.artist.findMany({
      where: { isHidden: false, flaggedAsNonKorean: false, birthDate: { not: null } },
      select: { id: true, slug: true, nameRomanized: true, nameHangul: true, primaryImageUrl: true, birthDate: true },
      take: 500,
      orderBy: { trendingScore: 'desc' },
    }),
    prisma.production.findMany({
      where: { isHidden: false, releaseDate: { gte: today, lte: windowEnd } },
      select: { id: true, slug: true, titlePt: true, titleKr: true, imageUrl: true, releaseDate: true, type: true, network: true },
      orderBy: { releaseDate: 'asc' },
      take: 30,
    }),
    prisma.production.findMany({
      where: { isHidden: false, releaseDate: { gte: past14, lt: today } },
      select: { id: true, slug: true, titlePt: true, titleKr: true, imageUrl: true, releaseDate: true, type: true, network: true },
      orderBy: { releaseDate: 'desc' },
      take: 12,
    }),
    prisma.storeProduct.findMany({
      where: { isActive: true, isHidden: false },
      orderBy: [{ featured: 'desc' }, { position: 'asc' }],
      take: 8,
      select: { id: true, name: true, price: true, originalPrice: true, imageUrl: true, affiliateUrl: true, store: true, badge: true, rating: true, soldCount: true },
    }).catch(() => []),
  ])

  return { artists, upcomingProductions, recentProductions, storePool }
}
