'use client'

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
    Save, Send, Eye, ArrowLeft, Loader2, CheckCircle, XCircle, Tag, X,
    Blocks, FileText, Layout, ImageIcon, PanelRightClose, PanelRightOpen,
    Maximize2, Minimize2, Undo2, Redo2, Clock, History,
} from 'lucide-react'
import { BlogBlockEditor } from '@/components/admin/BlogBlockEditor'
import { SeoChecklist } from '@/components/admin/SeoChecklist'
import { MediaPicker } from '@/components/admin/MediaPicker'
import { ArticleHealthPanel } from '@/components/admin/ArticleHealthPanel'
import { PublishChecklist } from '@/components/admin/PublishChecklist'
import { VersionHistoryPanel } from '@/components/admin/VersionHistoryPanel'
import { useArticleHealth } from '@/lib/hooks/useArticleHealth'
import type { BlogBlock, BlogTemplate } from '@/lib/types/blocks'
import { BLOG_TEMPLATE_BLOCKS, BLOG_TEMPLATE_LABELS } from '@/lib/types/blocks'

const AUTOSAVE_KEY = 'blog_draft_autosave'

type EditorMode = 'markdown' | 'blocks'

// ─── Template picker ──────────────────────────────────────────────────────────

function TemplatePicker({ onPick }: { onPick: (template: BlogTemplate) => void }) {
  const templates: { key: BlogTemplate; desc: string; icon: string }[] = [
    { key: 'free',      desc: 'Começa vazio — total liberdade', icon: '✏️' },
    { key: 'idol_bio',  desc: 'Stats, carreira, destaques', icon: '⭐' },
    { key: 'group_bio', desc: 'Integrantes, disco, conquistas', icon: '👥' },
    { key: 'comeback',  desc: 'Tracklist, conceito, nota', icon: '💿' },
    { key: 'review',    desc: 'Análise com nota e veredicto', icon: '🎬' },
    { key: 'interview', desc: 'Citações e contexto', icon: '🎤' },
    { key: 'guide',     desc: 'Passo a passo com FAQ', icon: '📖' },
    { key: 'news',      desc: 'Breaking news, reação dos fãs', icon: '📰' },
    { key: 'ranking',   desc: 'Lista ordenada Top N', icon: '🏆' },
    { key: 'listicle',  desc: 'Listagem numerada com conclusão', icon: '📋' },
  ]
  const [free, ...rest] = templates
  return (
    <div className="py-12 flex flex-col items-center gap-5">
      <div className="text-center">
        <Layout className="w-8 h-8 text-[#ff2d78] mx-auto mb-3" />
        <h2 className="text-xl font-black text-foreground mb-1">Escolha um template</h2>
        <p className="text-sm text-muted">Os blocos podem ser editados livremente depois</p>
      </div>
      <div className="w-full max-w-2xl space-y-3">
        {/* Free — full-width */}
        <button
          onClick={() => onPick(free.key)}
          className="w-full flex items-center gap-4 p-4 rounded-xl border border-dashed border-border hover:border-[#ff2d78]/50 bg-surface hover:bg-surface-hover transition-all text-left"
        >
          <span className="text-2xl shrink-0">{free.icon}</span>
          <div>
            <p className="text-sm font-bold text-foreground">{BLOG_TEMPLATE_LABELS[free.key]}</p>
            <p className="text-xs text-muted">{free.desc}</p>
          </div>
        </button>
        {/* Other templates — 3-column grid (9 items = 3×3) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {rest.map(t => (
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
    </div>
  )
}

function ExcerptTextarea({ value, onChange, placeholder = 'Resumo (aparece na listagem e no Google)...', maxLength = 600 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, 60)}px`
  }, [value])
  return (
    <textarea ref={ref} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} maxLength={maxLength} rows={2}
      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-[#ff2d78]/40 resize-none transition-colors"
      style={{ overflow: 'hidden' }} />
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
  const [autosaving, setAutosaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [versionCount, setVersionCount] = useState<number | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [focusMode, setFocusMode] = useState(false)
  const [showPublishChecklist, setShowPublishChecklist] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [postSlug, setPostSlug] = useState<string | null>(null)

  // Undo/Redo history
  const [blockHistory, setBlockHistory] = useState<BlogBlock[][]>([])
  const [blockFuture, setBlockFuture] = useState<BlogBlock[][]>([])
  const isUndoRedo = useRef(false)

  const setBlocksWithHistory = useCallback((next: BlogBlock[] | ((prev: BlogBlock[]) => BlogBlock[])) => {
    if (isUndoRedo.current) { isUndoRedo.current = false; return }
    setBlocks(prev => {
      const resolved = typeof next === 'function' ? next(prev) : next
      setBlockHistory(h => [...h.slice(-49), prev])
      setBlockFuture([])
      return resolved
    })
  }, [])

  function undo() {
    if (blockHistory.length === 0) return
    const prev = blockHistory[blockHistory.length - 1]
    isUndoRedo.current = true
    setBlockFuture(f => [blocks, ...f])
    setBlockHistory(h => h.slice(0, -1))
    setBlocks(prev)
  }

  function redo() {
    if (blockFuture.length === 0) return
    const next = blockFuture[0]
    isUndoRedo.current = true
    setBlockHistory(h => [...h, blocks])
    setBlockFuture(f => f.slice(1))
    setBlocks(next)
  }
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
        if (post.slug) setPostSlug(post.slug)
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

  // Fetch version count when postId changes
  useEffect(() => {
    if (!postId) return
    fetch(`/api/blog/posts/${postId}/versions`)
      .then(r => r.json())
      .then(data => setVersionCount(Array.isArray(data) ? data.length : null))
      .catch(() => {})
  }, [postId])

  // Auto-save to localStorage (new posts)
  useEffect(() => {
    if (editId || (!title && !content && blocks.length === 0)) return
    const timer = setTimeout(() => {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ title, content, excerpt, tags, blocks }))
    }, 1000)
    return () => clearTimeout(timer)
  }, [title, content, excerpt, tags, blocks, editId])

  // Server autosave every 30s for existing posts
  const lastAutosaveRef = useRef<string>('')
  useEffect(() => {
    if (!postId || saving) return
    const timer = setTimeout(async () => {
      const hasContent = editorMode === 'blocks' ? blocks.length > 0 : content.trim().length > 0
      if (!title.trim() || !hasContent) return
      const payload = JSON.stringify({ title, excerpt, blocks, contentMd: content || ' ' })
      if (payload === lastAutosaveRef.current) return
      lastAutosaveRef.current = payload
      setAutosaving(true)
      try {
        const res = await fetch(`/api/blog/posts/${postId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, excerpt: excerpt || undefined, contentMd: content || ' ',
            blocks: editorMode === 'blocks' ? blocks : null }),
        })
        if (res.ok) {
          const data = await res.json()
          setVersionCount(c => (c ?? 0) + 1)
          if (data.slug) setPostSlug(data.slug)
          setLastSavedAt(new Date())
          setSaveState('saved')
          setTimeout(() => setSaveState('idle'), 3000)
        }
      } catch { /* silent */ } finally {
        setAutosaving(false)
      }
    }, 30000)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, excerpt, blocks, content, postId, saving, editorMode])

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
      if (data.slug) setPostSlug(data.slug)
      setPostStatus(data.status)
      setVersionCount(c => (c ?? 0) + 1)
      setSaveState('saved')
      setSaveError(null)
      setLastSavedAt(new Date())
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

  const { issues, errors: healthErrors, warnings: healthWarnings, checking: healthChecking } = useArticleHealth({
    title, excerpt, coverImageUrl, categoryId, tags, blocks, focusKeyword, wordCount,
  })

  // Global keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 's') { e.preventDefault(); if (title && hasContent && !saving) handleSave() }
      if (mod && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo() }
      if (mod && (e.shiftKey && e.key === 'z' || e.key === 'y')) { e.preventDefault(); redo() }
      if (e.key === 'Escape' && focusMode) { e.preventDefault(); setFocusMode(false) }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, hasContent, saving, focusMode, blockHistory, blockFuture, blocks])

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-muted" /></div>
  if (!session) return <div className="min-h-screen flex items-center justify-center text-muted">Faça login para escrever.</div>
  if (!role || !['admin', 'editor', 'contributor'].includes(role)) return <div className="min-h-screen flex items-center justify-center text-muted">Sem permissão para escrever artigos.</div>

  const statusLabels: Record<string, string> = {
    DRAFT: 'Rascunho', PENDING_REVIEW: 'Aguardando revisão', PUBLISHED: 'Publicado', ARCHIVED: 'Arquivado',
  }

  function formatTimestamp(date: Date): string {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000)
    if (diff < 60) return 'agora'
    if (diff < 3600) return `há ${Math.floor(diff / 60)}min`
    return `às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  }

  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  return (
    <div className={`min-h-screen bg-background text-foreground ${focusMode ? 'fixed inset-0 z-[400] overflow-auto' : ''}`}>
      {/* Publish checklist modal */}
      {showPublishChecklist && (
        <PublishChecklist
          issues={issues}
          isPublished={postStatus === 'PUBLISHED'}
          onConfirm={() => { setShowPublishChecklist(false); handlePublish() }}
          onCancel={() => setShowPublishChecklist(false)}
        />
      )}

      {/* Top bar */}
      <div className={`sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl px-4 flex items-center gap-2 h-12 ${focusMode ? 'bg-background/95' : ''}`}>
        {!focusMode && (
          <Link href="/blog" className="p-1.5 text-muted hover:text-foreground transition-colors rounded-lg hover:bg-surface shrink-0">
            <ArrowLeft size={16} />
          </Link>
        )}
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Título do artigo..."
          className="flex-1 bg-transparent text-sm font-semibold text-foreground placeholder:text-muted focus:outline-none min-w-0"
        />

        {/* Left controls group: status + save indicator + undo/redo + view tools */}
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Status badge */}
          <span className={`hidden md:block px-2 py-0.5 rounded-md text-[11px] font-semibold mr-1 ${
            postStatus === 'PUBLISHED' ? 'bg-green-500/15 text-green-600 dark:text-green-400' :
            postStatus === 'PENDING_REVIEW' ? 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400' :
            'bg-surface text-muted'
          }`}>{statusLabels[postStatus] ?? postStatus}</span>

          {/* Autosave indicator */}
          {autosaving && (
            <span className="hidden lg:flex items-center gap-1 text-[11px] text-muted/60 mr-2">
              <Loader2 size={10} className="animate-spin" />
              salvando…
            </span>
          )}
          {!autosaving && saveState === 'saved' && lastSavedAt && (
            <span className="hidden lg:flex items-center gap-1 text-[11px] text-muted mr-2">
              <CheckCircle size={11} className="text-green-500" />
              {formatTimestamp(lastSavedAt)}
            </span>
          )}
          {saveState === 'error' && (
            <span className="flex items-center gap-1 text-red-500 text-[11px] mr-1">
              <XCircle size={12} />
              {saveError?.slice(0, 30)}
            </span>
          )}

          {/* Undo/Redo */}
          <button onClick={undo} disabled={blockHistory.length === 0} title="Desfazer (⌘Z)"
            className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface disabled:opacity-25 transition-all">
            <Undo2 size={13} />
          </button>
          <button onClick={redo} disabled={blockFuture.length === 0} title="Refazer (⌘⇧Z)"
            className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface disabled:opacity-25 transition-all">
            <Redo2 size={13} />
          </button>

          <div className="w-px h-4 bg-border mx-1" />

          {/* Preview */}
          {postSlug && (
            <button
              onClick={async () => { await handleSave(); window.open(`/blog/${postSlug}`, '_blank') }}
              title="Preview (abre em nova aba)"
              className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface transition-all">
              <Eye size={13} />
            </button>
          )}

          {/* Focus mode */}
          <button onClick={() => setFocusMode(v => !v)} title={focusMode ? 'Sair do modo foco (ESC)' : 'Modo foco'}
            className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface transition-all">
            {focusMode ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>

          {/* Sidebar toggle */}
          <button onClick={() => setSidebarOpen(v => !v)} title={sidebarOpen ? 'Ocultar sidebar' : 'Mostrar sidebar'}
            className="hidden lg:flex p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface transition-all">
            {sidebarOpen ? <PanelRightClose size={13} /> : <PanelRightOpen size={13} />}
          </button>

          <div className="w-px h-4 bg-border mx-1" />
        </div>

        {/* Right actions group: Save + Publish */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handleSave} disabled={saving || !title || !hasContent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-foreground hover:bg-surface-hover text-xs font-medium transition-all disabled:opacity-40">
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            Salvar
          </button>

          {canPublish ? (
            <button onClick={() => setShowPublishChecklist(true)} disabled={publishing || !title || !hasContent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ff2d78] text-white text-xs font-bold transition-all disabled:opacity-40 hover:bg-[#e0256a]">
              {publishing ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              {postStatus === 'PUBLISHED' ? 'Despublicar' : 'Publicar'}
            </button>
          ) : postStatus === 'DRAFT' ? (
            <button onClick={handleSubmit} disabled={submitting || !title || !hasContent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ff2d78] text-white text-xs font-bold transition-all disabled:opacity-40 hover:bg-[#e0256a]">
              {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Enviar para revisão
            </button>
          ) : null}
        </div>
      </div>

      <div className={`mx-auto px-4 py-6 grid gap-6 transition-all w-full ${focusMode ? 'max-w-2xl grid-cols-1' : sidebarOpen ? 'max-w-6xl grid-cols-1 lg:grid-cols-[1fr_300px]' : 'max-w-3xl grid-cols-1'}`}>
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

            {/* Template pill inline in tab bar */}
            {editorMode === 'blocks' && templatePicked && (
              <div className="flex items-center gap-1 ml-2">
                <span className="w-px h-3.5 bg-border" />
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#ff2d78]/10 text-[#ff2d78] ml-1">
                  {BLOG_TEMPLATE_LABELS[template]}
                </span>
                <button onClick={() => { setTemplatePicked(false); setBlocks([]) }}
                  className="text-[10px] text-muted/60 hover:text-muted transition-colors">
                  trocar
                </button>
              </div>
            )}

            <div className="ml-auto flex items-center gap-3 pr-1">
              {wordCount > 0 && (
                <span className="flex items-center gap-1.5 text-[11px] text-muted tabular-nums">
                  <span>{wordCount.toLocaleString('pt-BR')} palavras</span>
                  <span className="flex items-center gap-0.5 text-muted/50">
                    <Clock size={9} />{readingTime} min
                  </span>
                </span>
              )}
              {editorMode === 'markdown' && (
                <button onClick={() => {}}
                  className="flex items-center gap-1 text-[11px] text-muted hover:text-foreground transition-colors">
                  <Eye size={11} /> Preview
                </button>
              )}
            </div>
          </div>

          {/* Editor area */}
          {editorMode === 'blocks' ? (
            !templatePicked ? (
              <TemplatePicker onPick={pickTemplate} />
            ) : (
              <BlogBlockEditor blocks={blocks} onChange={setBlocksWithHistory} />
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
        {sidebarOpen && !focusMode && <aside className="space-y-5">
          {/* Article Health */}
          <ArticleHealthPanel
            issues={issues}
            errors={healthErrors}
            warnings={healthWarnings}
            checking={healthChecking}
            onJumpToField={(field) => {
              const fieldMap: Record<string, string> = {
                title: 'input[placeholder="Título do artigo..."]',
                excerpt: 'textarea[placeholder*="Resumo"]',
                cover: 'input[placeholder*="URL externa"]',
              }
              const sel = fieldMap[field]
              if (sel) (document.querySelector(sel) as HTMLElement | null)?.focus()
            }}
            onJumpToBlock={(index) => {
              const els = document.querySelectorAll('[data-block-index]')
              const el = els[index] as HTMLElement | null
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }}
          />

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
            <ExcerptTextarea value={excerpt} onChange={setExcerpt} />
            <p className={`text-xs text-right tabular-nums ${
              excerpt.length >= 120 && excerpt.length <= 160 ? 'text-green-500' :
              excerpt.length > 160 ? 'text-yellow-500' :
              excerpt.length > 0 ? 'text-orange-400' : 'text-muted'
            }`}>
              {excerpt.length} <span className="text-muted font-normal">/ ideal 120–160</span>
            </p>
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
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider">Tags</label>
              <span className={`text-[10px] tabular-nums ${tags.length >= 3 ? 'text-green-500' : tags.length > 0 ? 'text-orange-400' : 'text-muted'}`}>
                {tags.length}/10
              </span>
            </div>
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
              <ExcerptTextarea value={versionNote} onChange={setVersionNote} placeholder="Descreva o que mudou nesta versão (opcional)…" maxLength={300} />
              <p className="text-xs text-muted text-right">{versionNote.length}/300</p>
            </div>
          )}

          {/* Version History */}
          {postId && (
            <div className="rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setShowVersionHistory(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-2">
                  <History className="w-3.5 h-3.5 text-muted" />
                  <span className="text-xs font-black uppercase tracking-wider text-foreground">Versões</span>
                  {versionCount !== null && versionCount > 0 && (
                    <span className="text-[10px] font-bold tabular-nums bg-surface-hover px-1.5 py-0.5 rounded-full text-muted">{versionCount}</span>
                  )}
                </div>
                <span className="text-[10px] text-muted">{showVersionHistory ? 'fechar' : 'ver'}</span>
              </button>
              {showVersionHistory && (
                <div className="border-t border-border">
                  <VersionHistoryPanel postId={postId} onRestore={v => {
                setTitle(v.title)
                if (v.excerpt) setExcerpt(v.excerpt)
                if (v.blocks?.length) { setBlocksWithHistory(v.blocks); setEditorMode('blocks') }
                else if (v.contentMd?.trim()) { setContent(v.contentMd); setEditorMode('markdown') }
                setShowVersionHistory(false)
              }} />
                </div>
              )}
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
        </aside>}
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
