'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminButton } from '@/components/admin/AdminButton'
import { useToast } from '@/lib/hooks/useToast'
import {
  History, RotateCcw, Loader2, ArrowLeft, Clock, User, FileText,
  Pin, PinOff, Eye, X, ChevronDown, ChevronUp, Pencil, Check,
} from 'lucide-react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface VersionSummary {
  id: string
  savedAt: string
  title: string
  excerpt: string | null
  wordCount: number
  note: string | null
  pinned: boolean
  label: string | null
  savedBy: { id: string; name: string | null; email: string }
}

interface VersionFull extends VersionSummary {
  contentMd: string
  blocks: unknown
}

// ─── Diff helpers ─────────────────────────────────────────────────────────────

function wordDelta(current: VersionSummary, v: VersionSummary) {
  const delta = v.wordCount - current.wordCount
  if (delta === 0) return null
  return delta > 0 ? `+${delta} pal.` : `${delta} pal.`
}

function DiffBadges({ current, v }: { current: VersionSummary; v: VersionSummary }) {
  const badges: { text: string; color: string }[] = []
  if (v.title !== current.title) badges.push({ text: 'Título', color: 'bg-blue-500/10 text-blue-400' })
  if ((v.excerpt ?? '') !== (current.excerpt ?? '')) badges.push({ text: 'Resumo', color: 'bg-amber-500/10 text-amber-400' })
  const delta = wordDelta(current, v)
  if (delta) badges.push({ text: delta, color: delta.startsWith('+') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400' })
  if (badges.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {badges.map(b => (
        <span key={b.text} className={`${b.color} text-[10px] font-semibold px-1.5 py-0.5 rounded`}>{b.text}</span>
      ))}
    </div>
  )
}

// ─── Preview modal ────────────────────────────────────────────────────────────

function PreviewModal({ postId, versionId, onClose }: { postId: string; versionId: string; onClose: () => void }) {
  const [version, setVersion] = useState<VersionFull | null>(null)
  const [loading, setLoading] = useState(true)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/blog/posts/${postId}/versions/${versionId}`)
      .then(r => r.json())
      .then(setVersion)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [postId, versionId])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <p className="text-xs text-muted uppercase tracking-wider font-semibold">Preview da versão</p>
            {version && (
              <p className="text-sm text-muted mt-0.5">
                {new Date(version.savedAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                {' · '}{version.savedBy.name ?? version.savedBy.email}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando…
            </div>
          ) : version ? (
            <>
              <h2 className="text-xl font-bold text-foreground">{version.title}</h2>
              {version.excerpt && (
                <p className="text-sm text-muted italic border-l-2 border-[#ff2d78]/30 pl-3">{version.excerpt}</p>
              )}
              {version.contentMd && (
                <pre className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed bg-surface rounded-xl p-4 border border-border overflow-x-auto">
                  {version.contentMd}
                </pre>
              )}
              {!version.contentMd && <p className="text-sm text-muted italic">Conteúdo em blocos (sem preview de markdown).</p>}
            </>
          ) : (
            <p className="text-sm text-muted">Versão não encontrada.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Label editor ─────────────────────────────────────────────────────────────

function LabelEditor({ postId, version, onUpdate }: { postId: string; version: VersionSummary; onUpdate: (v: Partial<VersionSummary>) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(version.label ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/blog/posts/${postId}/versions/${version.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: draft.trim() || null }),
      })
      if (!res.ok) throw new Error()
      onUpdate({ label: draft.trim() || null })
      setEditing(false)
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => { setDraft(version.label ?? ''); setEditing(true) }}
        className="flex items-center gap-1 text-[11px] text-muted hover:text-foreground transition-colors group"
        title="Editar rótulo"
      >
        {version.label ? (
          <span className="bg-[#ff2d78]/10 text-[#ff2d78] px-1.5 py-0.5 rounded font-semibold">{version.label}</span>
        ) : (
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">+ rótulo</span>
        )}
        <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1 mt-1">
      <input
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value.slice(0, 100))}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
        placeholder="ex.: v1.0 publicada"
        className="text-[11px] bg-surface border border-border rounded px-2 py-0.5 text-foreground focus:outline-none focus:border-[#ff2d78]/40 w-36"
      />
      <button onClick={save} disabled={saving} className="p-0.5 text-green-500 hover:text-green-400 transition-colors">
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
      </button>
      <button onClick={() => setEditing(false)} className="p-0.5 text-muted hover:text-foreground transition-colors">
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BlogPostHistory() {
  const { id } = useParams<{ id: string }>()
  const { addToast } = useToast()

  const [versions, setVersions] = useState<VersionSummary[]>([])
  const [loading, setLoading]   = useState(true)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [togglingPin, setTogglingPin] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [expandedDiff, setExpandedDiff] = useState<string | null>(null)

  const loadVersions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/blog/posts/${id}/versions`)
      if (!res.ok) throw new Error()
      setVersions(await res.json())
    } catch {
      addToast({ type: 'error', message: 'Não foi possível carregar o histórico.' })
    } finally {
      setLoading(false)
    }
  }, [id, addToast])

  useEffect(() => { loadVersions() }, [loadVersions])

  async function handleRestore(versionId: string) {
    if (!confirm('Restaurar esta versão? O estado atual será salvo como snapshot automático.')) return
    setRestoring(versionId)
    try {
      const res = await fetch(`/api/blog/posts/${id}/versions/${versionId}/restore`, { method: 'POST' })
      if (!res.ok) throw new Error()
      addToast({ type: 'success', message: 'Versão restaurada com sucesso.' })
      await loadVersions()
    } catch {
      addToast({ type: 'error', message: 'Não foi possível restaurar a versão.' })
    } finally {
      setRestoring(null)
    }
  }

  async function handleTogglePin(v: VersionSummary) {
    setTogglingPin(v.id)
    try {
      const res = await fetch(`/api/blog/posts/${id}/versions/${v.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: !v.pinned }),
      })
      if (!res.ok) throw new Error()
      setVersions(prev => prev.map(x => x.id === v.id ? { ...x, pinned: !v.pinned } : x))
    } catch {
      addToast({ type: 'error', message: 'Não foi possível alterar o pin.' })
    } finally {
      setTogglingPin(null)
    }
  }

  function updateVersion(versionId: string, patch: Partial<VersionSummary>) {
    setVersions(prev => prev.map(x => x.id === versionId ? { ...x, ...patch } : x))
  }

  const current = versions[0] ?? null

  return (
    <AdminLayout title="Histórico de versões">
      {previewId && (
        <PreviewModal
          postId={id}
          versionId={previewId}
          onClose={() => setPreviewId(null)}
        />
      )}

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin/blog" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Voltar">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <History className="w-6 h-6 text-[#ff2d78]" />
          <div>
            <h1 className="text-xl font-semibold leading-none">Histórico de versões</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Snapshots automáticos a cada salvamento · Pin para proteger de deleção automática
            </p>
          </div>
          {!loading && versions.length > 0 && (
            <span className="ml-auto text-xs text-muted bg-surface border border-border px-2 py-1 rounded-lg">
              {versions.length} / {versions.filter(v => v.pinned).length} pinadas
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Carregando histórico…
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Nenhuma versão salva ainda.</p>
            <p className="text-xs mt-1">Os snapshots são criados automaticamente a cada salvamento.</p>
          </div>
        ) : (
          <ol className="relative border-l border-border ml-4">
            {versions.map((v, idx) => {
              const isFirst = idx === 0
              const isDiffExpanded = expandedDiff === v.id
              return (
                <li key={v.id} className="mb-6 ml-6">
                  {/* Timeline dot */}
                  <span className={`absolute -left-[9px] flex items-center justify-center w-4 h-4 rounded-full ring-4 ring-background ${v.pinned ? 'bg-[#ff2d78]/40' : 'bg-[#ff2d78]/20'}`}>
                    <span className={`w-2 h-2 rounded-full ${v.pinned ? 'bg-[#ff2d78]' : 'bg-[#ff2d78]/70'}`} />
                  </span>

                  <div className={`bg-card border rounded-xl p-4 shadow-sm transition-colors ${v.pinned ? 'border-[#ff2d78]/30' : 'border-border'}`}>
                    <div className="flex items-start gap-3">
                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-sm truncate max-w-[280px]" title={v.title}>{v.title}</p>
                          {isFirst && (
                            <span className="bg-[#ff2d78]/10 text-[#ff2d78] px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0">
                              ATUAL
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(v.savedAt).toLocaleString('pt-BR', {
                              day: '2-digit', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {v.savedBy.name ?? v.savedBy.email}
                          </span>
                          <span className="text-muted">{v.wordCount.toLocaleString('pt-BR')} pal.</span>
                        </div>

                        {/* Label editor */}
                        <LabelEditor postId={id} version={v} onUpdate={p => updateVersion(v.id, p)} />

                        {/* Nota da versão */}
                        {v.note && (
                          <p className="mt-2 text-xs text-muted-foreground italic border-l-2 border-[#ff2d78]/30 pl-2">
                            {v.note}
                          </p>
                        )}

                        {/* Diff em relação ao estado atual */}
                        {!isFirst && current && (
                          <>
                            <DiffBadges current={current} v={v} />
                            {(v.title !== current.title || (v.excerpt ?? '') !== (current.excerpt ?? '')) && (
                              <button
                                onClick={() => setExpandedDiff(isDiffExpanded ? null : v.id)}
                                className="mt-1.5 flex items-center gap-1 text-[11px] text-muted hover:text-foreground transition-colors"
                              >
                                {isDiffExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                {isDiffExpanded ? 'Ocultar diff' : 'Ver diff'}
                              </button>
                            )}
                            {isDiffExpanded && (
                              <div className="mt-2 space-y-1.5 text-[11px]">
                                {v.title !== current.title && (
                                  <div className="rounded-lg overflow-hidden border border-border">
                                    <div className="bg-red-500/10 px-3 py-1.5 text-red-400 line-through">{v.title}</div>
                                    <div className="bg-green-500/10 px-3 py-1.5 text-green-400">{current.title}</div>
                                  </div>
                                )}
                                {(v.excerpt ?? '') !== (current.excerpt ?? '') && (
                                  <div className="rounded-lg overflow-hidden border border-border">
                                    <div className="bg-red-500/10 px-3 py-1.5 text-red-400 line-through opacity-80 italic">{v.excerpt || '(sem resumo)'}</div>
                                    <div className="bg-green-500/10 px-3 py-1.5 text-green-400 italic">{current.excerpt || '(sem resumo)'}</div>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1 shrink-0">
                        {/* Preview */}
                        <AdminButton
                          size="sm"
                          variant="ghost"
                          onClick={() => setPreviewId(v.id)}
                          title="Visualizar versão"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </AdminButton>

                        {/* Pin */}
                        <AdminButton
                          size="sm"
                          variant={v.pinned ? 'warning' : 'ghost'}
                          disabled={togglingPin === v.id}
                          onClick={() => handleTogglePin(v)}
                          title={v.pinned ? 'Remover pin' : 'Pinar (proteger de deleção automática)'}
                        >
                          {togglingPin === v.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : v.pinned
                              ? <PinOff className="w-3.5 h-3.5" />
                              : <Pin className="w-3.5 h-3.5" />}
                        </AdminButton>

                        {/* Restaurar */}
                        {!isFirst && (
                          <AdminButton
                            size="sm"
                            variant="secondary"
                            disabled={restoring === v.id}
                            onClick={() => handleRestore(v.id)}
                            title="Restaurar esta versão"
                          >
                            {restoring === v.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <RotateCcw className="w-3.5 h-3.5" />}
                          </AdminButton>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </AdminLayout>
  )
}
