import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { PageTransition } from '@/components/features/PageTransition'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { ScrollToTop } from '@/components/ui/ScrollToTop'
import { JsonLd } from '@/components/seo/JsonLd'
import { BookOpen, Clock, Eye } from 'lucide-react'
import prisma from '@/lib/prisma'

const BASE_URL = 'https://www.hallyuhub.com.br'

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

async function getPosts() {
  const [featured, recent, categories] = await Promise.all([
    prisma.blogPost.findMany({
      where: { status: 'PUBLISHED', featured: true },
      orderBy: { publishedAt: 'desc' },
      take: 3,
      include: { author: { select: { name: true, image: true } }, category: true },
    }),
    prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 12,
      include: { author: { select: { name: true, image: true } }, category: true },
    }),
    prisma.blogCategory.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { posts: { where: { status: 'PUBLISHED' } } } } },
    }),
  ])
  return { featured, recent, categories }
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

type PostWithRelations = Awaited<ReturnType<typeof getPosts>>['recent'][0]

function PostCard({ post, featured = false }: { post: PostWithRelations, featured?: boolean }) {
  return (
    <Link href={`/blog/${post.slug}`} className={`group flex flex-col rounded-2xl overflow-hidden border border-white/5 bg-zinc-900/50 hover:bg-zinc-900 hover:border-white/10 transition-all ${featured ? 'lg:flex-row' : ''}`}>
      {post.coverImageUrl && (
        <div className={`relative overflow-hidden ${featured ? 'lg:w-1/2 aspect-video lg:aspect-auto' : 'aspect-video'}`}>
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
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs font-semibold uppercase tracking-wider">
              {post.category.name}
            </span>
          )}
          {post.featured && (
            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs font-semibold uppercase tracking-wider">
              Destaque
            </span>
          )}
        </div>
        <h2 className={`font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2 ${featured ? 'text-xl' : 'text-base'}`}>
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-zinc-400 text-sm line-clamp-2 flex-1">{post.excerpt}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-zinc-500 mt-auto pt-2 border-t border-white/5">
          {post.author?.image ? (
            <Image src={post.author.image} alt={post.author.name ?? ''} width={20} height={20} className="rounded-full object-cover" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center text-[9px] font-bold text-purple-300">
              {post.author?.name?.[0] ?? '?'}
            </div>
          )}
          <span>{post.author?.name}</span>
          <span>·</span>
          <span>{formatDate(post.publishedAt ?? post.createdAt)}</span>
          <span>·</span>
          <span className="flex items-center gap-1"><Clock size={11} />{post.readingTimeMin} min</span>
          <span className="flex items-center gap-1 ml-auto"><Eye size={11} />{post.viewCount}</span>
        </div>
      </div>
    </Link>
  )
}

export default async function BlogPage() {
  const { featured, recent, categories } = await getPosts()

  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'Blog | HallyuHub',
        url: `${BASE_URL}/blog`,
        inLanguage: 'pt-BR',
      }} />
      <PageTransition className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
        <SectionHeader
          title="Blog"
          subtitle="Artigos, análises e reflexões sobre o universo Hallyu."
        />

        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10">
            {categories.filter(c => c._count.posts > 0).map(c => (
              <Link
                key={c.id}
                href={`/blog?category=${c.slug}`}
                className="px-3 py-1.5 rounded-full border border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:text-white hover:border-zinc-600 text-sm transition-colors"
              >
                {c.name}
                <span className="ml-1.5 text-zinc-600">{c._count.posts}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Featured posts */}
        {featured.length > 0 && (
          <section className="mb-12 space-y-4">
            <h2 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
              <BookOpen size={18} className="text-purple-400" /> Em destaque
            </h2>
            <div className="grid gap-4">
              {featured.map(p => <PostCard key={p.id} post={p} featured />)}
            </div>
          </section>
        )}

        {/* Recent posts */}
        {recent.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-zinc-200">Publicações recentes</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map(p => <PostCard key={p.id} post={p} />)}
            </div>
          </section>
        )}

        {recent.length === 0 && (
          <div className="text-center py-20 text-zinc-500">
            <BookOpen size={40} className="mx-auto mb-4 opacity-30" />
            <p>Nenhum artigo publicado ainda.</p>
          </div>
        )}

        <ScrollToTop />
      </PageTransition>
    </>
  )
}
