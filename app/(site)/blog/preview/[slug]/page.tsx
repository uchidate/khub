import Link from 'next/link'
import Image from 'next/image'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    robots: { index: false, follow: false },
}
import { PageTransition } from '@/components/features/PageTransition'
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer'
import { BlogBlockRenderer, type ResolvedEntities } from '@/components/ui/BlogBlockRenderer'
import type { BlogBlock } from '@/lib/types/blocks'
import { Clock, Eye, ArrowLeft, Tag, Calendar, Lock, Pencil } from 'lucide-react'
import prisma from '@/lib/prisma'
import { BLOG_AUTHOR_DISPLAY_NAME, BLOG_AUTHOR_AVATAR_INITIAL } from '@/lib/config/blog'

export const dynamic = 'force-dynamic'

async function getPost(slug: string) {
  return prisma.blogPost.findFirst({
    where: { slug, status: { in: ['PUBLISHED', 'DRAFT'] } },
    include: {
      author: { select: { id: true, name: true, image: true, bio: true } },
      category: true,
    },
  })
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function BlogPreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')

  const role = (session.user as { role?: string }).role?.toLowerCase()
  if (role !== 'admin' && role !== 'editor') notFound()

  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const blocks = Array.isArray((post as unknown as { blocks: unknown }).blocks)
    ? (post as unknown as { blocks: BlogBlock[] }).blocks
    : []
  const artistIds = Array.from(new Set(blocks.filter(b => b.type === 'blog_artist_card' && (b as { artistId?: string }).artistId).map(b => (b as { artistId: string }).artistId)))
  const productionIds = Array.from(new Set(blocks.filter(b => b.type === 'blog_production_card' && (b as { productionId?: string }).productionId).map(b => (b as { productionId: string }).productionId)))
  const groupIds = Array.from(new Set(blocks.filter(b => b.type === 'blog_group_card' && (b as { groupId?: string }).groupId).map(b => (b as { groupId: string }).groupId)))
  const [artists, productions, groups] = await Promise.all([
    artistIds.length > 0
      ? prisma.artist.findMany({ where: { id: { in: artistIds } }, select: { id: true, nameRomanized: true, roles: true, primaryImageUrl: true } })
      : [],
    productionIds.length > 0
      ? prisma.production.findMany({ where: { id: { in: productionIds } }, select: { id: true, titlePt: true, type: true, year: true, imageUrl: true } })
      : [],
    groupIds.length > 0
      ? prisma.musicalGroup.findMany({ where: { id: { in: groupIds } }, select: { id: true, name: true, profileImageUrl: true, fanClubName: true } })
      : [],
  ])
  const resolvedEntities: ResolvedEntities = {
    artists: Object.fromEntries(artists.map(a => [a.id, a])),
    productions: Object.fromEntries(productions.map(p => [p.id, p])),
    groups: Object.fromEntries(groups.map(g => [g.id, g])),
  }

  return (
    <PageTransition className="py-8 md:py-12 px-4 sm:px-6">
      {/* Preview banner */}
      <div className="max-w-3xl mx-auto mb-6">
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#ff2d78]/10 border border-[#ff2d78]/20">
          <div className="flex items-center gap-2 text-sm text-[#ff2d78]">
            <Lock size={14} />
            <span className="font-semibold">Prévia privada</span>
            <span className="text-[#ff2d78]/60">— este post não está visível no blog público</span>
          </div>
          <Link
            href={`/write?edit=${post.id}`}
            className="flex items-center gap-1.5 text-xs text-[#ff2d78] hover:text-white transition-colors"
          >
            <Pencil size={12} />
            Editar
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <Link href="/admin/blog" className="inline-flex items-center gap-2 text-sm text-muted hover:text-white transition-colors mb-8">
          <ArrowLeft size={14} />
          Voltar ao painel
        </Link>

        {/* Header */}
        <header className="mb-8 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {post.category && (
              <span className="px-2.5 py-1 bg-[#ff2d78]/20 text-[#ff2d78] rounded text-xs font-semibold uppercase tracking-wider">
                {post.category.name}
              </span>
            )}
            {post.featured && (
              <span className="px-2.5 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-semibold uppercase tracking-wider">
                Destaque
              </span>
            )}
            <span className="px-2.5 py-1 bg-[#ff2d78]/40 text-[#ff2d78] rounded text-xs font-semibold border border-[#ff2d78]/20">
              🔒 Privado
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">{post.title}</h1>

          {post.excerpt && (
            <p className="text-xl text-[#999] leading-relaxed">{post.excerpt}</p>
          )}

          <div className="flex items-center gap-4 flex-wrap text-sm text-muted pt-2 border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#ff2d78]/30 flex items-center justify-center text-xs font-bold text-[#ff2d78]">
                {BLOG_AUTHOR_AVATAR_INITIAL}
              </div>
              <span className="font-medium text-[#e8e8e8]">{BLOG_AUTHOR_DISPLAY_NAME}</span>
            </div>
            <span className="flex items-center gap-1.5"><Calendar size={13} />{formatDate(post.publishedAt ?? post.createdAt)}</span>
            <span className="flex items-center gap-1.5"><Clock size={13} />{post.readingTimeMin} min de leitura</span>
            <span className="flex items-center gap-1.5 ml-auto"><Eye size={13} />{post.viewCount} views</span>
          </div>
        </header>

        {post.coverImageUrl && (
          <div className="relative aspect-video rounded-2xl overflow-hidden mb-10 border border-white/5">
            <Image src={post.coverImageUrl} alt={post.title} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" priority />
          </div>
        )}

        <article>
          {Array.isArray((post as unknown as { blocks: unknown }).blocks) && ((post as unknown as { blocks: BlogBlock[] }).blocks).length > 0
            ? <BlogBlockRenderer blocks={(post as unknown as { blocks: BlogBlock[] }).blocks} resolvedEntities={resolvedEntities} />
            : <MarkdownRenderer content={post.contentMd} />
          }
        </article>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-white/5">
            <Tag size={14} className="text-[#444] mt-0.5 shrink-0" />
            {post.tags.map(tag => (
              <span key={tag} className="px-2.5 py-1 rounded-full border border-[#2a2a2a] bg-[#1a1a1a]/50 text-[#999] text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}

        {post.author?.bio && (
          <div className="mt-10 p-5 rounded-2xl border border-white/5 bg-[#080808]/50 flex gap-4">
            <div className="w-12 h-12 rounded-full bg-[#ff2d78]/30 flex items-center justify-center text-sm font-bold text-[#ff2d78] shrink-0">
              {BLOG_AUTHOR_AVATAR_INITIAL}
            </div>
            <div>
              <p className="font-semibold text-white text-sm">{BLOG_AUTHOR_DISPLAY_NAME}</p>
              <p className="text-[#999] text-sm mt-1">{post.author.bio}</p>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
