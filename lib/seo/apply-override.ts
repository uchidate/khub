/**
 * lib/seo/apply-override.ts
 *
 * Busca o override de SeoMeta para uma entidade e aplica sobre o Metadata
 * padrão gerado pela página. Campos null no override são ignorados (mantém o padrão).
 */

import type { Metadata } from 'next'
import prisma from '@/lib/prisma'

type EntityType = 'artist' | 'production' | 'group' | 'blog_post'

export async function applySeoOverride(
    base: Metadata,
    entityType: EntityType,
    entityId: string,
): Promise<Metadata> {
    let override: {
        metaTitle: string | null
        metaDesc: string | null
        ogTitle: string | null
        ogDesc: string | null
        ogImageUrl: string | null
        canonicalUrl: string | null
        noIndex: boolean
    } | null = null

    try {
        override = await prisma.seoMeta.findUnique({
            where: { entityType_entityId: { entityType, entityId } },
            select: { metaTitle: true, metaDesc: true, ogTitle: true, ogDesc: true, ogImageUrl: true, canonicalUrl: true, noIndex: true },
        })
    } catch { /* DB indisponível no build — ignorar */ }

    if (!override) return base

    const result: Metadata = { ...base }

    if (override.noIndex) {
        result.robots = { index: false, follow: false }
    }
    if (override.metaTitle)    result.title       = override.metaTitle
    if (override.metaDesc)     result.description = override.metaDesc
    if (override.canonicalUrl) result.alternates  = { ...result.alternates, canonical: override.canonicalUrl }

    // OpenGraph
    if (override.ogTitle || override.ogDesc || override.ogImageUrl) {
        const ogTitle = override.ogTitle || (typeof result.title === 'string' ? result.title : undefined)
        const ogDesc  = override.ogDesc  || result.description as string | undefined
        const ogImage = override.ogImageUrl

        result.openGraph = {
            ...(result.openGraph as object ?? {}),
            ...(ogTitle ? { title: ogTitle }                                              : {}),
            ...(ogDesc  ? { description: ogDesc }                                         : {}),
            ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] }        : {}),
        }
        result.twitter = {
            ...(result.twitter as object ?? {}),
            ...(ogTitle ? { title: ogTitle }       : {}),
            ...(ogDesc  ? { description: ogDesc }  : {}),
            ...(ogImage ? { images: [ogImage] }    : {}),
        }
    }

    return result
}
