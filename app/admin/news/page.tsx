'use client'

import { useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable, Column, refetchTable } from '@/components/admin/DataTable'
import { FormModal, FormField } from '@/components/admin/FormModal'
import { DeleteConfirm } from '@/components/admin/DeleteConfirm'
import { Plus, FlaskConical, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface News {
  id: string
  title: string
  contentMd: string
  sourceUrl: string
  imageUrl: string | null
  publishedAt: Date
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

const columns: Column<News>[] = [
  {
    key: 'imageUrl',
    label: 'Imagem',
    render: (news) =>
      news.imageUrl ? (
        <Image
          src={news.imageUrl}
          alt={news.title}
          width={60}
          height={40}
          className="rounded-lg object-cover"
        />
      ) : (
        <div className="w-15 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-xs text-zinc-500">
          N/A
        </div>
      ),
  },
  {
    key: 'title',
    label: 'Título',
    sortable: true,
    render: (news) => (
      <div className="max-w-xs">
        <p className="font-medium text-white truncate">{news.title}</p>
        <p className="text-xs text-zinc-500 truncate">{news.sourceUrl}</p>
      </div>
    ),
  },
  {
    key: 'publishedAt',
    label: 'Publicado em',
    sortable: true,
    render: (news) => (
      <span className="text-sm text-zinc-400">
        {new Date(news.publishedAt).toLocaleDateString('pt-BR')}
      </span>
    ),
  },
  {
    key: 'tags',
    label: 'Tags',
    render: (news) => (
      <div className="flex flex-wrap gap-1 max-w-xs">
        {news.tags.slice(0, 3).map((tag, index) => (
          <span key={index} className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
            {tag}
          </span>
        ))}
        {news.tags.length > 3 && (
          <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-xs">
            +{news.tags.length - 3}
          </span>
        )}
      </div>
    ),
  },
  {
    key: 'createdAt',
    label: 'Data de Criação',
    sortable: true,
    render: (news) => new Date(news.createdAt).toLocaleDateString('pt-BR'),
  },
]

const formFields: FormField[] = [
  { key: 'title', label: 'Título', type: 'text', placeholder: 'Título da notícia', required: true },
  { key: 'contentMd', label: 'Conteúdo (Markdown)', type: 'textarea', placeholder: 'Conteúdo em Markdown', required: true },
  { key: 'sourceUrl', label: 'URL da Fonte', type: 'text', placeholder: 'https://...', required: true },
  { key: 'imageUrl', label: 'URL da Imagem', type: 'text', placeholder: 'https://...' },
  { key: 'publishedAt', label: 'Data de Publicação', type: 'date' },
  { key: 'tags', label: 'Tags', type: 'tags', placeholder: 'Separar por vírgula (ex: k-drama, k-pop)' },
]

interface GenerateResult {
  success: boolean
  news?: { title: string; artistsCount: number; artists: { name: string }[] }
  error?: string
  duration?: number
}

export default function NewsAdminPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingNews, setEditingNews] = useState<News | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [generateResult, setGenerateResult] = useState<GenerateResult | null>(null)

  const handleCreate = () => {
    setEditingNews(null)
    setFormOpen(true)
  }

  const handleEdit = (news: News) => {
    setEditingNews(news)
    setFormOpen(true)
  }

  const handleDelete = (ids: string[]) => {
    setSelectedIds(ids)
    setDeleteOpen(true)
  }

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    // Convert publishedAt to ISO string if it's a date
    if (data.publishedAt && typeof data.publishedAt === 'string') {
      data.publishedAt = new Date(data.publishedAt).toISOString()
    }

    const url = editingNews ? `/api/admin/news?id=${editingNews.id}` : '/api/admin/news'
    const method = editingNews ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Erro ao salvar notícia')
    }

    refetchTable()
  }

  const handleGenerateOne = async () => {
    setGenerating(true)
    setGenerateResult(null)
    try {
      const res = await fetch('/api/admin/news/generate-one', { method: 'POST' })
      const data = await res.json()
      setGenerateResult(data)
      if (data.success) refetchTable()
    } catch {
      setGenerateResult({ success: false, error: 'Erro de rede' })
    } finally {
      setGenerating(false)
    }
  }

  const handleDeleteConfirm = async () => {
    const res = await fetch('/api/admin/news', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Erro ao deletar notícias')
    }

    refetchTable()
  }

  return (
    <AdminLayout title="Notícias">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-zinc-400">Gerencie notícias e artigos</p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateOne}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 border border-zinc-700 text-white font-bold rounded-lg hover:border-green-500 hover:text-green-400 transition-all disabled:opacity-50"
            >
              {generating ? <Loader2 size={18} className="animate-spin" /> : <FlaskConical size={18} />}
              {generating ? 'Gerando...' : 'Gerar 1 Notícia (Teste)'}
            </button>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all"
            >
              <Plus size={18} />
              Nova Notícia
            </button>
          </div>
        </div>

        {generateResult && (
          <div className={`flex items-start gap-3 p-4 rounded-xl border ${generateResult.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            {generateResult.success
              ? <CheckCircle size={20} className="text-green-400 mt-0.5 shrink-0" />
              : <XCircle size={20} className="text-red-400 mt-0.5 shrink-0" />
            }
            <div className="text-sm">
              {generateResult.success && generateResult.news ? (
                <>
                  <p className="font-bold text-white">{generateResult.news.title}</p>
                  <p className="text-zinc-400 mt-1">
                    {generateResult.news.artistsCount > 0
                      ? `Artistas: ${generateResult.news.artists.map(a => a.name).join(', ')}`
                      : 'Nenhum artista identificado'
                    }
                    {generateResult.duration && ` · ${(generateResult.duration / 1000).toFixed(1)}s`}
                  </p>
                </>
              ) : (
                <p className="text-red-400">{generateResult.error}</p>
              )}
            </div>
            <button onClick={() => setGenerateResult(null)} className="ml-auto text-zinc-500 hover:text-white">✕</button>
          </div>
        )}

        <DataTable<News>
          columns={columns}
          apiUrl="/api/admin/news"
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchPlaceholder="Buscar por título ou conteúdo..."
        />
      </div>

      <FormModal
        title={editingNews ? 'Editar Notícia' : 'Nova Notícia'}
        fields={formFields}
        initialData={
          editingNews
            ? {
                ...editingNews,
                publishedAt: new Date(editingNews.publishedAt).toISOString().split('T')[0],
                tags: editingNews.tags,
              } as unknown as Record<string, unknown>
            : undefined
        }
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <DeleteConfirm
        open={deleteOpen}
        count={selectedIds.length}
        entityName="notícia"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </AdminLayout>
  )
}
