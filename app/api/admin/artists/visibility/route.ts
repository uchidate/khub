import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'
import { getArtistVisibilityService } from '@/lib/services/artist-visibility-service'

export const dynamic = 'force-dynamic'

// Espelha o PUBLIC_PRODUCTION_FILTER do ArtistVisibilityService
const PUBLIC_PRODUCTION_FILTER = {
    isHidden: false,
    // flaggedAsNonKorean check removed — non-Korean productions now always have isHidden=true
    AND: [
        { OR: [{ ageRating: null }, { ageRating: { not: '18' } }] },
        { OR: [{ isAdultContent: null }, { isAdultContent: false }] },
    ],
}

/**
 * GET /api/admin/artists/visibility
 * Lista artistas auto-ocultos com diagnóstico de motivo.
 * Filtros: reason=all|no_productions|hidden_productions|adult_content
 */
export async function GET(req: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(req.url)
    const reason = searchParams.get('reason') ?? 'all'
    const q = searchParams.get('q')?.trim() ?? ''
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '30')))
    const skip = (page - 1) * limit

    try {
        const [
            totalAutoHidden,
            manuallyHidden,
            noProductions,
            hiddenProductions,
            adultContent,
        ] = await Promise.all([
            prisma.artist.count({ where: { isHidden: true, autoHidden: true } }),
            prisma.artist.count({ where: { isHidden: true, autoHidden: false } }),
            // Sem nenhuma produção vinculada
            prisma.artist.count({
                where: { isHidden: true, autoHidden: true, productions: { none: {} } },
            }),
            // Tem produções mas todas ocultas ou 18+
            prisma.artist.count({
                where: {
                    isHidden: true, autoHidden: true,
                    productions: {
                        some: {},
                        none: { production: PUBLIC_PRODUCTION_FILTER },
                    },
                    NOT: {
                        productions: { some: { production: { isAdultContent: true, adultContentType: 'sexual' } } },
                    },
                },
            }),
            // Oculto por conteúdo adulto
            prisma.artist.count({
                where: {
                    isHidden: true, autoHidden: true,
                    productions: { some: { production: { isAdultContent: true, adultContentType: 'sexual' } } },
                },
            }),
        ])

        // Filtro por motivo
        let reasonWhere = {}
        if (reason === 'no_productions') {
            reasonWhere = { productions: { none: {} } }
        } else if (reason === 'hidden_productions') {
            reasonWhere = {
                productions: {
                    some: {},
                    none: { production: PUBLIC_PRODUCTION_FILTER },
                },
                NOT: {
                    productions: { some: { production: { isAdultContent: true, adultContentType: 'sexual' } } },
                },
            }
        } else if (reason === 'adult_content') {
            reasonWhere = {
                productions: { some: { production: { isAdultContent: true, adultContentType: 'sexual' } } },
            }
        }

        const where = {
            isHidden: true, autoHidden: true,
            ...(q ? { nameRomanized: { contains: q, mode: 'insensitive' as const } } : {}),
            ...reasonWhere,
        }

        const [artists, total] = await Promise.all([
            prisma.artist.findMany({
                where,
                select: {
                    id: true, nameRomanized: true, nameHangul: true, primaryImageUrl: true,
                    productions: {
                        select: {
                            production: {
                                select: {
                                    id: true, titlePt: true, isHidden: true,
                                    flaggedAsNonKorean: true, ageRating: true, isAdultContent: true, adultContentType: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { nameRomanized: 'asc' },
                skip, take: limit,
            }),
            prisma.artist.count({ where }),
        ])

        const items = artists.map(artist => {
            const prods = artist.productions.map(ap => ap.production)
            const hasAdultContent = prods.some(p => p.isAdultContent && p.adultContentType === 'sexual')
            const hasAnyProd = prods.length > 0
            const hasVisibleProd = prods.some(p => !p.isHidden && p.ageRating !== '18' && !p.isAdultContent)

            type HideReason = 'adult_content' | 'hidden_productions' | 'no_productions'
            let hideReason: HideReason
            if (hasAdultContent) hideReason = 'adult_content'
            else if (!hasAnyProd) hideReason = 'no_productions'
            else hideReason = 'hidden_productions'

            return {
                id: artist.id,
                nameRomanized: artist.nameRomanized,
                nameHangul: artist.nameHangul,
                primaryImageUrl: artist.primaryImageUrl,
                productionCount: prods.length,
                visibleProductionCount: prods.filter(p => !p.isHidden && p.ageRating !== '18' && !p.isAdultContent).length,
                hideReason,
                productions: prods.map(p => ({
                    id: p.id, titlePt: p.titlePt, isHidden: p.isHidden,
                    flaggedAsNonKorean: p.flaggedAsNonKorean, ageRating: p.ageRating, isAdultContent: p.isAdultContent,
                })),
            }
        })

        return NextResponse.json({
            items, total, page, totalPages: Math.ceil(total / limit),
            stats: { totalAutoHidden, manuallyHidden, noProductions, hiddenProductions, adultContent },
        })
    } catch (err) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
    }
}

/**
 * PATCH /api/admin/artists/visibility
 * Body: { action: 'show' | 'reconcile', ids?: string[] }
 */
export async function PATCH(req: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const body = await req.json()
        const { action, ids } = body as { action: string; ids?: string[] }

        if (action === 'show' && ids && ids.length > 0) {
            const result = await prisma.artist.updateMany({
                where: { id: { in: ids }, isHidden: true, autoHidden: true },
                data: { isHidden: false, autoHidden: false },
            })
            return NextResponse.json({ ok: true, updated: result.count })
        }

        if (action === 'reconcile') {
            const service = getArtistVisibilityService()
            const result = await service.reconcileAll(500)
            return NextResponse.json({ ok: true, ...result })
        }

        return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 })
    } catch (err) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
    }
}
