'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminButton } from '@/components/admin/AdminButton'
import { useToast } from '@/lib/hooks/useToast'
import {
    Plus, Pencil, Trash2, Eye, EyeOff, Star, StarOff,
    ShoppingBag, ExternalLink, Package, RefreshCw, X, Check,
} from 'lucide-react'
import Image from 'next/image'

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface StoreProduct {
    id: string
    name: string
    description: string | null
    price: string
    originalPrice: string | null
    imageUrl: string
    affiliateUrl: string
    store: string
    category: string
    badge: string | null
    rating: number | null
    soldCount: string | null
    isActive: boolean
    featured: boolean
    position: number
    tags: string[]
    clickCount: number
    createdAt: string
}

const CATEGORIES: Record<string, string> = {
    kpop_album:   '💿 Álbum K-Pop',
    lightstick:   '💡 Lightstick',
    kbeauty:      '✨ K-Beauty',
    kdrama:       '📺 K-Drama',
    clothing:     '👕 Roupas',
    acessorios:   '🧣 Acessórios',
    photocard:    '🃏 Photocard',
    outros:       '📦 Outros',
}

const STORES: Record<string, { label: string; color: string }> = {
    shopee:       { label: 'Shopee',        color: 'bg-orange-500/10 text-orange-500' },
    amazon:       { label: 'Amazon',        color: 'bg-yellow-500/10 text-yellow-600' },
    mercadolivre: { label: 'Mercado Livre', color: 'bg-yellow-400/10 text-yellow-500' },
    outro:        { label: 'Outro',         color: 'bg-muted/10 text-muted' },
}

const EMPTY_FORM = {
    name: '', description: '', price: '', originalPrice: '', imageUrl: '',
    affiliateUrl: '', store: 'shopee', category: 'kpop_album', badge: '',
    rating: '', soldCount: '', isActive: true, featured: false, position: 0, tags: '',
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AdminLojaPage() {
    const [products, setProducts] = useState<StoreProduct[]>([])
    const [loading, setLoading] = useState(true)
    const [filterCategory, setFilterCategory] = useState('')
    const [filterStore, setFilterStore] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const { addToast: toast } = useToast()

    const load = useCallback(async () => {
        setLoading(true)
        const params = new URLSearchParams()
        if (filterCategory) params.set('category', filterCategory)
        if (filterStore) params.set('store', filterStore)
        const res = await fetch(`/api/admin/store?${params}`)
        if (res.ok) setProducts(await res.json())
        setLoading(false)
    }, [filterCategory, filterStore])

    useEffect(() => { load() }, [load])

    const openNew = () => {
        setEditingId(null)
        setForm(EMPTY_FORM)
        setShowForm(true)
    }

    const openEdit = (p: StoreProduct) => {
        setEditingId(p.id)
        setForm({
            name: p.name, description: p.description || '', price: p.price,
            originalPrice: p.originalPrice || '', imageUrl: p.imageUrl,
            affiliateUrl: p.affiliateUrl, store: p.store, category: p.category,
            badge: p.badge || '', rating: p.rating?.toString() || '',
            soldCount: p.soldCount || '', isActive: p.isActive, featured: p.featured,
            position: p.position, tags: p.tags.join(', '),
        })
        setShowForm(true)
    }

    const closeForm = () => { setShowForm(false); setEditingId(null) }

    const save = async () => {
        if (!form.name || !form.price || !form.imageUrl || !form.affiliateUrl) {
            toast({ type: 'error', message: 'Preencha os campos obrigatórios' })
            return
        }
        setSaving(true)
        const payload = {
            ...form,
            tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            rating: form.rating || null,
            originalPrice: form.originalPrice || null,
            badge: form.badge || null,
            description: form.description || null,
            soldCount: form.soldCount || null,
        }
        const url = editingId ? `/api/admin/store/${editingId}` : '/api/admin/store'
        const method = editingId ? 'PATCH' : 'POST'
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        if (res.ok) {
            toast({ type: 'success', message: editingId ? 'Produto atualizado' : 'Produto criado' })
            closeForm()
            load()
        } else {
            const err = await res.json().catch(() => ({}))
            toast({ type: 'error', message: err.error || 'Erro ao salvar' })
        }
        setSaving(false)
    }

    const toggle = async (p: StoreProduct, field: 'isActive' | 'featured') => {
        await fetch(`/api/admin/store/${p.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [field]: !p[field] }),
        })
        load()
    }

    const remove = async (p: StoreProduct) => {
        if (!confirm(`Excluir "${p.name}"?`)) return
        await fetch(`/api/admin/store/${p.id}`, { method: 'DELETE' })
        toast({ type: 'success', message: 'Produto removido' })
        load()
    }

    // Agrupar por categoria
    const grouped = Object.entries(
        products.reduce<Record<string, StoreProduct[]>>((acc, p) => {
            if (!acc[p.category]) acc[p.category] = []
            acc[p.category].push(p)
            return acc
        }, {})
    ).sort(([a], [b]) => a.localeCompare(b))

    return (
        <AdminLayout title="Loja — Produtos Afiliados">
            {/* Barra de ações */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <AdminButton onClick={openNew}>
                    <Plus className="w-4 h-4 inline mr-1" />Novo produto
                </AdminButton>
                <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    className="text-sm bg-surface border border-border rounded-lg px-3 py-1.5 text-foreground"
                >
                    <option value="">Todas as categorias</option>
                    {Object.entries(CATEGORIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <select
                    value={filterStore}
                    onChange={e => setFilterStore(e.target.value)}
                    className="text-sm bg-surface border border-border rounded-lg px-3 py-1.5 text-foreground"
                >
                    <option value="">Todas as lojas</option>
                    {Object.entries(STORES).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
                </select>
                <button onClick={load} className="text-muted hover:text-foreground p-1.5 rounded-lg hover:bg-surface transition-colors">
                    <RefreshCw className="w-4 h-4" />
                </button>
                <span className="text-xs text-muted ml-auto">{products.length} produto{products.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Modal de formulário */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-2xl bg-background border border-border rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="text-base font-bold text-foreground">
                                {editingId ? 'Editar produto' : 'Novo produto'}
                            </h2>
                            <button onClick={closeForm} className="text-muted hover:text-foreground p-1 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Nome */}
                            <div className="sm:col-span-2">
                                <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1">Nome do produto *</label>
                                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
                                    placeholder="BTS - Anthology Album [Proof]" />
                            </div>
                            {/* URL da imagem */}
                            <div className="sm:col-span-2">
                                <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1">URL da imagem *</label>
                                <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
                                    placeholder="https://..." />
                            </div>
                            {/* URL do afiliado */}
                            <div className="sm:col-span-2">
                                <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1">Link de afiliado *</label>
                                <input value={form.affiliateUrl} onChange={e => setForm(f => ({ ...f, affiliateUrl: e.target.value }))}
                                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
                                    placeholder="https://shope.ee/..." />
                            </div>
                            {/* Preço */}
                            <div>
                                <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1">Preço *</label>
                                <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
                                    placeholder="R$ 89,90" />
                            </div>
                            {/* Preço original */}
                            <div>
                                <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1">Preço original (tachado)</label>
                                <input value={form.originalPrice} onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))}
                                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
                                    placeholder="R$ 129,90" />
                            </div>
                            {/* Loja */}
                            <div>
                                <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1">Loja</label>
                                <select value={form.store} onChange={e => setForm(f => ({ ...f, store: e.target.value }))}
                                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-foreground">
                                    {Object.entries(STORES).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
                                </select>
                            </div>
                            {/* Categoria */}
                            <div>
                                <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1">Categoria *</label>
                                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-foreground">
                                    {Object.entries(CATEGORIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                </select>
                            </div>
                            {/* Badge */}
                            <div>
                                <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1">Badge</label>
                                <input value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}
                                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
                                    placeholder="-30% · Top vendas · Novo" />
                            </div>
                            {/* Rating */}
                            <div>
                                <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1">Rating (0-5)</label>
                                <input value={form.rating} onChange={e => setForm(f => ({ ...f, rating: e.target.value }))}
                                    type="number" min="0" max="5" step="0.1"
                                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
                                    placeholder="4.8" />
                            </div>
                            {/* Vendidos */}
                            <div>
                                <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1">Vendidos</label>
                                <input value={form.soldCount} onChange={e => setForm(f => ({ ...f, soldCount: e.target.value }))}
                                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
                                    placeholder="2.3k" />
                            </div>
                            {/* Posição */}
                            <div>
                                <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1">Posição (ordem)</label>
                                <input value={form.position} onChange={e => setForm(f => ({ ...f, position: parseInt(e.target.value) || 0 }))}
                                    type="number" min="0"
                                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-foreground" />
                            </div>
                            {/* Tags */}
                            <div className="sm:col-span-2">
                                <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1">Tags (separadas por vírgula)</label>
                                <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
                                    placeholder="BTS, kpop, album" />
                            </div>
                            {/* Descrição */}
                            <div className="sm:col-span-2">
                                <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1">Descrição (opcional)</label>
                                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    rows={2}
                                    className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-foreground resize-none"
                                    placeholder="Descrição curta do produto..." />
                            </div>
                            {/* Checkboxes */}
                            <div className="sm:col-span-2 flex gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                                        className="w-4 h-4 rounded" />
                                    <span className="text-sm text-foreground">Ativo (visível na loja)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
                                        className="w-4 h-4 rounded" />
                                    <span className="text-sm text-foreground">Destaque (homepage)</span>
                                </label>
                            </div>
                        </div>
                        {/* Preview da imagem */}
                        {form.imageUrl && (
                            <div className="px-6 pb-2">
                                <p className="text-xs text-muted mb-2">Preview da imagem:</p>
                                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                                    <Image src={form.imageUrl} alt="preview" fill className="object-cover"
                                        onError={() => {}} unoptimized />
                                </div>
                            </div>
                        )}
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                            <button onClick={closeForm} className="text-sm text-muted hover:text-foreground px-4 py-2">
                                Cancelar
                            </button>
                            <AdminButton onClick={save} disabled={saving}>
                                {saving
                                    ? <><RefreshCw className="w-4 h-4 animate-spin inline mr-1" />Salvando...</>
                                    : <><Check className="w-4 h-4 inline mr-1" />{editingId ? 'Atualizar' : 'Criar produto'}</>
                                }
                            </AdminButton>
                        </div>
                    </div>
                </div>
            )}

            {/* Lista de produtos agrupada por categoria */}
            {loading ? (
                <div className="flex items-center justify-center py-20 text-muted">
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Carregando...
                </div>
            ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted gap-3">
                    <Package className="w-10 h-10 opacity-30" />
                    <p className="text-sm">Nenhum produto cadastrado ainda.</p>
                    <AdminButton onClick={openNew}>
                        <Plus className="w-4 h-4 inline mr-1" />Adicionar primeiro produto
                    </AdminButton>
                </div>
            ) : (
                <div className="space-y-8">
                    {grouped.map(([category, items]) => (
                        <div key={category}>
                            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                                {CATEGORIES[category] || category}
                                <span className="text-xs font-normal text-muted">({items.length})</span>
                            </h2>
                            <div className="rounded-xl border border-border overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-surface border-b border-border text-xs text-muted">
                                            <th className="text-left px-4 py-2.5 font-semibold">Produto</th>
                                            <th className="text-left px-3 py-2.5 font-semibold hidden sm:table-cell">Loja</th>
                                            <th className="text-left px-3 py-2.5 font-semibold">Preço</th>
                                            <th className="text-left px-3 py-2.5 font-semibold hidden md:table-cell">Pos.</th>
                                            <th className="text-left px-3 py-2.5 font-semibold hidden md:table-cell">Cliques</th>
                                            <th className="text-right px-4 py-2.5 font-semibold">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map(p => (
                                            <tr key={p.id} className={`border-b border-border/50 last:border-0 hover:bg-surface/50 transition-colors ${!p.isActive ? 'opacity-50' : ''}`}>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted/10">
                                                            <Image src={p.imageUrl} alt={p.name} fill className="object-cover" unoptimized />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-medium text-foreground line-clamp-1">{p.name}</p>
                                                            {p.badge && <span className="text-[10px] bg-orange-500/10 text-orange-500 px-1.5 py-0.5 rounded-full">{p.badge}</span>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 hidden sm:table-cell">
                                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STORES[p.store]?.color || 'bg-muted/10 text-muted'}`}>
                                                        {STORES[p.store]?.label || p.store}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <p className="text-xs font-bold text-orange-500">{p.price}</p>
                                                    {p.originalPrice && <p className="text-[10px] text-muted line-through">{p.originalPrice}</p>}
                                                </td>
                                                <td className="px-3 py-3 hidden md:table-cell">
                                                    <span className="text-xs text-muted">{p.position}</span>
                                                </td>
                                                <td className="px-3 py-3 hidden md:table-cell">
                                                    <span className={`text-xs font-medium ${p.clickCount > 0 ? 'text-orange-500' : 'text-muted'}`}>
                                                        {p.clickCount > 0 ? `🔗 ${p.clickCount}` : '—'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <a href={p.affiliateUrl} target="_blank" rel="noopener noreferrer"
                                                            className="p-1.5 text-muted hover:text-foreground rounded-lg hover:bg-surface transition-colors"
                                                            title="Abrir link">
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                        </a>
                                                        <button onClick={() => toggle(p, 'featured')}
                                                            className={`p-1.5 rounded-lg hover:bg-surface transition-colors ${p.featured ? 'text-yellow-400' : 'text-muted hover:text-foreground'}`}
                                                            title={p.featured ? 'Remover destaque' : 'Destacar'}>
                                                            {p.featured ? <Star className="w-3.5 h-3.5 fill-yellow-400" /> : <StarOff className="w-3.5 h-3.5" />}
                                                        </button>
                                                        <button onClick={() => toggle(p, 'isActive')}
                                                            className={`p-1.5 rounded-lg hover:bg-surface transition-colors ${p.isActive ? 'text-accent' : 'text-muted hover:text-foreground'}`}
                                                            title={p.isActive ? 'Desativar' : 'Ativar'}>
                                                            {p.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                                        </button>
                                                        <button onClick={() => openEdit(p)}
                                                            className="p-1.5 text-muted hover:text-foreground rounded-lg hover:bg-surface transition-colors"
                                                            title="Editar">
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button onClick={() => remove(p)}
                                                            className="p-1.5 text-muted hover:text-red-500 rounded-lg hover:bg-surface transition-colors"
                                                            title="Excluir">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </AdminLayout>
    )
}
