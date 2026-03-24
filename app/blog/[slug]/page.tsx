import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { PageTransition } from '@/components/features/PageTransition'
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer'
import { BlogBlockRenderer, type ResolvedEntities } from '@/components/ui/BlogBlockRenderer'
import type { BlogBlock } from '@/lib/types/blocks'
import { Clock, Eye, ArrowLeft, Tag, Calendar } from 'lucide-react'
import prisma from '@/lib/prisma'
import { JsonLd } from '@/components/seo/JsonLd'
import { AdBanner } from '@/components/ui/AdBanner'

import { SITE_URL } from '@/lib/constants/site'
import { BLOG_AUTHOR_DISPLAY_NAME, BLOG_AUTHOR_AVATAR_INITIAL } from '@/lib/config/blog'
const BASE_URL = SITE_URL

export const revalidate = 3600

export async function generateStaticParams() {
  if (process.env.SKIP_BUILD_STATIC_GENERATION) return []
  const posts = await prisma.blogPost.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true },
  })
  return posts.map(p => ({ slug: p.slug }))
}

async function getPost(slug: string) {
  return prisma.blogPost.findFirst({
    where: { slug, status: 'PUBLISHED', isPrivate: false },
    include: {
      author: { select: { id: true, name: true, image: true, bio: true } },
      category: true,
    },
  })
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    alternates: { canonical: `${BASE_URL}/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      url: `${BASE_URL}/blog/${slug}`,
      images: post.coverImageUrl ? [{ url: post.coverImageUrl }] : [],
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      authors: [BLOG_AUTHOR_DISPLAY_NAME],
    },
  }
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  // Increment view count
  void prisma.blogPost.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } }).catch(() => {})

  // Pre-fetch data for embedded entity cards
  const blocks = Array.isArray((post as unknown as { blocks: unknown }).blocks)
    ? (post as unknown as { blocks: BlogBlock[] }).blocks
    : []
  const artistIds = Array.from(new Set(blocks.filter(b => b.type === 'blog_artist_card').map(b => (b as { artistId: string }).artistId)))
  const productionIds = Array.from(new Set(blocks.filter(b => b.type === 'blog_production_card').map(b => (b as { productionId: string }).productionId)))
  const [artists, productions] = await Promise.all([
    artistIds.length > 0
      ? prisma.artist.findMany({ where: { id: { in: artistIds } }, select: { id: true, nameRomanized: true, roles: true, primaryImageUrl: true } })
      : [],
    productionIds.length > 0
      ? prisma.production.findMany({ where: { id: { in: productionIds } }, select: { id: true, titlePt: true, type: true, year: true, imageUrl: true } })
      : [],
  ])
  const resolvedEntities: ResolvedEntities = {
    artists: Object.fromEntries(artists.map(a => [a.id, a])),
    productions: Object.fromEntries(productions.map(p => [p.id, p])),
  }

  return (
    <PageTransition className="pb-20 px-4 sm:px-6">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.excerpt ?? undefined,
        "image": post.coverImageUrl ?? undefined,
        "url": `${BASE_URL}/blog/${post.slug}`,
        "datePublished": (post.publishedAt ?? post.createdAt).toISOString(),
        "dateModified": post.updatedAt.toISOString(),
        "inLanguage": "pt-BR",
        "author": { "@type": "Organization", "name": BLOG_AUTHOR_DISPLAY_NAME },
        "publisher": {
          "@type": "Organization",
          "name": "HallyuHub",
          "logo": { "@type": "ImageObject", "url": `${BASE_URL}/og-image.jpg` },
        },
        ...(post.tags.length > 0 ? { "keywords": post.tags.join(', ') } : {}),
      }} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Blog", "item": `${BASE_URL}/blog` },
          { "@type": "ListItem", "position": 2, "name": post.title, "item": `${BASE_URL}/blog/${post.slug}` },
        ],
      }} />
      <div className="max-w-3xl mx-auto">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-8">
          <ArrowLeft size={14} />
          Voltar ao Blog
        </Link>

        {/* Header */}
        <header className="mb-8 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {post.category && (
              <Link href={`/blog?category=${post.category.slug}`} className="px-2.5 py-1 bg-[#ff2d78]/10 text-[#ff2d78] rounded text-xs font-semibold uppercase tracking-wider hover:bg-[#ff2d78]/20 transition-colors">
                {post.category.name}
              </Link>
            )}
            {post.featured && (
              <span className="px-2.5 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-semibold uppercase tracking-wider">
                Destaque
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-foreground leading-tight">{post.title}</h1>

          {post.excerpt && (
            <p className="text-xl text-muted leading-relaxed">{post.excerpt}</p>
          )}

          <div className="flex items-center gap-4 flex-wrap text-sm text-muted pt-2 border-t border-border">
            {/* Author */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#ff2d78]/10 flex items-center justify-center text-xs font-bold text-[#ff2d78]">
                {BLOG_AUTHOR_AVATAR_INITIAL}
              </div>
              <span className="font-medium text-foreground">{BLOG_AUTHOR_DISPLAY_NAME}</span>
            </div>
            <span className="flex items-center gap-1.5"><Calendar size={13} />{formatDate(post.publishedAt ?? post.createdAt)}</span>
            <span className="flex items-center gap-1.5"><Clock size={13} />{post.readingTimeMin} min de leitura</span>
            <span className="flex items-center gap-1.5 ml-auto"><Eye size={13} />{post.viewCount + 1} views</span>
          </div>
        </header>

        {/* Cover image */}
        {post.coverImageUrl && (
          <div className="relative aspect-video rounded-2xl overflow-hidden mb-10 border border-border">
            <Image src={post.coverImageUrl} alt={post.title} fill className="object-cover" priority />
          </div>
        )}

        <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG_ARTICLE!} format="horizontal" className="mb-10" />

        {/* Content — blocks take precedence over markdown */}
        <article>
          {Array.isArray((post as unknown as { blocks: unknown }).blocks) && ((post as unknown as { blocks: BlogBlock[] }).blocks).length > 0
            ? <BlogBlockRenderer blocks={(post as unknown as { blocks: BlogBlock[] }).blocks} resolvedEntities={resolvedEntities} />
            : <MarkdownRenderer content={post.contentMd} />
          }
        </article>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-border">
            <Tag size={14} className="text-muted mt-0.5 shrink-0" />
            {post.tags.map(tag => (
              <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`} className="px-2.5 py-1 rounded-full border border-border bg-surface text-muted hover:text-foreground hover:border-[#080808]/20 text-xs transition-colors">
                {tag}
              </Link>
            ))}
          </div>
        )}

        {/* Author bio */}
        {post.author?.bio && (
          <div className="mt-10 p-5 rounded-2xl border border-border bg-surface flex gap-4">
            <div className="w-12 h-12 rounded-full bg-[#ff2d78]/10 flex items-center justify-center text-sm font-bold text-[#ff2d78] shrink-0">
              {BLOG_AUTHOR_AVATAR_INITIAL}
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">{BLOG_AUTHOR_DISPLAY_NAME}</p>
              <p className="text-muted text-sm mt-1">{post.author.bio}</p>
            </div>
          </div>
        )}

        <div className="mt-10">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors">
            <ArrowLeft size={14} />
            Voltar ao Blog
          </Link>
        </div>
      </div>
    </PageTransition>
  )
}
