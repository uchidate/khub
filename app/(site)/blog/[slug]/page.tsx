import React from 'react'
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
import { BlogEditButton } from '@/components/blog/BlogEditButton'
import { JsonLd } from '@/components/seo/JsonLd'

import { SITE_URL } from '@/lib/constants/site'
import { BLOG_AUTHOR_DISPLAY_NAME, BLOG_AUTHOR_AVATAR_INITIAL } from '@/lib/config/blog'
import { AdBanner } from '@/components/ui/AdBanner'
import { getTagStyle } from '@/lib/utils/tag-colors'
import { BlogViewTracker } from '@/components/blog/BlogViewTracker'
import { BlogReadingProgress } from '@/components/blog/BlogReadingProgress'
import { applySeoOverride } from '@/lib/seo/apply-override'
const BASE_URL = SITE_URL

const AD_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG_ARTICLE!

function MarkdownWithAds({ content }: { content: string }) {
  const sections = content.split(/(?=^#{2,3} )/m).filter(Boolean)
  if (sections.length <= 2) {
    return <MarkdownRenderer content={content} />
  }
  // Inject an ad every 3 sections
  const AD_EVERY = 3
  const parts: React.ReactNode[] = []
  for (let i = 0; i < sections.length; i++) {
    parts.push(<MarkdownRenderer key={i} content={sections[i]} />)
    if ((i + 1) % AD_EVERY === 0 && i < sections.length - 1) {
      parts.push(<AdBanner key={`ad-${i}`} slot={AD_SLOT} format="auto" className="my-8" />)
    }
  }
  return <>{parts}</>
}

// ISR ativo — force-dynamic removido; generateStaticParams pré-renderiza os posts publicados
export const revalidate = 3600

export async function generateStaticParams() {
  if (process.env.SKIP_BUILD_STATIC_GENERATION) return []
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true },
    })
    return posts.map(p => ({ slug: p.slug }))
  } catch {
    return []
  }
}

async function getPost(slug: string) {
  if (process.env.SKIP_BUILD_STATIC_GENERATION) return null
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

  return applySeoOverride({
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
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.coverImageUrl ? [post.coverImageUrl] : [],
    },
  }, 'blog_post', slug)
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

async function fetchRelatedPosts(postId: string, tags: string[], limit = 3) {
  if (tags.length === 0) return []
  return prisma.blogPost.findMany({
    where: {
      id: { not: postId },
      status: 'PUBLISHED',
      isPrivate: false,
      tags: { hasSome: tags },
    },
    select: {
      slug: true, title: true, excerpt: true,
      coverImageUrl: true, readingTimeMin: true, publishedAt: true, tags: true,
    },
    orderBy: { publishedAt: 'desc' },
    take: limit,
  })
}

type RelatedPost = Awaited<ReturnType<typeof fetchRelatedPosts>>[number]

function RelatedPostCard({ post }: { post: RelatedPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group flex flex-col gap-3 rounded-2xl border border-border bg-surface hover:border-[#ff2d78]/30 transition-all">
      {post.coverImageUrl ? (
        <div className="relative aspect-video rounded-t-2xl overflow-hidden">
          <Image src={post.coverImageUrl} alt={post.title} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      ) : (
        <div className="aspect-video rounded-t-2xl bg-[#ff2d78]/5 flex items-center justify-center">
          <span className="text-3xl opacity-30">✦</span>
        </div>
      )}
      <div className="px-4 pb-4 flex flex-col gap-2">
        <h3 className="font-bold text-foreground text-sm leading-snug group-hover:text-[#ff2d78] transition-colors line-clamp-2">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-muted text-xs leading-relaxed line-clamp-2">{post.excerpt}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-muted mt-1">
          <span className="flex items-center gap-1"><Clock size={11} />{post.readingTimeMin} min</span>
          {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
        </div>
      </div>
    </Link>
  )
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()


  // Pre-fetch data for embedded entity cards
  const blocks = Array.isArray((post as unknown as { blocks: unknown }).blocks)
    ? (post as unknown as { blocks: BlogBlock[] }).blocks
    : []
  const artistIds = Array.from(new Set(blocks.filter(b => b.type === 'blog_artist_card').map(b => (b as { artistId: string }).artistId)))
  const productionIds = Array.from(new Set(blocks.filter(b => b.type === 'blog_production_card').map(b => (b as { productionId: string }).productionId)))
  const groupIds = Array.from(new Set(blocks.filter(b => b.type === 'blog_group_card').map(b => (b as { groupId: string }).groupId)))
  const [artists, productions, groups, relatedPosts] = await Promise.all([
    artistIds.length > 0
      ? prisma.artist.findMany({ where: { id: { in: artistIds } }, select: { id: true, nameRomanized: true, roles: true, primaryImageUrl: true } })
      : [],
    productionIds.length > 0
      ? prisma.production.findMany({ where: { id: { in: productionIds } }, select: { id: true, titlePt: true, type: true, year: true, imageUrl: true } })
      : [],
    groupIds.length > 0
      ? prisma.musicalGroup.findMany({ where: { id: { in: groupIds } }, select: { id: true, name: true, profileImageUrl: true, fanClubName: true } })
      : [],
    fetchRelatedPosts(post.id, post.tags).catch(() => []),
  ])
  const resolvedEntities: ResolvedEntities = {
    artists: Object.fromEntries(artists.map(a => [a.id, a])),
    productions: Object.fromEntries(productions.map(p => [p.id, p])),
    groups: Object.fromEntries(groups.map(g => [g.id, g])),
  }

  return (
    <PageTransition className="pt-6 pb-20 px-4 sm:px-6">
      <BlogReadingProgress />
      <BlogViewTracker slug={slug} />
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
      <div className="max-w-screen-2xl mx-auto">
      {/* Grid: mobile=1col, xl=left+article+right (ambas sidebars em >=1280px) */}
      <div className="grid grid-cols-1 xl:grid-cols-[200px_1fr_200px] gap-6 xl:gap-8">

      {/* ── Sidebar ESQUERDA (sticky) ── */}
      <aside className="hidden xl:block">
        <div className="sticky top-6">
          <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG_SIDEBAR!} format="auto" />
        </div>
      </aside>

      {/* ── Coluna principal — largura máxima para leitura ── */}
      <div className="min-w-0 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors">
            <ArrowLeft size={14} />
            Voltar ao Blog
          </Link>
          <BlogEditButton postId={post.id} />
        </div>

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
            <p className="text-xl text-muted leading-relaxed italic border-l-2 border-[#ff2d78]/30 pl-4">{post.excerpt}</p>
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
            <Image src={post.coverImageUrl} alt={post.title} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" priority />
          </div>
        )}

        {/* Content — blocks take precedence over markdown */}
        <article>
          {Array.isArray((post as unknown as { blocks: unknown }).blocks) && ((post as unknown as { blocks: BlogBlock[] }).blocks).length > 0
            ? <BlogBlockRenderer blocks={(post as unknown as { blocks: BlogBlock[] }).blocks} resolvedEntities={resolvedEntities} />
            : <MarkdownWithAds content={(post as unknown as { contentMd?: string }).contentMd ?? ''} />
          }
        </article>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-border">
            <Tag size={14} className="text-muted mt-0.5 shrink-0" />
            {post.tags.map(tag => {
              const ts = getTagStyle(tag)
              return (
                <Link
                  key={tag}
                  href={`/blog?tag=${encodeURIComponent(tag)}`}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:brightness-95"
                  style={{ color: ts.color, backgroundColor: ts.bg }}
                >
                  {tag}
                </Link>
              )
            })}
          </div>
        )}

        {/* Author bio */}
        {(post as unknown as { author?: { bio?: string } }).author?.bio && (
          <div className="mt-10 p-5 rounded-2xl border border-border bg-surface flex gap-4">
            <div className="w-12 h-12 rounded-full bg-[#ff2d78]/10 flex items-center justify-center text-sm font-bold text-[#ff2d78] shrink-0">
              {BLOG_AUTHOR_AVATAR_INITIAL}
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">{BLOG_AUTHOR_DISPLAY_NAME}</p>
              <p className="text-muted text-sm mt-1">{(post as unknown as { author?: { bio?: string } }).author?.bio}</p>
            </div>
          </div>
        )}

        {/* Ad before related posts — slot diferente do inline */}
        <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG_SIDEBAR!} format="auto" className="mt-10" />

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-14 pt-10 border-t border-border">
            <h2 className="text-lg font-bold text-foreground mb-6">Artigos relacionados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedPosts.map(related => (
                <RelatedPostCard key={related.slug} post={related} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-10">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors">
            <ArrowLeft size={14} />
            Voltar ao Blog
          </Link>
        </div>
      </div>{/* fim coluna principal */}

      {/* ── Sidebar DIREITA (sticky) ── */}
      <aside className="hidden xl:block">
        <div className="sticky top-6">
          <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG_ARTICLE!} format="auto" />
        </div>
      </aside>

      </div>{/* fim grid */}
      </div>{/* fim max-w */}
    </PageTransition>
  )
}
