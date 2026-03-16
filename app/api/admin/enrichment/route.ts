import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'
import { assertBudgetAvailable } from '@/lib/ai/budget-guard'
import { getAllEditorialBudgetStatuses } from '@/lib/ai/budget-guard'
import {
    generateArtistBio,
    generateArtistEditorial,
    generateArtistCuriosidades,
    generateProductionReview,
    generateNewsEditorialNote,
    generateBlogPostFromNews,
    EDITORIAL_COST_ESTIMATES,
} from '@/lib/ai/generators/editorial-generator'

export const dynamic = 'force-dynamic'

export type EnrichmentTarget =
    | 'artist_bio'
    | 'artist_editorial'
    | 'artist_curiosidades'
    | 'production_review'
    | 'news_editorial_note'
    | 'news_blog_post'

const TARGET_TO_FEATURE: Record<EnrichmentTarget, string> = {
    artist_bio:           'artist_bio_enrichment',
    artist_editorial:     'artist_editorial',
    artist_curiosidades:  'artist_curiosidades',
    production_review:    'production_review',
    news_editorial_note:  'news_editorial_note',
    news_blog_post:       'blog_post_generation',
}

/**
 * GET /api/admin/enrichment
 * Dry-run: conta quantos itens precisam de enriquecimento e estima o custo total.
 */
export async function GET() {
    const { error } = await requireAdmin()
    if (error) return error

    const [
        artistsWithoutBio,
        artistsWithoutEditorial,
        artistsWithoutCuriosidades,
        productionsWithoutReview,
        newsWithoutNote,
        newsWithoutBlogPost,
        budgets,
    ] = await Promise.all([
        prisma.artist.count({
            where: { isHidden: false, flaggedAsNonKorean: false, bio: null },
        }),
        prisma.artist.count({
            where: { isHidden: false, flaggedAsNonKorean: false, analiseEditorial: null },
        }),
        prisma.artist.count({
            where: { isHidden: false, flaggedAsNonKorean: false, curiosidades: { isEmpty: true } },
        }),
        prisma.production.count({
            where: { isHidden: false, flaggedAsNonKorean: false, editorialReview: null },
        }),
        prisma.news.count({
            where: { isHidden: false, status: 'published', editorialNote: null },
        }),
        prisma.news.count({
            where: { isHidden: false, status: 'published', blogPostGeneratedAt: null },
        }),
        getAllEditorialBudgetStatuses(),
    ])

    const counts = {
        artist_bio:           artistsWithoutBio,
        artist_editorial:     artistsWithoutEditorial,
        artist_curiosidades:  artistsWithoutCuriosidades,
        production_review:    productionsWithoutReview,
        news_editorial_note:  newsWithoutNote,
        news_blog_post:       newsWithoutBlogPost,
    }

    const estimates = {
        artist_bio:           artistsWithoutBio          * EDITORIAL_COST_ESTIMATES.artist_bio_enrichment,
        artist_editorial:     artistsWithoutEditorial     * EDITORIAL_COST_ESTIMATES.artist_editorial,
        artist_curiosidades:  artistsWithoutCuriosidades  * EDITORIAL_COST_ESTIMATES.artist_curiosidades,
        production_review:    productionsWithoutReview    * EDITORIAL_COST_ESTIMATES.production_review,
        news_editorial_note:  newsWithoutNote             * EDITORIAL_COST_ESTIMATES.news_editorial_note,
        news_blog_post:       newsWithoutBlogPost         * EDITORIAL_COST_ESTIMATES.blog_post_generation,
    }

    const totalEstimate = Object.values(estimates).reduce((a, b) => a + b, 0)

    return NextResponse.json({ counts, estimates, totalEstimate, budgets })
}

/**
 * POST /api/admin/enrichment
 * Executa enriquecimento em lote para um target e um limite de itens.
 * Body: { target: EnrichmentTarget; limit: number; overwrite?: boolean }
 */
export async function POST(req: Request) {
    const { error, session: adminSession } = await requireAdmin()
    if (error) return error

    const body = await req.json() as {
        target:    EnrichmentTarget
        limit?:    number
        overwrite?: boolean
        entityId?: string  // single-item enrichment
    }

    const { target, limit = 1, overwrite = false, entityId } = body

    if (!target) {
        return NextResponse.json({ error: 'target obrigatório.' }, { status: 400 })
    }
    if (!entityId && (limit < 1 || limit > 50)) {
        return NextResponse.json(
            { error: 'Parâmetros inválidos. limit entre 1 e 50.' },
            { status: 400 }
        )
    }

    const feature = TARGET_TO_FEATURE[target]
    if (!feature) return NextResponse.json({ error: 'Target inválido.' }, { status: 400 })

    // Verificar budget antes de começar
    try {
        await assertBudgetAvailable(feature as Parameters<typeof assertBudgetAvailable>[0])
    } catch (err) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 402 })
    }

    const processed: string[] = []
    const failed: { id: string; error: string }[] = []
    let totalCost = 0

    try {
        switch (target) {
            case 'artist_bio': {
                const artists = await prisma.artist.findMany({
                    where: {
                        ...(entityId ? { id: entityId } : {
                            isHidden: false,
                            flaggedAsNonKorean: false,
                            ...(overwrite ? {} : { bio: null }),
                        }),
                    },
                    take: entityId ? 1 : limit,
                    select: {
                        id: true, nameRomanized: true, nameHangul: true, roles: true,
                        birthDate: true, birthName: true, placeOfBirth: true, bio: true,
                        agency: { select: { name: true } },
                        memberships: { select: { group: { select: { name: true } }, isActive: true } },
                    },
                    orderBy: { trendingScore: 'desc' },
                })

                for (const artist of artists) {
                    try {
                        await assertBudgetAvailable('artist_bio_enrichment')
                        const r = await generateArtistBio(artist)
                        await prisma.artist.update({
                            where: { id: artist.id },
                            data: { bio: r.bio, editorialGeneratedAt: new Date() },
                        })
                        processed.push(artist.id)
                        totalCost += r.cost
                    } catch (err) {
                        failed.push({ id: artist.id, error: getErrorMessage(err) })
                        if (getErrorMessage(err).includes('Budget')) break // parar se budget esgotado
                    }
                }
                break
            }

            case 'artist_editorial': {
                const artists = await prisma.artist.findMany({
                    where: {
                        ...(entityId ? { id: entityId } : {
                            isHidden: false,
                            flaggedAsNonKorean: false,
                            ...(overwrite ? {} : { analiseEditorial: null }),
                        }),
                    },
                    take: entityId ? 1 : limit,
                    select: {
                        id: true, nameRomanized: true, nameHangul: true,
                        roles: true, gender: true, birthDate: true, bio: true,
                        memberships: { select: { group: { select: { name: true } } } },
                        productions: {
                            select: { production: { select: { titlePt: true } } },
                            take: 3,
                        },
                    },
                    orderBy: { trendingScore: 'desc' },
                })

                for (const artist of artists) {
                    try {
                        await assertBudgetAvailable('artist_editorial')
                        const r = await generateArtistEditorial(artist)
                        await prisma.artist.update({
                            where: { id: artist.id },
                            data: { analiseEditorial: r.analiseEditorial, editorialGeneratedAt: new Date() },
                        })
                        processed.push(artist.id)
                        totalCost += r.cost
                    } catch (err) {
                        failed.push({ id: artist.id, error: getErrorMessage(err) })
                        if (getErrorMessage(err).includes('Budget')) break
                    }
                }
                break
            }

            case 'artist_curiosidades': {
                const artists = await prisma.artist.findMany({
                    where: {
                        ...(entityId ? { id: entityId } : {
                            isHidden: false,
                            flaggedAsNonKorean: false,
                            ...(overwrite ? {} : { curiosidades: { isEmpty: true } }),
                        }),
                    },
                    take: entityId ? 1 : limit,
                    select: {
                        id: true, nameRomanized: true, nameHangul: true,
                        roles: true, gender: true, birthDate: true, bio: true,
                        memberships: { select: { group: { select: { name: true } } } },
                        productions: {
                            select: { production: { select: { titlePt: true } } },
                            take: 3,
                        },
                    },
                    orderBy: { trendingScore: 'desc' },
                })

                for (const artist of artists) {
                    try {
                        await assertBudgetAvailable('artist_curiosidades')
                        const r = await generateArtistCuriosidades(artist)
                        await prisma.artist.update({
                            where: { id: artist.id },
                            data: { curiosidades: r.curiosidades, editorialGeneratedAt: new Date() },
                        })
                        processed.push(artist.id)
                        totalCost += r.cost
                    } catch (err) {
                        failed.push({ id: artist.id, error: getErrorMessage(err) })
                        if (getErrorMessage(err).includes('Budget')) break
                    }
                }
                break
            }

            case 'production_review': {
                const productions = await prisma.production.findMany({
                    where: {
                        ...(entityId ? { id: entityId } : {
                            isHidden: false,
                            flaggedAsNonKorean: false,
                            ...(overwrite ? {} : { editorialReview: null }),
                        }),
                    },
                    take: entityId ? 1 : limit,
                    select: {
                        id: true, titlePt: true, titleKr: true, type: true, year: true,
                        synopsis: true, tagline: true, voteAverage: true,
                        streamingPlatforms: true, network: true,
                    },
                    orderBy: { voteAverage: 'desc' },
                })

                for (const production of productions) {
                    try {
                        await assertBudgetAvailable('production_review')
                        const r = await generateProductionReview(production)
                        await prisma.production.update({
                            where: { id: production.id },
                            data: {
                                editorialReview: r.editorialReview,
                                whyWatch: r.whyWatch,
                                editorialRating: r.editorialRating,
                                editorialGeneratedAt: new Date(),
                            },
                        })
                        processed.push(production.id)
                        totalCost += r.cost
                    } catch (err) {
                        failed.push({ id: production.id, error: getErrorMessage(err) })
                        if (getErrorMessage(err).includes('Budget')) break
                    }
                }
                break
            }

            case 'news_editorial_note': {
                const newsList = await prisma.news.findMany({
                    where: {
                        ...(entityId ? { id: entityId } : {
                            isHidden: false,
                            status: 'published',
                            ...(overwrite ? {} : { editorialNote: null }),
                        }),
                    },
                    take: entityId ? 1 : limit,
                    select: { id: true, title: true, contentMd: true, source: true },
                    orderBy: { publishedAt: 'desc' },
                })

                for (const news of newsList) {
                    try {
                        await assertBudgetAvailable('news_editorial_note')
                        const r = await generateNewsEditorialNote(news)
                        await prisma.news.update({
                            where: { id: news.id },
                            data: { editorialNote: r.editorialNote, editorialNoteGeneratedAt: new Date() },
                        })
                        processed.push(news.id)
                        totalCost += r.cost
                    } catch (err) {
                        failed.push({ id: news.id, error: getErrorMessage(err) })
                        if (getErrorMessage(err).includes('Budget')) break
                    }
                }
                break
            }

            case 'news_blog_post': {
                const newsList = await prisma.news.findMany({
                    where: {
                        ...(entityId ? { id: entityId } : {
                            isHidden: false,
                            status: 'published',
                            ...(overwrite ? {} : { blogPostGeneratedAt: null }),
                        }),
                    },
                    take: entityId ? 1 : limit,
                    select: { id: true, title: true, contentMd: true, source: true, tags: true },
                    orderBy: { publishedAt: 'desc' },
                })

                const authorId = (adminSession?.user as { id?: string })?.id
                if (!authorId) {
                    return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })
                }

                for (const news of newsList) {
                    try {
                        await assertBudgetAvailable('blog_post_generation')
                        const r = await generateBlogPostFromNews(news)

                        const baseSlug = r.slug
                        let slug = baseSlug
                        const existing = await prisma.blogPost.findUnique({ where: { slug } })
                        if (existing) slug = `${baseSlug}-${Date.now().toString(36)}`

                        await prisma.blogPost.create({
                            data: {
                                slug,
                                title:          r.title,
                                excerpt:        r.excerpt,
                                contentMd:      r.contentMd,
                                tags:           r.tags,
                                readingTimeMin: r.readingTimeMin,
                                status:         'DRAFT',
                                authorId,
                            },
                        })

                        await prisma.news.update({
                            where: { id: news.id },
                            data: { blogPostGeneratedAt: new Date() },
                        })

                        processed.push(news.id)
                        totalCost += r.cost
                    } catch (err) {
                        failed.push({ id: news.id, error: getErrorMessage(err) })
                        if (getErrorMessage(err).includes('Budget')) break
                    }
                }
                break
            }
        }
    } catch (err) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
    }

    return NextResponse.json({
        target,
        processed: processed.length,
        failed: failed.length,
        failures: failed.length > 0 ? failed : undefined,
        totalCostUsd: totalCost,
        ranBy: (adminSession?.user as { email?: string })?.email ?? 'admin',
    })
}
