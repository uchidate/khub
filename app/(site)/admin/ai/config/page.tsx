'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminButton } from '@/components/admin'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import { Loader2, Save, ArrowLeft, CheckCircle } from 'lucide-react'
import { AI_FEATURES, FEATURE_LABELS } from '@/lib/ai/ai-features'
import type { AiFeature } from '@/lib/ai/ai-features'

interface AiConfigRow {
    id:                string
    feature:           string
    preferredProvider: string | null
    enabled:           boolean
    monthlyBudgetUsd:  number | null
    notes:             string | null
}

interface FormState {
    preferredProvider: string
    enabled:           boolean
    monthlyBudgetUsd:  string
    notes:             string
}

const PROVIDER_OPTIONS = [
    { value: '',         label: 'Automático (legado)' },
    { value: 'deepseek', label: 'DeepSeek-V3' },
    { value: 'ollama',   label: 'Ollama (local)' },
]

export default function AiConfigPage() {
    const router = useRouter()
    const toast = useAdminToast()
    const [_configs, setConfigs]  = useState<AiConfigRow[]>([])
    const [forms,    setForms]    = useState<Record<string, FormState>>({})
    const [saving,   setSaving]   = useState<string | null>(null)
    const [saved,    setSaved]    = useState<string | null>(null)
    const [loading,  setLoading]  = useState(true)

    useEffect(() => {
        fetch('/api/admin/ai/config')
            .then(r => r.json())
            .then(data => {
                setConfigs(data.configs ?? [])
                const initial: Record<string, FormState> = {}
                for (const feat of AI_FEATURES) {
                    const cfg = (data.configs ?? []).find((c: AiConfigRow) => c.feature === feat)
                    initial[feat] = {
                        preferredProvider: cfg?.preferredProvider ?? '',
                        enabled:           cfg?.enabled ?? true,
                        monthlyBudgetUsd:  cfg?.monthlyBudgetUsd != null ? String(cfg.monthlyBudgetUsd) : '',
                        notes:             cfg?.notes ?? '',
                    }
                }
                setForms(initial)
            })
            .catch(() => toast.error('Erro ao carregar configurações'))
            .finally(() => setLoading(false))
    }, [toast])

    async function handleSave(feature: string) {
        const form = forms[feature]
        if (!form) return
        setSaving(feature)
        try {
            const res = await fetch('/api/admin/ai/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    feature,
                    preferredProvider: form.preferredProvider || null,
                    enabled:           form.enabled,
                    monthlyBudgetUsd:  form.monthlyBudgetUsd ? parseFloat(form.monthlyBudgetUsd) : null,
                    notes:             form.notes || null,
                }),
            })
            if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao salvar')
            setSaved(feature)
            setTimeout(() => setSaved(null), 2500)
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erro ao salvar')
        } finally {
            setSaving(null)
        }
    }

    function updateForm(feature: string, key: keyof FormState, value: string | boolean) {
        setForms(prev => ({ ...prev, [feature]: { ...prev[feature], [key]: value } }))
    }

    if (loading) {
        return (
            <AdminLayout title="Configuração de IA" subtitle="Defina providers e orçamentos por feature de IA">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 text-muted animate-spin" />
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout title="Configuração de IA">
            <div className="space-y-6 max-w-3xl">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <AdminButton
                        onClick={() => router.push('/admin/ai')}
                        variant="ghost"
                        size="sm"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Dashboard
                    </AdminButton>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Configuração de IA</h1>
                        <p className="text-xs text-muted mt-0.5">Provider preferido, limites de orçamento e habilitação por feature</p>
                    </div>
                </div>

                <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-muted">
                    Geração editorial e traduções automáticas estão desativadas. Salvar configurações históricas aqui não reativa esses fluxos; a curadoria usa Gemini com aplicação manual.
                </div>

                <div className="space-y-3">
                    {AI_FEATURES.map(feat => {
                        const form  = forms[feat] ?? { preferredProvider: '', enabled: true, monthlyBudgetUsd: '', notes: '' }
                        const isSav = saving === feat
                        const isDone = saved === feat
                        return (
                            <div
                                key={feat}
                                className={`bg-surface border rounded-xl p-4 transition-colors ${
                                    form.enabled ? 'border-border' : 'border-border opacity-60'
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Enable toggle */}
                                    <button
                                        onClick={() => updateForm(feat, 'enabled', !form.enabled)}
                                        className={`mt-0.5 w-8 h-4.5 rounded-full transition-colors relative shrink-0 ${
                                            form.enabled ? 'bg-accent' : 'bg-surface'
                                        }`}
                                        title={form.enabled ? 'Desabilitar' : 'Habilitar'}
                                    >
                                        <span
                                            className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform ${
                                                form.enabled ? 'translate-x-4' : 'translate-x-0.5'
                                            }`}
                                        />
                                    </button>

                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">{FEATURE_LABELS[feat as AiFeature | 'unknown']}</p>
                                                <p className="text-[10px] text-muted font-mono">{feat}</p>
                                            </div>
                                            <AdminButton
                                                onClick={() => handleSave(feat)}
                                                disabled={isSav}
                                                variant="primary"
                                                size="sm"
                                            >
                                                {isSav  ? <Loader2 className="w-3 h-3 animate-spin" /> :
                                                 isDone ? <CheckCircle className="w-3 h-3 text-emerald-300" /> :
                                                          <Save className="w-3 h-3" />}
                                                {isDone ? 'Salvo!' : 'Salvar'}
                                            </AdminButton>
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] text-muted uppercase tracking-wide block mb-1">
                                                    Provider preferido
                                                </label>
                                                <select
                                                    value={form.preferredProvider}
                                                    onChange={e => updateForm(feat, 'preferredProvider', e.target.value)}
                                                    className="w-full text-xs bg-surface border border-border rounded-lg px-2.5 py-1.5 text-foreground"
                                                >
                                                    {PROVIDER_OPTIONS.map(o => (
                                                        <option key={o.value} value={o.value}>{o.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-muted uppercase tracking-wide block mb-1">
                                                    Orçamento mensal (USD) — opcional
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="ex: 5.00"
                                                    value={form.monthlyBudgetUsd}
                                                    onChange={e => updateForm(feat, 'monthlyBudgetUsd', e.target.value)}
                                                    className="w-full text-xs bg-surface border border-border rounded-lg px-2.5 py-1.5 text-foreground placeholder:text-muted"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] text-muted uppercase tracking-wide block mb-1">
                                                Observações
                                            </label>
                                            <input
                                                type="text"
                                                maxLength={300}
                                                placeholder="Notas internas..."
                                                value={form.notes}
                                                onChange={e => updateForm(feat, 'notes', e.target.value)}
                                                className="w-full text-xs bg-surface border border-border rounded-lg px-2.5 py-1.5 text-foreground placeholder:text-muted"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <p className="text-[10px] text-muted">
                    Nota: o orçamento é apenas informativo no momento — a aplicação exibe alerta no dashboard mas não bloqueia chamadas automaticamente.
                </p>
            </div>
        </AdminLayout>
    )
}
