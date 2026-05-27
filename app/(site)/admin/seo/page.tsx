'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminEmptyState, ConfirmDialog } from '@/components/admin'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import {
    Globe, Plus, Trash2, Loader2, Pencil, X, Check,
    AlertCircle, ExternalLink, EyeOff, ChevronDown, ChevronUp, Search,
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

interface EntitySuggestion {
    id: string          // CUID ou slug (blog_post usa slug)
    label: string       // nome para exibir
    imageUrl?: string   // thumbnail opcional
    suggested: {        // valores para pré-preencher o formulário
        metaTitle: string
        metaDesc: string
        ogImageUrl: string
    }
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
    entityLabel: string   // apenas para exibição
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
    entityLabel: '',
    metaTitle: '',
    metaDesc: '',
    ogTitle: '',
    ogDesc: '',
    ogImageUrl: '',
    canonicalUrl: '',
    noIndex: false,
}

// ── Busca de entidades por tipo ───────────────────────────────────────────────

async function searchEntities(type: EntityType, query: string): Promise<EntitySuggestion[]> {
    if (!query.trim()) return []
    try {
        if (type === 'artist') {
            const res = await fetch(`/api/admin/artists?search=${encodeURIComponent(query)}&limit=8`)
            const data = await res.json()
            return (data.data ?? []).map((a: { id: string; nameRomanized: string; primaryImageUrl?: string }) => ({
                id: a.id,
                label: a.nameRomanized,
                imageUrl: a.primaryImageUrl,
                suggested: {
                    metaTitle: `${a.nameRomanized} | HallyuHub`,
                    metaDesc: `Discografia, trajetória e informações sobre ${a.nameRomanized} no HallyuHub.`,
                    ogImageUrl: a.primaryImageUrl ?? '',
                },
            }))
        }
        if (type === 'group') {
            const res = await fetch(`/api/admin/groups?search=${encodeURIComponent(query)}&limit=8`)
            const data = await res.json()
            return (data.data ?? []).map((g: { id: string; name: string; profileImageUrl?: string }) => ({
                id: g.id,
                label: g.name,
                imageUrl: g.profileImageUrl,
                suggested: {
                    metaTitle: `${g.name} | HallyuHub`,
                    metaDesc: `Trajetória, discografia e membros do grupo ${g.name} no HallyuHub.`,
                    ogImageUrl: g.profileImageUrl ?? '',
                },
            }))
        }
        if (type === 'production') {
            const res = await fetch(`/api/admin/productions?search=${encodeURIComponent(query)}&limit=8`)
            const data = await res.json()
            return (data.data ?? []).map((p: { id: string; titlePt?: string; titleKr?: string; imageUrl?: string }) => ({
                id: p.id,
                label: p.titlePt || p.titleKr || p.id,
                imageUrl: p.imageUrl,
                suggested: {
                    metaTitle: `${p.titlePt || p.titleKr} | HallyuHub`,
                    metaDesc: `Informações, elenco e avaliação de ${p.titlePt || p.titleKr} no HallyuHub.`,
                    ogImageUrl: p.imageUrl ?? '',
                },
            }))
        }
        if (type === 'blog_post') {
            const res = await fetch(`/api/blog/posts?search=${encodeURIComponent(query)}&limit=8`)
            const data = await res.json()
            return (data.data ?? []).map((p: { slug: string; title: string; coverImageUrl?: string; excerpt?: string }) => ({
                id: p.slug,   // blog_post usa slug como entityId
                label: p.title,
                imageUrl: p.coverImageUrl,
                suggested: {
                    metaTitle: p.title.length <= 60 ? p.title : p.title.slice(0, 57) + '...',
                    metaDesc: p.excerpt ?? '',
                    ogImageUrl: p.coverImageUrl ?? '',
                },
            }))
        }
        return []
    } catch { return [] }
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function SeoAdminPage() {
    const toast = useAdminToast()
    const [metas,        setMetas]        = useState<SeoMeta[]>([])
    const [total,        setTotal]        = useState(0)
    const [loading,      setLoading]      = useState(true)
    const [typeFilter,   setTypeFilter]   = useState<string>('')
    const [showForm,     setShowForm]     = useState(false)
    const [form,         setForm]         = useState<FormState>(EMPTY_FORM)
    const [editId,       setEditId]       = useState<string | null>(null)
    const [saving,       setSaving]       = useState(false)
    const [deletingId,   setDeletingId]   = useState<string | null>(null)
    const [confirmDelete, setConfirmDelete] = useState<SeoMeta | null>(null)
    const [expandedId,   setExpandedId]   = useState<string | null>(null)

    // busca de entidade
    const [entityQuery,     setEntityQuery]     = useState('')
    const [suggestions,     setSuggestions]     = useState<EntitySuggestion[]>([])
    const [searchLoading,   setSearchLoading]   = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const searchBoxRef = useRef<HTMLDivElement>(null)

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
            toast.error('Erro ao carregar overrides SEO')
        } finally {
            setLoading(false)
        }
    }, [typeFilter, toast])

    useEffect(() => { load() }, [load])

    // fechar dropdown ao clicar fora
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    // debounce da busca
    useEffect(() => {
        if (!entityQuery.trim()) { setSuggestions([]); setShowSuggestions(false); return }
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(async () => {
            setSearchLoading(true)
            const results = await searchEntities(form.entityType, entityQuery)
            setSuggestions(results)
            setShowSuggestions(true)
            setSearchLoading(false)
        }, 300)
    }, [entityQuery, form.entityType])

    function selectSuggestion(s: EntitySuggestion) {
        setForm(f => ({
            ...f,
            entityId:    s.id,
            entityLabel: s.label,
            // pré-preencher apenas se o campo ainda estiver vazio
            metaTitle:   f.metaTitle  || s.suggested.metaTitle,
            metaDesc:    f.metaDesc   || s.suggested.metaDesc,
            ogTitle:     f.ogTitle    || s.suggested.metaTitle,
            ogDesc:      f.ogDesc     || s.suggested.metaDesc,
            ogImageUrl:  f.ogImageUrl || s.suggested.ogImageUrl,
        }))
        setEntityQuery(s.label)
        setShowSuggestions(false)
    }

    function handleEntityTypeChange(type: EntityType) {
        setForm(f => ({ ...f, entityType: type, entityId: '', entityLabel: '' }))
        setEntityQuery('')
        setSuggestions([])
    }

    function startEdit(meta: SeoMeta) {
        setForm({
            entityType:   meta.entityType,
            entityId:     meta.entityId,
            entityLabel:  meta.metaTitle ?? meta.entityId,
            metaTitle:    meta.metaTitle ?? '',
            metaDesc:     meta.metaDesc ?? '',
            ogTitle:      meta.ogTitle ?? '',
            ogDesc:       meta.ogDesc ?? '',
            ogImageUrl:   meta.ogImageUrl ?? '',
            canonicalUrl: meta.canonicalUrl ?? '',
            noIndex:      meta.noIndex,
        })
        setEntityQuery(meta.metaTitle ?? meta.entityId)
        setEditId(meta.id)
        setShowForm(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    function cancelForm() {
        setShowForm(false)
        setEditId(null)
        setForm(EMPTY_FORM)
        setEntityQuery('')
        setSuggestions([])
    }

    async function handleSave() {
        if (!form.entityId.trim()) { toast.error('Selecione uma entidade'); return }
        setSaving(true)
        try {
            const res = await fetch('/api/admin/seo', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entityType:   form.entityType,
                    entityId:     form.entityId,
                    metaTitle:    form.metaTitle   || null,
                    metaDesc:     form.metaDesc    || null,
                    ogTitle:      form.ogTitle     || null,
                    ogDesc:       form.ogDesc      || null,
                    ogImageUrl:   form.ogImageUrl  || null,
                    canonicalUrl: form.canonicalUrl || null,
                    noIndex:      form.noIndex,
                }),
            })
            if (!res.ok) { toast.error('Erro ao salvar'); return }
            toast.success(editId ? 'Override atualizado' : 'Override criado')
            cancelForm()
            load()
        } catch { toast.error('Erro de rede') }
        finally { setSaving(false) }
    }

    function handleDelete(meta: SeoMeta) {
        if (deletingId) return
        setConfirmDelete(meta)
    }

    async function executeDelete(meta: SeoMeta) {
        setDeletingId(meta.id)
        try {
            await fetch(`/api/admin/seo?entityType=${meta.entityType}&entityId=${meta.entityId}`, { method: 'DELETE' })
            toast.success('Override removido')
            load()
        } catch { toast.error('Erro ao remover') }
        finally { setDeletingId(null) }
    }

    const hasIssues = (meta: SeoMeta) =>
        !meta.metaTitle || !meta.metaDesc || meta.metaTitle.length > 60 || meta.metaDesc.length > 155

    const titleLen = form.metaTitle.length
    const descLen  = form.metaDesc.length

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

                    {/* Seleção de entidade */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1">Tipo</label>
                            <select
                                value={form.entityType}
                                onChange={e => handleEntityTypeChange(e.target.value as EntityType)}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                            >
                                {(Object.keys(ENTITY_LABELS) as EntityType[]).map(t => (
                                    <option key={t} value={t}>{ENTITY_LABELS[t]}</option>
                                ))}
                            </select>
                        </div>

                        {/* Busca por nome */}
                        <div ref={searchBoxRef} className="relative">
                            <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1">
                                {ENTITY_LABELS[form.entityType]}
                                {form.entityId && <span className="ml-1 font-mono text-accent normal-case">✓ selecionado</span>}
                            </label>
                            <div className="relative">
                                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                                <input
                                    value={entityQuery}
                                    onChange={e => { setEntityQuery(e.target.value); if (form.entityId) setForm(f => ({ ...f, entityId: '', entityLabel: '' })) }}
                                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                    placeholder={`Buscar ${ENTITY_LABELS[form.entityType].toLowerCase()}...`}
                                    className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
                                />
                                {searchLoading && <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted animate-spin" />}
                            </div>
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute z-50 top-full mt-1 w-full bg-surface border border-border rounded-xl shadow-lg overflow-hidden">
                                    {suggestions.map(s => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => selectSuggestion(s)}
                                            className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-surface-hover text-left transition-colors"
                                        >
                                            {s.imageUrl && (
                                                <img src={s.imageUrl} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0" />
                                            )}
                                            <span className="text-sm text-foreground truncate">{s.label}</span>
                                            <span className="ml-auto text-[10px] text-muted font-mono shrink-0 truncate max-w-[80px]">{s.id.slice(0, 8)}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {showSuggestions && suggestions.length === 0 && !searchLoading && entityQuery.trim() && (
                                <div className="absolute z-50 top-full mt-1 w-full bg-surface border border-border rounded-xl shadow-lg px-3 py-2.5">
                                    <span className="text-sm text-muted">Nenhum resultado para &ldquo;{entityQuery}&rdquo;</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Campos SEO */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1">
                                Meta Title
                                <span className={`ml-1 font-normal ${titleLen > 60 ? 'text-amber-400' : titleLen > 50 ? 'text-yellow-500' : ''}`}>
                                    ({titleLen}/60)
                                </span>
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
                                OG Title
                                <span className="ml-1 font-normal text-muted">({form.ogTitle.length}/70)</span>
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
                                Meta Description
                                <span className={`ml-1 font-normal ${descLen > 155 ? 'text-amber-400' : descLen > 130 ? 'text-yellow-500' : ''}`}>
                                    ({descLen}/155)
                                </span>
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
                                OG Description
                                <span className="ml-1 font-normal text-muted">({form.ogDesc.length}/200)</span>
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

                    {/* Preview rápido */}
                    {form.metaTitle && (
                        <div className="p-3 rounded-lg bg-background border border-border space-y-0.5">
                            <p className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1">Preview Google</p>
                            <p className="text-blue-400 text-sm font-medium leading-tight truncate">{form.metaTitle}</p>
                            {form.metaDesc && <p className="text-xs text-muted leading-relaxed line-clamp-2">{form.metaDesc}</p>}
                        </div>
                    )}

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
                                disabled={saving || !form.entityId}
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
                    {(['', 'artist', 'production', 'group', 'blog_post'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTypeFilter(t)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                                typeFilter === t
                                    ? 'bg-foreground/10 text-foreground border border-foreground/20'
                                    : 'text-muted hover:text-foreground hover:bg-surface border border-transparent'
                            }`}
                        >
                            {t ? ENTITY_LABELS[t] : 'Todos'}
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
            <ConfirmDialog
                open={!!confirmDelete}
                title="Remover override SEO?"
                confirmLabel="Remover"
                variant="danger"
                onConfirm={async () => { await executeDelete(confirmDelete!); setConfirmDelete(null) }}
                onCancel={() => setConfirmDelete(null)}
            />
        </AdminLayout>
    )
}
