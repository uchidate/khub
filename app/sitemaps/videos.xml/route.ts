import prisma from '@/lib/prisma'
import { SITE_URL } from '@/lib/constants/site'
import { escapeXml, xmlResponse } from '@/lib/seo/xml'
import { extractYoutubeId } from '@/lib/utils/youtube'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

type VideoInput = { title?: string; url?: string }

function videoEntry(input: {
    pageUrl: string
    video: VideoInput
    fallbackTitle: string
    description: string
    thumbnailUrl?: string | null
    updatedAt: Date
}) {
    if (!input.video.url) return ''
    const id = extractYoutubeId(input.video.url)
    if (!id) return ''

    const title = input.video.title?.trim() || input.fallbackTitle
    const thumbnail = input.thumbnailUrl || `https://img.youtube.com/vi/${id}/hqdefault.jpg`
    return `
  <url>
    <loc>${escapeXml(input.pageUrl)}</loc>
    <video:video>
      <video:thumbnail_loc>${escapeXml(thumbnail)}</video:thumbnail_loc>
      <video:title>${escapeXml(title)}</video:title>
      <video:description>${escapeXml(input.description.slice(0, 2000))}</video:description>
      <video:player_loc allow_embed="yes">https://www.youtube.com/embed/${escapeXml(id)}</video:player_loc>
      <video:publication_date>${input.updatedAt.toISOString()}</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
    </video:video>
  </url>`
}

function parseVideos(value: unknown): VideoInput[] {
    return Array.isArray(value)
        ? value.filter(item => item && typeof item === 'object') as VideoInput[]
        : []
}

export async function GET() {
    const [artists, groups, productions] = await Promise.all([
        prisma.artist.findMany({
            where: {
                flaggedAsNonKorean: false,
                isHidden: false,
                slug: { not: null },
                videos: { not: undefined },
            },
            select: { slug: true, nameRomanized: true, bio: true, primaryImageUrl: true, videos: true, updatedAt: true },
            orderBy: { trendingScore: 'desc' },
            take: 1000,
        }),
        prisma.musicalGroup.findMany({
            where: { isHidden: false, slug: { not: null }, videos: { not: undefined } },
            select: { slug: true, name: true, bio: true, profileImageUrl: true, videos: true, updatedAt: true },
            orderBy: { trendingScore: 'desc' },
            take: 1000,
        }),
        prisma.production.findMany({
            where: {
                flaggedAsNonKorean: false,
                isHidden: false,
                slug: { not: null },
                trailerUrl: { not: null },
                AND: [
                    { OR: [{ ageRating: null }, { ageRating: { not: '18' } }] },
                    { OR: [{ isAdultContent: null }, { isAdultContent: false }] },
                ],
            },
            select: { slug: true, titlePt: true, synopsis: true, imageUrl: true, backdropUrl: true, trailerUrl: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
            take: 1000,
        }),
    ])

    const entries = [
        ...artists.flatMap(artist =>
            parseVideos(artist.videos).slice(0, 3).map(video => videoEntry({
                pageUrl: `${SITE_URL}/artists/${artist.slug}`,
                video,
                fallbackTitle: `${artist.nameRomanized} no YouTube`,
                description: artist.bio ?? `Vídeo relacionado a ${artist.nameRomanized} no HallyuHub.`,
                thumbnailUrl: artist.primaryImageUrl,
                updatedAt: artist.updatedAt,
            }))
        ),
        ...groups.flatMap(group =>
            parseVideos(group.videos).slice(0, 3).map(video => videoEntry({
                pageUrl: `${SITE_URL}/groups/${group.slug}`,
                video,
                fallbackTitle: `${group.name} no YouTube`,
                description: group.bio ?? `Vídeo relacionado a ${group.name} no HallyuHub.`,
                thumbnailUrl: group.profileImageUrl,
                updatedAt: group.updatedAt,
            }))
        ),
        ...productions.map(production => videoEntry({
            pageUrl: `${SITE_URL}/productions/${production.slug}`,
            video: { title: `Trailer - ${production.titlePt}`, url: production.trailerUrl ?? undefined },
            fallbackTitle: `Trailer - ${production.titlePt}`,
            description: production.synopsis ?? `Trailer de ${production.titlePt} no HallyuHub.`,
            thumbnailUrl: production.imageUrl ?? production.backdropUrl,
            updatedAt: production.updatedAt,
        })),
    ].filter(Boolean).join('')

    return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">${entries}
</urlset>`)
}
