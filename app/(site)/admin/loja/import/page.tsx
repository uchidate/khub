'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminButton } from '@/components/admin/AdminButton'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import Image from 'next/image'
import { ShoppingBag, Check, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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

const STORES: Record<string, string> = {
    shopee: 'Shopee',
    amazon: 'Amazon',
    mercadolivre: 'Mercado Livre',
    outro: 'Outro',
}

function ImportForm() {
    const params = useSearchParams()
    const router = useRouter()
    const toast = useAdminToast()
    const [saving, setSaving] = useState(false)

    const [form, setForm] = useState({
        name: '',
        price: '',
        originalPrice: '',
        imageUrl: '',
        affiliateUrl: '',
        store: 'shopee',
        category: 'outros',
        badge: '',
        rating: '',
        soldCount: '',
        isActive: true,
        featured: false,
        position: 0,
        tags: 'shopee, kpop',
        description: '',
    })

    useEffect(() => {
        setForm(f => ({
            ...f,
            name: params.get('name') ?? '',
            price: params.get('price') ?? '',
            originalPrice: params.get('originalPrice') ?? '',
            imageUrl: params.get('imageUrl') ?? '',
            affiliateUrl: params.get('affiliateUrl') ?? '',
            store: params.get('store') ?? 'shopee',
            category: params.get('category') ?? 'outros',
            rating: params.get('rating') ?? '',
            soldCount: params.get('soldCount') ?? '',
        }))
    }, [params])

    const save = async () => {
        if (!form.name || !form.imageUrl || !form.affiliateUrl) {
            toast.error('Preencha nome, imagem e link de afiliado')
            return
        }
        setSaving(true)
        const payload = {
            ...form,
            tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
            rating: form.rating ? parseFloat(form.rating) : null,
            originalPrice: form.originalPrice || null,
            badge: form.badge || null,
            description: form.description || null,
            soldCount: form.soldCount || null,
        }
        const res = await fetch('/api/admin/store', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
        if (res.ok) {
            toast.success('Produto criado com sucesso!')
            router.push('/admin/loja')
        } else {
            const err = await res.json().catch(() => ({}))
            toast.error(err.error || 'Erro ao salvar')
        }
        setSaving(false)
    }

    const field = (label: string, key: keyof typeof form, placeholder?: string, span2 = false) => (
        <div className={span2 ? 'sm:col-span-2' : ''}>
            <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1">{label}</label>
            <input
                value={form[key] as string}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full text-sm bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-orange-400/50"
            />
        </div>
    )

    return (
        <AdminLayout title="Importar produto via Bookmarklet">
            <div className="mb-6">
                <Link href="/admin/loja" className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Voltar para Loja
                </Link>
            </div>

            {/* Instruções do bookmarklet */}
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                    <ShoppingBag className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-foreground mb-1">Como usar o bookmarklet</p>
                        <ol className="text-xs text-muted space-y-1 list-decimal list-inside">
                            <li>Instale o bookmarklet no seu browser (arquivo <code className="bg-surface px-1 rounded">scripts/shopee-bookmarklet.min.txt</code>)</li>
                            <li>Abra qualquer produto Shopee clicando no seu link de afiliado</li>
                            <li>Clique o bookmark — este formulário abrirá pré-preenchido</li>
                            <li>Revise os dados abaixo e clique "Criar produto"</li>
                        </ol>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Formulário */}
                <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6">
                    <h2 className="text-sm font-bold text-foreground mb-4">Dados do produto</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {field('Nome do produto *', 'name', 'BTS — Anthology Album [Proof]', true)}
                        {field('Link de afiliado *', 'affiliateUrl', 'https://s.shopee.com.br/...', true)}
                        {field('URL da imagem *', 'imageUrl', 'https://down-br.img.susercontent.com/...', true)}
<div>
                            <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1">Loja</label>
                            <select value={form.store} onChange={e => setForm(f => ({ ...f, store: e.target.value }))}
                                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground">
                                {Object.entries(STORES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1">Categoria</label>
                            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground">
                                {Object.entries(CATEGORIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </div>

                        {field('Badge (ex: -30% · Top vendas)', 'badge', '-30%')}
                        {field('Rating (0-5)', 'rating', '4.8')}
                        {field('Vendidos', 'soldCount', '2.3k')}
                        {field('Tags (vírgula)', 'tags', 'bts, kpop, album', true)}

                        <div className="sm:col-span-2 flex gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 rounded" />
                                <span className="text-sm text-foreground">Ativo (visível na loja)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} className="w-4 h-4 rounded" />
                                <span className="text-sm text-foreground">Destaque (homepage)</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end mt-6">
                        <AdminButton onClick={save} disabled={saving}>
                            {saving
                                ? <><RefreshCw className="w-4 h-4 animate-spin inline mr-1.5" />Salvando...</>
                                : <><Check className="w-4 h-4 inline mr-1.5" />Criar produto</>
                            }
                        </AdminButton>
                    </div>
                </div>

                {/* Preview da imagem */}
                <div className="space-y-4">
                    <div className="bg-surface border border-border rounded-xl p-4">
                        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Preview da imagem</p>
                        {form.imageUrl ? (
                            <div className="relative aspect-square rounded-xl overflow-hidden bg-muted/10">
                                <Image src={form.imageUrl} alt="preview" fill className="object-contain" unoptimized />
                            </div>
                        ) : (
                            <div className="aspect-square rounded-xl bg-surface flex items-center justify-center border border-dashed border-border">
                                <p className="text-xs text-muted">Cole a URL da imagem</p>
                            </div>
                        )}
                    </div>

                    {form.affiliateUrl && (
                        <div className="bg-surface border border-border rounded-xl p-4">
                            <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Link de afiliado</p>
                            <a href={form.affiliateUrl} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-orange-500 hover:underline break-all">
                                {form.affiliateUrl.slice(0, 60)}{form.affiliateUrl.length > 60 ? '…' : ''}
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    )
}

export default function ImportPage() {
    return (
        <Suspense>
            <ImportForm />
        </Suspense>
    )
}
