'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Loader2, Save, ArrowLeft, CheckCircle } from 'lucide-react'
import { AI_FEATURES, FEATURE_LABELS } from '@/lib/services/ai-config-service'
import type { AiFeature } from '@/lib/ai/ai-usage-logger'

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
    { value: '',         label: 'Auto (round-robin)' },
    { value: 'deepseek', label: 'DeepSeek-V3' },
    { value: 'openai',   label: 'OpenAI (gpt-4o-mini)' },
    { value: 'claude',   label: 'Claude (Haiku)' },
    { value: 'ollama',   label: 'Ollama (local)' },
    { value: 'gemini',   label: 'Gemini (desabilitado)' },
]

export default function AiConfigPage() {
    const router = useRouter()
    const [configs,  setConfigs]  = useState<AiConfigRow[]>([])
    const [forms,    setForms]    = useState<Record<string, FormState>>({})
    const [saving,   setSaving]   = useState<string | null>(null)
    const [saved,    setSaved]    = useState<string | null>(null)
    const [loading,  setLoading]  = useState(true)
    const [error,    setError]    = useState<string | null>(null)

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
            .catch(() => setError('Erro ao carregar configurações'))
            .finally(() => setLoading(false))
    }, [])

    async function handleSave(feature: string) {
        const form = forms[feature]
        if (!form) return
        setSaving(feature)
        setError(null)
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
            setError(e instanceof Error ? e.message : 'Erro ao salvar')
        } finally {
            setSaving(null)
        }
    }

    function updateForm(feature: string, key: keyof FormState, value: string | boolean) {
        setForms(prev => ({ ...prev, [feature]: { ...prev[feature], [key]: value } }))
    }

    if (loading) {
        return (
            <AdminLayout title="Configuração de IA">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 text-zinc-600 animate-spin" />
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout title="Configuração de IA">
            <div className="space-y-6 max-w-3xl">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/admin/ai')}
                        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Dashboard
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white">Configuração de IA</h1>
                        <p className="text-xs text-zinc-500 mt-0.5">Provider preferido, limites de orçamento e habilitação por feature</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-sm text-red-400">
                        {error}
                    </div>
                )}

                <div className="space-y-3">
                    {AI_FEATURES.map(feat => {
                        const form  = forms[feat] ?? { preferredProvider: '', enabled: true, monthlyBudgetUsd: '', notes: '' }
                        const isSav = saving === feat
                        const isDone = saved === feat
                        return (
                            <div
                                key={feat}
                                className={`bg-zinc-900 border rounded-xl p-4 transition-colors ${
                                    form.enabled ? 'border-white/8' : 'border-white/4 opacity-60'
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Enable toggle */}
                                    <button
                                        onClick={() => updateForm(feat, 'enabled', !form.enabled)}
                                        className={`mt-0.5 w-8 h-4.5 rounded-full transition-colors relative shrink-0 ${
                                            form.enabled ? 'bg-purple-600' : 'bg-zinc-700'
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
                                                <p className="text-sm font-semibold text-white">{FEATURE_LABELS[feat as AiFeature | 'unknown']}</p>
                                                <p className="text-[10px] text-zinc-600 font-mono">{feat}</p>
                                            </div>
                                            <button
                                                onClick={() => handleSave(feat)}
                                                disabled={isSav}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white transition-colors"
                                            >
                                                {isSav  ? <Loader2 className="w-3 h-3 animate-spin" /> :
                                                 isDone ? <CheckCircle className="w-3 h-3 text-emerald-300" /> :
                                                          <Save className="w-3 h-3" />}
                                                {isDone ? 'Salvo!' : 'Salvar'}
                                            </button>
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] text-zinc-500 uppercase tracking-wide block mb-1">
                                                    Provider preferido
                                                </label>
                                                <select
                                                    value={form.preferredProvider}
                                                    onChange={e => updateForm(feat, 'preferredProvider', e.target.value)}
                                                    className="w-full text-xs bg-zinc-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-zinc-300"
                                                >
                                                    {PROVIDER_OPTIONS.map(o => (
                                                        <option key={o.value} value={o.value}>{o.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-zinc-500 uppercase tracking-wide block mb-1">
                                                    Orçamento mensal (USD) — opcional
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="ex: 5.00"
                                                    value={form.monthlyBudgetUsd}
                                                    onChange={e => updateForm(feat, 'monthlyBudgetUsd', e.target.value)}
                                                    className="w-full text-xs bg-zinc-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-zinc-300 placeholder:text-zinc-600"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase tracking-wide block mb-1">
                                                Observações
                                            </label>
                                            <input
                                                type="text"
                                                maxLength={300}
                                                placeholder="Notas internas..."
                                                value={form.notes}
                                                onChange={e => updateForm(feat, 'notes', e.target.value)}
                                                className="w-full text-xs bg-zinc-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-zinc-300 placeholder:text-zinc-600"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <p className="text-[10px] text-zinc-700">
                    Nota: o orçamento é apenas informativo no momento — a aplicação exibe alerta no dashboard mas não bloqueia chamadas automaticamente.
                </p>
            </div>
        </AdminLayout>
    )
}
