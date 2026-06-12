import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { HubPageContent } from '@/components/seo/HubPageContent'
import { ARCHIVE_HUBS, ARCHIVE_HUB_BY_SLUG } from '@/lib/seo/archive-hubs'
import { getHubBlogPosts, getHubItems } from '@/lib/seo/hub-items'
import { buildHubMetadata } from '@/lib/seo/hub-metadata'

export const revalidate = 3600

export async function generateStaticParams() {
    return ARCHIVE_HUBS.filter(hub => !hub.locale || hub.locale === 'pt').map(hub => ({ slug: hub.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params
    const hub = ARCHIVE_HUB_BY_SLUG[slug]
    if (!hub || (hub.locale && hub.locale !== 'pt')) return {}
    const items = await getHubItems(hub)
    const itemCount = process.env.SKIP_BUILD_STATIC_GENERATION ? undefined : items.length
    return buildHubMetadata('pt', slug, { itemCount })
}

export default async function HubPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const hub = ARCHIVE_HUB_BY_SLUG[slug]
    if (!hub || (hub.locale && hub.locale !== 'pt')) notFound()

    const [items, blogPosts] = await Promise.all([
        getHubItems(hub),
        process.env.SKIP_BUILD_STATIC_GENERATION ? Promise.resolve([]) : getHubBlogPosts(hub).catch(() => []),
    ])

    return <HubPageContent hub={hub} locale="pt" items={items} blogPosts={blogPosts} />
}
