import type { Metadata } from 'next'
import BlogPage from '../../page'
import { SITE_URL } from '@/lib/constants/site'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/JsonLd'

const BASE_URL = SITE_URL

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
    const { tag } = await params
    const decoded = decodeURIComponent(tag)
    const title = `${decoded} — artigos e conteúdos | HallyuHub`
    const description = `Explore todos os artigos e conteúdos sobre ${decoded} no HallyuHub. Análises, curiosidades e novidades sobre K-Pop, K-Drama e cultura coreana em português.`
    const canonical = `${BASE_URL}/blog/tag/${encodeURIComponent(decoded)}`
    return {
        title,
        description,
        alternates: { canonical },
        openGraph: { title, description, url: canonical },
    }
}

export async function generateStaticParams() {
    const posts = await prisma.blogPost.findMany({
        where: { status: 'PUBLISHED', isPrivate: false, tags: { isEmpty: false } },
        select: { tags: true },
        take: 500,
    }).catch(() => [])
    const unique = new Set(posts.flatMap(p => p.tags as string[]))
    return [...unique].map(tag => ({ tag: encodeURIComponent(tag) }))
}

export default async function BlogTagPage({ params, searchParams }: {
    params: Promise<{ tag: string }>
    searchParams: Promise<{ page?: string; sortBy?: string }>
}) {
    const [{ tag }, sp] = await Promise.all([params, searchParams])
    const decoded = decodeURIComponent(tag)

    const [relatedArtists, postCount] = await Promise.all([
        prisma.artist.findMany({
            where: {
                isHidden: false,
                flaggedAsNonKorean: false,
                blogPosts: {
                    some: {
                        blogPost: { status: 'PUBLISHED', isPrivate: false, tags: { has: decoded } },
                    },
                },
            },
            select: { nameRomanized: true, slug: true, id: true },
            take: 8,
            orderBy: { trendingScore: 'desc' },
        }).catch(() => []),
        prisma.blogPost.count({
            where: { status: 'PUBLISHED', isPrivate: false, tags: { has: decoded } },
        }).catch(() => 0),
    ])

    return (
        <>
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Blog', item: `${BASE_URL}/blog` },
                    { '@type': 'ListItem', position: 2, name: decoded, item: `${BASE_URL}/blog/tag/${encodeURIComponent(decoded)}` },
                ],
            }} />

            {/* Header com contexto da tag */}
            <div className="border-b border-border/40 bg-surface">
                <div className="page-wrap py-8">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted mb-1">
                        <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
                        {' / '}Tag
                    </p>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">#{decoded}</h1>
                    <p className="text-muted text-sm">
                        {postCount} artigo{postCount !== 1 ? 's' : ''} sobre {decoded} em português
                    </p>

                    {relatedArtists.length > 0 && (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <span className="text-xs text-muted">Artistas relacionados:</span>
                            {relatedArtists.map(a => (
                                <Link
                                    key={a.id}
                                    href={`/artists/${a.slug ?? a.id}`}
                                    className="rounded-full border border-border px-3 py-0.5 text-xs font-medium hover:border-accent/50 hover:text-accent transition-colors"
                                >
                                    {a.nameRomanized}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <BlogPage searchParams={Promise.resolve({ ...sp, tag: decoded })} />
        </>
    )
}
