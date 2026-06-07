import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/JsonLd'
import { SITE_URL } from '@/lib/constants/site'
import { ARCHIVE_HUBS } from '@/lib/seo/archive-hubs'

export const revalidate = 3600

const BASE_URL = SITE_URL
const PT_HUBS = ARCHIVE_HUBS.filter(hub => !hub.locale || hub.locale === 'pt')

export const metadata: Metadata = {
    title: 'Guias e hubs de K-Pop e K-Drama',
    description: 'Hubs editoriais do HallyuHub para descobrir artistas, grupos, idols, doramas e cultura coreana por tema.',
    alternates: { canonical: `${BASE_URL}/hubs` },
}

export default function HubsPage() {
    return (
        <main className="min-h-screen bg-background">
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'CollectionPage',
                name: 'Guias e hubs HallyuHub',
                description: 'Coleções editoriais para navegar por K-Pop, K-Drama e cultura coreana.',
                url: `${BASE_URL}/hubs`,
                inLanguage: 'pt-BR',
            }} />
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'ItemList',
                name: 'Guias HallyuHub',
                url: `${BASE_URL}/hubs`,
                numberOfItems: PT_HUBS.length,
                itemListElement: PT_HUBS.map((hub, index) => ({
                    '@type': 'ListItem',
                    position: index + 1,
                    url: `${BASE_URL}/hubs/${hub.slug}`,
                    name: hub.title,
                })),
            }} />
            <section className="page-wrap py-12 sm:py-16">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-accent">Navegação editorial</p>
                <h1 className="mt-2 max-w-3xl text-[38px] font-black leading-[0.98] tracking-[-0.04em] text-foreground sm:text-[56px]">Guias para descobrir o universo Hallyu</h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-muted">Explore coleções com artistas, grupos e produções organizados por intenção de busca.</p>
                <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {PT_HUBS.map(hub => (
                        <Link key={hub.slug} href={`/hubs/${hub.slug}`} className="group border border-border bg-surface p-5 transition-colors hover:border-accent/50">
                            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{hub.kind}</p>
                            <h2 className="mt-2 text-xl font-black text-foreground group-hover:text-accent">{hub.title}</h2>
                            <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{hub.description}</p>
                        </Link>
                    ))}
                </div>
            </section>
        </main>
    )
}
