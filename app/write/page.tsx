'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Save, Send, Eye, ArrowLeft, Loader2, CheckCircle, XCircle, Tag, X, Blocks, FileText, Layout } from 'lucide-react'
import { BlogBlockEditor } from '@/components/admin/BlogBlockEditor'
import { SeoChecklist } from '@/components/admin/SeoChecklist'
import type { BlogBlock, BlogTemplate } from '@/lib/types/blocks'
import { BLOG_TEMPLATE_BLOCKS, BLOG_TEMPLATE_LABELS } from '@/lib/types/blocks'

const AUTOSAVE_KEY = 'blog_draft_autosave'

type EditorMode = 'markdown' | 'blocks'

// ─── Template picker ──────────────────────────────────────────────────────────

function TemplatePicker({ onPick }: { onPick: (template: BlogTemplate) => void }) {
  const templates: { key: BlogTemplate; desc: string; icon: string }[] = [
    { key: 'free',      desc: 'Começa vazio — total liberdade', icon: '✏️' },
    { key: 'idol_bio',  desc: 'Stats, carreira, destaques', icon: '⭐' },
    { key: 'review',    desc: 'Análise com nota e veredicto', icon: '🎬' },
    { key: 'ranking',   desc: 'Lista ordenada Top N', icon: '🏆' },
  ]
  return (
    <div className="py-16 flex flex-col items-center gap-6">
      <div className="text-center">
        <Layout className="w-8 h-8 text-[#ff2d78] mx-auto mb-3" />
        <h2 className="text-xl font-black text-white mb-1">Escolha um template</h2>
        <p className="text-sm text-muted">Os blocos podem ser editados livremente depois</p>
      </div>
      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        {templates.map(t => (
          <button
            key={t.key}
            onClick={() => onPick(t.key)}
            className="flex flex-col items-start gap-2 p-4 rounded-xl border border-white/8 hover:border-[#ff2d78]/40 bg-[#080808]/50 hover:bg-[#080808] transition-all text-left"
          >
            <span className="text-2xl">{t.icon}</span>
            <div>
              <p className="text-sm font-bold text-white">{BLOG_TEMPLATE_LABELS[t.key]}</p>
              <p className="text-xs text-muted">{t.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main write page ──────────────────────────────────────────────────────────

function WritePageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')

  const [editorMode, setEditorMode] = useState<EditorMode>('blocks')
  const [templatePicked, setTemplatePicked] = useState(false)
  const [blocks, setBlocks] = useState<BlogBlock[]>([])
  const [template, setTemplate] = useState<BlogTemplate>('free')

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')    // markdown fallback
  const [excerpt, setExcerpt] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [focusKeyword, setFocusKeyword] = useState('')

  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')
  const [postId, setPostId] = useState<string | null>(editId)
  const [postStatus, setPostStatus] = useState<string>('DRAFT')
  const [isPrivate, setIsPrivate] = useState(false)

  const role = session?.user?.role?.toLowerCase()
  const canPublish = role === 'admin' || role === 'editor'

  // Load localStorage draft (new posts only)
  useEffect(() => {
    if (editId) return
    const saved = localStorage.getItem(AUTOSAVE_KEY)
    if (!saved) return
    try {
      const parsed = JSON.parse(saved)
      if (parsed.title) setTitle(parsed.title)
      if (parsed.content) setContent(parsed.content)
      if (parsed.excerpt) setExcerpt(parsed.excerpt)
      if (parsed.tags) setTags(parsed.tags)
      if (parsed.blocks) { setBlocks(parsed.blocks); setTemplatePicked(true); setEditorMode('blocks') }
    } catch { /* ignore */ }
  }, [editId])

  // Load existing post
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
        setIsPrivate(post.isPrivate ?? false)
        if (post.template) setTemplate(post.template)
        if (Array.isArray(post.blocks) && post.blocks.length > 0) {
          setBlocks(post.blocks)
          setTemplatePicked(true)
          setEditorMode('blocks')
        }
      })
      .catch(() => {})
  }, [editId])

  // Auto-save to localStorage
  useEffect(() => {
    if (editId || (!title && !content && blocks.length === 0)) return
    const timer = setTimeout(() => {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ title, content, excerpt, tags, blocks }))
    }, 1000)
    return () => clearTimeout(timer)
  }, [title, content, excerpt, tags, blocks, editId])

  function pickTemplate(t: BlogTemplate) {
    setTemplate(t)
    setBlocks(BLOG_TEMPLATE_BLOCKS[t].map(b => ({ ...b })))
    setTemplatePicked(true)
  }

  const handleSave = async () => {
    const hasContent = editorMode === 'blocks' ? blocks.length > 0 : content.trim()
    if (!title.trim() || !hasContent) return
    setSaving(true)
    setSaveState('idle')
    try {
      const method = postId ? 'PATCH' : 'POST'
      const url = postId ? `/api/blog/posts/${postId}` : '/api/blog/posts'
      const body: Record<string, unknown> = {
        title,
        contentMd: content || ' ',
        excerpt: excerpt || undefined,
        coverImageUrl: coverImageUrl || undefined,
        tags,
        isPrivate,
      }
      if (editorMode === 'blocks') {
        body.blocks = blocks
        body.template = template
      } else {
        body.blocks = null
        body.template = 'free'
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
    } catch { setSaveState('error') } finally { setSubmitting(false) }
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
    } catch { setSaveState('error') } finally { setPublishing(false) }
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t) && tags.length < 10) { setTags(p => [...p, t]); setTagInput('') }
  }

  const hasContent = editorMode === 'blocks' ? blocks.length > 0 : content.trim().length > 0

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#999]" /></div>
  if (!session) return <div className="min-h-screen flex items-center justify-center text-[#999]">Faça login para escrever.</div>
  if (!role || !['admin', 'editor', 'contributor'].includes(role)) return <div className="min-h-screen flex items-center justify-center text-[#999]">Sem permissão para escrever artigos.</div>

  const statusLabels: Record<string, string> = {
    DRAFT: 'Rascunho', PENDING_REVIEW: 'Aguardando revisão', PUBLISHED: 'Publicado', ARCHIVED: 'Arquivado',
  }

  return (
    <div className="min-h-screen bg-surface text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-50 border-b border-white/5 bg-surface/90 backdrop-blur-xl px-4 py-2 flex items-center gap-3">
        <Link href="/blog" className="p-2 text-muted hover:text-white transition-colors rounded-lg hover:bg-white/5">
          <ArrowLeft size={18} />
        </Link>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Título do artigo..."
          className="flex-1 bg-transparent text-lg font-bold placeholder-zinc-600 focus:outline-none min-w-0"
        />
        <div className="flex items-center gap-2 shrink-0">
          <span className={`hidden sm:block px-2 py-0.5 rounded text-xs font-medium ${
            postStatus === 'PUBLISHED' ? 'bg-green-500/20 text-green-400' :
            postStatus === 'PENDING_REVIEW' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-[#2a2a2a] text-[#999]'
          }`}>{statusLabels[postStatus] ?? postStatus}</span>

          {saveState === 'saved' && <CheckCircle size={16} className="text-green-400" />}
          {saveState === 'error' && <XCircle size={16} className="text-red-400" />}

          <button onClick={handleSave} disabled={saving || !title || !hasContent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[#e8e8e8] hover:text-white hover:border-[#444] text-sm font-medium transition-all disabled:opacity-40">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Salvar
          </button>

          {canPublish ? (
            <button onClick={handlePublish} disabled={publishing || !title || !hasContent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#ff2d78] to-pink-600 text-white text-sm font-bold transition-all disabled:opacity-40 hover:from-[#ff2d78] hover:to-pink-500">
              {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {postStatus === 'PUBLISHED' ? 'Despublicar' : 'Publicar'}
            </button>
          ) : postStatus === 'DRAFT' ? (
            <button onClick={handleSubmit} disabled={submitting || !title || !hasContent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#ff2d78] to-pink-600 text-white text-sm font-bold transition-all disabled:opacity-40">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Enviar para revisão
            </button>
          ) : null}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Main editor */}
        <div className="space-y-4">
          {/* Mode tabs */}
          <div className="flex items-center gap-1 border-b border-white/5 pb-0">
            <button onClick={() => setEditorMode('blocks')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${editorMode === 'blocks' ? 'text-white border-b-2 border-[#ff2d78]' : 'text-muted hover:text-[#e8e8e8]'}`}>
              <Blocks size={13} /> Blocos
            </button>
            <button onClick={() => setEditorMode('markdown')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${editorMode === 'markdown' ? 'text-white border-b-2 border-[#ff2d78]' : 'text-muted hover:text-[#e8e8e8]'}`}>
              <FileText size={13} /> Markdown
            </button>
            {editorMode === 'markdown' && (
              <button onClick={() => {}}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted hover:text-[#e8e8e8] transition-colors">
                <Eye size={12} /> Preview
              </button>
            )}
          </div>

          {/* Editor area */}
          {editorMode === 'blocks' ? (
            !templatePicked ? (
              <TemplatePicker onPick={pickTemplate} />
            ) : (
              <div className="space-y-3">
                {/* Template badge + change */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#444]">Template:</span>
                  <span className="px-2 py-0.5 rounded bg-[#ff2d78]/20 border border-[#ff2d78]/30 text-[#ff2d78] text-xs font-bold">
                    {BLOG_TEMPLATE_LABELS[template]}
                  </span>
                  <button onClick={() => { setTemplatePicked(false); setBlocks([]) }}
                    className="text-xs text-[#444] hover:text-[#999] transition-colors">
                    trocar
                  </button>
                </div>
                <BlogBlockEditor blocks={blocks} onChange={setBlocks} />
              </div>
            )
          ) : (
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Escreva seu artigo em Markdown..."
              className="w-full min-h-[60vh] bg-transparent text-[#ccc] placeholder-zinc-600 focus:outline-none resize-none font-mono text-sm leading-relaxed"
            />
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          {/* SEO Checklist */}
          <SeoChecklist
            title={title}
            excerpt={excerpt}
            contentMd={content}
            blocks={blocks}
            focusKeyword={focusKeyword}
            onFocusKeywordChange={setFocusKeyword}
            coverImageUrl={coverImageUrl}
            tags={tags}
          />

          {/* Excerpt */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#999] uppercase tracking-wider">Resumo</label>
            <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)}
              placeholder="Resumo (aparece na listagem e no Google)..."
              maxLength={600} rows={3}
              className="w-full bg-[#080808] border border-[#1a1a1a] rounded-lg px-3 py-2 text-sm text-[#ccc] placeholder-zinc-600 focus:outline-none focus:border-[#444] resize-none" />
            <p className="text-xs text-[#444] text-right">{excerpt.length}/600</p>
          </div>

          {/* Cover image */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#999] uppercase tracking-wider">Imagem de capa (URL)</label>
            <input value={coverImageUrl} onChange={e => setCoverImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-[#080808] border border-[#1a1a1a] rounded-lg px-3 py-2 text-sm text-[#ccc] placeholder-zinc-600 focus:outline-none focus:border-[#444]" />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#999] uppercase tracking-wider">Tags</label>
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                placeholder="Adicionar tag..."
                className="flex-1 bg-[#080808] border border-[#1a1a1a] rounded-lg px-3 py-2 text-sm text-[#ccc] placeholder-zinc-600 focus:outline-none focus:border-[#444]" />
              <button onClick={addTag} className="px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[#999] hover:text-white text-sm transition-colors">
                <Tag size={14} />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map(t => (
                  <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-xs text-[#e8e8e8]">
                    {t}
                    <button onClick={() => setTags(p => p.filter(x => x !== t))} className="text-muted hover:text-red-400 transition-colors">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Visibility */}
          {canPublish && (
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#080808]/50 border border-[#1a1a1a]">
              <div>
                <p className="text-xs font-semibold text-[#999]">Visibilidade privada</p>
                <p className="text-[11px] text-[#444] mt-0.5">Publicado mas invisível no blog público</p>
              </div>
              <button
                onClick={() => setIsPrivate(v => !v)}
                className={`relative w-9 h-5 rounded-full transition-colors ${isPrivate ? 'bg-[#ff2d78]' : 'bg-[#2a2a2a]'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-background transition-transform ${isPrivate ? 'translate-x-4' : ''}`} />
              </button>
            </div>
          )}

          {/* Markdown cheat sheet (only in markdown mode) */}
          {editorMode === 'markdown' && (
            <div className="space-y-2 p-3 bg-[#080808]/50 border border-[#1a1a1a] rounded-xl">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Markdown rápido</p>
              <div className="text-xs text-[#444] space-y-1 font-mono">
                <p><span className="text-[#999]"># Título</span></p>
                <p><span className="text-[#999]">**negrito**</span></p>
                <p><span className="text-[#999]">*itálico*</span></p>
                <p><span className="text-[#999]">[link](url)</span></p>
                <p><span className="text-[#999]">![alt](img-url)</span></p>
                <p><span className="text-[#999]">&gt; citação</span></p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

export default function WritePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <WritePageContent />
    </Suspense>
  )
}
