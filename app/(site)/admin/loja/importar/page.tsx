'use client'

import { useState, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useToast } from '@/lib/hooks/useToast'
import { Search, Loader2, Package, CheckSquare, Square, Import, ExternalLink, Star } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
    kpop_album: 'Álbum K-Pop', lightstick: 'Lightstick', kbeauty: 'K-Beauty',
    kdrama: 'K-Drama', clothing: 'Roupas', acessorios: 'Acessórios',
    photocard: 'Photocard', alimenta: 'Alimentação', outros: 'Outros',
}

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS)

interface MLProduct {
    id: string
    name: string
    imageUrl: string
    affiliateUrl: string
    category: string
    store: string
    price: string | null
    rating: number | null
    reviewCount: number | null
}

export default function MLImportarPage() {
    const { addToast: toast } = useToast()
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [importing, setImporting] = useState(false)
    const [results, setResults] = useState<MLProduct[]>([])
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string>>({})

    const search = useCallback(async () => {
        if (!query.trim()) return
        setLoading(true)
        setResults([])
        setSelected(new Set())
        try {
            const res = await fetch(`/api/admin/ml-search?q=${encodeURIComponent(query)}&limit=50`)
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Erro na busca')
            setResults(data.results || [])
        } catch (e) {
            toast({ type: 'error', message: String(e) })
        } finally {
            setLoading(false)
        }
    }, [query, toast])

    const toggleAll = () => {
        if (selected.size === results.length) {
            setSelected(new Set())
        } else {
            setSelected(new Set(results.map(r => r.id)))
        }
    }

    const toggle = (id: string) => {
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
                        isActive:     true,
                        featured:     false,
                        position:     100,
                        tags:         ['mercado livre', 'kpop'],
                    }),
                })
                if (res.status === 201) created++
                else skipped++
            } catch {
                skipped++
            }
        }
        setImporting(false)
        toast({ type: 'success', message: `${created} importado(s)${skipped ? ` · ${skipped} erro(s)` : ''}` })
        setSelected(new Set())
    }

    return (
        <AdminLayout title="Importar do Mercado Livre">
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

                {/* Ações */}
                {results.length > 0 && (
                    <div className="flex items-center justify-between">
                        <button onClick={toggleAll} className="flex items-center gap-2 text-sm text-muted hover:text-foreground">
                            {selected.size === results.length
                                ? <CheckSquare className="w-4 h-4 text-accent" />
                                : <Square className="w-4 h-4" />}
                            {selected.size === results.length ? 'Desmarcar todos' : 'Selecionar todos'}
                            <span className="text-xs text-muted">({results.length} produtos)</span>
                        </button>
                        <button
                            onClick={importSelected}
                            disabled={selected.size === 0 || importing}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold disabled:opacity-40"
                        >
                            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Import className="w-4 h-4" />}
                            Importar {selected.size > 0 ? `${selected.size} selecionado(s)` : ''}
                        </button>
                    </div>
                )}

                {/* Grid de resultados */}
                {results.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center py-20 text-muted gap-3">
                        <Package className="w-10 h-10 opacity-30" />
                        <p className="text-sm">Busque produtos do Mercado Livre para importar</p>
                    </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {results.map(product => {
                        const isSelected = selected.has(product.id)
                        const cat = categoryOverrides[product.id] || product.category
                        return (
                            <div
                                key={product.id}
                                onClick={() => toggle(product.id)}
                                className={`relative rounded-xl border-2 cursor-pointer transition-all overflow-hidden ${
                                    isSelected
                                        ? 'border-accent shadow-md shadow-accent/20'
                                        : 'border-border hover:border-border/80'
                                }`}
                            >
                                {/* Checkbox overlay */}
                                <div className={`absolute top-2 left-2 z-10 w-5 h-5 rounded-md flex items-center justify-center ${
                                    isSelected ? 'bg-accent' : 'bg-black/40 backdrop-blur-sm'
                                }`}>
                                    {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                                </div>

                                {/* Imagem */}
                                <div className="aspect-square bg-surface flex items-center justify-center overflow-hidden">
                                    {product.imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
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
            </div>
        </AdminLayout>
    )
}
