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
import { Clock, Eye, ArrowLeft, ArrowRight, Tag, Calendar, Trophy } from 'lucide-react'
import prisma from '@/lib/prisma'
import { JsonLd } from '@/components/seo/JsonLd'

import { SITE_URL } from '@/lib/constants/site'
import { BLOG_AUTHOR_DISPLAY_NAME, BLOG_AUTHOR_AVATAR_INITIAL } from '@/lib/config/blog'
import { AdBanner } from '@/components/ui/AdBanner'
import { StickyAdBanner } from '@/components/ui/StickyAdBanner'
import { getTagStyle } from '@/lib/utils/tag-colors'
import { applySeoOverride } from '@/lib/seo/apply-override'

const BlogBlockRenderer = dynamic(() => import('@/components/ui/BlogBlockRenderer').then(m => ({ default: m.BlogBlockRenderer })))
const BlogEditButton = dynamic(() => import('@/components/blog/BlogEditButton').then(m => ({ default: m.BlogEditButton })))
const BlogViewTracker = dynamic(() => import('@/components/blog/BlogViewTracker').then(m => ({ default: m.BlogViewTracker })))
const BlogReadingProgress = dynamic(() => import('@/components/blog/BlogReadingProgress').then(m => ({ default: m.BlogReadingProgress })))
const BlogNavLink = dynamic(() => import('@/components/blog/BlogNavLink').then(m => ({ default: m.BlogNavLink })))
const BASE_URL = SITE_URL

function MarkdownWithAds({ content }: { content: string }) {
  // Split on H2/H3 headings to inject ads between sections
  const sections = content.split(/(?=^#{2,3} )/m).filter(Boolean)
  if (sections.length <= 2) {
    return (
      <>
        <MarkdownRenderer content={content} />
        <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE_1!} variant="fluid" minimal className="my-8" />
      </>
    )
  }
  const midpoint = Math.floor(sections.length / 2)
  const firstHalf = sections.slice(0, midpoint).join('')
  const secondHalf = sections.slice(midpoint).join('')
  return (
    <>
      <MarkdownRenderer content={firstHalf} />
      <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE_1!} variant="fluid" minimal className="my-8" />
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
    <Link href={`/blog/${post.slug}`} className="group flex flex-col gap-3 rounded-2xl border border-border bg-surface hover:border-[#ff2d78]/30 transition-all">
      <div className="relative aspect-video rounded-t-2xl overflow-hidden bg-[#ff2d78]/5">
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

function SidebarRelatedCard({ post }: { post: RelatedPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block border-b border-border/50 last:border-b-0 py-3">
      {post.coverImageUrl && (
        <div className="relative aspect-video w-full rounded-md overflow-hidden mb-2 bg-muted/20">
          <SafeImage
            src={post.coverImageUrl}
            alt={post.title}
            fill
            sizes="(min-width: 1280px) 200px, 0px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <p className="text-[11px] font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-[#ff2d78] transition-colors">
        {post.title}
      </p>
      <p className="text-[10px] text-muted mt-1 flex items-center gap-1">
        <Clock size={9} />{post.readingTimeMin} min de leitura
      </p>
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
  const [artists, productions, groups, relatedPosts, prevPost, nextPost] = await Promise.all([
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
    post.publishedAt
      ? prisma.blogPost.findFirst({
          where: { status: 'PUBLISHED', isPrivate: false, publishedAt: { lt: post.publishedAt } },
          orderBy: { publishedAt: 'desc' },
          select: { slug: true, title: true, coverImageUrl: true },
        }).catch(() => null)
      : null,
    post.publishedAt
      ? prisma.blogPost.findFirst({
          where: { status: 'PUBLISHED', isPrivate: false, publishedAt: { gt: post.publishedAt } },
          orderBy: { publishedAt: 'asc' },
          select: { slug: true, title: true, coverImageUrl: true },
        }).catch(() => null)
      : null,
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
      <div className="max-w-6xl mx-auto">
      <div className="flex gap-6 xl:gap-8 items-start">
      {/* ── Coluna principal ── */}
      <div className="flex-1 min-w-0">
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
          <div className="relative aspect-video rounded-2xl overflow-hidden mb-10 border border-border bg-muted/10">
            <SafeImage src={post.coverImageUrl} alt={post.title} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" priority />
          </div>
        )}

        {/* Ad após cover image — melhor viewability, sem CLS acima do fold */}
        <div className="mb-8">
          <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_LEADERBOARD!} variant="auto" hideLabel />
        </div>

        {/* Content */}
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

        {/* Artigos relacionados — mobile/tablet (sidebar oculta em <xl) */}
        {relatedPosts.length > 0 && (
          <div className="xl:hidden mt-10 pt-8 border-t border-border">
            <h2 className="text-base font-bold text-foreground mb-4">Artigos relacionados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedPosts.slice(0, 3).map(related => (
                <RelatedPostCard key={related.slug} post={related} />
              ))}
            </div>
          </div>
        )}

        {/* Artistas mencionados no artigo */}
        {artists.length > 0 && (
          <div className="mt-10 pt-8 border-t border-border">
            <p className="text-xs font-black uppercase tracking-widest text-muted mb-4">Mencionados neste artigo</p>
            <div className="flex flex-wrap gap-3">
              {artists.map(artist => (
                <Link
                  key={artist.id}
                  href={`/artists/${artist.id}`}
                  className="group flex items-center gap-2.5 px-3 py-2 rounded-xl border border-border bg-surface hover:border-accent/40 hover:bg-surface-hover transition-all"
                >
                  <div className="relative w-8 h-8 rounded-full overflow-hidden bg-surface-hover flex-shrink-0">
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

        {/* Banner Quiz */}
        <Link
          href="/quiz"
          className="group mt-10 flex items-center gap-4 p-4 rounded-2xl border border-border bg-surface hover:border-accent/40 hover:bg-surface-hover transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <Trophy className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-foreground group-hover:text-accent transition-colors">Quanto você sabe sobre K-Pop e K-Drama?</p>
            <p className="text-xs text-muted">Faça o quiz do HallyuHub — 10 perguntas, perguntas novas a cada rodada</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </Link>

        {/* Multiplex — recomendações patrocinadas no final do artigo */}
        <AdBanner
          slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_MULTIPLEX!}
          variant="multiplex"
          className="mt-10"
        />

        {/* Navegação anterior / próximo */}
        {(prevPost || nextPost) && (
          <div className="mt-8 pt-8 border-t border-border grid grid-cols-2 gap-3">
            <div>
              {prevPost && <BlogNavLink slug={prevPost.slug} title={prevPost.title} direction="prev" currentSlug={slug} />}
            </div>
            <div>
              {nextPost && <BlogNavLink slug={nextPost.slug} title={nextPost.title} direction="next" currentSlug={slug} />}
            </div>
          </div>
        )}

        <div className="mt-8">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors">
            <ArrowLeft size={14} />
            Voltar ao Blog
          </Link>
        </div>
      </div>{/* fim coluna principal */}

      {/* ── Sidebar sticky (xl+) ── */}
      <aside className="hidden xl:block w-[300px] shrink-0">
        <div className="sticky top-6 flex flex-col gap-4">
          <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_RECTANGLE!} variant="rectangle" />

          {relatedPosts.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-surface border-b border-border">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted">Artigos sugeridos</p>
              </div>
              <div className="px-3">
                {relatedPosts.map(related => (
                  <SidebarRelatedCard key={related.slug} post={related} />
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      </div>{/* fim flex */}
      </div>{/* fim max-w */}
      <StickyAdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER!} />
    </PageTransition>
  )
}
