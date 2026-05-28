'use client'

import { useState, useCallback, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import { Search, Loader2, Package, CheckSquare, Square, Import, ExternalLink, Star, ChevronDown, BadgeCheck } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
    kpop_album: 'Álbum K-Pop', lightstick: 'Lightstick', kbeauty: 'K-Beauty',
    kdrama: 'K-Drama', clothing: 'Roupas', acessorios: 'Acessórios',
    photocard: 'Photocard', alimenta: 'Alimentação', outros: 'Outros',
}

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS)

const QUICK_FILTERS = [
    { label: 'Álbuns K-Pop', query: 'album kpop' },
    { label: 'Lightstick', query: 'lightstick kpop' },
    { label: 'Photocard', query: 'photocard kpop' },
    { label: 'BTS', query: 'bts album' },
    { label: 'BLACKPINK', query: 'blackpink album' },
    { label: 'TWICE', query: 'twice album' },
    { label: 'Stray Kids', query: 'stray kids album' },
    { label: 'NewJeans', query: 'newjeans album' },
    { label: 'SEVENTEEN', query: 'seventeen album' },
    { label: 'Aespa', query: 'aespa album' },
]

interface MLProduct {
    id: string
    itemId: string
    name: string
    imageUrl: string
    affiliateUrl: string
    category: string
    store: string
    price: string | null
    rating: number | null
    reviewCount: number | null
    soldCount: string | null
    alreadyImported: boolean
}

export default function MLImportarPage() {
    const toast = useAdminToast()
    const [mounted, setMounted] = useState(false)
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [importing, setImporting] = useState(false)
    const [results, setResults] = useState<MLProduct[]>([])
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string>>({})
    const [total, setTotal] = useState(0)
    const [offset, setOffset] = useState(0)

    const fetchResults = useCallback(async (q: string, off: number, append = false) => {
        if (!q.trim()) return
        append ? setLoadingMore(true) : setLoading(true)
        if (!append) { setResults([]); setSelected(new Set()); setOffset(0) }
        try {
            const res = await fetch(`/api/admin/ml-search?q=${encodeURIComponent(q)}&limit=50&offset=${off}`)
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Erro na busca')
            setResults(prev => append ? [...prev, ...(data.results || [])] : (data.results || []))
            setTotal(data.total || 0)
            setOffset(off + 50)
        } catch (e) {
            toast.error(String(e))
        } finally {
            append ? setLoadingMore(false) : setLoading(false)
        }
    }, [toast])

    const search = useCallback(() => fetchResults(query, 0, false), [query, fetchResults])

    const applyQuickFilter = (q: string) => {
        setQuery(q)
        fetchResults(q, 0, false)
    }

    const loadMore = () => fetchResults(query, offset, true)

    const toggleAll = () => {
        const notImported = results.filter(r => !r.alreadyImported)
        if (selected.size === notImported.length && notImported.length > 0) {
            setSelected(new Set())
        } else {
            setSelected(new Set(notImported.map(r => r.id)))
        }
    }

    const toggle = (id: string, alreadyImported: boolean) => {
        if (alreadyImported) return
        setSelected(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    const importSelected = async () => {
        const toImport = results.filter(r => selected.has(r.id))
        if (!toImport.length) return
        setImporting(true)
        let created = 0
        let skipped = 0
        for (const p of toImport) {
            try {
                const res = await fetch('/api/admin/store', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name:         p.name,
                        imageUrl:     p.imageUrl,
                        affiliateUrl: p.affiliateUrl,
                        store:        'mercadolivre',
                        category:     categoryOverrides[p.id] || p.category,
                        price:        p.price,
                        rating:       p.rating,
                        reviewCount:  p.reviewCount,
                        soldCount:    p.soldCount,
                        externalId:   p.id,
                        isActive:     false,
                        isHidden:     false,
                        featured:     false,
                        position:     100,
                        tags:         ['mercado livre', 'kpop', 'pendente link afiliado'],
                    }),
                })
                if (res.ok) {
                    created++
                    setResults(prev => prev.map(r => r.id === p.id ? { ...r, alreadyImported: true } : r))
                } else skipped++
            } catch {
                skipped++
            }
        }
        setImporting(false)
        setSelected(new Set())
        toast.success(`${created} rascunho(s) importado(s)${skipped ? ` · ${skipped} erro(s)` : ''}`)
    }

    const notImportedCount = results.filter(r => !r.alreadyImported).length

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <AdminLayout title="Importar do Mercado Livre" subtitle="Importe produtos ativos como rascunho; publique depois de colar o link oficial de afiliado">
                <div className="flex flex-col items-center justify-center py-20 text-muted gap-3">
                    <Loader2 className="w-8 h-8 animate-spin opacity-40" />
                    <p className="text-sm">Carregando importador...</p>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout title="Importar do Mercado Livre" subtitle="Importe produtos ativos como rascunho; publique depois de colar o link oficial de afiliado">
            <div className="space-y-6">

                {/* Busca */}
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && search()}
                            placeholder="album kpop bts, lightstick blackpink..."
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                        />
                    </div>
                    <button
                        onClick={search}
                        disabled={loading || !query.trim()}
                        className="px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        Buscar
                    </button>
                </div>

                {/* Quick filters */}
                <div className="flex flex-wrap gap-2">
                    {QUICK_FILTERS.map(f => (
                        <button
                            key={f.query}
                            onClick={() => applyQuickFilter(f.query)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                                query === f.query
                                    ? 'bg-accent text-white border-accent'
                                    : 'bg-surface border-border text-muted hover:border-accent/50 hover:text-foreground'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Ações */}
                {results.length > 0 && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={toggleAll} className="flex items-center gap-2 text-sm text-muted hover:text-foreground">
                                {selected.size > 0 && selected.size === notImportedCount
                                    ? <CheckSquare className="w-4 h-4 text-accent" />
                                    : <Square className="w-4 h-4" />}
                                {selected.size > 0 && selected.size === notImportedCount ? 'Desmarcar todos' : 'Selecionar todos'}
                            </button>
                            <span className="text-xs text-muted">
                                {results.length} exibidos · {total.toLocaleString()} no ML
                                {results.filter(r => r.alreadyImported).length > 0 && (
                                    <span className="ml-1 text-green-500">· {results.filter(r => r.alreadyImported).length} já importados</span>
                                )}
                            </span>
                        </div>
                        <button
                            onClick={importSelected}
                            disabled={selected.size === 0 || importing}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold disabled:opacity-40"
                        >
                            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Import className="w-4 h-4" />}
                            Importar rascunho {selected.size > 0 ? `(${selected.size})` : ''}
                        </button>
                    </div>
                )}

                {/* Grid de resultados */}
                <div className={results.length === 0 && !loading ? 'flex flex-col items-center justify-center py-20 text-muted gap-3' : 'hidden'}>
                    <Package className="w-10 h-10 opacity-30" />
                    <p className="text-sm">Busque produtos ou use um filtro rápido acima</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {results.map(product => {
                        const isSelected = selected.has(product.id)
                        const cat = categoryOverrides[product.id] || product.category
                        return (
                            <div
                                key={product.id}
                                onClick={() => toggle(product.id, product.alreadyImported)}
                                className={`relative rounded-xl border-2 transition-all overflow-hidden ${
                                    product.alreadyImported
                                        ? 'border-green-500/40 opacity-60 cursor-default'
                                        : isSelected
                                            ? 'border-accent shadow-md shadow-accent/20 cursor-pointer'
                                            : 'border-border hover:border-border/80 cursor-pointer'
                                }`}
                            >
                                {/* Já importado badge */}
                                {product.alreadyImported && (
                                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-green-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                                        <BadgeCheck className="w-3 h-3" />
                                        Importado
                                    </div>
                                )}

                                {/* Checkbox overlay */}
                                {!product.alreadyImported && (
                                    <div className={`absolute top-2 left-2 z-10 w-5 h-5 rounded-md flex items-center justify-center ${
                                        isSelected ? 'bg-accent' : 'bg-black/40 backdrop-blur-sm'
                                    }`}>
                                        {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                                    </div>
                                )}

                                {/* Imagem */}
                                <div className="aspect-square bg-surface flex items-center justify-center overflow-hidden">
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="w-full h-full object-contain p-2"
                                        />
                                    ) : (
                                        <Package className="w-8 h-8 text-muted opacity-30" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-2 space-y-1.5" onClick={e => e.stopPropagation()}>
                                    <p className="text-[11px] font-semibold text-foreground leading-tight line-clamp-2">
                                        {product.name}
                                    </p>
                                    {product.price && (
                                        <p className="text-[12px] font-black text-green-500">{product.price}</p>
                                    )}
                                    {product.rating && (
                                        <div className="flex items-center gap-1">
                                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                            <span className="text-[10px] text-muted">{product.rating}{product.reviewCount ? ` (${product.reviewCount})` : ''}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <select
                                            value={cat}
                                            onChange={e => setCategoryOverrides(prev => ({ ...prev, [product.id]: e.target.value }))}
                                            className="flex-1 text-[10px] rounded-lg border border-border bg-surface px-1.5 py-1 focus:outline-none"
                                        >
                                            {CATEGORY_OPTIONS.map(([val, label]) => (
                                                <option key={val} value={val}>{label}</option>
                                            ))}
                                        </select>
                                        <a
                                            href={product.affiliateUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1 rounded-lg border border-border hover:border-accent/50 text-muted hover:text-accent transition-colors"
                                            title="Ver no ML"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Carregar mais */}
                {results.length > 0 && offset < total && (
                    <div className="flex justify-center pt-2">
                        <button
                            onClick={loadMore}
                            disabled={loadingMore}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-border bg-surface text-sm font-semibold text-muted hover:text-foreground hover:border-accent/50 disabled:opacity-40 transition-colors"
                        >
                            {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                            Carregar mais ({Math.min(50, total - offset)} de {(total - offset).toLocaleString()} restantes)
                        </button>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
