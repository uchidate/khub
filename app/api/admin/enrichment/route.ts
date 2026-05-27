import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import {
    ARTIST_CURATION_PENDING_WHERE,
    GROUP_CURATION_PENDING_WHERE,
    PRODUCTION_CURATION_PENDING_WHERE,
} from '@/lib/admin/curation-queue'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export type EnrichmentPriorityItem = {
    id: string
    type: 'artist' | 'group' | 'production'
    name: string
    subtitle: string | null
    href: string
    missingFields: string[]
    relevance: number
    ageDays: number
    stale: boolean
}

/**
 * GET /api/admin/enrichment
 * Returns the backlog for the reviewed prompt/Gemini workflow only.
 */
export async function GET() {
    const { error } = await requireAdmin()
    if (error) return error

    const staleCutoff = new Date(Date.now() - 7 * 86400_000)
    const [artists, groups, productions, staleArtists, staleGroups, staleProductions, priorityArtists, priorityGroups, priorityProductions] = await Promise.all([
        prisma.artist.count({
            where: ARTIST_CURATION_PENDING_WHERE,
        }),
        prisma.musicalGroup.count({
            where: GROUP_CURATION_PENDING_WHERE,
        }),
        prisma.production.count({
            where: PRODUCTION_CURATION_PENDING_WHERE,
        }),
        prisma.artist.count({
            where: { AND: [ARTIST_CURATION_PENDING_WHERE, { createdAt: { lt: staleCutoff } }] },
        }),
        prisma.musicalGroup.count({
            where: { AND: [GROUP_CURATION_PENDING_WHERE, { createdAt: { lt: staleCutoff } }] },
        }),
        prisma.production.count({
            where: { AND: [PRODUCTION_CURATION_PENDING_WHERE, { createdAt: { lt: staleCutoff } }] },
        }),
        prisma.artist.findMany({
            where: ARTIST_CURATION_PENDING_WHERE,
            orderBy: { trendingScore: 'desc' },
            take: 8,
            select: {
                id: true,
                nameRomanized: true,
                nameHangul: true,
                roles: true,
                trendingScore: true,
                bio: true,
                analiseEditorial: true,
                curiosidades: true,
                height: true,
                bloodType: true,
                fanInfo: true,
                awards: true,
                createdAt: true,
            },
        }),
        prisma.musicalGroup.findMany({
            where: GROUP_CURATION_PENDING_WHERE,
            orderBy: { trendingScore: 'desc' },
            take: 8,
            select: {
                id: true,
                name: true,
                nameHangul: true,
                trendingScore: true,
                bio: true,
                analiseEditorial: true,
                curiosidades: true,
                fanClubName: true,
                officialColor: true,
                socialLinks: true,
                createdAt: true,
            },
        }),
        prisma.production.findMany({
            where: PRODUCTION_CURATION_PENDING_WHERE,
            orderBy: [{ needsCuration: 'desc' }, { releaseDate: 'desc' }],
            take: 8,
            select: {
                id: true,
                titlePt: true,
                type: true,
                year: true,
                voteAverage: true,
                needsCuration: true,
                synopsis: true,
                tagline: true,
                whyWatch: true,
                editorialReview: true,
                editorialRating: true,
                curiosidades: true,
                createdAt: true,
            },
        }),
    ])

    const detailedQueues = { artists, groups, productions }
    const staleQueues = { artists: staleArtists, groups: staleGroups, productions: staleProductions }
    const ageInDays = (createdAt: Date) => Math.floor((Date.now() - createdAt.getTime()) / 86400_000)
    const priorityItems: EnrichmentPriorityItem[] = [
        ...priorityArtists.map(artist => ({
            id: artist.id,
            type: 'artist' as const,
            name: artist.nameRomanized,
            subtitle: [artist.roles[0], artist.nameHangul].filter(Boolean).join(' · ') || null,
            href: `/admin/artists/${artist.id}/enrich`,
            missingFields: [
                !artist.bio && 'bio',
                !artist.analiseEditorial && 'editorial',
                artist.curiosidades.length === 0 && 'curiosidades',
                !artist.height && 'altura',
                !artist.bloodType && 'tipo sanguineo',
                !artist.fanInfo && 'fandom',
                !artist.awards && 'premios',
            ].filter((field): field is string => !!field),
            relevance: artist.trendingScore,
            ageDays: ageInDays(artist.createdAt),
            stale: artist.createdAt < staleCutoff,
        })),
        ...priorityGroups.map(group => ({
            id: group.id,
            type: 'group' as const,
            name: group.name,
            subtitle: group.nameHangul,
            href: `/admin/groups/${group.id}/enrich`,
            missingFields: [
                !group.bio && 'bio',
                !group.analiseEditorial && 'editorial',
                group.curiosidades.length === 0 && 'curiosidades',
                !group.fanClubName && 'fandom',
                !group.officialColor && 'cor oficial',
                !group.socialLinks && 'redes',
            ].filter((field): field is string => !!field),
            relevance: group.trendingScore,
            ageDays: ageInDays(group.createdAt),
            stale: group.createdAt < staleCutoff,
        })),
        ...priorityProductions.map(production => ({
            id: production.id,
            type: 'production' as const,
            name: production.titlePt,
            subtitle: [production.type, production.year?.toString()].filter(Boolean).join(' · ') || null,
            href: `/admin/productions/${production.id}/enrich`,
            missingFields: [
                !production.synopsis && 'sinopse',
                !production.tagline && 'tagline',
                !production.whyWatch && 'por que assistir',
                !production.editorialReview && 'review',
                production.editorialRating == null && 'nota',
                production.curiosidades.length === 0 && 'curiosidades',
            ].filter((field): field is string => !!field),
            relevance: (production.needsCuration ? 100 : 0) + (production.voteAverage ?? 0) * 10,
            ageDays: ageInDays(production.createdAt),
            stale: production.createdAt < staleCutoff,
        })),
    ]
        .sort((left, right) => (
            (Number(right.stale) * 500 + right.missingFields.length * 100 + right.relevance)
            - (Number(left.stale) * 500 + left.missingFields.length * 100 + left.relevance)
        ))
        .slice(0, 10)

    return NextResponse.json({
        mode: 'reviewed_gemini',
        counts: detailedQueues,
        detailedQueues,
        staleQueues,
        priorityItems,
    })
}

/**
 * Automated editorial enrichment previously generated content through DeepSeek.
 * Writing curated fields now happens only through the reviewed Gemini import pages.
 */
export async function POST() {
    const { error } = await requireAdmin()
    if (error) return error

    return NextResponse.json(
        {
            error: 'Enriquecimento automatico desativado. Use a fila manual com prompt e retorno do Gemini.',
            href: '/admin/enrichment',
        },
        { status: 410 },
    )
}
