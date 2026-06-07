import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getArchiveHubByLocaleAndSlug, getArchiveHubsByLocale } from '@/lib/seo/archive-hubs'
import { getHubItems } from '@/lib/seo/hub-items'
import { buildHubMetadata } from '@/lib/seo/hub-metadata'
import { HubPageContent } from '@/components/seo/HubPageContent'

export const revalidate = 3600

export async function generateStaticParams() {
    return getArchiveHubsByLocale('es').map(hub => ({ slug: hub.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params
    return buildHubMetadata('es', slug)
}

export default async function HubPageEs({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const hub = getArchiveHubByLocaleAndSlug('es', slug)
    if (!hub) notFound()

    const items = await getHubItems(hub)
    return <HubPageContent hub={hub} locale="es" items={items} />
}
