'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminButton, AdminLinkButton, AdminModalOverlay, AdminTableSkeleton, AdminEmptyState, ConfirmDialog } from '@/components/admin'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import {
    Plus, Pencil, Trash2, Eye, EyeOff, Star, StarOff,
    ExternalLink, Package, RefreshCw, Check, Download, Tag,
    MousePointerClick, TrendingUp, CircleAlert,
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
    isHidden: boolean
    featured: boolean
    position: number
    tags: string[]
    clickCount: number
    createdAt: string
}

interface StorePerformance {
    periodDays: number
    clicks: number
    placements: Array<{ placement: string; label: string; clicks: number }>
}

interface LojaMetrics {
    activeProducts: number
    draftProducts: number
    totalProducts: number
    mlMissingOfficialLink: number
    pendingCandidates: number
    approvedCandidates: number
    mercadoLivreProducts: number
    impressions30d: number
    clicks30d: number
    clicks7d: number
    ctr30d: number | null
}

const CATEGORIES: Record<string, string> = {
    kpop_album:   '💿 Álbum K-Pop',
    lightstick:   '💡 Lightstick',
    kbeauty:      '✨ K-Beauty',
    kdrama:       '📺 K-Drama',
    clothing:     '👕 Roupas',
    acessorios:   '🧣 Acessórios',
    photocard:    '🃏 Photocard',
    alimenta:     '🍜 Alimentação',
    outros:       '📦 Outros',
}

const STORES: Record<string, { label: string; color: string }> = {
    shopee:       { label: 'Shopee',          color: 'bg-orange-500/10 text-orange-500' },
    amazon:       { label: 'Amazon',          color: 'bg-yellow-500/10 text-yellow-600' },
    mercadolivre: { label: 'Mercado Livre',   color: 'bg-yellow-400/10 text-yellow-500' },
    magalu:       { label: 'Magazine Luiza',  color: 'bg-blue-500/10 text-blue-500'     },
    shein:        { label: 'Shein',           color: 'bg-gray-900/10 text-gray-900'     },
    outro:        { label: 'Outro',           color: 'bg-muted/10 text-muted'           },
}

const EMPTY_FORM = {
    name: '', description: '', price: '', originalPrice: '', imageUrl: '',
    affiliateUrl: '', store: 'shopee', category: 'kpop_album', badge: '',
    rating: '', soldCount: '', isActive: true, featured: false, position: 0, tags: '',
}

function isOfficialMercadoLivreAffiliateUrl(value: string): boolean {
    try {
        const url = new URL(value)
        const host = url.hostname.replace(/^www\./, '')
        if (host === 'meli.la') return true
        if (host !== 'mercadolivre.com.br') return false
        return url.pathname.toLowerCase().startsWith('/social/')
            && Boolean(url.searchParams.get('matt_word'))
            && Boolean(url.searchParams.get('ref'))
    } catch {
        return false
    }
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
    const [confirmRemove, setConfirmRemove] = useState<StoreProduct | null>(null)
    const [saving, setSaving] = useState(false)
    const [performance, setPerformance] = useState<StorePerformance | null>(null)
    const [metrics, setMetrics] = useState<LojaMetrics | null>(null)
    const toast = useAdminToast()

    const load = useCallback(async () => {
        setLoading(true)
        const params = new URLSearchParams()
        if (filterCategory) params.set('category', filterCategory)
        if (filterStore) params.set('store', filterStore)
        const [productsResponse, performanceResponse, metricsResponse] = await Promise.all([
            fetch(`/api/admin/store?${params}`),
            fetch('/api/admin/store/performance'),
            fetch('/api/admin/loja/metrics'),
        ])
        if (productsResponse.ok) setProducts(await productsResponse.json())
        if (performanceResponse.ok) setPerformance(await performanceResponse.json())
        if (metricsResponse.ok) setMetrics(await metricsResponse.json())
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
        if (!form.name || !form.imageUrl || !form.affiliateUrl) {
            toast.error('Preencha os campos obrigatórios')
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
            toast.success(editingId ? 'Produto atualizado' : 'Produto criado')
            closeForm()
            load()
        } else {
            const err = await res.json().catch(() => ({}))
            toast.error(err.error || 'Erro ao salvar')
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

    const remove = (p: StoreProduct) => setConfirmRemove(p)

    const executeRemove = async (p: StoreProduct) => {
        await fetch(`/api/admin/store/${p.id}`, { method: 'DELETE' })
        toast.deleted('Produto removido')
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
    const visibleProducts = products.filter(product => product.isActive && !product.isHidden)
    const featuredProducts = visibleProducts.filter(product => product.featured)
    const totalClicks = visibleProducts.reduce((total, product) => total + product.clickCount, 0)
    const productsWithoutClicks = visibleProducts.filter(product => product.clickCount === 0)
    const hiddenProducts = products.filter(product => product.isHidden)
    const productsWithoutAffiliate = visibleProducts.filter(p =>
        p.store === 'mercadolivre' && !isOfficialMercadoLivreAffiliateUrl(p.affiliateUrl)
    )
    const topClicked = [...visibleProducts]
        .filter(product => product.clickCount > 0)
        .sort((a, b) => b.clickCount - a.clickCount)
        .slice(0, 5)

    return (
        <AdminLayout title="Loja — Produtos Afiliados" subtitle="Gerencie produtos afiliados, links e cupons da loja">
            {/* Barra de ações */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <AdminButton variant="primary" onClick={openNew}>
                    <Plus className="w-4 h-4 inline mr-1" />Novo produto
                </AdminButton>
                <AdminLinkButton href="/admin/loja/import" size="sm">
                    <Download className="w-4 h-4" /> Importar Shopee
                </AdminLinkButton>
                <AdminLinkButton href="/admin/loja/importar" size="sm">
                    <Download className="w-4 h-4" /> Importar Mercado Livre
                </AdminLinkButton>
                <AdminLinkButton href="/admin/loja/cupons" size="sm">
                    <Tag className="w-4 h-4" /> Cupons do dia
                </AdminLinkButton>
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

            {metrics && (
                <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-border bg-surface p-4">
                        <p className="text-xs font-semibold text-muted">Impressões 30d</p>
                        <p className="mt-2 text-2xl font-black text-foreground">{metrics.impressions30d.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-4">
                        <p className="text-xs font-semibold text-muted">CTR 30d</p>
                        <p className="mt-2 text-2xl font-black text-foreground">
                            {metrics.ctr30d != null ? `${(metrics.ctr30d * 100).toFixed(1)}%` : '—'}
                        </p>
                        <p className="mt-1 text-xs text-muted">{metrics.clicks30d} cliques · {metrics.clicks7d} últimos 7d</p>
                    </div>
                    <div className={`rounded-xl border bg-surface p-4 ${metrics.pendingCandidates > 0 ? 'border-amber-500/40' : 'border-border'}`}>
                        <p className="text-xs font-semibold text-muted">Candidatos pendentes</p>
                        <p className={`mt-2 text-2xl font-black ${metrics.pendingCandidates > 0 ? 'text-amber-500' : 'text-foreground'}`}>{metrics.pendingCandidates}</p>
                        {metrics.approvedCandidates > 0 && <p className="mt-1 text-xs text-muted">{metrics.approvedCandidates} aprovados aguardando</p>}
                    </div>
                    <div className={`rounded-xl border bg-surface p-4 ${metrics.mlMissingOfficialLink > 0 ? 'border-red-500/40' : 'border-border'}`}>
                        <p className="text-xs font-semibold text-muted">ML sem link oficial</p>
                        <p className={`mt-2 text-2xl font-black ${metrics.mlMissingOfficialLink > 0 ? 'text-red-500' : 'text-foreground'}`}>{metrics.mlMissingOfficialLink}</p>
                        <p className="mt-1 text-xs text-muted">de {metrics.mercadoLivreProducts ?? metrics.totalProducts} produtos ML</p>
                    </div>
                </section>
            )}

            {/* Alerta: produtos sem link de afiliado */}
            {!loading && productsWithoutAffiliate.length > 0 && (
                <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/8 p-4 flex items-start gap-3">
                    <CircleAlert className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-amber-400">{productsWithoutAffiliate.length} produto{productsWithoutAffiliate.length !== 1 ? 's' : ''} sem ID de afiliado</p>
                        <p className="text-xs text-muted mt-0.5">
                            Esses links não parecem ser links oficiais de afiliado do Mercado Livre (<code className="font-mono bg-black/20 px-1 rounded">meli.la</code> ou <code className="font-mono bg-black/20 px-1 rounded">/social/...</code> com <code className="font-mono bg-black/20 px-1 rounded">matt_word/ref</code>).
                            Edite cada produto e cole o link gerado na Central de Afiliados do ML antes de considerar o anúncio pronto para monetização.
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {productsWithoutAffiliate.slice(0, 6).map(p => (
                                <button key={p.id} onClick={() => openEdit(p)}
                                    className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded hover:bg-amber-500/20 transition-colors">
                                    {p.name.slice(0, 30)}…
                                </button>
                            ))}
                            {productsWithoutAffiliate.length > 6 && (
                                <span className="text-[10px] text-muted px-2 py-0.5">+{productsWithoutAffiliate.length - 6} mais</span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {!loading && products.length > 0 && (
                <section className="mb-8 space-y-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">Desempenho afiliado</p>
                        <h2 className="mt-1 text-lg font-bold text-foreground">Decisões para a vitrine</h2>
                        <p className="mt-1 text-xs text-muted">Cliques acumulados dos produtos no filtro atual. Conversões e comissões dependem do relatório da plataforma afiliada.</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-xl border border-border bg-surface p-4">
                            <p className="text-xs font-semibold text-muted">Visíveis na vitrine</p>
                            <p className="mt-2 text-2xl font-black text-foreground">{visibleProducts.length}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-surface p-4">
                            <p className="text-xs font-semibold text-muted">Em destaque</p>
                            <p className="mt-2 text-2xl font-black text-foreground">{featuredProducts.length}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-surface p-4">
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-muted"><MousePointerClick className="h-3.5 w-3.5" /> Cliques acumulados</p>
                            <p className="mt-2 text-2xl font-black text-accent">{totalClicks}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-surface p-4">
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-muted"><CircleAlert className="h-3.5 w-3.5" /> Sem cliques</p>
                            <p className="mt-2 text-2xl font-black text-foreground">{productsWithoutClicks.length}</p>
                        </div>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
                        <div className="rounded-xl border border-border bg-background p-4">
                            <div className="mb-3 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-accent" />
                                <h3 className="text-sm font-bold text-foreground">Produtos que geram interesse</h3>
                            </div>
                            {topClicked.length === 0 ? (
                                <p className="text-xs text-muted">Ainda não há cliques registrados neste conjunto de produtos.</p>
                            ) : (
                                <div className="space-y-2">
                                    {topClicked.map((product, index) => (
                                        <div key={product.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2">
                                            <p className="min-w-0 truncate text-xs font-medium text-foreground">
                                                <span className="mr-2 font-mono text-muted">{index + 1}.</span>{product.name}
                                            </p>
                                            <span className="shrink-0 text-xs font-bold text-accent">{product.clickCount} clique{product.clickCount !== 1 ? 's' : ''}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="rounded-xl border border-border bg-surface p-4">
                            <h3 className="text-sm font-bold text-foreground">Atenção operacional</h3>
                            <div className="mt-3 space-y-2 text-xs text-muted">
                                <p><strong className="text-foreground">{productsWithoutClicks.length}</strong> produto{productsWithoutClicks.length !== 1 ? 's' : ''} {productsWithoutClicks.length === 1 ? 'visível' : 'visíveis'} sem clique: revise imagem, preço, título ou retire destaque.</p>
                                <p><strong className="text-foreground">{hiddenProducts.length}</strong> ocultado{hiddenProducts.length !== 1 ? 's' : ''} pelo sync: não aparece{hiddenProducts.length === 1 ? '' : 'm'} mais nos widgets públicos.</p>
                                <p>A próxima camada útil é importar conversões e comissões das plataformas para medir receita real.</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-border bg-background p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-bold text-foreground">Origem dos cliques</h3>
                                <p className="mt-1 text-xs text-muted">Eventos dos últimos {performance?.periodDays ?? 30} dias em todos os widgets afiliados.</p>
                            </div>
                            <p className="text-sm font-black text-accent">{performance?.clicks ?? 0} cliques no período</p>
                        </div>
                        {!performance || performance.placements.length === 0 ? (
                            <p className="mt-4 text-xs text-muted">A atribuição começa a ser registrada a partir desta atualização.</p>
                        ) : (
                            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {performance.placements.map(item => (
                                    <div key={item.placement} className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2">
                                        <span className="truncate text-xs font-medium text-foreground">{item.label}</span>
                                        <span className="shrink-0 text-xs font-bold text-accent">{item.clicks}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Modal de formulário */}
            {showForm && (
                <AdminModalOverlay
                    open
                    onClose={closeForm}
                    title={editingId ? 'Editar produto' : 'Novo produto'}
                    maxWidth="2xl"
                >
                    <div className="max-h-[70vh] overflow-y-auto -mx-5 px-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-4">
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
                </AdminModalOverlay>
            )}

            {/* Lista de produtos agrupada por categoria */}
            {loading ? (
                <AdminTableSkeleton rows={6} />
            ) : products.length === 0 ? (
                <AdminEmptyState
                    icon={<Package className="w-8 h-8" />}
                    title="Nenhum produto cadastrado ainda"
                    action={
                        <AdminButton onClick={openNew}>
                            <Plus className="w-4 h-4 inline mr-1" />Adicionar primeiro produto
                        </AdminButton>
                    }
                />
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
                                            <tr key={p.id} className={`border-b border-border/50 last:border-0 hover:bg-surface/50 transition-colors ${!p.isActive || p.isHidden ? 'opacity-50' : ''}`}>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted/10">
                                                            <Image src={p.imageUrl} alt={p.name} fill className="object-cover" unoptimized />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-medium text-foreground line-clamp-1">{p.name}</p>
                                                            {p.badge && <span className="text-[10px] bg-orange-500/10 text-orange-500 px-1.5 py-0.5 rounded-full">{p.badge}</span>}
                                                            {p.isHidden && <span className="ml-1 text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded-full">Oculto pelo sync</span>}
                                                            {p.store === 'mercadolivre' && !isOfficialMercadoLivreAffiliateUrl(p.affiliateUrl) && (
                                                                <span className="ml-1 text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full" title="Link Mercado Livre sem formato oficial de afiliado">sem link oficial</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 hidden sm:table-cell">
                                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STORES[p.store]?.color || 'bg-muted/10 text-muted'}`}>
                                                        {STORES[p.store]?.label || p.store}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <p className="text-xs font-semibold text-foreground">{p.price || '—'}</p>
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
            <ConfirmDialog
                open={!!confirmRemove}
                title={`Excluir "${confirmRemove?.name}"?`}
                confirmLabel="Excluir"
                variant="danger"
                onConfirm={async () => { await executeRemove(confirmRemove!); setConfirmRemove(null) }}
                onCancel={() => setConfirmRemove(null)}
            />
        </AdminLayout>
    )
}
