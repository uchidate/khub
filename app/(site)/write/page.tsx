'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Save, Send, Eye, ArrowLeft, Loader2, CheckCircle, XCircle, Tag, X, Blocks, FileText, Layout, ImageIcon } from 'lucide-react'
import { BlogBlockEditor } from '@/components/admin/BlogBlockEditor'
import { SeoChecklist } from '@/components/admin/SeoChecklist'
import { MediaPicker } from '@/components/admin/MediaPicker'
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
        <h2 className="text-xl font-black text-foreground mb-1">Escolha um template</h2>
        <p className="text-sm text-muted">Os blocos podem ser editados livremente depois</p>
      </div>
      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        {templates.map(t => (
          <button
            key={t.key}
            onClick={() => onPick(t.key)}
            className="flex flex-col items-start gap-2 p-4 rounded-xl border border-border hover:border-[#ff2d78]/40 bg-surface hover:bg-surface-hover transition-all text-left"
          >
            <span className="text-2xl">{t.icon}</span>
            <div>
              <p className="text-sm font-bold text-foreground">{BLOG_TEMPLATE_LABELS[t.key]}</p>
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
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [focusKeyword, setFocusKeyword] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([])

  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [versionNote, setVersionNote] = useState('')
  const [postId, setPostId] = useState<string | null>(editId)
  const [postStatus, setPostStatus] = useState<string>('DRAFT')
  const [isPrivate, setIsPrivate] = useState(false)
  const [scheduledAt, setScheduledAt] = useState<string>('')

  const role = session?.user?.role?.toLowerCase()
  const canPublish = role === 'admin' || role === 'editor'

  // Load categories from API
  useEffect(() => {
    fetch('/api/blog/categories')
      .then(r => r.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

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
        setCategoryId(post.categoryId ?? null)
        setPostStatus(post.status)
        setIsPrivate(post.isPrivate ?? false)
        if (post.scheduledAt) {
          const d = new Date(post.scheduledAt)
          setScheduledAt(d.toISOString().slice(0, 16))
        }
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
        categoryId: categoryId || null,
        tags,
        isPrivate,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        ...(postId && versionNote.trim() ? { versionNote: versionNote.trim() } : {}),
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
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data))
      if (!postId) setPostId(data.id)
      setPostStatus(data.status)
      setSaveState('saved')
      setSaveError(null)
      localStorage.removeItem(AUTOSAVE_KEY)
      setVersionNote('')
      setTimeout(() => setSaveState('idle'), 3000)
    } catch (err) {
      console.error('[SAVE ERROR]', err)
      setSaveState('error')
      setSaveError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
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

  const wordCount = useMemo(() => {
    if (editorMode === 'markdown') return content.split(/\s+/).filter(Boolean).length
    let count = 0
    for (const block of blocks) {
      if ('text' in block && typeof (block as { text?: unknown }).text === 'string')
        count += ((block as { text: string }).text).split(/\s+/).filter(Boolean).length
      if ('summary' in block && typeof (block as { summary?: unknown }).summary === 'string')
        count += ((block as { summary: string }).summary).split(/\s+/).filter(Boolean).length
      if ('items' in block && Array.isArray((block as { items?: unknown }).items)) {
        for (const item of (block as { items: Record<string, unknown>[] }).items) {
          if (typeof item.text === 'string') count += item.text.split(/\s+/).filter(Boolean).length
          if (typeof item.title === 'string') count += item.title.split(/\s+/).filter(Boolean).length
        }
      }
    }
    return count
  }, [editorMode, content, blocks])

  // Cmd+S / Ctrl+S to save
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (title && hasContent && !saving) handleSave()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, hasContent, saving])

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-muted" /></div>
  if (!session) return <div className="min-h-screen flex items-center justify-center text-muted">Faça login para escrever.</div>
  if (!role || !['admin', 'editor', 'contributor'].includes(role)) return <div className="min-h-screen flex items-center justify-center text-muted">Sem permissão para escrever artigos.</div>

  const statusLabels: Record<string, string> = {
    DRAFT: 'Rascunho', PENDING_REVIEW: 'Aguardando revisão', PUBLISHED: 'Publicado', ARCHIVED: 'Arquivado',
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl px-4 py-2 flex items-center gap-3">
        <Link href="/blog" className="p-2 text-muted hover:text-foreground transition-colors rounded-lg hover:bg-surface">
          <ArrowLeft size={18} />
        </Link>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Título do artigo..."
          className="flex-1 bg-transparent text-lg font-bold text-foreground placeholder:text-muted focus:outline-none min-w-0"
        />
        <div className="flex items-center gap-2 shrink-0">
          <span className={`hidden sm:block px-2 py-0.5 rounded text-xs font-medium ${
            postStatus === 'PUBLISHED' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
            postStatus === 'PENDING_REVIEW' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
            'bg-surface text-muted'
          }`}>{statusLabels[postStatus] ?? postStatus}</span>

          {saveState === 'saved' && <CheckCircle size={16} className="text-green-500" />}
          {saveState === 'error' && (
            <span className="flex items-center gap-1 text-red-500 text-xs">
              <XCircle size={16} />
              {saveError}
            </span>
          )}

          <button onClick={handleSave} disabled={saving || !title || !hasContent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-foreground hover:bg-surface-hover text-sm font-medium transition-all disabled:opacity-40">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Salvar
          </button>

          {canPublish ? (
            <button onClick={handlePublish} disabled={publishing || !title || !hasContent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ff2d78] text-white text-sm font-bold transition-all disabled:opacity-40 hover:bg-[#e0256a]">
              {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {postStatus === 'PUBLISHED' ? 'Despublicar' : 'Publicar'}
            </button>
          ) : postStatus === 'DRAFT' ? (
            <button onClick={handleSubmit} disabled={submitting || !title || !hasContent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ff2d78] text-white text-sm font-bold transition-all disabled:opacity-40 hover:bg-[#e0256a]">
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
          <div className="flex items-center gap-1 border-b border-border pb-0">
            <button onClick={() => setEditorMode('blocks')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${editorMode === 'blocks' ? 'text-foreground border-b-2 border-[#ff2d78]' : 'text-muted hover:text-foreground'}`}>
              <Blocks size={13} /> Blocos
            </button>
            <button onClick={() => setEditorMode('markdown')}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${editorMode === 'markdown' ? 'text-foreground border-b-2 border-[#ff2d78]' : 'text-muted hover:text-foreground'}`}>
              <FileText size={13} /> Markdown
            </button>
            {editorMode === 'markdown' && (
              <button onClick={() => {}}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted hover:text-foreground transition-colors">
                <Eye size={12} /> Preview
              </button>
            )}
            {wordCount > 0 && (
              <span className="ml-auto text-[11px] text-muted pr-1 tabular-nums">
                {wordCount.toLocaleString('pt-BR')} palavra{wordCount !== 1 ? 's' : ''}
              </span>
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
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted">Template:</span>
                  <span className="px-2 py-0.5 rounded bg-[#ff2d78]/10 border border-[#ff2d78]/20 text-[#ff2d78] text-xs font-bold">
                    {BLOG_TEMPLATE_LABELS[template]}
                  </span>
                  <button onClick={() => { setTemplatePicked(false); setBlocks([]) }}
                    className="text-xs text-muted hover:text-foreground transition-colors">
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
              className="w-full min-h-[60vh] bg-transparent text-foreground placeholder:text-muted focus:outline-none resize-none font-mono text-sm leading-relaxed"
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
            <label className="text-xs font-semibold text-muted uppercase tracking-wider">Resumo</label>
            <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)}
              placeholder="Resumo (aparece na listagem e no Google)..."
              maxLength={600} rows={3}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-[#ff2d78]/40 resize-none transition-colors" />
            <p className="text-xs text-muted text-right">{excerpt.length}/600</p>
          </div>

          {/* Cover image */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider">Imagem de capa</label>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setShowMediaPicker(true)}
                  className="flex items-center gap-1 text-[10px] font-semibold text-[#ff2d78] hover:text-[#e0245e] transition-colors">
                  <ImageIcon className="w-3 h-3" />
                  {coverImageUrl ? 'Trocar' : 'Escolher da biblioteca'}
                </button>
                {coverImageUrl && (
                  <button onClick={() => setCoverImageUrl('')} className="text-[10px] text-muted hover:text-red-500 transition-colors">Remover</button>
                )}
              </div>
            </div>
            {coverImageUrl && (
              <div className="relative rounded-lg overflow-hidden border border-border h-28 bg-surface cursor-pointer" onClick={() => setShowMediaPicker(true)}>
                <img src={coverImageUrl} alt="capa" className="w-full h-full object-cover"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
              </div>
            )}
            <input value={coverImageUrl} onChange={e => setCoverImageUrl(e.target.value)}
              placeholder="Ou cole uma URL externa..."
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-[#ff2d78]/40 transition-colors" />
          </div>

          {showMediaPicker && (
            <MediaPicker
              value={coverImageUrl}
              onChange={url => setCoverImageUrl(url)}
              onClose={() => setShowMediaPicker(false)}
            />
          )}

          {/* Category */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider">Categoria</label>
            <select
              value={categoryId ?? ''}
              onChange={e => setCategoryId(e.target.value || null)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-[#ff2d78]/40 transition-colors"
            >
              <option value="">Sem categoria</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider">Tags</label>
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                placeholder="Adicionar tag..."
                className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-[#ff2d78]/40 transition-colors" />
              <button onClick={addTag} className="px-3 py-2 bg-surface border border-border rounded-lg text-muted hover:text-foreground hover:bg-surface-hover text-sm transition-colors">
                <Tag size={14} />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map(t => (
                  <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-surface border border-border rounded text-xs text-foreground">
                    {t}
                    <button onClick={() => setTags(p => p.filter(x => x !== t))} className="text-muted hover:text-red-500 transition-colors">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Agendamento */}
          {canPublish && postStatus === 'DRAFT' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider">Agendar publicação</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-[#ff2d78]/40 transition-colors"
              />
              {scheduledAt && (
                <div className="flex items-center justify-between text-[11px] text-amber-500">
                  <span>Publicação agendada</span>
                  <button onClick={() => setScheduledAt('')} className="text-muted hover:text-red-400 transition-colors">
                    <X size={11} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Visibility */}
          {canPublish && (
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface border border-border">
              <div>
                <p className="text-xs font-semibold text-muted">Visibilidade privada</p>
                <p className="text-[11px] text-muted mt-0.5">Publicado mas invisível no blog público</p>
              </div>
              <button
                onClick={() => setIsPrivate(v => !v)}
                className={`relative w-9 h-5 rounded-full transition-colors ${isPrivate ? 'bg-[#ff2d78]' : 'bg-surface-hover border border-border'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-background transition-transform shadow-sm ${isPrivate ? 'translate-x-4' : ''}`} />
              </button>
            </div>
          )}

          {/* Nota da versão */}
          {postId && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider">Nota da versão</label>
              <textarea
                value={versionNote}
                onChange={e => setVersionNote(e.target.value)}
                placeholder="Descreva o que mudou nesta versão (opcional)…"
                maxLength={300}
                rows={2}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-[#ff2d78]/40 resize-none transition-colors"
              />
              <p className="text-xs text-muted text-right">{versionNote.length}/300</p>
            </div>
          )}

          {/* Markdown cheat sheet (only in markdown mode) */}
          {editorMode === 'markdown' && (
            <div className="space-y-2 p-3 bg-surface border border-border rounded-xl">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Markdown rápido</p>
              <div className="text-xs text-muted space-y-1 font-mono">
                <p># Título</p>
                <p>**negrito**</p>
                <p>*itálico*</p>
                <p>[link](url)</p>
                <p>![alt](img-url)</p>
                <p>&gt; citação</p>
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
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <WritePageContent />
    </Suspense>
  )
}
