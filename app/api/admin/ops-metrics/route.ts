import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { isOfficialMercadoLivreAffiliateUrl } from '@/lib/store/mercadolivre'

export const dynamic = 'force-dynamic'

function pct(value: number, total: number): number {
  if (!total) return 0
  return Math.round((value / total) * 1000) / 10
}

function healthScore(openIssues: number, total: number): number {
  if (!total) return 100
  return Math.max(0, Math.round(100 - (openIssues / total) * 100))
}

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const since30d = new Date(Date.now() - 30 * 86400_000)

  const [
    artistsTotal,
    artistsMissingSlug,
    artistsMissingImage,
    artistsMissingBio,
    artistsMissingHangul,
    artistsMissingAgency,
    artistsPendingTranslation,
    artistsFailedTranslation,

    groupsTotal,
    groupsMissingSlug,
    groupsMissingImage,
    groupsMissingBio,
    groupsMissingMembers,
    groupsMissingAgency,

    productionsTotal,
    productionsMissingSlug,
    productionsMissingPoster,
    productionsMissingSynopsis,
    productionsMissingCast,
    productionsMissingStreaming,
    productionsPendingTranslation,
    productionsFailedTranslation,
    productionsAdultUnchecked,
    productionsNeedsCuration,

    newsPublished,
    newsDraftReady,
    newsHidden,
    newsMissingImage,
    newsPendingTranslation,
    newsFailedTranslation,
    newsWithoutEditorialNote,
    newsWithoutGeneratedBlog,

    blogPublished,
    blogDraft,
    blogPendingReview,
    blogMissingCover,
    blogMissingCategory,
    blogWithoutEntityLinks,

    seoTotal,
    seoMissingMetaDesc,
    seoNoIndex,

    storeProducts,
    storeCandidatesPending,
    storeCandidatesApproved,
    storeImpressions30d,
    storeClicks30d,
  ] = await Promise.all([
    prisma.artist.count({ where: { isHidden: false } }),
    prisma.artist.count({ where: { isHidden: false, slug: null } }),
    prisma.artist.count({ where: { isHidden: false, primaryImageUrl: null } }),
    prisma.artist.count({ where: { isHidden: false, bio: null } }),
    prisma.artist.count({ where: { isHidden: false, nameHangul: null } }),
    prisma.artist.count({ where: { isHidden: false, agencyId: null } }),
    prisma.artist.count({ where: { isHidden: false, bio: { not: null }, translationStatus: 'pending' } }),
    prisma.artist.count({ where: { isHidden: false, translationStatus: 'failed' } }),

    prisma.musicalGroup.count({ where: { isHidden: false } }),
    prisma.musicalGroup.count({ where: { isHidden: false, slug: null } }),
    prisma.musicalGroup.count({ where: { isHidden: false, profileImageUrl: null } }),
    prisma.musicalGroup.count({ where: { isHidden: false, bio: null } }),
    prisma.musicalGroup.count({ where: { isHidden: false, members: { none: {} } } }),
    prisma.musicalGroup.count({ where: { isHidden: false, agencyId: null } }),

    prisma.production.count({ where: { isHidden: false, isTakenDown: false } }),
    prisma.production.count({ where: { isHidden: false, isTakenDown: false, slug: null } }),
    prisma.production.count({ where: { isHidden: false, isTakenDown: false, imageUrl: null } }),
    prisma.production.count({ where: { isHidden: false, isTakenDown: false, synopsis: null } }),
    prisma.production.count({ where: { isHidden: false, isTakenDown: false, artists: { none: {} } } }),
    prisma.production.count({ where: { isHidden: false, isTakenDown: false, streamingPlatforms: { isEmpty: true } } }),
    prisma.production.count({ where: { isHidden: false, isTakenDown: false, synopsis: { not: null }, translationStatus: 'pending' } }),
    prisma.production.count({ where: { isHidden: false, isTakenDown: false, translationStatus: 'failed' } }),
    prisma.production.count({ where: { isHidden: false, isTakenDown: false, isAdultContent: null } }),
    prisma.production.count({ where: { isHidden: false, isTakenDown: false, needsCuration: true } }),

    prisma.news.count({ where: { status: 'published', isHidden: false } }),
    prisma.news.count({ where: { status: { in: ['draft', 'ready'] }, isHidden: false } }),
    prisma.news.count({ where: { isHidden: true } }),
    prisma.news.count({ where: { status: 'published', isHidden: false, imageUrl: null } }),
    prisma.news.count({ where: { status: 'published', isHidden: false, translationStatus: 'pending' } }),
    prisma.news.count({ where: { status: 'published', isHidden: false, translationStatus: 'failed' } }),
    prisma.news.count({ where: { status: 'published', isHidden: false, editorialNote: null } }),
    prisma.news.count({ where: { status: 'published', isHidden: false, blogPostGeneratedAt: null } }),

    prisma.blogPost.count({ where: { status: 'PUBLISHED', isPrivate: false } }),
    prisma.blogPost.count({ where: { status: 'DRAFT' } }),
    prisma.blogPost.count({ where: { status: 'PENDING_REVIEW' } }),
    prisma.blogPost.count({ where: { status: 'PUBLISHED', isPrivate: false, coverImageUrl: null } }),
    prisma.blogPost.count({ where: { status: 'PUBLISHED', isPrivate: false, categoryId: null } }),
    prisma.blogPost.count({
      where: {
        status: 'PUBLISHED',
        isPrivate: false,
        relatedArtists: { none: {} },
        relatedGroups: { none: {} },
        relatedProductions: { none: {} },
      },
    }),

    prisma.seoMeta.count(),
    prisma.seoMeta.count({ where: { OR: [{ metaDesc: null }, { metaDesc: '' }] } }),
    prisma.seoMeta.count({ where: { noIndex: true } }),

    prisma.storeProduct.findMany({
      select: {
        id: true,
        store: true,
        affiliateUrl: true,
        isActive: true,
        isHidden: true,
        externalId: true,
      },
    }),
    prisma.storeProductCandidate.count({ where: { status: 'candidate' } }),
    prisma.storeProductCandidate.count({ where: { status: 'approved' } }),
    prisma.storeProductImpression.count({ where: { createdAt: { gte: since30d } } }),
    prisma.storeAffiliateClick.count({ where: { createdAt: { gte: since30d }, productId: { not: null } } }),
  ])

  const mlProducts = storeProducts.filter(p => p.store === 'mercadolivre')
  const mlMissingOfficialLink = mlProducts.filter(p => !isOfficialMercadoLivreAffiliateUrl(p.affiliateUrl)).length
  const storeActive = storeProducts.filter(p => p.isActive && !p.isHidden).length
  const storeDraft = storeProducts.length - storeActive
  const storeTrackedExternal = storeProducts.filter(p => p.externalId).length

  const catalogIssues =
    artistsMissingSlug + artistsMissingImage + artistsMissingBio + artistsMissingHangul + artistsPendingTranslation +
    groupsMissingSlug + groupsMissingImage + groupsMissingBio + groupsMissingMembers +
    productionsMissingSlug + productionsMissingPoster + productionsMissingSynopsis + productionsMissingCast +
    productionsPendingTranslation + productionsAdultUnchecked

  const editorialIssues =
    newsDraftReady + newsMissingImage + newsPendingTranslation + newsWithoutEditorialNote +
    blogDraft + blogPendingReview + blogMissingCover + blogMissingCategory + blogWithoutEntityLinks

  const monetizationIssues = mlMissingOfficialLink + storeCandidatesPending

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    summary: {
      catalogHealth: healthScore(catalogIssues, artistsTotal + groupsTotal + productionsTotal),
      editorialHealth: healthScore(editorialIssues, newsPublished + blogPublished + newsDraftReady + blogDraft + blogPendingReview),
      monetizationHealth: healthScore(monetizationIssues, Math.max(1, storeProducts.length + storeCandidatesPending)),
      openIssues: catalogIssues + editorialIssues + monetizationIssues,
    },
    catalog: {
      artists: {
        total: artistsTotal,
        missingSlug: artistsMissingSlug,
        missingImage: artistsMissingImage,
        missingBio: artistsMissingBio,
        missingHangul: artistsMissingHangul,
        missingAgency: artistsMissingAgency,
        pendingTranslation: artistsPendingTranslation,
        failedTranslation: artistsFailedTranslation,
        coverage: {
          image: pct(artistsTotal - artistsMissingImage, artistsTotal),
          bio: pct(artistsTotal - artistsMissingBio, artistsTotal),
          hangul: pct(artistsTotal - artistsMissingHangul, artistsTotal),
        },
      },
      groups: {
        total: groupsTotal,
        missingSlug: groupsMissingSlug,
        missingImage: groupsMissingImage,
        missingBio: groupsMissingBio,
        missingMembers: groupsMissingMembers,
        missingAgency: groupsMissingAgency,
        coverage: {
          image: pct(groupsTotal - groupsMissingImage, groupsTotal),
          bio: pct(groupsTotal - groupsMissingBio, groupsTotal),
          members: pct(groupsTotal - groupsMissingMembers, groupsTotal),
        },
      },
      productions: {
        total: productionsTotal,
        missingSlug: productionsMissingSlug,
        missingPoster: productionsMissingPoster,
        missingSynopsis: productionsMissingSynopsis,
        missingCast: productionsMissingCast,
        missingStreaming: productionsMissingStreaming,
        pendingTranslation: productionsPendingTranslation,
        failedTranslation: productionsFailedTranslation,
        adultUnchecked: productionsAdultUnchecked,
        needsCuration: productionsNeedsCuration,
        coverage: {
          poster: pct(productionsTotal - productionsMissingPoster, productionsTotal),
          synopsis: pct(productionsTotal - productionsMissingSynopsis, productionsTotal),
          cast: pct(productionsTotal - productionsMissingCast, productionsTotal),
          streaming: pct(productionsTotal - productionsMissingStreaming, productionsTotal),
        },
      },
    },
    editorial: {
      news: {
        published: newsPublished,
        draftReady: newsDraftReady,
        hidden: newsHidden,
        missingImage: newsMissingImage,
        pendingTranslation: newsPendingTranslation,
        failedTranslation: newsFailedTranslation,
        withoutEditorialNote: newsWithoutEditorialNote,
        withoutGeneratedBlog: newsWithoutGeneratedBlog,
      },
      blog: {
        published: blogPublished,
        draft: blogDraft,
        pendingReview: blogPendingReview,
        missingCover: blogMissingCover,
        missingCategory: blogMissingCategory,
        withoutEntityLinks: blogWithoutEntityLinks,
      },
      seo: {
        records: seoTotal,
        missingMetaDesc: seoMissingMetaDesc,
        noIndex: seoNoIndex,
      },
    },
    monetization: {
      storeProducts: storeProducts.length,
      activeProducts: storeActive,
      draftProducts: storeDraft,
      externalTrackedProducts: storeTrackedExternal,
      mercadoLivreProducts: mlProducts.length,
      mercadoLivreMissingOfficialLink: mlMissingOfficialLink,
      pendingCandidates: storeCandidatesPending,
      approvedCandidates: storeCandidatesApproved,
      impressions30d: storeImpressions30d,
      clicks30d: storeClicks30d,
      ctr30d: storeImpressions30d ? storeClicks30d / storeImpressions30d : null,
    },
  })
}
