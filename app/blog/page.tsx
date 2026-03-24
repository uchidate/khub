export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { PageTransition } from '@/components/features/PageTransition'
import { ScrollToTop } from '@/components/ui/ScrollToTop'
import { JsonLd } from '@/components/seo/JsonLd'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { BookOpen, Clock, Eye } from 'lucide-react'
import { BLOG_AUTHOR_DISPLAY_NAME, BLOG_AUTHOR_AVATAR_INITIAL } from '@/lib/config/blog'
import { PHASE_PRODUCTION_BUILD } from 'next/constants'
import prisma from '@/lib/prisma'

import { SITE_URL } from '@/lib/constants/site'
const BASE_URL = SITE_URL

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Artigos, análises e reflexões sobre o universo Hallyu.',
  alternates: { canonical: `${BASE_URL}/blog` },
  openGraph: {
    title: 'Blog | HallyuHub',
    description: 'Artigos, análises e reflexões sobre o universo Hallyu.',
    url: `${BASE_URL}/blog`,
  },
}

const PUBLIC_WHERE = { status: 'PUBLISHED' as const, isPrivate: false }

async function getPosts() {
  const [featured, recent, categories] = await Promise.all([
    prisma.blogPost.findMany({
      where: { ...PUBLIC_WHERE, featured: true },
      orderBy: { publishedAt: 'desc' },
      take: 3,
      include: { category: true },
    }),
    prisma.blogPost.findMany({
      where: PUBLIC_WHERE,
      orderBy: { publishedAt: 'desc' },
      take: 12,
      include: { category: true },
    }),
    prisma.blogCategory.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { posts: { where: PUBLIC_WHERE } } } },
    }),
  ])
  return { featured, recent, categories }
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

type PostWithRelations = Awaited<ReturnType<typeof getPosts>>['recent'][0]

function PostCard({ post, featured = false }: { post: PostWithRelations; featured?: boolean }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`group flex flex-col rounded-xl overflow-hidden border border-border bg-background hover:border-accent/30 hover:bg-surface transition-all ${featured ? 'lg:flex-row' : ''}`}
    >
      {post.coverImageUrl && (
        <div className={`relative overflow-hidden bg-surface ${featured ? 'lg:w-2/5 aspect-video lg:aspect-auto' : 'aspect-video'}`}>
          <Image
            src={post.coverImageUrl}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}
      <div className="flex flex-col gap-3 p-5 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          {post.category && (
            <span className="px-2 py-0.5 bg-accent/10 text-accent rounded text-xs font-semibold uppercase tracking-wider">
              {post.category.name}
            </span>
          )}
          {post.featured && (
            <span className="px-2 py-0.5 bg-[#f59e0b]/10 text-[#d97706] rounded text-xs font-semibold uppercase tracking-wider">
              Destaque
            </span>
          )}
        </div>
        <h2 className={`font-bold text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-snug ${featured ? 'text-xl' : 'text-base'}`}>
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-sm text-muted line-clamp-2 flex-1 leading-relaxed">{post.excerpt}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-muted mt-auto pt-2 border-t border-border">
          <div className="w-5 h-5 rounded-full bg-[#ff2d78]/10 flex items-center justify-center text-[9px] font-bold text-accent flex-shrink-0">
            {BLOG_AUTHOR_AVATAR_INITIAL}
          </div>
          <span className="truncate">{BLOG_AUTHOR_DISPLAY_NAME}</span>
          <span className="flex-shrink-0">·</span>
          <span className="flex-shrink-0">{formatDate(post.publishedAt ?? post.createdAt)}</span>
          <span className="flex-shrink-0">·</span>
          <span className="flex items-center gap-1 flex-shrink-0"><Clock size={11} />{post.readingTimeMin} min</span>
          <span className="flex items-center gap-1 ml-auto flex-shrink-0"><Eye size={11} />{post.viewCount}</span>
        </div>
      </div>
    </Link>
  )
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
    return null
  }
  const { category: activeCategory } = await searchParams
  const { featured, recent, categories } = await getPosts()
  const total = await prisma.blogPost.count({ where: { ...PUBLIC_WHERE } }).catch(() => null)

  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'Blog | HallyuHub',
        url: `${BASE_URL}/blog`,
        inLanguage: 'pt-BR',
      }} />
      <PageTransition className="py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">

          {/* Header */}
          <SectionHeader
            title="Blog"
            count={total}
            countLabel="artigos"
            backHref="/"
          />

          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap mb-8">
              <Link
                href="/blog"
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  !activeCategory ? 'bg-accent text-white' : 'bg-surface text-muted hover:bg-surface-hover hover:text-foreground'
                }`}
              >
                Todas
              </Link>
              {categories.filter(c => c._count.posts > 0).map(c => (
                <Link
                  key={c.id}
                  href={`/blog?category=${c.slug}`}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    activeCategory === c.slug ? 'bg-accent text-white' : 'bg-surface text-muted hover:bg-surface-hover hover:text-foreground'
                  }`}
                >
                  {c.name}
                  <span className="ml-1.5 opacity-50">{c._count.posts}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Featured posts */}
          {featured.length > 0 && (
            <section className="mb-10">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
                <BookOpen size={16} className="text-accent" /> Em destaque
              </h2>
              <div className="grid gap-4">
                {featured.map(p => <PostCard key={p.id} post={p} featured />)}
              </div>
            </section>
          )}

          {/* Recent posts */}
          {recent.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-foreground mb-4">Publicações recentes</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recent.map(p => <PostCard key={p.id} post={p} />)}
              </div>
            </section>
          )}

          {recent.length === 0 && (
            <div className="text-center py-20 text-muted">
              <BookOpen size={40} className="mx-auto mb-4 opacity-30" />
              <p>Nenhum artigo publicado ainda.</p>
            </div>
          )}

          <ScrollToTop />
        </div>
      </PageTransition>
    </>
  )
}
