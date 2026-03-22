import Link from 'next/link'
import Image from 'next/image'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { PageTransition } from '@/components/features/PageTransition'
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer'
import { BlogBlockRenderer } from '@/components/ui/BlogBlockRenderer'
import type { BlogBlock } from '@/lib/types/blocks'
import { Clock, Eye, ArrowLeft, Tag, Calendar, Lock, Pencil } from 'lucide-react'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function getPost(slug: string) {
  return prisma.blogPost.findFirst({
    where: { slug, status: 'PUBLISHED' },
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

  return (
    <PageTransition className="pt-24 md:pt-32 pb-20 px-4 sm:px-6">
      {/* Preview banner */}
      <div className="max-w-3xl mx-auto mb-6">
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-center gap-2 text-sm text-purple-300">
            <Lock size={14} />
            <span className="font-semibold">Prévia privada</span>
            <span className="text-purple-400/60">— este post não está visível no blog público</span>
          </div>
          <Link
            href={`/write?edit=${post.id}`}
            className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-white transition-colors"
          >
            <Pencil size={12} />
            Editar
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <Link href="/admin/blog" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-8">
          <ArrowLeft size={14} />
          Voltar ao painel
        </Link>

        {/* Header */}
        <header className="mb-8 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {post.category && (
              <span className="px-2.5 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-semibold uppercase tracking-wider">
                {post.category.name}
              </span>
            )}
            {post.featured && (
              <span className="px-2.5 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-semibold uppercase tracking-wider">
                Destaque
              </span>
            )}
            <span className="px-2.5 py-1 bg-purple-900/40 text-purple-300 rounded text-xs font-semibold border border-purple-500/20">
              🔒 Privado
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">{post.title}</h1>

          {post.excerpt && (
            <p className="text-xl text-zinc-400 leading-relaxed">{post.excerpt}</p>
          )}

          <div className="flex items-center gap-4 flex-wrap text-sm text-zinc-500 pt-2 border-t border-white/5">
            <div className="flex items-center gap-2">
              {post.author?.image ? (
                <Image src={post.author.image} alt={post.author.name ?? ''} width={28} height={28} className="rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-300">
                  {post.author?.name?.[0] ?? '?'}
                </div>
              )}
              <span className="font-medium text-zinc-300">{post.author?.name}</span>
            </div>
            <span className="flex items-center gap-1.5"><Calendar size={13} />{formatDate(post.publishedAt ?? post.createdAt)}</span>
            <span className="flex items-center gap-1.5"><Clock size={13} />{post.readingTimeMin} min de leitura</span>
            <span className="flex items-center gap-1.5 ml-auto"><Eye size={13} />{post.viewCount} views</span>
          </div>
        </header>

        {post.coverImageUrl && (
          <div className="relative aspect-video rounded-2xl overflow-hidden mb-10 border border-white/5">
            <Image src={post.coverImageUrl} alt={post.title} fill className="object-cover" priority />
          </div>
        )}

        <article>
          {Array.isArray((post as unknown as { blocks: unknown }).blocks) && ((post as unknown as { blocks: BlogBlock[] }).blocks).length > 0
            ? <BlogBlockRenderer blocks={(post as unknown as { blocks: BlogBlock[] }).blocks} />
            : <MarkdownRenderer content={post.contentMd} />
          }
        </article>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-white/5">
            <Tag size={14} className="text-zinc-600 mt-0.5 shrink-0" />
            {post.tags.map(tag => (
              <span key={tag} className="px-2.5 py-1 rounded-full border border-zinc-700 bg-zinc-800/50 text-zinc-400 text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}

        {post.author?.bio && (
          <div className="mt-10 p-5 rounded-2xl border border-white/5 bg-zinc-900/50 flex gap-4">
            {post.author.image ? (
              <Image src={post.author.image} alt={post.author.name ?? ''} width={48} height={48} className="rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-purple-500/30 flex items-center justify-center text-sm font-bold text-purple-300 shrink-0">
                {post.author.name?.[0] ?? '?'}
              </div>
            )}
            <div>
              <p className="font-semibold text-white text-sm">{post.author.name}</p>
              <p className="text-zinc-400 text-sm mt-1">{post.author.bio}</p>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
