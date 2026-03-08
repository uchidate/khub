'use client'

import { useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable, Column, refetchTable } from '@/components/admin/DataTable'
import { CheckCircle, Eye, Archive, BookOpen } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface Author {
  id: string
  name: string | null
  image: string | null
}

interface Category {
  name: string
  slug: string
}

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  coverImageUrl: string | null
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED'
  featured: boolean
  viewCount: number
  readingTimeMin: number
  tags: string[]
  publishedAt: string | null
  createdAt: string
  author: Author
  category: Category | null
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT:          { label: 'Rascunho',         color: 'bg-zinc-700 text-zinc-400' },
  PENDING_REVIEW: { label: 'Em revisão',        color: 'bg-yellow-500/20 text-yellow-400' },
  PUBLISHED:      { label: 'Publicado',         color: 'bg-green-500/20 text-green-400' },
  ARCHIVED:       { label: 'Arquivado',         color: 'bg-red-500/20 text-red-400' },
}

function PublishButton({ post, onDone }: { post: BlogPost; onDone: () => void }) {
  const [loading, setLoading] = useState(false)

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setLoading(true)
    const publish = post.status !== 'PUBLISHED'
    await fetch(`/api/blog/posts/${post.id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publish }),
    })
    setLoading(false)
    onDone()
  }

  if (post.status === 'DRAFT' || post.status === 'ARCHIVED') return null

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={post.status === 'PUBLISHED' ? 'Despublicar' : 'Publicar'}
      className={`p-1.5 rounded transition-colors disabled:cursor-wait ${
        post.status === 'PUBLISHED'
          ? 'text-green-400 hover:text-red-400 hover:bg-red-400/10'
          : 'text-yellow-400 hover:text-green-400 hover:bg-green-400/10'
      }`}
    >
      {post.status === 'PUBLISHED' ? <Archive size={14} /> : <CheckCircle size={14} />}
    </button>
  )
}

export default function AdminBlogPage() {
  const columns: Column<BlogPost>[] = [
    {
      key: 'coverImageUrl',
      label: 'Img',
      render: (post) =>
        post.coverImageUrl ? (
          <Image src={post.coverImageUrl} alt={post.title} width={60} height={40} className="rounded-lg object-cover" />
        ) : (
          <div className="w-[60px] h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
            <BookOpen size={16} className="text-zinc-600" />
          </div>
        ),
    },
    {
      key: 'title',
      label: 'Título',
      sortable: true,
      render: (post) => (
        <div className="max-w-xs">
          <p className="font-medium text-white truncate">{post.title}</p>
          <p className="text-xs text-zinc-500 truncate">{post.author.name} · {post.category?.name ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (post) => {
        const s = STATUS_LABELS[post.status]
        return <span className={`px-2 py-0.5 rounded text-xs font-bold ${s.color}`}>{s.label}</span>
      },
    },
    {
      key: 'viewCount',
      label: 'Views',
      sortable: true,
      render: (post) => <span className="text-sm text-zinc-400 flex items-center gap-1"><Eye size={11} />{post.viewCount}</span>,
    },
    {
      key: 'publishedAt',
      label: 'Data',
      sortable: true,
      render: (post) => (
        <span className="text-sm text-zinc-400">
          {post.publishedAt
            ? new Date(post.publishedAt).toLocaleDateString('pt-BR')
            : new Date(post.createdAt).toLocaleDateString('pt-BR')}
        </span>
      ),
    },
  ]

  return (
    <AdminLayout title="Blog">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-zinc-400">Gerencie artigos do blog</p>
          <Link
            href="/write"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all text-sm"
          >
            <BookOpen size={16} />
            Novo Artigo
          </Link>
        </div>

        <DataTable<BlogPost>
          columns={columns}
          apiUrl="/api/admin/blog"
          searchPlaceholder="Buscar por título..."
          actions={(post) => (
            <div className="flex items-center gap-1">
              <Link
                href={`/write?edit=${post.id}`}
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded text-zinc-400 hover:text-blue-300 hover:bg-blue-400/10 transition-colors"
                title="Editar"
              >
                <BookOpen size={14} />
              </Link>
              <PublishButton post={post} onDone={refetchTable} />
              {post.status === 'PUBLISHED' && (
                <Link
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded text-zinc-400 hover:text-green-300 hover:bg-green-400/10 transition-colors"
                  title="Ver publicado"
                >
                  <Eye size={14} />
                </Link>
              )}
            </div>
          )}
        />
      </div>
    </AdminLayout>
  )
}
