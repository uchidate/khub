import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { SafeImage } from '@/components/ui/SafeImage'
import { notFound } from 'next/navigation'
import dynamic from 'next/dynamic'
import { PageTransition } from '@/components/features/PageTransition'
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer'
import type { ResolvedEntities } from '@/components/ui/BlogBlockRenderer'
import type { BlogBlock } from '@/lib/types/blocks'
import { BookOpen, Clock, Eye, ArrowRight, Tag, Calendar, Trophy } from 'lucide-react'
import { BrandDot } from '@/components/ui/BrandDot'
import prisma from '@/lib/prisma'
import { JsonLd } from '@/components/seo/JsonLd'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'

import { SITE_URL } from '@/lib/constants/site'
import { BLOG_AUTHOR_DISPLAY_NAME, BLOG_AUTHOR_AVATAR_INITIAL } from '@/lib/config/blog'
import { getTagStyle } from '@/lib/utils/tag-colors'
import { applySeoOverride } from '@/lib/seo/apply-override'
import { LojaRelacionados } from '@/components/ui/LojaRelacionados'
import { CommentsSection } from '@/components/features/CommentsSection'
import { ResponsiveFilterBar } from '@/components/ui/ResponsiveFilterBar'
import { BLOG_CATEGORIES } from '@/lib/config/categories'

const BlogBlockRenderer = dynamic(() => import('@/components/ui/BlogBlockRenderer').then(m => ({ default: m.BlogBlockRenderer })))
const BlogEditButton = dynamic(() => import('@/components/blog/BlogEditButton').then(m => ({ default: m.BlogEditButton })))
const BlogViewTracker = dynamic(() => import('@/components/blog/BlogViewTracker').then(m => ({ default: m.BlogViewTracker })))
const BlogReadingProgress = dynamic(() => import('@/components/blog/BlogReadingProgress').then(m => ({ default: m.BlogReadingProgress })))
const BlogTableOfContents = dynamic(() => import('@/components/blog/BlogTableOfContents').then(m => ({ default: m.BlogTableOfContents })))
const BlogShareButtons = dynamic(() => import('@/components/blog/BlogShareButtons').then(m => ({ default: m.BlogShareButtons })))
const BlogStickyNav = dynamic(() => import('@/components/blog/BlogStickyNav').then(m => ({ default: m.BlogStickyNav })))
const BlogBackToTop = dynamic(() => import('@/components/blog/BlogBackToTop').then(m => ({ default: m.BlogBackToTop })))
const BlogTextShare = dynamic(() => import('@/components/blog/BlogTextShare').then(m => ({ default: m.BlogTextShare })))
const BASE_URL = SITE_URL

function MarkdownWithAds({ content }: { content: string }) {
  // Split on H2/H3 headings to inject ads between sections
  const sections = content.split(/(?=^#{2,3} )/m).filter(Boolean)
  if (sections.length <= 2) {
    return (
      <>
        <MarkdownRenderer content={content} />
      </>
    )
  }
  const midpoint = Math.floor(sections.length / 2)
  const firstHalf = sections.slice(0, midpoint).join('')
  const secondHalf = sections.slice(midpoint).join('')
  return (
    <>
      <MarkdownRenderer content={firstHalf} />
      <MarkdownRenderer content={secondHalf} />
    </>
  )
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

async function fetchRelatedPosts(postId: string, tags: string[], limit = 6) {
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
    <Link href={`/blog/${post.slug}`} className="group flex flex-col gap-3 rounded-md border border-border bg-surface transition-all hover:border-accent/40">
      <div className="relative aspect-video overflow-hidden rounded-t-md bg-accent/5">
        {post.coverImageUrl ? (
          <SafeImage
            src={post.coverImageUrl}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            fallback={<span className="absolute inset-0 flex items-center justify-center text-3xl opacity-30">✦</span>}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-3xl opacity-30">✦</span>
        )}
      </div>
      <div className="px-4 pb-4 flex flex-col gap-2">
        <h3 className="font-bold text-foreground text-sm leading-snug group-hover:text-accent transition-colors line-clamp-2">
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

function _SidebarRelatedCard({ post }: { post: RelatedPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-hover">
      {post.coverImageUrl && (
        <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-surface-hover">
          <SafeImage
            src={post.coverImageUrl}
            alt={post.title}
            fill
            sizes="64px"
            className="object-cover"
            fallback={<span className="absolute inset-0 flex items-center justify-center text-muted"><BookOpen className="h-4 w-4" /></span>}
          />
        </div>
      )}
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-[12px] font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
          {post.title}
        </span>
        <span className="mt-1 flex items-center gap-1 text-[10px] text-muted">
          <Clock size={9} />{post.readingTimeMin} min
        </span>
      </span>
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
  const artistIds = Array.from(new Set(blocks.filter(b => b.type === 'blog_artist_card' && (b as { artistId?: string }).artistId).map(b => (b as { artistId: string }).artistId)))
  const productionIds = Array.from(new Set(blocks.filter(b => b.type === 'blog_production_card' && (b as { productionId?: string }).productionId).map(b => (b as { productionId: string }).productionId)))
  const groupIds = Array.from(new Set(blocks.filter(b => b.type === 'blog_group_card' && (b as { groupId?: string }).groupId).map(b => (b as { groupId: string }).groupId)))
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
    <PageTransition className="pb-10">
      <BlogReadingProgress />
      <BlogViewTracker slug={slug} />
      <BlogStickyNav
        title={post.title}
        readingTimeMin={post.readingTimeMin}
        shareUrl={`${BASE_URL}/blog/${post.slug}`}
        shareTitle={post.title}
        categoryName={post.category?.name}
        categorySlug={post.category?.slug}
      />
      <BlogBackToTop />
      <BlogTextShare shareUrl={`${BASE_URL}/blog/${post.slug}`} />
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
      <ResponsiveFilterBar label="Categoria" value={post.category?.name ?? 'Artigos'}>
        <div className="grid grid-cols-2 gap-1.5 lg:flex lg:items-stretch lg:gap-5">
        <Link href="/blog" className="flex h-8 shrink-0 items-center whitespace-nowrap rounded-md bg-surface px-3 text-[12px] font-black text-muted transition-colors hover:text-foreground lg:h-full lg:rounded-none lg:border-b-2 lg:border-transparent lg:bg-transparent lg:px-0.5">
          Todos
        </Link>
        {BLOG_CATEGORIES.map(c => (
          <Link
            key={c.slug}
            href={`/blog?category=${c.slug}`}
            className={`flex h-8 shrink-0 items-center whitespace-nowrap rounded-md px-3 text-[12px] font-black transition-colors lg:h-full lg:rounded-none lg:border-b-2 lg:px-0.5 ${post.category?.slug === c.slug ? 'bg-accent text-white lg:border-accent lg:bg-transparent lg:text-accent' : 'bg-surface text-muted hover:text-foreground lg:border-transparent lg:bg-transparent'}`}
          >
            {c.name}
          </Link>
        ))}
        </div>
      </ResponsiveFilterBar>

      <div className="sticky z-[190] bg-background border-b border-border/50 py-2 page-wrap" style={{ top: 'calc(var(--site-sticky-top, 92px) + var(--section-bar-h, 44px))' }}>
        <Breadcrumbs items={[{ label: 'Artigos', href: '/blog' }, { label: post.title }]} />
      </div>

      <div className="page-wrap pt-8">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-10 xl:gap-12 xl:items-stretch">

      {/* ── Coluna principal ── */}
      <div className="min-w-0">

        {/* Header */}
        <header className="mb-7">
          <h1 className="hidden lg:block font-display text-[28px] font-black leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[38px] lg:text-[52px] xl:text-[58px] mb-5">{post.title}<BrandDot /></h1>

          {post.excerpt && (
            <p className="hidden lg:block text-base leading-relaxed text-muted sm:text-lg border-l-4 border-accent/30 pl-4 mb-5">{post.excerpt}</p>
          )}

          <div className="hidden lg:flex flex-wrap items-center justify-between gap-y-3 border-t border-border pt-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent shrink-0">
                  {BLOG_AUTHOR_AVATAR_INITIAL}
                </div>
                <span className="font-semibold text-foreground">{BLOG_AUTHOR_DISPLAY_NAME}</span>
              </div>
              <span className="h-1 w-1 rounded-full bg-border/60" />
              <time dateTime={(post.publishedAt ?? post.createdAt).toISOString()} className="flex items-center gap-1.5"><Calendar size={12} />{formatDate(post.publishedAt ?? post.createdAt)}</time>
              <span className="flex items-center gap-1.5"><Clock size={12} />{post.readingTimeMin} min</span>
              <span className="flex items-center gap-1.5"><Eye size={12} />{(post.viewCount + 1).toLocaleString('pt-BR')} views</span>
            </div>
            <div className="flex items-center gap-2">
              <BlogShareButtons title={post.title} url={`${BASE_URL}/blog/${post.slug}`} compact />
              <BlogEditButton postId={post.id} />
            </div>
          </div>
        </header>

        {/* Cover image — mobile: hero full-bleed com título sobreposto | sm+: imagem abaixo do header */}
        {post.coverImageUrl && (
          <>
            {/* <lg hero — barra sólida estilo editorial */}
            <figure className="lg:hidden relative -mx-4 mb-6 w-[calc(100%+2rem)] overflow-hidden bg-surface">
              <div className="relative aspect-[4/3]">
                <SafeImage
                  src={post.coverImageUrl}
                  alt={post.title}
                  fill
                  sizes="100vw"
                  className="object-cover object-center"
                  priority
                  fallback={<span className="absolute inset-0 flex items-center justify-center bg-surface text-muted"><BookOpen className="h-10 w-10" /></span>}
                />
              </div>
              <div className="bg-foreground px-4 py-3">
                <div className="flex items-center gap-1.5 mb-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-white/50">
                  {post.category && <span>{post.category.name}</span>}
                  {post.category && <span>·</span>}
                  <span className="flex items-center gap-1"><Clock size={9} />{post.readingTimeMin} min</span>
                </div>
                <h1 className="font-display text-[20px] font-black leading-[1.15] tracking-[-0.02em] text-white">
                  {post.title}<BrandDot />
                </h1>
              </div>
            </figure>

            {/* <lg: excerpt + meta abaixo do hero */}
            <div className="lg:hidden mb-5">
              {post.excerpt && (
                <p className="text-sm leading-relaxed text-muted border-l-4 border-accent/30 pl-3 mb-4">{post.excerpt}</p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-y-2 border-t border-border pt-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <div className="flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent shrink-0">{BLOG_AUTHOR_AVATAR_INITIAL}</div>
                    <span className="font-semibold text-foreground text-xs">{BLOG_AUTHOR_DISPLAY_NAME}</span>
                  </div>
                  <time dateTime={(post.publishedAt ?? post.createdAt).toISOString()} className="flex items-center gap-1"><Calendar size={10} />{formatDate(post.publishedAt ?? post.createdAt)}</time>
                  <span className="flex items-center gap-1"><Eye size={10} />{(post.viewCount + 1).toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BlogShareButtons title={post.title} url={`${BASE_URL}/blog/${post.slug}`} compact />
                  <BlogEditButton postId={post.id} />
                </div>
              </div>
            </div>

            {/* lg+: imagem normal abaixo do header */}
            <figure className="hidden lg:block relative mb-8 w-full overflow-hidden rounded-xl border border-border/40 bg-surface aspect-video">
              <SafeImage
                src={post.coverImageUrl}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, calc(100vw - 360px)"
                className="object-cover object-center"
                priority
                fallback={<span className="absolute inset-0 flex items-center justify-center bg-surface text-muted"><BookOpen className="h-10 w-10" /></span>}
              />
            </figure>
          </>
        )}

        {/* Content */}
        <article className="w-full">
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
                  className="rounded-md px-2.5 py-1 text-xs font-semibold transition-all hover:brightness-95"
                  style={{ color: ts.color, backgroundColor: ts.bg }}
                >
                  {tag}
                </Link>
              )
            })}
          </div>
        )}

        {/* Artistas mencionados */}
        {artists.length > 0 && (
          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-xs font-black uppercase tracking-widest text-muted mb-4">Mencionados neste artigo</p>
            <div className="flex flex-wrap gap-3">
              {artists.map(artist => (
                <Link
                  key={artist.id}
                  href={`/artists/${artist.id}`}
                  className="group flex items-center gap-2.5 rounded-md border border-border bg-surface px-3 py-2 transition-all hover:border-accent/40 hover:bg-surface-hover"
                >
                  <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-md bg-surface-hover">
                    {artist.primaryImageUrl ? (
                      <Image src={artist.primaryImageUrl} alt={artist.nameRomanized} fill className="object-cover object-top" sizes="32px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted">{artist.nameRomanized[0]}</div>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">{artist.nameRomanized}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Leia também */}
        {relatedPosts.length > 0 && (
          <div className="mt-10 pt-8 border-t border-border">
            <h2 className="text-base font-bold text-foreground mb-4">Leia também</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedPosts.slice(0, 3).map(related => (
                <RelatedPostCard key={related.slug} post={related} />
              ))}
            </div>
          </div>
        )}

        {/* Quiz */}
        <Link
          href="/quiz"
          className="group mt-8 flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-all hover:border-accent/40 hover:bg-surface-hover"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-accent/10 transition-transform group-hover:scale-105">
            <Trophy className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-foreground group-hover:text-accent transition-colors">Quanto você sabe sobre K-Pop e K-Drama?</p>
            <p className="text-xs text-muted">Faça o quiz do HallyuHub — 10 perguntas, perguntas novas a cada rodada</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </Link>

        <CommentsSection blogPostSlug={post.slug} />
      </div>{/* fim coluna principal */}

      {/* ── Sidebar (xl+) ── */}
      <aside className="hidden xl:block">
        <div
          className="sticky flex flex-col gap-4 overflow-y-auto"
          style={{
            top: 'calc(var(--site-sticky-top, 92px) + var(--section-bar-h, 44px) + 36px + 8px)',
            maxHeight: 'calc(100vh - var(--site-sticky-top, 92px) - var(--section-bar-h, 44px) - 36px - 24px)',
          }}
        >
          <BlogTableOfContents />
          <LojaRelacionados tags={post.tags} title="Produtos relacionados" compact />
        </div>
      </aside>

      </div>{/* fim flex */}
      </div>{/* fim page-wrap */}
    </PageTransition>
  )
}
