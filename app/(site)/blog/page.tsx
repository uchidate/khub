export const revalidate = 300

import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { PageTransition } from '@/components/features/PageTransition'
import { ScrollToTop } from '@/components/ui/ScrollToTop'
import { JsonLd } from '@/components/seo/JsonLd'
import { Clock, Eye, TrendingUp, Tag, ArrowRight, BookOpen, Rss } from 'lucide-react'
import { BLOG_AUTHOR_DISPLAY_NAME, BLOG_AUTHOR_AVATAR_INITIAL } from '@/lib/config/blog'
import { getTagStyle } from '@/lib/utils/tag-colors'
import prisma from '@/lib/prisma'
import { ALL_BLOG_TAGS } from '@/lib/config/tags'
import { SITE_URL } from '@/lib/constants/site'
import { BLOG_CATEGORIES, BLOG_CATEGORY_BY_SLUG } from '@/lib/config/categories'
import { AdBanner } from '@/components/ui/AdBanner'

const BASE_URL = SITE_URL

export const metadata: Metadata = {
  title: 'Blog K-Pop & K-Drama',
  description: 'Artigos, análises e curiosidades sobre K-Pop, K-Drama e a cultura coreana — escritos em português para fãs do universo Hallyu.',
  alternates: { canonical: `${BASE_URL}/blog` },
  openGraph: {
    title: 'Blog K-Pop & K-Drama | HallyuHub',
    description: 'Artigos, análises e curiosidades sobre K-Pop, K-Drama e a cultura coreana — escritos em português para fãs do universo Hallyu.',
    url: `${BASE_URL}/blog`,
  },
}

const PUBLIC_WHERE = { status: 'PUBLISHED' as const, isPrivate: false }
const EMPTY_POSTS = { hero: null, posts: [], mostRead: [], categories: [], popularTags: [], total: 0 }

async function getPosts(category?: string, tag?: string) {
  if (process.env.SKIP_BUILD_STATIC_GENERATION) return EMPTY_POSTS
  try {
    const where = {
      ...PUBLIC_WHERE,
      ...(category ? { category: { slug: category } } : {}),
      ...(tag ? { tags: { has: tag } } : {}),
    }
    const [hero, posts, mostRead, categories, popularTags, total] = await Promise.all([
      prisma.blogPost.findFirst({
        where: PUBLIC_WHERE,
        orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
        select: {
          id: true, slug: true, title: true, excerpt: true, coverImageUrl: true,
          publishedAt: true, readingTimeMin: true, viewCount: true, featured: true, tags: true,
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.blogPost.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        take: 21,
        select: {
          id: true, slug: true, title: true, excerpt: true, coverImageUrl: true,
          publishedAt: true, readingTimeMin: true, viewCount: true, featured: true, tags: true,
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      !category && !tag ? prisma.blogPost.findMany({
        where: PUBLIC_WHERE,
        orderBy: { viewCount: 'desc' },
        take: 5,
        select: {
          slug: true, title: true, readingTimeMin: true, viewCount: true,
          coverImageUrl: true, publishedAt: true,
          category: { select: { id: true, name: true, slug: true } },
        },
      }) : Promise.resolve([]),
      prisma.blogCategory.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, slug: true, _count: { select: { posts: { where: PUBLIC_WHERE } } } },
      }),
      prisma.$queryRaw<{ tag: string; count: bigint }[]>`
        SELECT unnest(tags) as tag, count(*) as count
        FROM "BlogPost"
        WHERE status = 'PUBLISHED' AND "isPrivate" = false
        GROUP BY tag ORDER BY count DESC LIMIT 16
      `,
      prisma.blogPost.count({ where: PUBLIC_WHERE }),
    ])
    return { hero, posts, mostRead, categories, popularTags, total }
  } catch { return EMPTY_POSTS }
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function isRecent(date: Date | string | null | undefined) {
  if (!date) return false
  return Date.now() - new Date(date).getTime() < 7 * 24 * 60 * 60 * 1000
}

type PostItem = {
  id: string; slug: string; title: string; excerpt: string | null
  coverImageUrl: string | null; publishedAt: Date | null; readingTimeMin: number
  viewCount: number; featured: boolean; tags: string[]
  category: { id: string; name: string; slug: string } | null
}

function CategoryBadge({ category }: { category: { name: string; slug: string } | null }) {
  if (!category) return null
  const cfg = BLOG_CATEGORY_BY_SLUG[category.slug]
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{ backgroundColor: cfg?.bg ?? '#f3f4f6', color: cfg?.color ?? '#374151' }}
    >
      {category.name}
    </span>
  )
}

function PostMeta({ post, size = 'sm' }: { post: Pick<PostItem, 'publishedAt' | 'readingTimeMin' | 'viewCount'>, size?: 'sm' | 'xs' }) {
  const cls = size === 'xs' ? 'text-[10px] gap-2' : 'text-[11px] gap-2.5'
  return (
    <div className={`flex items-center ${cls} text-muted`}>
      {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
      <span className="flex items-center gap-1"><Clock size={size === 'xs' ? 9 : 10} />{post.readingTimeMin} min</span>
      <span className="flex items-center gap-1"><Eye size={size === 'xs' ? 9 : 10} />{post.viewCount}</span>
    </div>
  )
}

// Card horizontal — artigo em destaque (ocupa 2 colunas)
function HeroCard({ post }: { post: PostItem }) {
  const cfg = post.category ? BLOG_CATEGORY_BY_SLUG[post.category.slug] : null
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group col-span-full lg:col-span-2 flex flex-col sm:flex-row rounded-2xl overflow-hidden border border-border bg-surface hover:border-accent/30 hover:shadow-xl transition-all duration-300"
    >
      <div className="relative aspect-video sm:aspect-auto sm:w-[45%] sm:min-h-[280px] overflow-hidden bg-surface-hover shrink-0">
        {post.coverImageUrl ? (
          <Image
            src={post.coverImageUrl} alt={post.title} fill priority
            sizes="(max-width: 640px) 100vw, 45vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full" style={cfg ? { background: `linear-gradient(135deg, ${cfg.bg}, ${cfg.color}44)` } : { background: '#f3f4f6' }}>
            <BookOpen className="w-12 h-12 text-muted/20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
        )}
        {isRecent(post.publishedAt) && (
          <span className="absolute top-3 right-3 px-2 py-0.5 bg-accent text-white rounded-full text-[10px] font-bold uppercase tracking-wider">Novo</span>
        )}
        {post.featured && (
          <span className="absolute top-3 left-3 px-2 py-0.5 bg-yellow-400 text-yellow-900 rounded-full text-[10px] font-bold uppercase tracking-wider">Destaque</span>
        )}
      </div>
      <div className="flex flex-col gap-3 p-5 sm:p-7 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryBadge category={post.category} />
          <PostMeta post={post} />
        </div>
        <h2 className="font-black text-foreground text-xl sm:text-2xl leading-tight group-hover:text-accent transition-colors line-clamp-3">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-sm text-muted line-clamp-3 leading-relaxed flex-1">{post.excerpt}</p>
        )}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.slice(0, 4).map(tag => {
              const ts = getTagStyle(tag)
              return <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ color: ts.color, backgroundColor: ts.bg }}>{tag}</span>
            })}
          </div>
        )}
        <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border">
          <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center text-[9px] font-bold text-accent flex-shrink-0">
            {BLOG_AUTHOR_AVATAR_INITIAL}
          </div>
          <span className="text-[11px] text-muted truncate">{BLOG_AUTHOR_DISPLAY_NAME}</span>
          <span className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-accent">
            Ler artigo <ArrowRight size={11} />
          </span>
        </div>
      </div>
    </Link>
  )
}

// Card vertical padrão
function PostCard({ post }: { post: PostItem }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden border border-border bg-surface hover:border-accent/30 hover:shadow-md transition-all duration-300"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-surface-hover">
        {post.coverImageUrl ? (
          <Image
            src={post.coverImageUrl} alt={post.title} fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={post.category ? { background: `linear-gradient(135deg, ${BLOG_CATEGORY_BY_SLUG[post.category.slug]?.bg ?? '#f3f4f6'}, ${BLOG_CATEGORY_BY_SLUG[post.category.slug]?.color ?? '#e5e7eb'}33)` } : undefined}>
            <span className="text-4xl opacity-10">✦</span>
          </div>
        )}
        {isRecent(post.publishedAt) && (
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-accent text-white rounded-full text-[10px] font-bold uppercase tracking-wider">Novo</span>
        )}
        <div className="absolute top-2.5 left-2.5">
          <CategoryBadge category={post.category} />
        </div>
      </div>
      <div className="flex flex-col gap-2 p-4 flex-1">
        <h2 className="font-bold text-foreground text-sm leading-snug line-clamp-2 group-hover:text-accent transition-colors flex-1">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-[12px] text-muted line-clamp-2 leading-relaxed">{post.excerpt}</p>
        )}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.slice(0, 2).map(tag => {
              const ts = getTagStyle(tag)
              return <span key={tag} className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ color: ts.color, backgroundColor: ts.bg }}>{tag}</span>
            })}
          </div>
        )}
        <div className="pt-2.5 border-t border-border mt-auto">
          <PostMeta post={post} size="xs" />
        </div>
      </div>
    </Link>
  )
}

// Card compacto para listagem (sem imagem grande)
function CompactPostCard({ post }: { post: PostItem }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex gap-3 items-start p-3 rounded-xl border border-border bg-surface hover:border-accent/30 hover:bg-surface-hover transition-all"
    >
      {post.coverImageUrl && (
        <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
          <Image src={post.coverImageUrl} alt={post.title} fill sizes="64px" className="object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <CategoryBadge category={post.category} />
        </div>
        <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-accent transition-colors mb-1.5">
          {post.title}
        </p>
        <PostMeta post={post} size="xs" />
      </div>
    </Link>
  )
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ category?: string; tag?: string }> }) {
  const { category: activeCategory, tag: activeTag } = await searchParams
  const { hero, posts, mostRead, categories, popularTags, total } = await getPosts(activeCategory, activeTag)
  const isFiltered = !!activeCategory || !!activeTag

  const categoryOrder = new Map(BLOG_CATEGORIES.map((c, i) => [c.slug, i]))
  const orderedCategories = categories
    .filter(c => c._count.posts > 0)
    .sort((a, b) => (categoryOrder.get(a.slug) ?? 999) - (categoryOrder.get(b.slug) ?? 999))

  const tagCountMap = new Map<string, number>()
  for (const { tag, count } of popularTags) {
    const normalized = tag.trim().toLowerCase()
    if (!normalized || !ALL_BLOG_TAGS.includes(normalized)) continue
    tagCountMap.set(normalized, (tagCountMap.get(normalized) ?? 0) + Number(count))
  }
  const normalizedPopularTags = Array.from(tagCountMap.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag, count]) => ({ tag, count }))
    .slice(0, 14)

  const heroId = isFiltered ? posts[0]?.id : hero?.id
  const gridPosts = posts.filter(p => p.id !== heroId)

  const activeCatConfig = activeCategory ? BLOG_CATEGORY_BY_SLUG[activeCategory] : null

  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'Blog | HallyuHub',
        url: `${BASE_URL}/blog`,
        inLanguage: 'pt-BR',
      }} />
      <PageTransition className="pb-16">

        {/* ── Hero ──────────────────────────────────────────────── */}
        <div className="relative w-full h-[300px] md:h-[440px] overflow-hidden">
          {(() => {
            const featPost = isFiltered ? posts[0] : hero
            const coverImage = featPost?.coverImageUrl ?? null
            const cfg = featPost?.category ? BLOG_CATEGORY_BY_SLUG[featPost.category.slug] : null
            return (
              <>
                {coverImage ? (
                  <Image src={coverImage} alt={featPost?.title ?? 'Blog'} fill priority sizes="100vw"
                    className="object-cover" />
                ) : (
                  <div className="w-full h-full" style={{ background: activeCatConfig ? `linear-gradient(135deg, ${activeCatConfig.bg}, ${activeCatConfig.color}55)` : 'linear-gradient(135deg, #1a1a2e, #16213e)' }} />
                )}
                {/* Gradientes */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

                {/* Conteúdo */}
                <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-10 max-w-5xl">
                  {/* Header do blog */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-white/60" />
                      <span className="text-white/60 text-xs font-semibold uppercase tracking-widest">Blog HallyuHub</span>
                      {!isFiltered && total > 0 && (
                        <span className="text-white/40 text-xs">· {total} artigos</span>
                      )}
                    </div>
                    <Link href="/blog/feed.xml" className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors text-xs">
                      <Rss size={12} />
                      <span className="hidden sm:inline">RSS</span>
                    </Link>
                  </div>

                  {/* Artigo em destaque */}
                  {featPost ? (
                    <Link href={`/blog/${featPost.slug}`} className="group block">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {cfg && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider" style={{ backgroundColor: cfg.color, color: '#fff' }}>
                            {featPost.category?.name}
                          </span>
                        )}
                        {isRecent(featPost.publishedAt) && (
                          <span className="px-2.5 py-1 bg-accent text-white rounded-full text-[11px] font-bold uppercase tracking-wider">Novo</span>
                        )}
                        {featPost.featured && !isFiltered && (
                          <span className="px-2.5 py-1 bg-yellow-400/90 text-yellow-900 rounded-full text-[11px] font-bold uppercase tracking-wider">Destaque</span>
                        )}
                        {isFiltered && (
                          <span className="text-white/50 text-xs">{posts.length} {posts.length === 1 ? 'artigo' : 'artigos'}</span>
                        )}
                      </div>
                      <h1 className="text-2xl md:text-[2.2rem] font-black text-white leading-tight line-clamp-2 group-hover:text-accent transition-colors mb-2 md:mb-3">
                        {featPost.title}
                      </h1>
                      {featPost.excerpt && (
                        <p className="text-white/65 text-sm md:text-base line-clamp-2 leading-relaxed hidden sm:block mb-3">
                          {featPost.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-white/55 text-xs">
                        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold text-white/70">
                          {BLOG_AUTHOR_AVATAR_INITIAL}
                        </div>
                        <span>{BLOG_AUTHOR_DISPLAY_NAME}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Clock size={11} />{featPost.readingTimeMin} min</span>
                        <span className="flex items-center gap-1"><Eye size={11} />{featPost.viewCount} views</span>
                        <span className="ml-auto flex items-center gap-1 text-accent font-bold group-hover:gap-2 transition-all">
                          Ler <ArrowRight size={12} />
                        </span>
                      </div>
                    </Link>
                  ) : (
                    <div>
                      <h1 className="text-3xl md:text-4xl font-black text-white">Blog K-Pop & K-Drama</h1>
                      <p className="text-white/60 mt-2">Artigos sobre cultura coreana em português</p>
                    </div>
                  )}
                </div>
              </>
            )
          })()}
        </div>

        {/* ── Conteúdo ───────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">

          {/* Filter bar sticky */}
          <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm -mx-4 sm:-mx-6 lg:-mx-12 px-4 sm:px-6 lg:px-12 py-3 border-b border-border mb-6 space-y-2.5">
            {/* Categorias */}
            <div className="relative">
              <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-background/95 to-transparent z-10 sm:hidden" />
              <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background/95 to-transparent z-10 sm:hidden" />
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-nowrap sm:flex-wrap">
                <Link
                  href="/blog" scroll={false}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${!isFiltered ? 'bg-foreground text-background' : 'bg-surface text-muted hover:bg-surface-hover hover:text-foreground'}`}
                >
                  Todos {total > 0 && <span className="opacity-50 ml-0.5">({total})</span>}
                </Link>
                {orderedCategories.map(c => {
                  const isActive = activeCategory === c.slug
                  const cfg = BLOG_CATEGORY_BY_SLUG[c.slug]
                  const href = activeTag ? `/blog?category=${c.slug}&tag=${encodeURIComponent(activeTag)}` : `/blog?category=${c.slug}`
                  return (
                    <Link
                      key={c.id} href={href} scroll={false}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border"
                      style={isActive
                        ? { backgroundColor: cfg?.bg ?? '#f3f4f6', color: cfg?.color ?? '#374151', borderColor: `${cfg?.color ?? '#374151'}40` }
                        : { backgroundColor: 'transparent', borderColor: 'transparent', color: 'var(--color-muted)' }
                      }
                    >
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg?.color ?? '#9ca3af' }} />
                      {c.name}
                      <span className="opacity-40 text-[10px]">{c._count.posts}</span>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Tags */}
            {normalizedPopularTags.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-nowrap sm:flex-wrap">
                <Tag size={10} className="text-muted shrink-0" />
                {normalizedPopularTags.map(({ tag }) => {
                  const ts = getTagStyle(tag)
                  const isActiveTag = activeTag === tag
                  const href = isActiveTag
                    ? (activeCategory ? `/blog?category=${activeCategory}` : '/blog')
                    : (activeCategory ? `/blog?category=${activeCategory}&tag=${encodeURIComponent(tag)}` : `/blog?tag=${encodeURIComponent(tag)}`)
                  return (
                    <Link
                      key={tag} href={href} scroll={false}
                      className="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all"
                      style={{
                        color: isActiveTag ? '#fff' : ts.color,
                        backgroundColor: isActiveTag ? ts.color : ts.bg,
                      }}
                    >
                      {tag}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Info de filtro ativo */}
          {isFiltered && (
            <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-surface border border-border">
              {activeCatConfig && (
                <span className="text-xs font-semibold" style={{ color: activeCatConfig.color }}>
                  {activeCatConfig.name}
                </span>
              )}
              {activeTag && (
                <span className="flex items-center gap-1 text-xs text-muted">
                  <Tag size={10} />#{activeTag}
                </span>
              )}
              <span className="text-xs text-muted">{posts.length} {posts.length === 1 ? 'artigo' : 'artigos'}</span>
              <Link href="/blog" className="ml-auto text-xs text-accent hover:underline font-semibold">
                Limpar filtros
              </Link>
            </div>
          )}

          <AdBanner slot="1740970038" format="auto" className="mb-8" />

          {/* Layout principal: posts + sidebar */}
          <div className="grid lg:grid-cols-[1fr_300px] gap-10">

            {/* Posts */}
            <div>
              {!isFiltered && <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted mb-4">Publicações recentes</p>}

              {gridPosts.length > 0 ? (
                <>
                  {/* Grid 2 colunas: primeiro card ocupa as 2 */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    {gridPosts[0] && <HeroCard post={gridPosts[0]} />}
                    {gridPosts.slice(1, 3).map(p => <PostCard key={p.id} post={p} />)}
                  </div>

                  {gridPosts.length > 3 && (
                    <>
                      <AdBanner slot="1740970038" format="auto" className="my-8" />

                      {/* Segunda linha: 3 colunas */}
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-5">
                        {gridPosts.slice(3, 9).map(p => <PostCard key={p.id} post={p} />)}
                      </div>
                    </>
                  )}

                  {gridPosts.length > 9 && (
                    <>
                      <div className="my-8 border-t border-border" />
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted mb-4">Mais artigos</p>
                      <div className="flex flex-col gap-3">
                        {gridPosts.slice(9).map(p => <CompactPostCard key={p.id} post={p} />)}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center py-20 text-muted border border-dashed border-border rounded-2xl">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-semibold">Nenhum artigo encontrado.</p>
                  <Link href="/blog" className="text-xs text-accent mt-2 inline-block hover:underline">Ver todos os artigos</Link>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-6 lg:pt-0">

              {/* Mais lidos */}
              {mostRead.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted mb-3 flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-accent" /> Mais lidos
                  </p>
                  <div className="space-y-2">
                    {mostRead.map((p, i) => {
                      const cfg = p.category ? BLOG_CATEGORY_BY_SLUG[p.category.slug] : null
                      return (
                        <Link
                          key={p.slug}
                          href={`/blog/${p.slug}`}
                          className="group flex items-start gap-3 p-3 rounded-xl border border-border bg-surface hover:border-accent/30 hover:bg-surface-hover transition-all"
                        >
                          <span className="text-xl font-black leading-none w-6 shrink-0 mt-0.5"
                            style={{ color: `color-mix(in srgb, var(--accent) ${Math.max(20, 70 - i * 12)}%, var(--color-muted))` }}
                          >
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-accent transition-colors mb-1.5">
                              {p.title}
                            </p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {cfg && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                                  {p.category?.name}
                                </span>
                              )}
                              <span className="text-[10px] text-muted flex items-center gap-0.5"><Eye size={9} />{p.viewCount}</span>
                              <span className="text-[10px] text-muted flex items-center gap-0.5"><Clock size={9} />{p.readingTimeMin}min</span>
                            </div>
                          </div>
                          {p.coverImageUrl && (
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                              <Image src={p.coverImageUrl} alt={p.title} fill sizes="48px" className="object-cover" />
                            </div>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              <AdBanner slot="1740970038" format="auto" />

              {/* Explorar categorias */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted mb-3">Explorar por categoria</p>
                <div className="flex flex-col gap-1.5">
                  {orderedCategories.map(c => {
                    const cfg = BLOG_CATEGORY_BY_SLUG[c.slug]
                    const isActive = activeCategory === c.slug
                    return (
                      <Link
                        key={c.id}
                        href={isActive ? '/blog' : `/blog?category=${c.slug}`}
                        scroll={false}
                        className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all"
                        style={isActive
                          ? { backgroundColor: cfg?.bg ?? '#f3f4f6', borderColor: `${cfg?.color ?? '#374151'}40` }
                          : { borderColor: 'transparent', backgroundColor: 'transparent' }
                        }
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg?.color ?? '#9ca3af' }} />
                        <span className={`text-xs font-semibold flex-1 ${isActive ? '' : 'text-muted group-hover:text-foreground'}`}
                          style={isActive ? { color: cfg?.color } : undefined}>
                          {c.name}
                        </span>
                        <span className="text-[10px] font-bold opacity-40" style={isActive ? { color: cfg?.color } : undefined}>
                          {c._count.posts}
                        </span>
                        <ArrowRight size={11} className={`opacity-0 group-hover:opacity-60 transition-opacity shrink-0 ${isActive ? 'opacity-60' : ''}`}
                          style={isActive ? { color: cfg?.color } : undefined} />
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* RSS */}
              <Link
                href="/blog/feed.xml"
                className="flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors border border-border rounded-xl px-3 py-2.5"
              >
                <Rss size={13} className="text-orange-500" />
                <span>Assinar via RSS</span>
              </Link>
            </aside>
          </div>

          <AdBanner slot="1740970038" format="auto" className="mt-10" />
        </div>
        <ScrollToTop />
      </PageTransition>
    </>
  )
}
