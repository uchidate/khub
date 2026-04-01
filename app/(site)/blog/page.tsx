export const revalidate = 300 // revalida a cada 5 minutos

import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { PageTransition } from '@/components/features/PageTransition'
import { ScrollToTop } from '@/components/ui/ScrollToTop'
import { JsonLd } from '@/components/seo/JsonLd'
import { Clock, Eye, TrendingUp, Tag } from 'lucide-react'
import { BLOG_AUTHOR_DISPLAY_NAME, BLOG_AUTHOR_AVATAR_INITIAL } from '@/lib/config/blog'
import { getTagStyle } from '@/lib/utils/tag-colors'
import prisma from '@/lib/prisma'

import { SITE_URL } from '@/lib/constants/site'
import { BLOG_CATEGORY_BY_SLUG } from '@/lib/config/categories'
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

const EMPTY_POSTS = { hero: null, posts: [], mostRead: [], categories: [], popularTags: [] }

async function getPosts(category?: string, tag?: string) {
  // Durante next build não há DB disponível
  if (process.env.SKIP_BUILD_STATIC_GENERATION) return EMPTY_POSTS

  try {
    const where = {
      ...PUBLIC_WHERE,
      ...(category ? { category: { slug: category } } : {}),
      ...(tag ? { tags: { has: tag } } : {}),
    }
    const [hero, posts, mostRead, categories, popularTags] = await Promise.all([
      prisma.blogPost.findFirst({
        where: PUBLIC_WHERE,
        orderBy: { publishedAt: 'desc' },
        include: { category: true },
      }),
      prisma.blogPost.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        take: 18,
        include: { category: true },
      }),
      !category && !tag ? prisma.blogPost.findMany({
        where: PUBLIC_WHERE,
        orderBy: { viewCount: 'desc' },
        take: 5,
        select: { slug: true, title: true, readingTimeMin: true, viewCount: true, coverImageUrl: true, publishedAt: true, category: true },
      }) : Promise.resolve([]),
      prisma.blogCategory.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { posts: { where: PUBLIC_WHERE } } } },
      }),
      prisma.$queryRaw<{ tag: string; count: bigint }[]>`
        SELECT unnest(tags) as tag, count(*) as count
        FROM "BlogPost"
        WHERE status = 'PUBLISHED' AND "isPrivate" = false
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 12
      `,
    ])
    return { hero, posts, mostRead, categories, popularTags }
  } catch { return EMPTY_POSTS }
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
}

type PostWithCategory = Awaited<ReturnType<typeof getPosts>>['posts'][0]

function PostCard({ post }: { post: PostWithCategory }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden border border-border bg-surface hover:border-accent/30 hover:shadow-lg transition-all duration-300"
    >
      <div className="relative aspect-video overflow-hidden bg-surface-hover">
        {post.coverImageUrl ? (
          <Image
            src={post.coverImageUrl}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl opacity-10">✦</span>
          </div>
        )}
        {post.category && (() => {
          const config = BLOG_CATEGORY_BY_SLUG[post.category.slug]
          return (
            <span
              className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow"
              style={{ backgroundColor: config?.bg ?? '#f3f4f6', color: config?.color ?? '#374151' }}
            >
              {post.category.name}
            </span>
          )
        })()}
      </div>
      <div className="flex flex-col gap-2 p-4 flex-1">
        <h2 className="font-bold text-foreground text-sm leading-snug line-clamp-2 group-hover:text-accent transition-colors">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-xs text-muted line-clamp-2 leading-relaxed flex-1">{post.excerpt}</p>
        )}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {post.tags.slice(0, 2).map(tag => {
              const ts = getTagStyle(tag)
              return (
                <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ color: ts.color, backgroundColor: ts.bg }}>
                  {tag}
                </span>
              )
            })}
          </div>
        )}
        <div className="flex items-center gap-2 text-[11px] text-muted mt-auto pt-3 border-t border-border">
          <div className="w-4 h-4 rounded-full bg-accent/10 flex items-center justify-center text-[8px] font-bold text-accent flex-shrink-0">
            {BLOG_AUTHOR_AVATAR_INITIAL}
          </div>
          <span className="truncate">{BLOG_AUTHOR_DISPLAY_NAME}</span>
          <span className="ml-auto flex items-center gap-2 flex-shrink-0">
            <span className="flex items-center gap-1"><Clock size={10} />{post.readingTimeMin} min</span>
            <span className="flex items-center gap-1"><Eye size={10} />{post.viewCount}</span>
          </span>
        </div>
      </div>
    </Link>
  )
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ category?: string; tag?: string }> }) {

  const { category: activeCategory, tag: activeTag } = await searchParams
  const { hero, posts, mostRead, categories, popularTags } = await getPosts(activeCategory, activeTag)
  const total = await prisma.blogPost.count({ where: PUBLIC_WHERE }).catch(() => null)
  const isFiltered = !!activeCategory || !!activeTag

  // Não duplicar o post que aparece no hero/banner
  const heroId = isFiltered ? posts[0]?.id : hero?.id
  const gridPosts = posts.filter(p => p.id !== heroId)

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

        {/* Topo — hero sem filtro, banner de categoria com filtro */}
        <div className="w-full border-b border-border mb-10">
          {(() => {
            const activeCat = activeCategory ? BLOG_CATEGORY_BY_SLUG[activeCategory] : null
            const featPost = activeCat ? posts[0] : activeTag ? posts[0] : hero
            const coverImage = featPost?.coverImageUrl ?? null
            const badge = activeCat ? activeCat.name : activeTag ? `#${activeTag}` : featPost?.category?.name
            const badgeColor = activeCat?.color ?? (featPost?.category ? BLOG_CATEGORY_BY_SLUG[featPost.category.slug]?.color : undefined) ?? '#ec4899'

            return (
              <Link
                href={featPost ? `/blog/${featPost.slug}` : '/blog'}
                className="group block relative w-full h-[340px] md:h-[480px] overflow-hidden"
              >
                {coverImage ? (
                  <Image
                    src={coverImage}
                    alt={featPost?.title ?? ''}
                    fill
                    sizes="100vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    priority
                  />
                ) : (
                  <div className="w-full h-full" style={{ background: activeCat ? `linear-gradient(135deg, ${activeCat.bg}, ${activeCat.color}44)` : '#f3f4f6' }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 max-w-4xl">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {badge && (
                      <span
                        className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                        style={{ backgroundColor: badgeColor, color: '#fff' }}
                      >
                        {badge}
                      </span>
                    )}
                    {!activeCat && !activeTag && featPost?.featured && (
                      <span className="px-2.5 py-1 bg-yellow-500/90 text-black rounded-full text-[11px] font-bold uppercase tracking-wider">
                        Destaque
                      </span>
                    )}
                    {featPost && (
                      <span className="text-white/60 text-xs">
                        {formatDate(featPost.publishedAt ?? featPost.createdAt)}
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl md:text-4xl font-black text-white leading-tight line-clamp-2 group-hover:text-accent transition-colors mb-2">
                    {featPost?.title ?? (activeCat ? `Artigos de ${activeCat.name}` : 'Blog')}
                  </h1>
                  {featPost?.excerpt && (
                    <p className="text-white/70 text-sm md:text-base line-clamp-2 leading-relaxed hidden sm:block">
                      {featPost.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-white/60 text-xs">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-[9px] font-bold text-white/80">
                      {BLOG_AUTHOR_AVATAR_INITIAL}
                    </div>
                    <span>{BLOG_AUTHOR_DISPLAY_NAME}</span>
                    {featPost && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Clock size={11} />{featPost.readingTimeMin} min</span>
                        <span className="flex items-center gap-1"><Eye size={11} />{featPost.viewCount} views</span>
                      </>
                    )}
                    {(activeCat || activeTag) && (
                      <span className="ml-auto text-white/40">
                        {posts.length} {posts.length === 1 ? 'artigo' : 'artigos'}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })()}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">

          {/* Filter bar */}
          <div className="mb-8 space-y-3">
            {/* Categories */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href="/blog"
                scroll={false}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${!isFiltered ? 'bg-accent text-white' : 'bg-surface text-muted hover:bg-surface-hover hover:text-foreground'}`}
              >
                Todos {total ? <span className="opacity-70">({total})</span> : null}
              </Link>
              {categories.filter(c => c._count.posts > 0).map(c => {
                const isActive = activeCategory === c.slug
                const config = BLOG_CATEGORY_BY_SLUG[c.slug]
                return (
                  <Link
                    key={c.id}
                    href={`/blog?category=${c.slug}`}
                    scroll={false}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                    style={isActive
                      ? { backgroundColor: config?.bg ?? '#f3f4f6', color: config?.color ?? '#374151', outline: `1.5px solid ${config?.color ?? '#374151'}33` }
                      : undefined
                    }
                  >
                    {config && (
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: config.color }} />
                    )}
                    <span className={isActive ? '' : 'text-muted'}>{c.name}</span>
                    <span className="opacity-40 text-[10px]">{c._count.posts}</span>
                  </Link>
                )
              })}
            </div>
            {/* Tags */}
            {popularTags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Tag size={11} className="text-muted shrink-0" />
                {popularTags.map(({ tag }) => {
                  const ts = getTagStyle(tag)
                  return (
                    <Link
                      key={tag}
                      href={activeTag === tag ? '/blog' : `/blog?tag=${encodeURIComponent(tag)}`}
                      scroll={false}
                      className="px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all hover:brightness-90"
                      style={{
                        color: ts.color,
                        backgroundColor: activeTag === tag ? ts.color : ts.bg,
                        ...(activeTag === tag ? { color: '#fff' } : {}),
                      }}
                    >
                      {tag}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Limpar filtro de tag (categoria já tem banner próprio) */}
          {activeTag && (
            <div className="flex items-center gap-2 mb-6">
              <p className="text-sm text-muted">{posts.length} {posts.length === 1 ? 'artigo' : 'artigos'} com a tag &ldquo;{activeTag}&rdquo;</p>
              <Link href="/blog" className="text-xs text-accent hover:underline">Limpar filtro</Link>
            </div>
          )}

          {/* Main content */}
          <div className={`${!isFiltered && mostRead.length > 0 ? 'grid lg:grid-cols-[1fr_300px] gap-10' : ''}`}>

            {/* Posts grid */}
            <div>
              {!isFiltered && (
                <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-4">Publicações recentes</h2>
              )}
              {gridPosts.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {gridPosts.map(p => <PostCard key={p.id} post={p} />)}
                </div>
              ) : (
                <div className="text-center py-20 text-muted">
                  <p className="text-sm">Nenhum artigo encontrado.</p>
                </div>
              )}
            </div>

            {/* Sidebar: most read */}
            {!isFiltered && mostRead.length > 0 && (
              <aside className="space-y-4">
                <h2 className="text-sm font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp size={13} className="text-accent" /> Mais lidos
                </h2>
                <div className="space-y-3">
                  {mostRead.map((p, i) => (
                    <Link
                      key={p.slug}
                      href={`/blog/${p.slug}`}
                      className="group flex items-start gap-3 p-3 rounded-xl border border-border bg-surface hover:border-accent/30 hover:bg-surface-hover transition-all"
                    >
                      <span className="text-2xl font-black text-accent/20 leading-none w-6 shrink-0 group-hover:text-accent/40 transition-colors">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                          {p.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted">
                          <span className="flex items-center gap-1"><Eye size={9} />{p.viewCount}</span>
                          <span className="flex items-center gap-1"><Clock size={9} />{p.readingTimeMin} min</span>
                        </div>
                      </div>
                      {p.coverImageUrl && (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                          <Image src={p.coverImageUrl} alt={p.title} fill sizes="48px" className="object-cover" />
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </aside>
            )}
          </div>
        </div>

        <ScrollToTop />
      </PageTransition>
    </>
  )
}
