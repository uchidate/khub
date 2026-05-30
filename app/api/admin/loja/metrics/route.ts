import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { isOfficialMercadoLivreAffiliateUrl } from '@/lib/store/mercadolivre'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const since30d = new Date(Date.now() - 30 * 86400_000)
  const since7d = new Date(Date.now() - 7 * 86400_000)

  const [products, pendingCandidates, approvedCandidates, impressions30d, clicks30d, clicks7d] =
    await Promise.all([
      prisma.storeProduct.findMany({
        select: { id: true, store: true, affiliateUrl: true, isActive: true, isHidden: true },
      }),
      prisma.storeProductCandidate.count({ where: { status: 'candidate' } }),
      prisma.storeProductCandidate.count({ where: { status: 'approved' } }),
      prisma.storeProductImpression.count({ where: { createdAt: { gte: since30d } } }),
      prisma.storeAffiliateClick.count({ where: { createdAt: { gte: since30d }, productId: { not: null } } }),
      prisma.storeAffiliateClick.count({ where: { createdAt: { gte: since7d }, productId: { not: null } } }),
    ])

  const mlProducts = products.filter(p => p.store === 'mercadolivre')
  const mlMissingOfficialLink = mlProducts.filter(p => !isOfficialMercadoLivreAffiliateUrl(p.affiliateUrl)).length
  const activeProducts = products.filter(p => p.isActive && !p.isHidden).length
  const draftProducts = products.length - activeProducts

  return NextResponse.json({
    activeProducts,
    draftProducts,
    totalProducts: products.length,
    mercadoLivreProducts: mlProducts.length,
    mlMissingOfficialLink,
    pendingCandidates,
    approvedCandidates,
    impressions30d,
    clicks30d,
    clicks7d,
    ctr30d: impressions30d ? clicks30d / impressions30d : null,
  })
}
