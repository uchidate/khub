'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminEmptyState } from '@/components/admin'
import { useToast } from '@/lib/hooks/useToast'
import {
    Globe, Plus, Trash2, Loader2, Pencil, X, Check,
    AlertCircle, ExternalLink, EyeOff, ChevronDown, ChevronUp,
} from 'lucide-react'
import Link from 'next/link'

type EntityType = 'artist' | 'production' | 'group' | 'blog_post'

interface SeoMeta {
    id: string
    entityType: EntityType
    entityId: string
    metaTitle: string | null
    metaDesc: string | null
    ogTitle: string | null
    ogDesc: string | null
    ogImageUrl: string | null
    canonicalUrl: string | null
    noIndex: boolean
    updatedAt: string
}

const ENTITY_LABELS: Record<EntityType, string> = {
    artist: 'Artista',
    production: 'Produção',
    group: 'Grupo',
    blog_post: 'Post do Blog',
}

const ENTITY_COLORS: Record<EntityType, string> = {
    artist: 'bg-pink-500/10 text-pink-400',
    production: 'bg-blue-500/10 text-blue-400',
    group: 'bg-purple-500/10 text-purple-400',
    blog_post: 'bg-emerald-500/10 text-emerald-400',
}

const ENTITY_LINKS: Record<EntityType, (id: string) => string> = {
    artist: id => `/artists/${id}`,
    production: id => `/productions/${id}`,
    group: id => `/groups/${id}`,
    blog_post: id => `/blog/${id}`,
}

interface FormState {
    entityType: EntityType
    entityId: string
    metaTitle: string
    metaDesc: string
    ogTitle: string
    ogDesc: string
    ogImageUrl: string
    canonicalUrl: string
    noIndex: boolean
}

const EMPTY_FORM: FormState = {
    entityType: 'artist',
    entityId: '',
    metaTitle: '',
    metaDesc: '',
    ogTitle: '',
    ogDesc: '',
    ogImageUrl: '',
    canonicalUrl: '',
    noIndex: false,
}

export default function SeoAdminPage() {
    const { addToast } = useToast()
    const [metas,        setMetas]        = useState<SeoMeta[]>([])
    const [total,        setTotal]        = useState(0)
    const [loading,      setLoading]      = useState(true)
    const [typeFilter,   setTypeFilter]   = useState<string>('')
    const [showForm,     setShowForm]     = useState(false)
    const [form,         setForm]         = useState<FormState>(EMPTY_FORM)
    const [editId,       setEditId]       = useState<string | null>(null)
    const [saving,       setSaving]       = useState(false)
    const [deletingId,   setDeletingId]   = useState<string | null>(null)
    const [expandedId,   setExpandedId]   = useState<string | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (typeFilter) params.set('type', typeFilter)
            const res = await fetch(`/api/admin/seo?${params}`)
            const data = await res.json()
            setMetas(data.data ?? [])
            setTotal(data.total ?? 0)
        } catch {
            addToast({ type: 'error', message: 'Erro ao carregar overrides SEO' })
        } finally {
            setLoading(false)
        }
    }, [typeFilter, addToast])

    useEffect(() => { load() }, [load])

    function startEdit(meta: SeoMeta) {
        setForm({
            entityType:   meta.entityType,
            entityId:     meta.entityId,
            metaTitle:    meta.metaTitle ?? '',
            metaDesc:     meta.metaDesc ?? '',
            ogTitle:      meta.ogTitle ?? '',
            ogDesc:       meta.ogDesc ?? '',
            ogImageUrl:   meta.ogImageUrl ?? '',
            canonicalUrl: meta.canonicalUrl ?? '',
            noIndex:      meta.noIndex,
        })
        setEditId(meta.id)
        setShowForm(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    function cancelForm() {
        setShowForm(false)
        setEditId(null)
        setForm(EMPTY_FORM)
    }

    async function handleSave() {
        if (!form.entityId.trim()) { addToast({ type: 'error', message: 'ID da entidade obrigatório' }); return }
        setSaving(true)
        try {
            const res = await fetch('/api/admin/seo', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    ogImageUrl:   form.ogImageUrl   || null,
                    canonicalUrl: form.canonicalUrl || null,
                }),
            })
            if (!res.ok) { addToast({ type: 'error', message: 'Erro ao salvar' }); return }
            addToast({ type: 'success', message: editId ? 'Override atualizado' : 'Override criado' })
            cancelForm()
            load()
        } catch { addToast({ type: 'error', message: 'Erro de rede' }) }
        finally { setSaving(false) }
    }

    async function handleDelete(meta: SeoMeta) {
        if (deletingId || !window.confirm('Remover override SEO?')) return
        setDeletingId(meta.id)
        try {
            await fetch(`/api/admin/seo?entityType=${meta.entityType}&entityId=${meta.entityId}`, { method: 'DELETE' })
            addToast({ type: 'success', message: 'Override removido' })
            load()
        } catch { addToast({ type: 'error', message: 'Erro ao remover' }) }
        finally { setDeletingId(null) }
    }

    const hasIssues = (meta: SeoMeta) =>
        !meta.metaTitle || !meta.metaDesc || meta.metaTitle.length > 60 || meta.metaDesc.length > 155

    return (
        <AdminLayout
            title="SEO"
            subtitle="Overrides de meta tags por entidade"
            actions={
                <button
                    onClick={() => { cancelForm(); setShowForm(true) }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-all"
                >
                    <Plus size={14} />
                    Novo override
                </button>
            }
        >
            {/* Form */}
            {showForm && (
                <div className="mb-6 p-5 rounded-xl border border-border bg-surface space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-foreground">{editId ? 'Editar override' : 'Novo override SEO'}</h3>
                        <button onClick={cancelForm} className="text-muted hover:text-foreground transition-colors"><X size={16} /></button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1">Tipo de entidade</label>
                            <select
                                value={form.entityType}
                                onChange={e => setForm(f => ({ ...f, entityType: e.target.value as EntityType }))}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                            >
                                {(Object.keys(ENTITY_LABELS) as EntityType[]).map(t => (
                                    <option key={t} value={t}>{ENTITY_LABELS[t]}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1">ID da entidade</label>
                            <input
                                value={form.entityId}
                                onChange={e => setForm(f => ({ ...f, entityId: e.target.value }))}
                                placeholder="cuid da entidade..."
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1">
                                Meta Title <span className="text-muted font-normal">({form.metaTitle.length}/70)</span>
                            </label>
                            <input
                                value={form.metaTitle}
                                onChange={e => setForm(f => ({ ...f, metaTitle: e.target.value }))}
                                maxLength={70}
                                placeholder="Título para Google..."
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1">
                                OG Title <span className="text-muted font-normal">({form.ogTitle.length}/70)</span>
                            </label>
                            <input
                                value={form.ogTitle}
                                onChange={e => setForm(f => ({ ...f, ogTitle: e.target.value }))}
                                maxLength={70}
                                placeholder="Título para redes sociais..."
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1">
                                Meta Description <span className="text-muted font-normal">({form.metaDesc.length}/160)</span>
                            </label>
                            <textarea
                                value={form.metaDesc}
                                onChange={e => setForm(f => ({ ...f, metaDesc: e.target.value }))}
                                maxLength={160}
                                rows={2}
                                placeholder="Descrição para Google..."
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent resize-none"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1">
                                OG Description <span className="text-muted font-normal">({form.ogDesc.length}/200)</span>
                            </label>
                            <textarea
                                value={form.ogDesc}
                                onChange={e => setForm(f => ({ ...f, ogDesc: e.target.value }))}
                                maxLength={200}
                                rows={2}
                                placeholder="Descrição para redes sociais..."
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent resize-none"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1">OG Image URL</label>
                            <input
                                value={form.ogImageUrl}
                                onChange={e => setForm(f => ({ ...f, ogImageUrl: e.target.value }))}
                                placeholder="https://..."
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1">Canonical URL</label>
                            <input
                                value={form.canonicalUrl}
                                onChange={e => setForm(f => ({ ...f, canonicalUrl: e.target.value }))}
                                placeholder="https://..."
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.noIndex}
                                onChange={e => setForm(f => ({ ...f, noIndex: e.target.checked }))}
                                className="rounded"
                            />
                            <span className="text-sm text-foreground flex items-center gap-1.5">
                                <EyeOff size={13} className="text-muted" />
                                noindex (ocultar do Google)
                            </span>
                        </label>
                        <div className="flex gap-2">
                            <button onClick={cancelForm} className="px-3 py-1.5 text-sm text-muted hover:text-foreground transition-colors">Cancelar</button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-all"
                            >
                                {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats + Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="flex items-center gap-2 text-sm text-muted">
                    <Globe size={14} />
                    <span><strong className="text-foreground">{total}</strong> override{total !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex gap-1.5 ml-auto flex-wrap">
                    {['', 'artist', 'production', 'group', 'blog_post'].map(t => (
                        <button
                            key={t}
                            onClick={() => setTypeFilter(t)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                                typeFilter === t
                                    ? 'bg-foreground/10 text-foreground border border-foreground/20'
                                    : 'text-muted hover:text-foreground hover:bg-surface border border-transparent'
                            }`}
                        >
                            {t ? ENTITY_LABELS[t as EntityType] : 'Todos'}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted" /></div>
            ) : metas.length === 0 ? (
                <AdminEmptyState
                    icon={<Globe className="w-8 h-8 text-muted" />}
                    title="Nenhum override SEO"
                    description="Crie overrides para customizar meta tags de artistas, produções e posts."
                    bordered
                />
            ) : (
                <div className="space-y-2">
                    {metas.map(meta => (
                        <div key={meta.id} className="rounded-xl border border-border bg-surface overflow-hidden">
                            <div className="flex items-center gap-3 px-4 py-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ENTITY_COLORS[meta.entityType]}`}>
                                    {ENTITY_LABELS[meta.entityType]}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate">
                                        {meta.metaTitle || <span className="text-muted italic">sem título</span>}
                                    </p>
                                    <p className="text-[11px] text-muted font-mono truncate">{meta.entityId}</p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    {hasIssues(meta) && <AlertCircle size={13} className="text-amber-400" aria-label="Campos incompletos ou muito longos" />}
                                    {meta.noIndex && <EyeOff size={13} className="text-red-400" aria-label="noindex ativo" />}
                                    <Link href={ENTITY_LINKS[meta.entityType](meta.entityId)} target="_blank" className="p-1.5 text-muted hover:text-foreground transition-colors">
                                        <ExternalLink size={12} />
                                    </Link>
                                    <button onClick={() => startEdit(meta)} className="p-1.5 text-muted hover:text-foreground transition-colors">
                                        <Pencil size={12} />
                                    </button>
                                    <button onClick={() => handleDelete(meta)} disabled={deletingId === meta.id} className="p-1.5 text-muted hover:text-red-400 transition-colors">
                                        {deletingId === meta.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                    </button>
                                    <button onClick={() => setExpandedId(expandedId === meta.id ? null : meta.id)} className="p-1.5 text-muted hover:text-foreground transition-colors">
                                        {expandedId === meta.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    </button>
                                </div>
                            </div>
                            {expandedId === meta.id && (
                                <div className="border-t border-border px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                    {[
                                        ['Meta Title', meta.metaTitle, meta.metaTitle && meta.metaTitle.length > 60 ? 'text-amber-400' : ''],
                                        ['Meta Desc', meta.metaDesc, meta.metaDesc && meta.metaDesc.length > 155 ? 'text-amber-400' : ''],
                                        ['OG Title', meta.ogTitle, ''],
                                        ['OG Desc', meta.ogDesc, ''],
                                        ['OG Image', meta.ogImageUrl, ''],
                                        ['Canonical', meta.canonicalUrl, ''],
                                    ].map(([label, value, cls]) => (
                                        <div key={String(label)}>
                                            <span className="text-muted font-semibold">{label}: </span>
                                            <span className={`${cls || 'text-foreground'}`}>{value || <em className="text-muted">—</em>}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </AdminLayout>
    )
}
