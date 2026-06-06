import type { Metadata } from 'next'
import BlogPage from '../../page'
import { SITE_URL } from '@/lib/constants/site'
import { BLOG_CATEGORY_BY_SLUG, BLOG_CATEGORIES } from '@/lib/config/categories'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { JsonLd } from '@/components/seo/JsonLd'

const BASE_URL = SITE_URL

export const revalidate = 300

export async function generateStaticParams() {
    return BLOG_CATEGORIES.map(c => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params
    const category = BLOG_CATEGORY_BY_SLUG[slug]
    const name = category?.name ?? slug
    const title = `${name} — artigos e análises | HallyuHub`
    const description = `Conteúdos sobre ${name}: artigos, análises, guias e curiosidades sobre K-Pop, K-Drama e cultura coreana em português.`
    const canonical = `${BASE_URL}/blog/category/${slug}`
    return {
        title,
        description,
        alternates: { canonical },
        openGraph: { title, description, url: canonical },
    }
}

export default async function BlogCategoryPage({ params, searchParams }: {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ page?: string; sortBy?: string }>
}) {
    const [{ slug }, sp] = await Promise.all([params, searchParams])
    const category = BLOG_CATEGORY_BY_SLUG[slug]

    const postCount = await prisma.blogPost.count({
        where: { status: 'PUBLISHED', isPrivate: false, category: { slug } },
    }).catch(() => 0)

    const recentPosts = await prisma.blogPost.findMany({
        where: { status: 'PUBLISHED', isPrivate: false, category: { slug } },
        select: { title: true, slug: true, publishedAt: true },
        orderBy: { publishedAt: 'desc' },
        take: 5,
    }).catch(() => [])

    return (
        <>
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Blog', item: `${BASE_URL}/blog` },
                    { '@type': 'ListItem', position: 2, name: category?.name ?? slug, item: `${BASE_URL}/blog/category/${slug}` },
                ],
            }} />
            {recentPosts.length > 0 && (
                <JsonLd data={{
                    '@context': 'https://schema.org',
                    '@type': 'CollectionPage',
                    name: `${category?.name ?? slug} | HallyuHub`,
                    description: `Artigos sobre ${category?.name ?? slug} em português`,
                    url: `${BASE_URL}/blog/category/${slug}`,
                    hasPart: recentPosts.map(p => ({
                        '@type': 'BlogPosting',
                        headline: p.title,
                        url: `${BASE_URL}/blog/${p.slug}`,
                        ...(p.publishedAt ? { datePublished: p.publishedAt.toISOString() } : {}),
                    })),
                }} />
            )}

            <div className="border-b border-border/40 bg-surface">
                <div className="page-wrap py-8">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted mb-1">
                        <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
                        {' / '}Categoria
                    </p>
                    <div className="flex items-center gap-3 mb-2">
                        {category?.color && (
                            <span className="h-4 w-1 rounded-full" style={{ background: category.color }} />
                        )}
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{category?.name ?? slug}</h1>
                    </div>
                    <p className="text-muted text-sm">
                        {postCount} artigo{postCount !== 1 ? 's' : ''} sobre {category?.name ?? slug} em português
                    </p>
                </div>
            </div>

            <BlogPage searchParams={Promise.resolve({ ...sp, category: slug })} />
        </>
    )
}
