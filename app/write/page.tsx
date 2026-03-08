'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Save, Send, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle, XCircle, Tag, X } from 'lucide-react'

const AUTOSAVE_KEY = 'blog_draft_autosave'

type Tab = 'write' | 'preview'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function MarkdownPreview({ content }: { content: string }) {
  // Simple inline preview — escape HTML then render line breaks
  if (!content) return <p className="text-zinc-600 italic">Nada para visualizar ainda...</p>
  return (
    <div
      className="prose prose-invert prose-zinc max-w-none prose-headings:font-bold prose-a:text-purple-400"
      dangerouslySetInnerHTML={{ __html: escapeHtml(content).replace(/\n/g, '<br/>') }}
    />
  )
}

function WritePageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')

  const [tab, setTab] = useState<Tab>('write')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')
  const [postId, setPostId] = useState<string | null>(editId)
  const [postStatus, setPostStatus] = useState<string>('DRAFT')

  const role = session?.user?.role?.toLowerCase()
  const canPublish = role === 'admin' || role === 'editor'

  // Load draft from localStorage on mount (only for new posts)
  useEffect(() => {
    if (!editId) {
      const saved = localStorage.getItem(AUTOSAVE_KEY)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed.title) setTitle(parsed.title)
          if (parsed.content) setContent(parsed.content)
          if (parsed.excerpt) setExcerpt(parsed.excerpt)
          if (parsed.tags) setTags(parsed.tags)
        } catch {
          // ignore parse errors
        }
      }
    }
  }, [editId])

  // Load existing post for editing
  useEffect(() => {
    if (!editId) return
    fetch(`/api/blog/posts/${editId}`)
      .then(r => r.json())
      .then(post => {
        setTitle(post.title || '')
        setContent(post.contentMd || '')
        setExcerpt(post.excerpt || '')
        setCoverImageUrl(post.coverImageUrl || '')
        setTags(post.tags || [])
        setPostStatus(post.status)
      })
      .catch(() => {})
  }, [editId])

  // Auto-save to localStorage
  useEffect(() => {
    if (editId || (!title && !content)) return
    const timer = setTimeout(() => {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ title, content, excerpt, tags }))
    }, 1000)
    return () => clearTimeout(timer)
  }, [title, content, excerpt, tags, editId])

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    setSaveState('idle')

    try {
      const method = postId ? 'PATCH' : 'POST'
      const url = postId ? `/api/blog/posts/${postId}` : '/api/blog/posts'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, contentMd: content, excerpt: excerpt || undefined, coverImageUrl: coverImageUrl || undefined, tags }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (!postId) setPostId(data.id)
      setPostStatus(data.status)
      setSaveState('saved')
      localStorage.removeItem(AUTOSAVE_KEY)
    } catch {
      setSaveState('error')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveState('idle'), 3000)
    }
  }

  const handleSubmit = async () => {
    await handleSave()
    if (!postId) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/blog/posts/${postId}/submit`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPostStatus('PENDING_REVIEW')
      router.push('/write?submitted=1')
    } catch {
      setSaveState('error')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePublish = async () => {
    await handleSave()
    if (!postId) return
    setPublishing(true)
    try {
      const isPublished = postStatus === 'PUBLISHED'
      const res = await fetch(`/api/blog/posts/${postId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publish: !isPublished }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPostStatus(data.status)
      if (!isPublished) router.push(`/blog/${data.slug}`)
    } catch {
      setSaveState('error')
    } finally {
      setPublishing(false)
    }
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags(prev => [...prev, t])
      setTagInput('')
    }
  }

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-zinc-400" /></div>
  }

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center text-zinc-400">Faça login para escrever.</div>
  }

  if (!role || !['admin', 'editor', 'contributor'].includes(role)) {
    return <div className="min-h-screen flex items-center justify-center text-zinc-400">Sem permissão para escrever artigos.</div>
  }

  const statusLabels: Record<string, string> = {
    DRAFT: 'Rascunho',
    PENDING_REVIEW: 'Aguardando revisão',
    PUBLISHED: 'Publicado',
    ARCHIVED: 'Arquivado',
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/90 backdrop-blur-xl px-4 py-2 flex items-center gap-3">
        <Link href="/blog" className="p-2 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-white/5">
          <ArrowLeft size={18} />
        </Link>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Título do artigo..."
          className="flex-1 bg-transparent text-lg font-bold placeholder-zinc-600 focus:outline-none min-w-0"
        />
        <div className="flex items-center gap-2 shrink-0">
          {/* Status badge */}
          <span className={`hidden sm:block px-2 py-0.5 rounded text-xs font-medium ${
            postStatus === 'PUBLISHED' ? 'bg-green-500/20 text-green-400' :
            postStatus === 'PENDING_REVIEW' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-zinc-700 text-zinc-400'
          }`}>
            {statusLabels[postStatus] ?? postStatus}
          </span>

          {saveState === 'saved' && <CheckCircle size={16} className="text-green-400" />}
          {saveState === 'error' && <XCircle size={16} className="text-red-400" />}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || !title || !content}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600 text-sm font-medium transition-all disabled:opacity-40"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Salvar
          </button>

          {/* Submit / Publish */}
          {canPublish ? (
            <button
              onClick={handlePublish}
              disabled={publishing || !title || !content}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold transition-all disabled:opacity-40 hover:from-purple-500 hover:to-pink-500"
            >
              {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {postStatus === 'PUBLISHED' ? 'Despublicar' : 'Publicar'}
            </button>
          ) : postStatus === 'DRAFT' ? (
            <button
              onClick={handleSubmit}
              disabled={submitting || !title || !content}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold transition-all disabled:opacity-40"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Enviar para revisão
            </button>
          ) : null}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Main editor */}
        <div className="space-y-4">
          {/* Write / Preview tabs */}
          <div className="flex border-b border-white/5">
            {(['write', 'preview'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  tab === t ? 'text-white border-b-2 border-purple-500' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {t === 'write' ? <><EyeOff size={13} />Escrever</> : <><Eye size={13} />Preview</>}
              </button>
            ))}
          </div>

          {tab === 'write' ? (
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Escreva seu artigo em Markdown..."
              className="w-full min-h-[60vh] bg-transparent text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none font-mono text-sm leading-relaxed"
            />
          ) : (
            <div className="min-h-[60vh]">
              <MarkdownPreview content={content} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          {/* Excerpt */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Resumo</label>
            <textarea
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              placeholder="Resumo do artigo (aparece na listagem)..."
              maxLength={600}
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 resize-none"
            />
            <p className="text-xs text-zinc-600 text-right">{excerpt.length}/600</p>
          </div>

          {/* Cover image */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Imagem de capa (URL)</label>
            <input
              value={coverImageUrl}
              onChange={e => setCoverImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tags</label>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                placeholder="Adicionar tag..."
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
              />
              <button onClick={addTag} className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 hover:text-white text-sm transition-colors">
                <Tag size={14} />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map(t => (
                  <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300">
                    {t}
                    <button onClick={() => setTags(prev => prev.filter(x => x !== t))} className="text-zinc-500 hover:text-red-400 transition-colors">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Markdown cheat sheet */}
          <div className="space-y-2 p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Markdown rápido</p>
            <div className="text-xs text-zinc-600 space-y-1 font-mono">
              <p><span className="text-zinc-400"># Título</span></p>
              <p><span className="text-zinc-400">**negrito**</span></p>
              <p><span className="text-zinc-400">*itálico*</span></p>
              <p><span className="text-zinc-400">[link](url)</span></p>
              <p><span className="text-zinc-400">![alt](img-url)</span></p>
              <p><span className="text-zinc-400">&gt; citação</span></p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default function WritePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <WritePageContent />
    </Suspense>
  )
}
