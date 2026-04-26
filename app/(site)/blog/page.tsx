export const revalidate = 300

import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { BlogImage } from '@/components/ui/BlogImage'
import { PageTransition } from '@/components/features/PageTransition'
import { ScrollToTop } from '@/components/ui/ScrollToTop'
import { JsonLd } from '@/components/seo/JsonLd'
import { Clock, Eye, TrendingUp, Tag, ArrowRight, BookOpen, Rss, ChevronRight, Sparkles, ChevronDown, Mail } from 'lucide-react'
import { BLOG_AUTHOR_DISPLAY_NAME, BLOG_AUTHOR_AVATAR_INITIAL } from '@/lib/config/blog'
import { getTagStyle } from '@/lib/utils/tag-colors'
import prisma from '@/lib/prisma'
import { ALL_BLOG_TAGS } from '@/lib/config/tags'
import { SITE_URL } from '@/lib/constants/site'
import { BLOG_CATEGORIES, BLOG_CATEGORY_BY_SLUG } from '@/lib/config/categories'
import { AdBanner } from '@/components/ui/AdBanner'
import { TagFilter } from '@/components/blog/TagFilter'

const BASE_URL = SITE_URL
const AD_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG_ARTICLE!

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
const EMPTY_POSTS = { hero: null, posts: [], mostRead: [], categories: [], popularTags: [], total: 0, totalCategories: 0 }
const PAGE_SIZE = 20

async function getPosts(category?: string, tag?: string, page = 1) {
  if (process.env.SKIP_BUILD_STATIC_GENERATION) return EMPTY_POSTS
  try {
    const where = {
      ...PUBLIC_WHERE,
      ...(category ? { category: { slug: category } } : {}),
      ...(tag ? { tags: { has: tag } } : {}),
    }
    const [hero, posts, mostRead, categories, popularTags, total, totalCategories] = await Promise.all([
      page === 1 ? prisma.blogPost.findFirst({
        where: PUBLIC_WHERE,
        orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
        select: {
          id: true, slug: true, title: true, excerpt: true, coverImageUrl: true,
          publishedAt: true, readingTimeMin: true, viewCount: true, featured: true, tags: true,
          category: { select: { id: true, name: true, slug: true } },
        },
      }) : Promise.resolve(null),
      prisma.blogPost.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
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
        GROUP BY tag ORDER BY count DESC LIMIT 60
      `,
      prisma.blogPost.count({ where: PUBLIC_WHERE }),
      prisma.blogCategory.count(),
    ])
    return { hero, posts, mostRead, categories, popularTags, total, totalCategories }
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

function CategoryBadge({ category, size = 'sm' }: { category: { name: string; slug: string } | null; size?: 'sm' | 'xs' }) {
  if (!category) return null
  const cfg = BLOG_CATEGORY_BY_SLUG[category.slug]
  return (
    <span
      className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider whitespace-nowrap ${size === 'xs' ? 'text-[9px]' : 'text-[10px]'}`}
      style={{ backgroundColor: cfg?.bg ?? '#f3f4f6', color: cfg?.color ?? '#374151' }}
    >
      {category.name}
    </span>
  )
}

function PostMeta({ post, size = 'sm', light = false }: {
  post: Pick<PostItem, 'publishedAt' | 'readingTimeMin' | 'viewCount'>
  size?: 'sm' | 'xs'
  light?: boolean
}) {
  const cls = size === 'xs' ? 'text-[10px] gap-2' : 'text-[11px] gap-2.5'
  const colorCls = light ? 'text-white/55' : 'text-muted'
  return (
    <div className={`flex items-center flex-wrap ${cls} ${colorCls}`}>
      {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
      {post.readingTimeMin > 0 && (
        <span className="flex items-center gap-1"><Clock size={size === 'xs' ? 9 : 10} />{post.readingTimeMin} min</span>
      )}
      {post.viewCount > 0 && (
        <span className="flex items-center gap-1"><Eye size={size === 'xs' ? 9 : 10} />{post.viewCount}</span>
      )}
    </div>
  )
}

// Card grande — destaque editorial (esquerda do magazine grid)
function EditorialMainCard({ post }: { post: PostItem }) {
  const cfg = post.category ? BLOG_CATEGORY_BY_SLUG[post.category.slug] : null
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative flex flex-col rounded-2xl overflow-hidden border border-border bg-surface hover:border-accent/40 hover:shadow-xl transition-all duration-300 h-full min-h-[340px] sm:min-h-[420px]"
    >
      {/* Imagem de fundo */}
      <BlogImage
        src={post.coverImageUrl} alt={post.title} fill priority
        sizes="(max-width: 640px) 100vw, 55vw"
        className="object-cover group-hover:scale-[1.03] transition-transform duration-700"
        fallbackGradient={cfg ? `linear-gradient(135deg, ${cfg.bg}, ${cfg.color}55)` : '#0d0d1a'}
      />

      {/* Gradiente sobre imagem */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

      {/* Conteúdo no rodapé */}
      <div className="relative z-10 mt-auto p-5 sm:p-6 flex flex-col gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          {post.featured && (
            <span className="px-2 py-0.5 bg-yellow-400/90 text-yellow-900 rounded-full text-[10px] font-bold uppercase tracking-wider">Destaque</span>
          )}
          {isRecent(post.publishedAt) && (
            <span className="px-2 py-0.5 bg-accent text-white rounded-full text-[10px] font-bold uppercase tracking-wider">Novo</span>
          )}
          {post.category && (() => {
            const c = BLOG_CATEGORY_BY_SLUG[post.category!.slug]
            return c ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{ backgroundColor: c.color, color: '#fff' }}>
                {post.category!.name}
              </span>
            ) : null
          })()}
        </div>
        <h2 className="font-black text-white text-lg sm:text-xl leading-snug line-clamp-3 group-hover:text-accent/90 transition-colors">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-white/60 text-xs leading-relaxed line-clamp-2 hidden sm:block">{post.excerpt}</p>
        )}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
          <PostMeta post={post} size="xs" light />
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-accent group-hover:gap-2.5 transition-all whitespace-nowrap">
            Ler <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  )
}

// Card menor para o par do lado direito no magazine grid — vertical com imagem topo
function EditorialSideCard({ post, priority }: { post: PostItem; priority?: boolean }) {
  const cfg = post.category ? BLOG_CATEGORY_BY_SLUG[post.category.slug] : null
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-xl overflow-hidden border border-border bg-surface hover:border-accent/40 hover:shadow-md transition-all duration-300 flex-1"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted/20 shrink-0">
        <BlogImage src={post.coverImageUrl} alt={post.title} fill sizes="(max-width: 640px) 100vw, 240px" priority={priority}
          className="object-cover group-hover:scale-[1.05] transition-transform duration-500"
          fallbackGradient={cfg ? `linear-gradient(135deg, ${cfg.bg}, ${cfg.color}44)` : '#f5f5f5'}
        />
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          <CategoryBadge category={post.category} size="xs" />
          {isRecent(post.publishedAt) && (
            <span className="px-1.5 py-0.5 bg-accent text-white rounded-full text-[9px] font-bold">Novo</span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1.5 p-3 flex-1">
        <p className="text-xs font-bold text-foreground leading-snug line-clamp-2 group-hover:text-accent transition-colors flex-1">
          {post.title}
        </p>
        <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
          <PostMeta post={post} size="xs" />
          <ChevronRight size={11} className="text-muted opacity-0 group-hover:opacity-50 group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>
      </div>
    </Link>
  )
}

// Card vertical padrão — grid 2-3 colunas
function PostCard({ post, priority }: { post: PostItem; priority?: boolean }) {
  const cfg = post.category ? BLOG_CATEGORY_BY_SLUG[post.category.slug] : null
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden border border-border bg-surface hover:border-accent/40 hover:shadow-lg transition-all duration-300 h-full"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted/20 shrink-0">
        <BlogImage
          src={post.coverImageUrl} alt={post.title} fill priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
          fallbackGradient={cfg ? `linear-gradient(135deg, ${cfg.bg}, ${cfg.color}33)` : '#f5f5f5'}
        />
        <div className="absolute top-2.5 left-2.5 flex gap-1">
          <CategoryBadge category={post.category} />
        </div>
        {isRecent(post.publishedAt) && (
          <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 bg-accent text-white rounded-full text-[9px] font-bold uppercase">Novo</span>
        )}
      </div>
      <div className="flex flex-col gap-2.5 p-4 flex-1">
        <h2 className="font-bold text-foreground text-[13px] leading-snug line-clamp-2 group-hover:text-accent transition-colors flex-1">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-[12px] text-muted line-clamp-2 leading-relaxed">{post.excerpt}</p>
        )}
        <div className="pt-2.5 border-t border-border mt-auto flex items-center justify-between gap-2">
          <PostMeta post={post} size="xs" />
          <ChevronRight size={12} className="text-muted opacity-0 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>
      </div>
    </Link>
  )
}

// Card compacto — listagem de mais artigos
function CompactPostCard({ post, rank }: { post: PostItem; rank?: number }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex gap-3.5 items-start p-3.5 rounded-xl border border-border bg-surface hover:border-accent/40 hover:bg-surface-hover transition-all"
    >
      {rank !== undefined ? (
        <span className="text-base font-black w-5 shrink-0 mt-0.5 tabular-nums text-muted/40 group-hover:text-accent/60 transition-colors">
          {rank}
        </span>
      ) : null}
      <BlogImage src={post.coverImageUrl} alt={post.title}
        aspectRatio="thumb" width={72} height={48} priority
        className="rounded-lg shrink-0 object-cover group-hover:scale-[1.04] transition-transform duration-300"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <CategoryBadge category={post.category} size="xs" />
          {isRecent(post.publishedAt) && (
            <span className="px-1.5 py-0.5 bg-accent/10 text-accent rounded-full text-[9px] font-bold">Novo</span>
          )}
        </div>
        <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-accent transition-colors mb-1.5">
          {post.title}
        </p>
        <PostMeta post={post} size="xs" />
      </div>
      <ChevronRight size={14} className="text-muted opacity-0 group-hover:opacity-50 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
    </Link>
  )
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ category?: string; tag?: string; page?: string }> }) {
  const { category: activeCategory, tag: activeTag, page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const { hero, posts, mostRead, categories, popularTags, total } = await getPosts(activeCategory, activeTag, page)
  const isFiltered = !!activeCategory || !!activeTag
  const totalPages = Math.ceil(total / PAGE_SIZE)

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

  const featPost = page > 1 ? null : (isFiltered ? posts[0] : hero)
  const heroId = featPost?.id
  const gridPosts = posts.filter(p => p.id !== heroId)

  const activeCatConfig = activeCategory ? BLOG_CATEGORY_BY_SLUG[activeCategory] : null

  // Magazine grid: posts 0-1 no editorial (main+side), posts 2+ no grid normal
  const magazineMain = gridPosts[0]
  const magazineSide = gridPosts.slice(1, 3)
  const gridStart = 3
  const block2Posts = gridPosts.slice(gridStart, gridStart + 6)
  const compactPosts = gridPosts.slice(gridStart + 6)

  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'Blog | HallyuHub',
        url: `${BASE_URL}/blog`,
        inLanguage: 'pt-BR',
      }} />
      <div className="w-full bg-background border-b border-border/40">
        <div className="max-w-[970px] mx-auto px-4 py-1">
          <AdBanner slot={AD_SLOT} variant="leaderboard" eager minimal hideLabel />
        </div>
      </div>
      <PageTransition className="pb-16">

        {/* ── Hero — só na página 1 ─────────────────────────────── */}
        {page === 1 && <div className="relative w-full min-h-[460px] md:min-h-[580px] overflow-hidden">
          {featPost?.coverImageUrl ? (
            <Image src={featPost.coverImageUrl} alt={featPost.title} fill priority sizes="100vw"
              className="object-cover" />
          ) : (
            <div className="w-full h-full absolute inset-0"
              style={{ background: activeCatConfig
                ? `linear-gradient(135deg, ${activeCatConfig.bg}, ${activeCatConfig.color}55)`
                : 'linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 50%, #16213e 100%)' }} />
          )}

          {/* Gradientes */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />

          {/* Conteúdo */}
          <div className="relative z-10 h-full flex flex-col justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 md:py-10">
            {/* Topo */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Blog HallyuHub</span>
              </div>
              <Link href="/blog/feed.xml"
                className="flex items-center gap-1.5 text-white/35 hover:text-white/70 transition-colors text-xs px-2.5 py-1.5 rounded-lg hover:bg-white/10">
                <Rss size={12} />
                <span className="hidden sm:inline">RSS</span>
              </Link>
            </div>

            {/* Artigo em destaque */}
            {featPost ? (
              <Link href={`/blog/${featPost.slug}`} className="group block mt-auto">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {featPost.category && (() => {
                    const cfg = BLOG_CATEGORY_BY_SLUG[featPost.category.slug]
                    return cfg ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                        style={{ backgroundColor: cfg.color, color: '#fff' }}>
                        {featPost.category.name}
                      </span>
                    ) : null
                  })()}
                  {isRecent(featPost.publishedAt) && (
                    <span className="px-2.5 py-1 bg-accent text-white rounded-full text-[11px] font-bold uppercase tracking-wider">Novo</span>
                  )}
                  {featPost.featured && !isFiltered && (
                    <span className="px-2.5 py-1 bg-yellow-400/90 text-yellow-900 rounded-full text-[11px] font-bold uppercase tracking-wider">Destaque</span>
                  )}
                  {isFiltered && (
                    <span className="text-white/45 text-xs">{posts.length} {posts.length === 1 ? 'artigo' : 'artigos'}</span>
                  )}
                </div>

                <h1 className="text-[1.6rem] sm:text-3xl md:text-[2.8rem] font-black text-white leading-tight line-clamp-2 group-hover:text-accent transition-colors mb-3 max-w-3xl">
                  {featPost.title}
                </h1>

                {featPost.excerpt && (
                  <p className="text-white/60 text-sm md:text-[15px] line-clamp-2 leading-relaxed hidden sm:block mb-5 max-w-2xl">
                    {featPost.excerpt}
                  </p>
                )}

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-white/45 text-xs">
                    <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center text-[9px] font-bold text-white/80">
                      {BLOG_AUTHOR_AVATAR_INITIAL}
                    </div>
                    <span>{BLOG_AUTHOR_DISPLAY_NAME}</span>
                    <span>·</span>
                    <PostMeta post={featPost} size="xs" light />
                  </div>
                  <span className="ml-auto sm:ml-4 flex items-center gap-1.5 text-[13px] font-bold text-accent group-hover:gap-3 transition-all">
                    Ler artigo <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ) : (
              <div className="mt-auto">
                <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Blog K-Pop & K-Drama</h1>
                <p className="text-white/55 text-base">Artigos sobre cultura coreana em português</p>
              </div>
            )}
          </div>

          {/* Scroll hint */}
          {!isFiltered && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/25 animate-bounce pointer-events-none">
              <ChevronDown size={16} />
            </div>
          )}
        </div>}

        {/* ── Conteúdo principal ────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">

          {/* ── Filter bar sticky ─────────────────────────────── */}
          <div className="sticky top-[52px] sm:top-[60px] lg:top-[64px] z-20 bg-background/95 backdrop-blur-md -mx-4 sm:-mx-6 lg:-mx-12 px-4 sm:px-6 lg:px-12 py-3 border-b border-border mb-8 space-y-2">
            {/* Categorias */}
            <div className="relative">
              <div className="pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-background/95 to-transparent z-10 sm:hidden" />
              <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-background/95 to-transparent z-10 sm:hidden" />
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-nowrap sm:flex-wrap">
                <Link
                  href="/blog" scroll={false}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    !isFiltered
                      ? 'bg-foreground text-background'
                      : 'bg-surface text-muted hover:bg-surface-hover hover:text-foreground border border-border'
                  }`}
                >
                  Todos {total > 0 && <span className="opacity-40 ml-0.5">({total})</span>}
                </Link>
                {orderedCategories.map(c => {
                  const isActive = activeCategory === c.slug
                  const cfg = BLOG_CATEGORY_BY_SLUG[c.slug]
                  const href = activeTag
                    ? `/blog?category=${c.slug}&tag=${encodeURIComponent(activeTag)}`
                    : `/blog?category=${c.slug}`
                  return (
                    <Link
                      key={c.id} href={href} scroll={false}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border"
                      style={isActive
                        ? { backgroundColor: cfg?.bg ?? '#f3f4f6', color: cfg?.color ?? '#374151', borderColor: `${cfg?.color ?? '#374151'}50` }
                        : { backgroundColor: 'transparent', borderColor: 'transparent', color: 'var(--color-muted)' }
                      }
                    >
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg?.color ?? '#9ca3af' }} />
                      {c.name}
                      <span className="opacity-35 text-[10px]">{c._count.posts}</span>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Tags — com busca e expansão */}
            {normalizedPopularTags.length > 0 && (
              <TagFilter
                tags={normalizedPopularTags}
                activeTag={activeTag}
                activeCategory={activeCategory}
              />
            )}
          </div>

          {/* Info de filtro ativo */}
          {isFiltered && (
            <div className="flex items-center gap-3 mb-6 p-3.5 rounded-xl bg-surface border border-border">
              <div className="flex items-center gap-2 flex-wrap flex-1">
                {activeCatConfig && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ color: activeCatConfig.color, backgroundColor: activeCatConfig.bg }}>
                    {activeCatConfig.name}
                  </span>
                )}
                {activeTag && (
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <Tag size={10} />#{activeTag}
                  </span>
                )}
                <span className="text-xs text-muted">
                  {posts.length} {posts.length === 1 ? 'artigo encontrado' : 'artigos encontrados'}
                </span>
              </div>
              <Link href="/blog" className="text-xs text-accent hover:underline font-semibold whitespace-nowrap">
                Limpar filtros
              </Link>
            </div>
          )}

          {/* ── Layout: posts + sidebar ────────────────────────── */}
          <div className="grid lg:grid-cols-[1fr_300px] gap-10 xl:gap-14">

            {/* ── Coluna principal ─────────────────────────────── */}
            <div>
              {page > 1 && !isFiltered ? (
                /* Página 2+: arquivo compacto em ordem */
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted flex items-center gap-1.5 shrink-0">
                      <span className="w-3 h-px bg-muted inline-block" />
                      Arquivo · Página {page}
                    </p>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] text-muted shrink-0">{total} artigos</span>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {gridPosts.map((p, i) => (
                      <CompactPostCard key={p.id} post={p} rank={(page - 1) * PAGE_SIZE + i + 1} />
                    ))}
                  </div>
                  {totalPages > 1 && (() => {
                    const buildHref = (p: number) => {
                      const q = p > 1 ? `?page=${p}` : ''
                      return `/blog${q}`
                    }
                    return (
                      <div className="mt-6 flex items-center justify-between gap-4">
                        {page > 1 ? (
                          <Link href={buildHref(page - 1)} scroll
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-surface hover:bg-surface-hover hover:border-accent/40 text-sm font-semibold text-foreground transition-all">
                            ← Anterior
                          </Link>
                        ) : <div />}
                        <span className="text-xs text-muted text-center">Página {page} de {totalPages}</span>
                        {page < totalPages ? (
                          <Link href={buildHref(page + 1)} scroll
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background hover:opacity-90 text-sm font-semibold transition-all">
                            Próxima <ArrowRight size={14} />
                          </Link>
                        ) : <div />}
                      </div>
                    )
                  })()}
                </div>
              ) : (
                <>
                {!isFiltered && (
                  <div className="flex items-center gap-3 mb-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted flex items-center gap-1.5 shrink-0">
                      <span className="w-3 h-px bg-muted inline-block" />
                      Publicações recentes
                    </p>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] text-muted shrink-0">{total} artigos</span>
                  </div>
                )}

              {gridPosts.length > 0 ? (
                <div className="space-y-8">

                  {/* ── Magazine grid: 1 grande + 2 verticais ── */}
                  {magazineMain && (
                    <div className="grid sm:grid-cols-[3fr_2fr] gap-4 items-stretch">
                      <EditorialMainCard post={magazineMain} />
                      <div className="flex flex-col gap-3 h-full">
                        {magazineSide.map((p, i) => (
                          <EditorialSideCard key={p.id} post={p} priority={i === 0} />
                        ))}
                      </div>
                    </div>
                  )}

                  {block2Posts.length > 0 && (
                    <AdBanner slot={AD_SLOT} variant="banner" className="my-2" />
                  )}

                  {block2Posts.length > 0 && (
                    <>
                      <div className="flex items-center gap-3 -mb-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted flex items-center gap-1.5 shrink-0">
                          <span className="w-3 h-px bg-muted inline-block" />
                          Mais artigos
                        </p>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {block2Posts.map((p, i) => <PostCard key={p.id} post={p} priority={i < 3} />)}
                      </div>
                    </>
                  )}

                  {compactPosts.length > 0 && (
                    <div>
                      <AdBanner slot={AD_SLOT} variant="banner" className="mb-6" />
                      <div className="flex items-center gap-3 mb-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted flex items-center gap-1.5">
                          <span className="w-3 h-px bg-muted inline-block" />
                          Arquivo
                        </p>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                      <div className="flex flex-col gap-2.5">
                        {compactPosts.map((p, i) => (
                          <CompactPostCard key={p.id} post={p} rank={gridStart + 6 + i + 1} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Paginação */}
                  {totalPages > 1 && (() => {
                    const buildHref = (p: number) => {
                      const params = new URLSearchParams()
                      if (activeCategory) params.set('category', activeCategory)
                      if (activeTag) params.set('tag', activeTag)
                      if (p > 1) params.set('page', String(p))
                      const q = params.toString()
                      return `/blog${q ? `?${q}` : ''}`
                    }
                    return (
                      <div className="mt-6 flex items-center justify-between gap-4">
                        {page > 1 ? (
                          <Link href={buildHref(page - 1)} scroll
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-surface hover:bg-surface-hover hover:border-accent/40 text-sm font-semibold text-foreground transition-all">
                            ← Anterior
                          </Link>
                        ) : <div />}
                        <span className="text-xs text-muted text-center">
                          Página {page} de {totalPages} · {total} artigos
                        </span>
                        {page < totalPages ? (
                          <Link href={buildHref(page + 1)} scroll
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background hover:opacity-90 text-sm font-semibold transition-all">
                            Ver mais artigos <ArrowRight size={14} />
                          </Link>
                        ) : <div />}
                      </div>
                    )
                  })()}

                  {/* Ver todos quando filtrado */}
                  {isFiltered && (
                    <div className="mt-6 text-center">
                      <Link href="/blog"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border bg-surface hover:bg-surface-hover hover:border-accent/40 text-sm font-semibold text-foreground transition-all">
                        Ver todos os artigos <ArrowRight size={14} />
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-24 text-muted border border-dashed border-border rounded-2xl">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-semibold mb-1">Nenhum artigo encontrado.</p>
                  <p className="text-xs text-muted/70 mb-4">Tente outro filtro ou veja todos os artigos.</p>
                  <Link href="/blog" className="text-xs text-accent font-semibold hover:underline">
                    Ver todos os artigos →
                  </Link>
                </div>
              )}
              </>
              )}
            </div>

            {/* ── Sidebar ──────────────────────────────────────── */}
            <aside className="space-y-7">

              {/* Mais lidos */}
              {mostRead.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-4 flex items-center gap-1.5">
                    <TrendingUp size={11} className="text-accent" /> Mais lidos
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
                          <span className="text-lg font-black leading-none w-5 shrink-0 mt-0.5 tabular-nums"
                            style={{ color: `color-mix(in srgb, var(--accent) ${Math.max(25, 75 - i * 13)}%, var(--color-muted))` }}>
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-accent transition-colors mb-1.5">
                              {p.title}
                            </p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {cfg && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
                                  style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                                  {p.category?.name}
                                </span>
                              )}
                              <span className="text-[10px] text-muted flex items-center gap-0.5"><Eye size={9} />{p.viewCount}</span>
                              <span className="text-[10px] text-muted flex items-center gap-0.5"><Clock size={9} />{p.readingTimeMin}min</span>
                            </div>
                          </div>
                          <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-muted/20">
                            <BlogImage src={p.coverImageUrl} alt={p.title} fill priority aspectRatio="thumb"
                              className="object-cover" />
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Ad na sidebar */}
              <AdBanner slot={AD_SLOT} variant="rectangle" />

              {/* Explorar por categoria */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-3">Categorias</p>
                <div className="flex flex-col gap-1">
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
                        <span className="text-xs font-semibold flex-1 transition-colors"
                          style={isActive ? { color: cfg?.color } : undefined}>
                          {c.name}
                        </span>
                        <span className="text-[10px] font-bold opacity-35" style={isActive ? { color: cfg?.color } : undefined}>
                          {c._count.posts}
                        </span>
                        <ArrowRight size={11}
                          className={`transition-all shrink-0 ${isActive ? 'opacity-60' : 'opacity-0 group-hover:opacity-50 group-hover:translate-x-0.5'}`}
                          style={isActive ? { color: cfg?.color } : undefined} />
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Tags populares */}
              {normalizedPopularTags.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-3 flex items-center gap-1.5">
                    <Tag size={10} /> Tags populares
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {normalizedPopularTags.slice(0, 10).map(({ tag }) => {
                      const ts = getTagStyle(tag)
                      const isActiveTag = activeTag === tag
                      const href = isActiveTag ? '/blog' : `/blog?tag=${encodeURIComponent(tag)}`
                      return (
                        <Link key={tag} href={href} scroll={false}
                          className="px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all"
                          style={{
                            color: isActiveTag ? '#fff' : ts.color,
                            backgroundColor: isActiveTag ? ts.color : ts.bg,
                          }}>
                          {tag}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Newsletter CTA */}
              <div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Mail size={14} className="text-accent shrink-0" />
                  <p className="text-xs font-black uppercase tracking-wider text-accent">Newsletter</p>
                </div>
                <p className="text-sm font-bold text-foreground mb-1">Novidades do universo Hallyu</p>
                <p className="text-[11px] text-muted leading-relaxed mb-4">
                  Receba os melhores artigos sobre K-Pop, K-Drama e cultura coreana direto no seu e-mail.
                </p>
                <Link
                  href="/settings"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white text-xs font-bold hover:opacity-90 transition-all"
                >
                  Criar conta gratuita <ArrowRight size={12} />
                </Link>
              </div>

              {/* RSS */}
              <Link
                href="/blog/feed.xml"
                className="flex items-center gap-2.5 text-xs text-muted hover:text-foreground transition-colors border border-border rounded-xl px-3.5 py-3 hover:bg-surface group"
              >
                <Rss size={14} className="text-orange-500 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground text-xs">Feed RSS</p>
                  <p className="text-[10px] opacity-60">Receba novos artigos no seu leitor</p>
                </div>
                <ArrowRight size={12} className="ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />
              </Link>
            </aside>
          </div>

          {/* Ad final */}
          <AdBanner slot={AD_SLOT} variant="banner" className="mt-12" />
        </div>

        <ScrollToTop />
      </PageTransition>
    </>
  )
}
