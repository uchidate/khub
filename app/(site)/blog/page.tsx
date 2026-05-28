export const revalidate = 300

import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { PageTransition } from '@/components/features/PageTransition'
import { ScrollToTop } from '@/components/ui/ScrollToTop'
import { JsonLd } from '@/components/seo/JsonLd'
import { BlogImage } from '@/components/ui/BlogImage'
import { BlogHeroCarousel } from '@/components/blog/BlogHeroCarousel'
import { LojaRelacionados } from '@/components/ui/LojaRelacionados'
import { ResponsiveFilterBar } from '@/components/ui/ResponsiveFilterBar'
import { PageHeader } from '@/components/ui/PageHeader'
import { Clock, Eye, ArrowRight, TrendingUp, BookOpen, ChevronRight, Sparkles } from 'lucide-react'
import { BLOG_AUTHOR_DISPLAY_NAME, BLOG_AUTHOR_AVATAR_INITIAL } from '@/lib/config/blog'
import prisma from '@/lib/prisma'
import { ALL_BLOG_TAGS } from '@/lib/config/tags'
import { SITE_URL } from '@/lib/constants/site'
import { BLOG_CATEGORIES, BLOG_CATEGORY_BY_SLUG } from '@/lib/config/categories'
import { rankPosts, selectDiversePosts } from '@/lib/blog/scoring'

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
const EMPTY_POSTS = { hero: null, heroSlides: [] as PostItem[], editorialIds: [] as string[], posts: [], mostRead: [], categories: [], popularTags: [], total: 0, totalCategories: 0 }
const PAGE_SIZE = 20

const POST_SELECT = {
  id: true, slug: true, title: true, excerpt: true, coverImageUrl: true,
  publishedAt: true, readingTimeMin: true, viewCount: true, featured: true, tags: true,
  category: { select: { id: true, name: true, slug: true } },
}

async function getPosts(category?: string, tag?: string, page = 1, sortBy?: string) {
  if (process.env.SKIP_BUILD_STATIC_GENERATION) return EMPTY_POSTS
  try {
    const where = {
      ...PUBLIC_WHERE,
      ...(category ? { category: { slug: category } } : {}),
      ...(tag ? { tags: { has: tag } } : {}),
    }

    const orderBy = sortBy === 'popular'
      ? { viewCount: 'desc' as const }
      : { publishedAt: 'desc' as const }

    const editorialCandidatesPromise = page === 1 && !category && !tag
      ? Promise.all([
          prisma.blogPost.findMany({ where: PUBLIC_WHERE, orderBy: { publishedAt: 'desc' }, take: 30, select: POST_SELECT }),
          prisma.blogPost.findMany({
            where: { ...PUBLIC_WHERE, publishedAt: { gte: new Date(Date.now() - 60 * 86_400_000) } },
            orderBy: { viewCount: 'desc' }, take: 10, select: POST_SELECT,
          }),
          Promise.all(
            BLOG_CATEGORIES.map(cat =>
              prisma.blogPost.findMany({
                where: { ...PUBLIC_WHERE, category: { slug: cat.slug } },
                orderBy: { publishedAt: 'desc' }, take: 8, select: POST_SELECT,
              }).catch(() => [])
            )
          ).then(arr => arr.flat()),
        ]).then(([recent, trending, categoryLatest]) => {
          const seen = new Set<string>()
          const merged = [...recent, ...trending, ...categoryLatest].filter(p => !seen.has(p.id) && seen.add(p.id))
          return rankPosts(merged)
        })
      : Promise.resolve([] as PostItem[])

    const [editorialRanked, posts, mostRead, categories, popularTags, total, totalCategories] = await Promise.all([
      editorialCandidatesPromise,
      prisma.blogPost.findMany({ where, orderBy, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, select: POST_SELECT }),
      !category && !tag ? prisma.blogPost.findMany({
        where: PUBLIC_WHERE, orderBy: { viewCount: 'desc' }, take: 5,
        select: { slug: true, title: true, readingTimeMin: true, viewCount: true, coverImageUrl: true, publishedAt: true,
          category: { select: { id: true, name: true, slug: true } } },
      }) : Promise.resolve([]),
      prisma.blogCategory.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, slug: true, _count: { select: { posts: { where: PUBLIC_WHERE } } } },
      }),
      prisma.$queryRaw<{ tag: string; count: bigint }[]>`
        SELECT unnest(tags) as tag, count(*) as count
        FROM "BlogPost" WHERE status = 'PUBLISHED' AND "isPrivate" = false
        GROUP BY tag ORDER BY count DESC LIMIT 16
      `,
      prisma.blogPost.count({ where }),
      prisma.blogCategory.count(),
    ])

    const heroSlides = selectDiversePosts(editorialRanked, 4, 1)
    const hero = heroSlides[0] ?? null
    const editorialIds = heroSlides.map(p => p.id)

    return { hero, heroSlides, editorialIds, posts, mostRead, categories, popularTags, total, totalCategories }
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
    <span className={`self-start w-fit px-2 py-0.5 font-mono font-bold uppercase tracking-[0.12em] whitespace-nowrap ${size === 'xs' ? 'text-[8.5px]' : 'text-[9.5px]'}`}
      style={{ backgroundColor: cfg?.bg ?? '#f3f4f6', color: cfg?.color ?? '#374151' }}>
      {category.name}
    </span>
  )
}

function PostMeta({ post, size = 'sm', light = false }: {
  post: Pick<PostItem, 'publishedAt' | 'readingTimeMin' | 'viewCount'>
  size?: 'sm' | 'xs'; light?: boolean
}) {
  const cls = size === 'xs' ? 'text-[10px] gap-2' : 'text-[11px] gap-2.5'
  const colorCls = light ? 'text-white/55' : 'text-muted'
  return (
    <div className={`flex items-center flex-wrap ${cls} ${colorCls}`}>
      {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
      {post.readingTimeMin > 0 && <span className="flex items-center gap-1"><Clock size={size === 'xs' ? 9 : 10} />{post.readingTimeMin} min</span>}
      {post.viewCount > 0 && <span className="flex items-center gap-1"><Eye size={size === 'xs' ? 9 : 10} />{post.viewCount}</span>}
    </div>
  )
}

function EditorialMainCard({ post }: { post: PostItem }) {
  const cfg = post.category ? BLOG_CATEGORY_BY_SLUG[post.category.slug] : null
  return (
    <Link href={`/blog/${post.slug}`}
      className="group relative flex flex-col overflow-hidden border border-border bg-background transition-colors duration-300 hover:border-accent/50 h-full min-h-[340px]">
      <BlogImage src={post.coverImageUrl} alt={post.title} fill priority
        sizes="(max-width: 640px) 100vw, 55vw"
        className="object-cover group-hover:scale-[1.03] transition-transform duration-700"
        fallbackGradient={cfg ? `linear-gradient(135deg, ${cfg.bg}, ${cfg.color}55)` : '#0d0d1a'}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      <div className="relative z-10 mt-auto p-5 sm:p-6 flex flex-col gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          {post.featured && <span className="px-2 py-0.5 bg-yellow-400/90 text-yellow-900 text-[10px] font-bold uppercase tracking-wider">Destaque</span>}
          {isRecent(post.publishedAt) && <span className="px-2 py-0.5 bg-accent text-white text-[10px] font-bold uppercase tracking-wider">Novo</span>}
          {post.category && (() => {
            const c = BLOG_CATEGORY_BY_SLUG[post.category!.slug]
            return c ? <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: c.color, color: '#fff' }}>{post.category!.name}</span> : null
          })()}
        </div>
        <h2 className="font-black text-white text-lg sm:text-xl leading-snug line-clamp-3 group-hover:text-accent/90 transition-colors">{post.title}</h2>
        {post.excerpt && <p className="text-white/60 text-xs leading-relaxed line-clamp-2 hidden sm:block">{post.excerpt}</p>}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
          <PostMeta post={post} size="xs" light />
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-accent group-hover:gap-2.5 transition-all whitespace-nowrap">Ler <ArrowRight size={12} /></span>
        </div>
      </div>
    </Link>
  )
}

function EditorialSideCard({ post, priority }: { post: PostItem; priority?: boolean }) {
  const cfg = post.category ? BLOG_CATEGORY_BY_SLUG[post.category.slug] : null
  return (
    <Link href={`/blog/${post.slug}`}
      className="group flex flex-col border border-border bg-background transition-colors duration-200 hover:border-accent/50 overflow-hidden flex-1">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted/20 shrink-0">
        <BlogImage src={post.coverImageUrl} alt={post.title} fill sizes="(max-width: 640px) 100vw, 240px" priority={priority}
          className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
          fallbackGradient={cfg ? `linear-gradient(135deg, ${cfg.bg}, ${cfg.color}44)` : '#f5f5f5'}
        />
        {isRecent(post.publishedAt) && <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-accent text-white text-[9px] font-bold uppercase">Novo</span>}
        {cfg && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: cfg.color }} />}
      </div>
      <div className="flex flex-col gap-1.5 p-3 flex-1">
        <CategoryBadge category={post.category} size="xs" />
        <p className="text-xs font-bold text-foreground leading-snug line-clamp-2 group-hover:text-accent transition-colors flex-1">{post.title}</p>
        <PostMeta post={post} size="xs" />
      </div>
    </Link>
  )
}

function PostCard({ post, priority }: { post: PostItem; priority?: boolean }) {
  const cfg = post.category ? BLOG_CATEGORY_BY_SLUG[post.category.slug] : null
  return (
    <Link href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden border border-border bg-background transition-colors duration-300 hover:border-accent/50 h-full">
      {cfg && <div className="h-0.5 w-full shrink-0" style={{ backgroundColor: cfg.color }} />}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted/20 shrink-0">
        <BlogImage src={post.coverImageUrl} alt={post.title} fill priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
          fallbackGradient={cfg ? `linear-gradient(135deg, ${cfg.bg}, ${cfg.color}33)` : '#f5f5f5'}
        />
        {isRecent(post.publishedAt) && <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 bg-accent text-white text-[9px] font-bold uppercase">Novo</span>}
      </div>
      <div className="flex flex-col gap-2 p-4 flex-1">
        <CategoryBadge category={post.category} />
        <h2 className="font-bold text-foreground text-sm leading-snug line-clamp-2 group-hover:text-accent transition-colors flex-1">{post.title}</h2>
        {post.excerpt && <p className="text-[12px] text-muted line-clamp-2 leading-relaxed">{post.excerpt}</p>}
        <div className="pt-2.5 border-t border-border mt-auto flex items-center justify-between gap-2">
          <PostMeta post={post} size="xs" />
          <span className="flex items-center gap-1 text-[10px] font-bold text-muted opacity-0 group-hover:opacity-60 group-hover:text-accent transition-all shrink-0">Ler <ChevronRight size={10} /></span>
        </div>
      </div>
    </Link>
  )
}

function CompactPostCard({ post, rank }: { post: PostItem; rank?: number }) {
  const cfg = post.category ? BLOG_CATEGORY_BY_SLUG[post.category.slug] : null
  return (
    <Link href={`/blog/${post.slug}`}
      className="group flex gap-3.5 items-center p-3 border border-border bg-background transition-colors hover:border-accent/50 hover:bg-surface/55 overflow-hidden"
      style={cfg ? { borderLeftColor: `${cfg.color}60`, borderLeftWidth: '3px' } : undefined}>
      {rank !== undefined && <span className="text-sm font-black w-5 shrink-0 tabular-nums text-muted/30 group-hover:text-accent/50 transition-colors">{rank}</span>}
      <div className="relative overflow-hidden shrink-0 bg-muted/20" style={{ width: 88, height: 58 }}>
        <BlogImage src={post.coverImageUrl} alt={post.title} aspectRatio="thumb" width={88} height={58} priority
          className="object-cover group-hover:scale-[1.05] transition-transform duration-300" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <CategoryBadge category={post.category} size="xs" />
          {isRecent(post.publishedAt) && <span className="px-1.5 py-0.5 bg-accent/10 text-accent text-[9px] font-bold">Novo</span>}
        </div>
        <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-accent transition-colors mb-1.5">{post.title}</p>
        <PostMeta post={post} size="xs" />
      </div>
      <ChevronRight size={14} className="text-muted opacity-0 group-hover:opacity-50 group-hover:translate-x-0.5 transition-all shrink-0" />
    </Link>
  )
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ category?: string; tag?: string; page?: string; sortBy?: string }> }) {
  const { category: activeCategory, tag: activeTag, page: pageParam, sortBy } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const { hero, heroSlides, editorialIds, posts, mostRead, categories, popularTags, total } = await getPosts(activeCategory, activeTag, page, sortBy)
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
    .slice(0, 14)

  const featPost = page > 1 ? null : (isFiltered ? posts[0] : hero)
  const heroId = featPost?.id
  const activeCatConfig = activeCategory ? BLOG_CATEGORY_BY_SLUG[activeCategory] : null

  const editorialPostsMap = new Map([hero, ...posts].filter(Boolean).map(p => [p!.id, p!]))
  const magazineMain = !isFiltered && page === 1 && editorialIds[1]
    ? (editorialPostsMap.get(editorialIds[1]) ?? posts.find(p => p.id !== heroId))
    : posts.find(p => p.id !== heroId) ?? null
  const magazineSide = (() => {
    const fromEditorial = (!isFiltered && page === 1)
      ? (editorialIds.slice(2, 4).map(id => editorialPostsMap.get(id)).filter(Boolean) as typeof posts)
      : []
    if (fromEditorial.length >= 2) return fromEditorial
    const used = new Set([heroId, magazineMain?.id, ...fromEditorial.map(p => p.id)])
    return [...fromEditorial, ...posts.filter(p => !used.has(p.id)).slice(0, 2 - fromEditorial.length)]
  })()
  const editorialUsed = new Set([heroId, magazineMain?.id, ...magazineSide.map(p => p.id)])
  const gridPosts = posts.filter(p => !editorialUsed.has(p.id))
  const block2Posts = gridPosts.slice(0, 6)
  const compactPosts = gridPosts.slice(6)

  const activeSortBy = sortBy || 'recent'
  const tabHref = (tab: string) => {
    const params = new URLSearchParams()
    if (activeCategory) params.set('category', activeCategory)
    if (activeTag) params.set('tag', activeTag)
    if (tab !== 'recent') params.set('sortBy', tab)
    const q = params.toString()
    return `/blog${q ? `?${q}` : ''}`
  }
  const buildHref = (p: number) => {
    const params = new URLSearchParams()
    if (activeCategory) params.set('category', activeCategory)
    if (activeTag) params.set('tag', activeTag)
    if (sortBy) params.set('sortBy', sortBy)
    if (p > 1) params.set('page', String(p))
    const q = params.toString()
    return `/blog${q ? `?${q}` : ''}`
  }

  const nowLabel = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const activeCategoryLabel = activeCategory
    ? orderedCategories.find(c => c.slug === activeCategory)?.name ?? activeCatConfig?.name ?? 'Categoria'
    : 'Todos'
  const categoryTabClass = (active: boolean) =>
    `flex h-8 shrink-0 items-center whitespace-nowrap rounded-md px-3 text-[12px] font-black transition-colors lg:h-full lg:rounded-none lg:border-b-2 lg:px-0.5 lg:text-[12px] ${
      active
        ? 'bg-accent text-white lg:border-accent lg:bg-transparent lg:text-accent'
        : 'bg-surface text-muted hover:text-foreground lg:border-transparent lg:bg-transparent'
    }`

  return (
    <>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'Blog', name: 'Blog | HallyuHub', url: `${BASE_URL}/blog`, inLanguage: 'pt-BR' }} />
      {orderedCategories.length > 0 && (
        <ResponsiveFilterBar label="Categoria" value={activeCategoryLabel}>
          <div className="grid grid-cols-2 gap-1.5 lg:flex lg:items-stretch lg:gap-5">
            <Link href="/blog" className={categoryTabClass(!activeCategory)}>Todos</Link>
            {orderedCategories.map((c) => (
              <Link key={c.id} href={`/blog?category=${c.slug}`} className={categoryTabClass(activeCategory === c.slug)}>{c.name}</Link>
            ))}
          </div>
        </ResponsiveFilterBar>
      )}
      <PageTransition className="overflow-x-clip pb-16">
        <PageHeader
          breadcrumbs={[{ label: 'Artigos' }]}
          subtitle={isFiltered ? 'Artigos filtrados por tema e tags' : `Edição de ${nowLabel}`}
          meta={`${total} artigos`}
        />

        {/* ── Hero carousel — página 1 sem filtro ──────────────────── */}
        {page === 1 && (
          <div>
            {!isFiltered && heroSlides.length > 0 ? (
              <BlogHeroCarousel
                slides={heroSlides}
                authorName={BLOG_AUTHOR_DISPLAY_NAME}
                authorInitial={BLOG_AUTHOR_AVATAR_INITIAL}
              />
            ) : featPost ? (
              <div className="relative w-full h-[400px] md:h-[520px] overflow-hidden">
                {featPost.coverImageUrl ? (
                  <Image src={featPost.coverImageUrl} alt={featPost.title} fill priority sizes="100vw" className="object-cover" />
                ) : (
                  <div className="w-full h-full absolute inset-0"
                    style={{ background: activeCatConfig
                      ? `linear-gradient(135deg, ${activeCatConfig.bg}, ${activeCatConfig.color}55)`
                      : 'linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 50%, #16213e 100%)' }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />
                <div className="relative z-10 h-full flex flex-col justify-end px-6 lg:px-12 py-8 md:py-12">
                  <Link href={`/blog/${featPost.slug}`} className="group block">
                    <h1 className="text-2xl sm:text-3xl md:text-[2.6rem] font-black text-white leading-tight line-clamp-2 group-hover:text-accent transition-colors mb-3 max-w-3xl">
                      {featPost.title}
                    </h1>
                    {featPost.excerpt && <p className="text-white/60 text-sm line-clamp-2 hidden sm:block mb-5 max-w-2xl">{featPost.excerpt}</p>}
                    <span className="flex items-center gap-1.5 text-[13px] font-bold text-accent group-hover:gap-3 transition-all">
                      Ler artigo <ArrowRight size={14} />
                    </span>
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ── Conteúdo principal ────────────────────────────────────── */}
        <div className="page-wrap mt-8">

          {/* Sort tabs + filtro ativo */}
          <div className="flex items-center justify-between gap-4 mb-8 border-b border-border pb-4">
            <div className="flex items-center gap-1">
              {[{ key: 'recent', label: 'Mais recentes' }, { key: 'popular', label: 'Mais lidos' }].map(tab => (
                <Link key={tab.key} href={tabHref(tab.key)} scroll={false}
                  className={`px-3 py-1.5 text-[12px] font-bold transition-colors rounded-full ${
                    activeSortBy === tab.key ? 'bg-foreground text-background' : 'text-muted hover:text-foreground'
                  }`}>
                  {tab.label}
                </Link>
              ))}
            </div>
            {isFiltered ? (
              <div className="flex items-center gap-2">
                {activeCatConfig && (
                  <span className="text-[11px] font-bold px-2 py-0.5" style={{ color: activeCatConfig.color, backgroundColor: activeCatConfig.bg }}>{activeCatConfig.name}</span>
                )}
                {activeTag && <span className="text-[11px] text-muted">#{activeTag}</span>}
                <Link href="/blog" className="text-[11px] text-accent hover:underline font-semibold">Limpar</Link>
              </div>
            ) : (
              <span className="font-mono text-[10px] text-muted">{total} artigos</span>
            )}
          </div>

          {/* ── Layout: main + sidebar ─────────────────────────────── */}
          <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_300px] gap-10 xl:gap-14">

            {/* Coluna principal */}
            <div className="min-w-0">
              {page > 1 && !isFiltered ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted flex items-center gap-1.5 shrink-0">
                      <span className="w-3 h-px bg-muted inline-block" />Arquivo · Página {page}
                    </p>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] text-muted shrink-0">{total} artigos</span>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {gridPosts.map((p, i) => <CompactPostCard key={p.id} post={p} rank={(page - 1) * PAGE_SIZE + i + 1} />)}
                  </div>
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between gap-4">
                      {page > 1 ? (
                        <Link href={buildHref(page - 1)} scroll className="flex items-center gap-2 px-5 py-2.5 border border-foreground text-sm font-semibold hover:bg-foreground hover:text-background transition-all">← Anterior</Link>
                      ) : <div />}
                      <span className="font-mono text-[11px] text-muted">Página {page} de {totalPages}</span>
                      {page < totalPages ? (
                        <Link href={buildHref(page + 1)} scroll className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-sm font-semibold hover:opacity-80 transition-all">Próxima <ArrowRight size={14} /></Link>
                      ) : <div />}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {!isFiltered && (
                    <div className="flex items-center gap-3 mb-5">
                      <div className="flex items-center gap-2 shrink-0">
                        <Sparkles size={12} className="text-accent" />
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground/60">Publicações recentes</p>
                      </div>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}

                  {gridPosts.length > 0 ? (
                    <div className="space-y-8">
                      {magazineMain && (
                        <div className="grid sm:grid-cols-[3fr_2fr] gap-4 items-stretch">
                          <EditorialMainCard post={magazineMain} />
                          <div className="grid grid-rows-2 gap-3">
                            {magazineSide.map((p, i) => <EditorialSideCard key={p.id} post={p} priority={i === 0} />)}
                            {magazineSide.length < 2 && Array.from({ length: 2 - magazineSide.length }).map((_, i) => (
                              <div key={i} className="border border-dashed border-border bg-surface/30 hidden sm:block" />
                            ))}
                          </div>
                        </div>
                      )}

                      {block2Posts.length > 0 && (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 shrink-0">
                              <BookOpen size={12} className="text-accent" />
                              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground/60">Mais artigos</p>
                            </div>
                            <div className="flex-1 h-px bg-border" />
                          </div>
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {block2Posts.map((p, i) => <PostCard key={p.id} post={p} priority={i < 3} />)}
                          </div>
                        </>
                      )}

                      {compactPosts.length > 0 && (
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="flex items-center gap-2 shrink-0">
                              <ArrowRight size={12} className="text-muted/50" />
                              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground/50">Mais publicações</p>
                            </div>
                            <div className="flex-1 h-px bg-border" />
                          </div>
                          <div className="flex flex-col gap-2">
                            {compactPosts.map((p, i) => <CompactPostCard key={p.id} post={p} rank={6 + i + 1} />)}
                          </div>
                        </div>
                      )}

                      {totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between gap-4">
                          {page > 1 ? (
                            <Link href={buildHref(page - 1)} scroll className="flex items-center gap-2 px-5 py-2.5 border border-foreground text-sm font-semibold hover:bg-foreground hover:text-background transition-all">← Anterior</Link>
                          ) : <div />}
                          <span className="font-mono text-[11px] text-muted text-center">Página {page} de {totalPages} · {total} artigos</span>
                          {page < totalPages ? (
                            <Link href={buildHref(page + 1)} scroll className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-sm font-semibold hover:opacity-80 transition-all">Ver mais artigos <ArrowRight size={14} /></Link>
                          ) : <div />}
                        </div>
                      )}

                      {isFiltered && (
                        <div className="mt-6 text-center">
                          <Link href="/blog" className="inline-flex items-center gap-2 px-6 py-3 border border-border bg-surface hover:bg-surface-hover hover:border-accent/40 text-sm font-semibold text-foreground transition-all">
                            Ver todos os artigos <ArrowRight size={14} />
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-24 text-muted border border-dashed border-border">
                      <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-semibold mb-1">Nenhum artigo encontrado.</p>
                      <p className="text-xs text-muted/70 mb-4">Tente outro filtro ou veja todos os artigos.</p>
                      <Link href="/blog" className="text-xs text-accent font-semibold hover:underline">Ver todos os artigos →</Link>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-7">
              {mostRead.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-4 flex items-center gap-1.5">
                    <TrendingUp size={11} className="text-accent" /> Mais lidos
                  </p>
                  <div className="space-y-2">
                    {mostRead.map((p, i) => {
                      const cfg = p.category ? BLOG_CATEGORY_BY_SLUG[p.category.slug] : null
                      return (
                        <Link key={p.slug} href={`/blog/${p.slug}`}
                            className="group flex items-start gap-3 p-3 border-y border-border bg-background transition-colors hover:border-accent/40 hover:bg-surface/55">
                          <span className="text-lg font-black leading-none w-5 shrink-0 mt-0.5 tabular-nums"
                            style={{ color: `color-mix(in srgb, var(--accent) ${Math.max(25, 75 - i * 13)}%, var(--color-muted))` }}>
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-accent transition-colors mb-1.5">{p.title}</p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {cfg && <span className="px-1.5 py-0.5 text-[9px] font-semibold" style={{ color: cfg.color, backgroundColor: cfg.bg }}>{p.category?.name}</span>}
                              <span className="text-[10px] text-muted flex items-center gap-0.5"><Eye size={9} />{p.viewCount}</span>
                              <span className="text-[10px] text-muted flex items-center gap-0.5"><Clock size={9} />{p.readingTimeMin}min</span>
                            </div>
                          </div>
                          <div className="relative w-11 h-11 overflow-hidden shrink-0 bg-muted/20">
                            <BlogImage src={p.coverImageUrl} alt={p.title} fill priority aspectRatio="thumb" className="object-cover" />
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              <LojaRelacionados tags={normalizedPopularTags.slice(0, 5).map(t => t.tag)} compact />
            </aside>
          </div>
        </div>


        <ScrollToTop />
      </PageTransition>
    </>
  )
}
