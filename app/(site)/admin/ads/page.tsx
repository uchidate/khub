'use client'

import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import { ExternalLink, AlertTriangle, CheckCircle2, Loader2, Copy, FileText, BarChart3, Eye, MousePointer, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdSettings {
    adsGloballyPaused:   boolean
    adsMultiplexEnabled: boolean
    adsSidebarEnabled:   boolean
    adsAutoAdsEnabled:   boolean
}

// ─── Static slot inventory ────────────────────────────────────────────────────

const SLOTS = [
    {
        key: 'NEXT_PUBLIC_ADSENSE_SLOT_AUTO',
        label: 'Auto Geral',
        format: 'Responsivo',
        envVar: 'NEXT_PUBLIC_ADSENSE_SLOT_AUTO',
        pages: ['Listas', 'Páginas genéricas'],
        setting: null, // controlado via Auto Ads
    },
    {
        key: 'NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR',
        label: 'Sidebar Blog',
        format: 'Auto responsivo',
        envVar: 'NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR',
        pages: ['Posts de blog (sidebar xl+)'],
        setting: 'adsSidebarEnabled' as keyof AdSettings,
    },
    {
        key: 'NEXT_PUBLIC_ADSENSE_SLOT_FLUID',
        label: 'In-Article (Fluid)',
        format: 'Fluid in-article',
        envVar: 'NEXT_PUBLIC_ADSENSE_SLOT_FLUID',
        pages: ['Artigos Markdown (entre seções)'],
        setting: null,
    },
    {
        key: 'NEXT_PUBLIC_ADSENSE_SLOT_MULTIPLEX',
        label: 'Multiplex (Discovery)',
        format: 'Autorelaxed',
        envVar: 'NEXT_PUBLIC_ADSENSE_SLOT_MULTIPLEX',
        pages: ['Posts de blog', 'Artistas', 'Produções', 'Grupos'],
        setting: 'adsMultiplexEnabled' as keyof AdSettings,
    },
    {
        key: 'NEXT_PUBLIC_ADSENSE_SLOT_HOME',
        label: 'Homepage',
        format: 'Auto responsivo',
        envVar: 'NEXT_PUBLIC_ADSENSE_SLOT_HOME',
        pages: ['Homepage'],
        setting: null,
    },
    {
        key: 'NEXT_PUBLIC_ADSENSE_SLOT_ANCHOR',
        label: 'Âncora (Sticky Bottom)',
        format: 'Auto anchor',
        envVar: 'NEXT_PUBLIC_ADSENSE_SLOT_ANCHOR',
        pages: ['Global (Auto Ads)'],
        setting: 'adsAutoAdsEnabled' as keyof AdSettings,
    },
    {
        key: 'NEXT_PUBLIC_ADSENSE_SLOT_STICKY',
        label: 'Sticky Bottom Manual (mobile)',
        format: 'Auto responsivo',
        envVar: 'NEXT_PUBLIC_ADSENSE_SLOT_STICKY',
        pages: ['Global (mobile, scroll > 400px, quando Auto Ads desativado)'],
        setting: null,
    },
    {
        key: 'NEXT_PUBLIC_ADSENSE_SLOT_SIDE_RAIL_LEFT',
        label: 'Side Rail Esquerdo',
        format: 'Side rail',
        envVar: 'NEXT_PUBLIC_ADSENSE_SLOT_SIDE_RAIL_LEFT',
        pages: ['Side Rails (desktop wide)'],
        setting: null,
    },
    {
        key: 'NEXT_PUBLIC_ADSENSE_SLOT_SIDE_RAIL_RIGHT',
        label: 'Side Rail Direito',
        format: 'Side rail',
        envVar: 'NEXT_PUBLIC_ADSENSE_SLOT_SIDE_RAIL_RIGHT',
        pages: ['Side Rails (desktop wide)'],
        setting: null,
    },
]

const SETTING_LABELS: Record<keyof AdSettings, { label: string; desc: string; danger?: boolean }> = {
    adsGloballyPaused:   { label: 'Pausar TODOS os anúncios',  desc: 'Kill switch global — desativa todo o AdSense no site', danger: true },
    adsAutoAdsEnabled:   { label: 'Auto Ads',                  desc: 'Script de Auto Ads do Google (âncora, overlay, etc.)' },
    adsMultiplexEnabled: { label: 'Multiplex (Discovery)',      desc: 'Widget de discovery no final de artistas, produções e grupos' },
    adsSidebarEnabled:   { label: 'Sidebar Blog',              desc: 'Banner na sidebar dos posts de blog' },
}

// ─── Toggle component ─────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
    return (
        <button
            onClick={() => !disabled && onChange(!checked)}
            disabled={disabled}
            className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-surface-hover border border-border'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : ''}`} />
        </button>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdsAdminPage() {
    const [settings, setSettings]   = useState<AdSettings | null>(null)
    const [loading, setLoading]     = useState(true)
    const [saving, setSaving]       = useState<keyof AdSettings | null>(null)
    const [copied, setCopied]       = useState<string | null>(null)
    const { success, error } = useAdminToast()

    useEffect(() => {
        fetch('/api/admin/settings/ads')
            .then(r => {
                if (!r.ok) throw new Error('settings_fetch_failed')
                return r.json()
            })
            .then(d => setSettings(d))
            .catch(() => error('Erro ao carregar configurações'))
            .finally(() => setLoading(false))
    }, [error])

    async function toggle(key: keyof AdSettings) {
        if (!settings) return
        setSaving(key)
        const newVal = !settings[key]
        try {
            const r = await fetch('/api/admin/settings/ads', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: newVal }),
            })
            if (!r.ok) throw new Error('settings_save_failed')
            const d = await r.json()
            setSettings(d)
            success(`${SETTING_LABELS[key].label}: ${newVal ? 'ativado' : 'pausado'}`)
        } catch {
            error('Erro ao salvar')
        } finally {
            setSaving(null)
        }
    }

    function copySlotId(envVar: string) {
        const val = (process.env as Record<string, string | undefined>)[envVar]
        if (!val) return
        navigator.clipboard.writeText(val)
        setCopied(envVar)
        setTimeout(() => setCopied(null), 2000)
    }

    const isPaused = settings?.adsGloballyPaused ?? false
    const policyChecks = [
        {
            label: 'Auto-refresh manual',
            status: 'ok',
            desc: 'Removido dos slots AdSense; refresh fica dependente de ação/configuração permitida.',
        },
        {
            label: 'Sticky mobile',
            status: settings?.adsAutoAdsEnabled === false ? 'warn' : 'ok',
            desc: settings?.adsAutoAdsEnabled === false
                ? 'Sticky manual pode aparecer porque Auto Ads está pausado.'
                : 'Sticky manual fica bloqueado enquanto Auto Ads está ativo.',
        },
        {
            label: 'Thin/noindex',
            status: 'ok',
            desc: 'Perfis thin, adultos, sem slug ou patrocinados ficam fora do inventário.',
        },
        {
            label: 'Canais granulares',
            status: 'ok',
            desc: 'Blog, artistas e produções enviam channels por intenção para análise de RPM.',
        },
    ] as const

    return (
        <AdminLayout title="Controle de Anúncios" subtitle="Gerencie slots, placements e configurações do Google AdSense">
            <div className="space-y-6">

                {/* Status geral */}
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${isPaused ? 'bg-red-500/8 border-red-500/25' : 'bg-emerald-500/8 border-emerald-500/25'}`}>
                    {isPaused
                        ? <AlertTriangle size={14} className="text-red-400 shrink-0" />
                        : <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />}
                    <p className="text-xs font-semibold text-foreground">
                        {isPaused ? 'Anúncios PAUSADOS globalmente — nenhum anúncio está sendo exibido' : 'Anúncios ativos — todos os placements configurados estão funcionando'}
                    </p>
                    <a
                        href="https://www.google.com/adsense/new/u/0/pub-6015098995926392/home"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto shrink-0 flex items-center gap-1 text-[11px] text-muted hover:text-foreground transition-colors"
                    >
                        AdSense <ExternalLink size={10} />
                    </a>
                </div>

                {/* Checks de política e qualidade */}
                <div className="bg-surface border border-border rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-border">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">Checks de Segurança AdSense</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                        {policyChecks.map(check => {
                            const isWarn = check.status === 'warn'
                            return (
                                <div key={check.label} className="flex items-start gap-3 px-5 py-4">
                                    {isWarn
                                        ? <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                                        : <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />}
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-foreground">{check.label}</p>
                                        <p className="text-[11px] text-muted mt-0.5">{check.desc}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Controles */}
                <div className="bg-surface border border-border rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-border">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">Controles de Placement</p>
                    </div>
                    <div className="divide-y divide-border">
                        {loading ? (
                            <div className="px-5 py-6 flex items-center gap-2 text-muted text-xs">
                                <Loader2 size={13} className="animate-spin" /> Carregando...
                            </div>
                        ) : (
                            (Object.keys(SETTING_LABELS) as (keyof AdSettings)[]).map(key => {
                                const meta = SETTING_LABELS[key]
                                const isActive = settings?.[key] ?? true
                                const isSaving = saving === key
                                const isKillSwitch = key === 'adsGloballyPaused'
                                return (
                                    <div key={key} className={`flex items-center gap-4 px-5 py-4 ${isKillSwitch ? 'bg-red-500/5' : ''}`}>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-foreground">{meta.label}</p>
                                                {isKillSwitch && <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">Kill Switch</span>}
                                            </div>
                                            <p className="text-xs text-muted mt-0.5">{meta.desc}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {isSaving && <Loader2 size={11} className="animate-spin text-muted" />}
                                            <Toggle
                                                checked={isKillSwitch ? !isActive : isActive}
                                                onChange={() => toggle(key)}
                                                disabled={isSaving || (isPaused && !isKillSwitch)}
                                            />
                                            <span className={`text-[11px] font-bold w-10 text-right ${isKillSwitch ? (!isActive ? 'text-emerald-400' : 'text-red-400') : (isActive && !isPaused ? 'text-emerald-400' : 'text-muted')}`}>
                                                {isKillSwitch ? (!isActive ? 'ativo' : 'pausado') : (isActive ? 'ativo' : 'pausado')}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Inventário de slots */}
                <div className="bg-surface border border-border rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">Inventário de Slots</p>
                        <a
                            href="https://www.google.com/adsense/new/u/0/pub-6015098995926392/myads/units/display"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] text-muted hover:text-foreground transition-colors"
                        >
                            Gerenciar no AdSense <ExternalLink size={10} />
                        </a>
                    </div>
                    <div className="divide-y divide-border">
                        {SLOTS.map(slot => {
                            const slotId = (process.env as Record<string, string | undefined>)[slot.envVar]
                            const settingActive = slot.setting ? (settings?.[slot.setting] ?? true) : true
                            const active = !isPaused && settingActive
                            return (
                                <div key={slot.key} className="flex items-start gap-4 px-5 py-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className="text-sm font-semibold text-foreground">{slot.label}</p>
                                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-surface-hover text-muted'}`}>
                                                {active ? 'ativo' : 'pausado'}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-muted">{slot.format} · {slot.pages.join(', ')}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {slotId && (
                                            <button
                                                onClick={() => copySlotId(slot.envVar)}
                                                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-border hover:border-accent/30 text-muted hover:text-foreground transition-all"
                                            >
                                                <Copy size={9} />
                                                {copied === slot.envVar ? 'copiado!' : slotId}
                                            </button>
                                        )}
                                        {!slotId && (
                                            <span className="text-[10px] text-red-400 font-mono">env var não definida</span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* GA4 Analytics */}
                <div className="bg-surface border border-border rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">Analytics de Anúncios (GA4)</p>
                        <a
                            href="https://analytics.google.com/analytics/web/#/p465736399/reports/explorer?params=_u..nav%3Dmaui%26_r.explorerCard..selmet%3D%5B%22eventCount%22%5D%26_r.explorerCard..seldim%3D%5B%22eventName%22%5D&r=top-events&ruid=top-events,life-cycle,engagement"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] text-muted hover:text-foreground transition-colors"
                        >
                            Abrir GA4 <ExternalLink size={10} />
                        </a>
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-border">
                        {[
                            { icon: Eye, label: 'ad_impression', desc: 'Slot preenchido e renderizado', color: 'text-emerald-400', href: 'https://analytics.google.com/analytics/web/#/p465736399/reports/explorer?params=_u..nav%3Dmaui%26_r.explorerCard..selmet%3D%5B%22eventCount%22%5D%26_r.explorerCard..filters%3D%5B%7B%22fieldName%22%3A%22eventName%22%2C%22filterType%22%3A%22EXACT%22%2C%22expressionList%22%3A%5B%22ad_impression%22%5D%7D%5D' },
                            { icon: TrendingUp, label: 'ad_viewed', desc: 'Visível ≥50% por ≥1s (viewability)', color: 'text-blue-400', href: 'https://analytics.google.com/analytics/web/#/p465736399/reports/explorer?params=_u..nav%3Dmaui%26_r.explorerCard..selmet%3D%5B%22eventCount%22%5D%26_r.explorerCard..filters%3D%5B%7B%22fieldName%22%3A%22eventName%22%2C%22filterType%22%3A%22EXACT%22%2C%22expressionList%22%3A%5B%22ad_viewed%22%5D%7D%5D' },
                            { icon: MousePointer, label: 'ad_click', desc: 'Clique no anúncio detectado', color: 'text-purple-400', href: 'https://analytics.google.com/analytics/web/#/p465736399/reports/explorer?params=_u..nav%3Dmaui%26_r.explorerCard..selmet%3D%5B%22eventCount%22%5D%26_r.explorerCard..filters%3D%5B%7B%22fieldName%22%3A%22eventName%22%2C%22filterType%22%3A%22EXACT%22%2C%22expressionList%22%3A%5B%22ad_click%22%5D%7D%5D' },
                        ].map(({ icon: Icon, label, desc, color, href }) => (
                            <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="flex flex-col gap-1.5 px-5 py-4 hover:bg-surface-hover transition-colors group">
                                <div className="flex items-center gap-2">
                                    <Icon size={13} className={color} />
                                    <p className="text-xs font-bold text-foreground font-mono">{label}</p>
                                    <ExternalLink size={9} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                                </div>
                                <p className="text-[11px] text-muted">{desc}</p>
                            </a>
                        ))}
                    </div>
                    <div className="px-5 py-3 border-t border-border bg-surface/50">
                        <div className="flex items-start gap-2">
                            <BarChart3 size={11} className="text-muted shrink-0 mt-0.5" />
                            <p className="text-[11px] text-muted">
                                Para ver receita estimada por página, acesse{' '}
                                <a href="https://www.google.com/adsense/new/u/0/pub-6015098995926392/reports/overview" target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline">
                                    AdSense → Relatórios
                                </a>
                                {' '}e filtre por URL. CLS causado por ads é reportado como evento{' '}
                                <span className="font-mono">ad_cls_impact</span> no GA4.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ads.txt status */}
                <div className="bg-surface border border-border rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-border">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">ads.txt</p>
                    </div>
                    <div className="px-5 py-4 flex items-center gap-4">
                        <FileText size={14} className="text-muted shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">Arquivo ads.txt configurado</p>
                            <p className="text-xs text-muted font-mono mt-0.5">google.com, ca-pub-6015098995926392, DIRECT, f08c47fec0942fa0</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <a
                                href="https://www.hallyuhub.com.br/ads.txt"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[10px] text-muted hover:text-foreground transition-colors"
                            >
                                Ver arquivo <ExternalLink size={10} />
                            </a>
                            <a
                                href="https://adstxt.guru/validator/results/?url=hallyuhub.com.br"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[10px] text-muted hover:text-foreground transition-colors"
                            >
                                Validar <ExternalLink size={10} />
                            </a>
                        </div>
                    </div>
                </div>

            </div>
        </AdminLayout>
    )
}
