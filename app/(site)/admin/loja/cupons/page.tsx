'use client'

import { useState, useEffect } from 'react'
import { Tag, Plus, Trash2, ToggleLeft, ToggleRight, Copy, Check } from 'lucide-react'

const STORE_LABELS: Record<string, string> = {
    shopee: 'Shopee',
    amazon: 'Amazon',
    mercadolivre: 'Mercado Livre',
}

interface Coupon {
    id: string
    code: string
    description: string
    discount: string
    minPurchase: string | null
    store: string
    affiliateUrl: string
    expiresAt: string
    isActive: boolean
    createdAt: string
}

function todayEndBRT() {
    const now = new Date()
    const brt = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    brt.setHours(23, 59, 0, 0)
    const diff = now.getTime() - new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })).getTime()
    return new Date(brt.getTime() + diff).toISOString().slice(0, 16)
}

export default function CuponsAdminPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [copied, setCopied] = useState<string | null>(null)
    const [form, setForm] = useState({
        code: '',
        description: '',
        discount: '',
        minPurchase: '',
        store: 'shopee',
        affiliateUrl: '',
        expiresAt: todayEndBRT(),
    })

    useEffect(() => { fetchCoupons() }, [])

    async function fetchCoupons() {
        const res = await fetch('/api/admin/coupons')
        if (res.ok) setCoupons(await res.json())
        setLoading(false)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        const res = await fetch('/api/admin/coupons', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })
        if (res.ok) {
            setForm({ ...form, code: '', description: '', discount: '', minPurchase: '', affiliateUrl: '', expiresAt: todayEndBRT() })
            await fetchCoupons()
        }
        setSaving(false)
    }

    async function toggleActive(coupon: Coupon) {
        await fetch(`/api/admin/coupons/${coupon.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: !coupon.isActive }),
        })
        await fetchCoupons()
    }

    async function deleteCoupon(id: string) {
        if (!confirm('Deletar cupom?')) return
        await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
        await fetchCoupons()
    }

    function copyCode(code: string) {
        navigator.clipboard.writeText(code)
        setCopied(code)
        setTimeout(() => setCopied(null), 2000)
    }

    const now = new Date()
    const active = coupons.filter(c => c.isActive && new Date(c.expiresAt) > now)
    const expired = coupons.filter(c => !c.isActive || new Date(c.expiresAt) <= now)

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
            <div className="flex items-center gap-3">
                <Tag className="w-5 h-5 text-orange-500" />
                <h1 className="text-xl font-black text-foreground">Cupons do Dia</h1>
                <span className="text-xs text-muted bg-surface px-2 py-0.5 rounded-full border border-border">
                    {active.length} ativo{active.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-5 space-y-4">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Novo cupom
                </h2>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-muted mb-1 block">Código *</label>
                        <input
                            value={form.code}
                            onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                            placeholder="SHOPEE10"
                            required
                            className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm font-mono font-bold tracking-wider focus:outline-none focus:border-orange-400"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-muted mb-1 block">Desconto *</label>
                        <input
                            value={form.discount}
                            onChange={e => setForm(f => ({ ...f, discount: e.target.value }))}
                            placeholder="10% OFF"
                            required
                            className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-orange-400"
                        />
                    </div>
                </div>
                <div>
                    <label className="text-xs text-muted mb-1 block">Descrição *</label>
                    <input
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="10% de desconto em toda a loja Shopee"
                        required
                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-orange-400"
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-muted mb-1 block">Mínimo de compra</label>
                        <input
                            value={form.minPurchase}
                            onChange={e => setForm(f => ({ ...f, minPurchase: e.target.value }))}
                            placeholder="Mínimo R$ 30"
                            className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-orange-400"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-muted mb-1 block">Loja</label>
                        <select
                            value={form.store}
                            onChange={e => setForm(f => ({ ...f, store: e.target.value }))}
                            className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-orange-400"
                        >
                            {Object.entries(STORE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="text-xs text-muted mb-1 block">Link afiliado *</label>
                    <input
                        value={form.affiliateUrl}
                        onChange={e => setForm(f => ({ ...f, affiliateUrl: e.target.value }))}
                        placeholder="https://shope.ee/..."
                        required
                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-orange-400"
                    />
                </div>
                <div>
                    <label className="text-xs text-muted mb-1 block">Expira em</label>
                    <input
                        type="datetime-local"
                        value={form.expiresAt}
                        onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-orange-400"
                    />
                </div>
                <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-2.5 bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                    {saving ? 'Salvando...' : 'Adicionar cupom'}
                </button>
            </form>

            {/* Active coupons */}
            {active.length > 0 && (
                <section>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-muted mb-3">Ativos hoje</h2>
                    <div className="space-y-2">
                        {active.map(c => <CouponRow key={c.id} coupon={c} onToggle={toggleActive} onDelete={deleteCoupon} onCopy={copyCode} copied={copied} />)}
                    </div>
                </section>
            )}

            {/* Expired */}
            {expired.length > 0 && (
                <section>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-muted mb-3">Expirados / Desativados</h2>
                    <div className="space-y-2 opacity-50">
                        {expired.map(c => <CouponRow key={c.id} coupon={c} onToggle={toggleActive} onDelete={deleteCoupon} onCopy={copyCode} copied={copied} />)}
                    </div>
                </section>
            )}

            {!loading && coupons.length === 0 && (
                <p className="text-center text-muted text-sm py-8">Nenhum cupom cadastrado ainda.</p>
            )}
        </div>
    )
}

function CouponRow({ coupon, onToggle, onDelete, onCopy, copied }: {
    coupon: Coupon
    onToggle: (c: Coupon) => void
    onDelete: (id: string) => void
    onCopy: (code: string) => void
    copied: string | null
}) {
    const expired = new Date(coupon.expiresAt) <= new Date()
    const expiresDate = new Date(coupon.expiresAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

    return (
        <div className="flex items-center gap-3 p-3 bg-surface border border-border rounded-xl">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-sm tracking-wider text-foreground">{coupon.code}</span>
                    <span className="text-[10px] font-bold bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full">{coupon.discount}</span>
                    <span className="text-[10px] text-muted">{STORE_LABELS[coupon.store] ?? coupon.store}</span>
                </div>
                <p className="text-xs text-muted mt-0.5 truncate">{coupon.description}</p>
                {coupon.minPurchase && <p className="text-[10px] text-muted/70">{coupon.minPurchase}</p>}
                <p className={`text-[10px] mt-0.5 ${expired ? 'text-red-400' : 'text-muted'}`}>
                    {expired ? 'Expirou' : 'Expira'} {expiresDate}
                </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => onCopy(coupon.code)} className="p-1.5 hover:bg-surface-hover rounded-lg transition-colors" title="Copiar código">
                    {copied === coupon.code ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted" />}
                </button>
                <button onClick={() => onToggle(coupon)} className="p-1.5 hover:bg-surface-hover rounded-lg transition-colors" title={coupon.isActive ? 'Desativar' : 'Ativar'}>
                    {coupon.isActive ? <ToggleRight className="w-4 h-4 text-orange-500" /> : <ToggleLeft className="w-4 h-4 text-muted" />}
                </button>
                <button onClick={() => onDelete(coupon.id)} className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors" title="Deletar">
                    <Trash2 className="w-4 h-4 text-muted hover:text-red-400" />
                </button>
            </div>
        </div>
    )
}
