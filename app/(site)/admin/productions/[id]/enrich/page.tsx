'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { PageHeader } from '@/components/admin/PageHeader'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import { CheckCircle, XCircle, AlertTriangle, ChevronLeft, Send, RefreshCw, Eye, Copy, ClipboardCheck } from 'lucide-react'

interface ProductionCurrent {
    id: string
    slug: string
    titlePt: string
    titleKr: string | null
    type: string
    year: number | null
    network: string | null
    episodeCount: number | null
    imageUrl: string | null
    synopsis: string | null
    tagline: string | null
    whyWatch: string | null
    editorialReview: string | null
    editorialRating: number | null
    curiosidades: string[]
    enrichedAt: string | null
    artists: { artist: { nameRomanized: string } }[]
}

interface ValidationError { field: string; message: string }

interface DiffField {
    field: string
    label: string
    current: string
    incoming: string
    changed: boolean
}

function summarize(val: unknown): string {
    if (val === null || val === undefined) return '(vazio)'
    if (typeof val === 'string') return val
    if (typeof val === 'number') return String(val)
    if (Array.isArray(val)) return (val as unknown[]).map((v, i) => `${i + 1}. ${String(v)}`).join('\n\n')
    return JSON.stringify(val, null, 2)
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        || 'producao'
}

function buildDiff(current: ProductionCurrent, incoming: Record<string, unknown>): DiffField[] {
    const fields: Array<{ key: keyof ProductionCurrent; label: string }> = [
        { key: 'titlePt',         label: 'Título PT-BR' },
        { key: 'synopsis',        label: 'Sinopse' },
        { key: 'tagline',         label: 'Tagline' },
        { key: 'whyWatch',        label: 'Por que assistir' },
        { key: 'editorialReview', label: 'Análise Editorial' },
        { key: 'editorialRating', label: 'Nota' },
        { key: 'curiosidades',    label: 'Curiosidades' },
    ]
    const result = fields
        .filter(f => incoming[f.key] !== undefined)
        .map(f => ({
            field: f.key,
            label: f.label,
            current: summarize(current[f.key]),
            incoming: summarize(incoming[f.key]),
            changed: JSON.stringify(current[f.key]) !== JSON.stringify(incoming[f.key]),
        }))

    // Se titlePt mudou, mostrar slug previsto
    if (incoming.titlePt && typeof incoming.titlePt === 'string') {
        const newSlug = slugify(incoming.titlePt)
        const currentSlug = current.slug ?? ''
        if (newSlug !== currentSlug) {
            result.splice(1, 0, {
                field: 'slug',
                label: 'Slug (URL)',
                current: currentSlug || '(vazio)',
                incoming: newSlug,
                changed: true,
            })
        }
    }

    return result
}

export default function ProductionEnrichPage() {
    const { id } = useParams<{ id: string }>()
    const toast = useAdminToast()

    const [current, setCurrent] = useState<ProductionCurrent | null>(null)
    const [loadingCurrent, setLoadingCurrent] = useState(true)
    const [jsonInput, setJsonInput] = useState('')
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
    const [parsed, setParsed] = useState<Record<string, unknown> | null>(null)
    const [diff, setDiff] = useState<DiffField[]>([])
    const [applying, setApplying] = useState(false)
    const [applied, setApplied] = useState<string[] | null>(null)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        fetch(`/api/admin/productions/${id}/enrich`)
            .then(r => r.json())
            .then(d => setCurrent(d.production))
            .finally(() => setLoadingCurrent(false))
    }, [id])

    const validate = useCallback(() => {
        setValidationErrors([])
        setParsed(null)
        setDiff([])
        setApplied(null)

        let obj: Record<string, unknown>
        try { obj = JSON.parse(jsonInput.trim()) } catch {
            setValidationErrors([{ field: 'json', message: 'JSON inválido — verifique a formatação' }])
            return
        }

        const errors: ValidationError[] = []
        if (obj.whyWatch && typeof obj.whyWatch === 'string' && obj.whyWatch.length < 50)
            errors.push({ field: 'whyWatch', message: `"Por que assistir" muito curto: ${obj.whyWatch.length} chars (mín. 50)` })
        if (obj.editorialReview && typeof obj.editorialReview === 'string' && obj.editorialReview.length < 100)
            errors.push({ field: 'editorialReview', message: `Análise muito curta: ${obj.editorialReview.length} chars (mín. 100)` })
        if (obj.editorialRating != null && (typeof obj.editorialRating !== 'number' || obj.editorialRating < 0 || obj.editorialRating > 10))
            errors.push({ field: 'editorialRating', message: 'Nota deve ser número entre 0 e 10' })

        if (errors.length > 0) { setValidationErrors(errors); return }

        setParsed(obj)
        if (current) setDiff(buildDiff(current, obj))
    }, [jsonInput, current])

    const handleApply = async () => {
        if (!parsed) return
        setApplying(true)
        try {
            const res = await fetch(`/api/admin/productions/${id}/enrich`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsed),
            })
            const data = await res.json()
            if (!res.ok) {
                if (data.details) setValidationErrors(data.details)
                else toast.error(data.error || 'Erro ao aplicar')
                return
            }
            setApplied(data.fieldsUpdated)
            toast.success('Enriquecimento aplicado!')
            const r = await fetch(`/api/admin/productions/${id}/enrich`)
            const d = await r.json()
            setCurrent(d.production)
            setDiff([])
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erro ao aplicar')
        } finally {
            setApplying(false)
        }
    }

    const copyPrompt = async () => {
        if (!current) return
        const res = await fetch(`/api/admin/productions/enrich-prompt?productionId=${id}`)
        if (!res.ok) { toast.error('Erro ao carregar prompt'); return }
        const { prompt, context } = await res.json()
        const filled = prompt.replace('[COLE O NOME AQUI]', context || current.titlePt)
        await navigator.clipboard.writeText(filled)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const hasChanges = diff.some(d => d.changed)
    const isValid = parsed !== null && validationErrors.length === 0

    const statusFields = [
        { label: 'Tagline',    ok: !!current?.tagline },
        { label: 'Por que assistir', ok: !!current?.whyWatch },
        { label: 'Análise',    ok: !!current?.editorialReview },
        { label: 'Nota',       ok: current?.editorialRating != null },
        { label: 'Curiosidades', ok: (current?.curiosidades?.length ?? 0) > 0, count: current?.curiosidades?.length },
    ]

    return (
        <AdminLayout title={`Enriquecer: ${current?.titlePt ?? '…'}`}>
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                <div className="flex items-center gap-3">
                    <Link href="/admin/productions/enrich" className="text-muted hover:text-foreground transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <PageHeader
                        title={`Enriquecer: ${current?.titlePt ?? '…'}`}
                        subtitle={[current?.type, current?.year, current?.network].filter(Boolean).join(' · ')}
                    />
                </div>

                {current && (
                    <div className="bg-surface border border-border rounded-lg p-4">
                        <p className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Estado atual</p>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            {statusFields.map(item => (
                                <div key={item.label} className="flex items-center gap-2">
                                    {item.ok ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                                    <span className="text-sm text-muted">
                                        {item.label}{item.count !== undefined && ` (${item.count})`}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {current.artists.length > 0 && (
                            <p className="text-xs text-muted mt-3">
                                Elenco: {current.artists.map(a => a.artist.nameRomanized).join(', ')}
                            </p>
                        )}
                        {current.enrichedAt && (
                            <p className="text-xs text-muted mt-1">
                                Último enriquecimento: {new Date(current.enrichedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                        )}
                    </div>
                )}

                {/* Instruções + Copiar prompt */}
                <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold text-foreground mb-1">Como usar:</p>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-muted">
                                <li>Copie o prompt com o contexto já preenchido</li>
                                <li>Cole no Gemini e envie</li>
                                <li>Copie o JSON retornado e cole abaixo</li>
                                <li>Clique em <strong className="text-foreground">Validar</strong> → <strong className="text-foreground">Aplicar</strong></li>
                            </ol>
                        </div>
                        <button onClick={copyPrompt} disabled={!current || copied}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold shrink-0 transition-all ${copied ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-accent text-white hover:bg-accent/90 disabled:opacity-40'}`}>
                            {copied ? <><ClipboardCheck className="w-4 h-4" /> Copiado!</> : <><Copy className="w-4 h-4" /> Copiar prompt</>}
                        </button>
                    </div>
                </div>

                {/* Input JSON */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted uppercase tracking-widest">JSON do Gemini</label>
                    <textarea
                        value={jsonInput}
                        onChange={e => { setJsonInput(e.target.value); setParsed(null); setValidationErrors([]); setDiff([]); setApplied(null) }}
                        placeholder={'{\n  "tagline": "...",\n  "whyWatch": "...",\n  ...\n}'}
                        rows={14}
                        className="w-full bg-surface border border-border rounded-lg p-3 text-sm font-mono text-foreground resize-y focus:outline-none focus:border-accent/50 placeholder:text-muted/40"
                        spellCheck={false}
                    />
                    <button type="button" onClick={validate} disabled={!jsonInput.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-accent/90 transition-colors">
                        <Eye className="w-4 h-4" /> Validar e ver diff
                    </button>
                </div>

                {validationErrors.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-2">
                        <p className="text-sm font-bold text-red-400 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {validationErrors.length} erro{validationErrors.length > 1 ? 's' : ''} encontrado{validationErrors.length > 1 ? 's' : ''}
                        </p>
                        <ul className="space-y-1">
                            {validationErrors.map((e, i) => (
                                <li key={i} className="text-sm text-red-300">
                                    <span className="font-mono text-red-400">{e.field}:</span> {e.message}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {isValid && diff.length > 0 && (
                    <div className="space-y-3">
                        <p className="text-xs font-bold text-muted uppercase tracking-widest">
                            Diff — {diff.filter(d => d.changed).length} campo{diff.filter(d => d.changed).length !== 1 ? 's' : ''} alterado{diff.filter(d => d.changed).length !== 1 ? 's' : ''}
                        </p>
                        <div className="space-y-2">
                            {diff.map(item => (
                                <div key={item.field} className={`border rounded-lg p-3 ${item.changed ? 'border-accent/40 bg-accent/5' : 'border-border bg-surface opacity-60'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {item.changed ? <CheckCircle className="w-3.5 h-3.5 text-accent" /> : <RefreshCw className="w-3.5 h-3.5 text-muted" />}
                                        <span className="text-xs font-bold text-foreground">{item.label}</span>
                                        {!item.changed && <span className="text-xs text-muted">(sem alteração)</span>}
                                    </div>
                                    {item.changed && (
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            {([
                                                { label: 'Atual', text: item.current, cls: 'text-foreground/70 bg-red-500/10' },
                                                { label: 'Novo',  text: item.incoming, cls: 'text-foreground bg-green-500/10' },
                                            ] as const).map(side => (
                                                <div key={side.label}>
                                                    <p className="text-muted mb-1">{side.label}</p>
                                                    <pre className={`font-mono px-3 py-2 rounded whitespace-pre-wrap break-words max-h-64 overflow-y-auto leading-relaxed ${side.cls}`}>{side.text}</pre>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={handleApply} disabled={!hasChanges || applying}
                            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-green-500 transition-colors">
                            {applying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {applying ? 'Aplicando…' : 'Aplicar no banco'}
                        </button>
                    </div>
                )}

                {applied && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                        <p className="text-sm font-bold text-green-400 flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4" /> Enriquecimento aplicado!
                        </p>
                        <p className="text-xs text-muted">
                            Campos atualizados: <span className="text-foreground font-mono">{applied.join(', ')}</span>
                        </p>
                        <Link href={`/productions/${current?.slug ?? id}`} className="mt-3 inline-flex items-center gap-1.5 text-xs text-accent hover:underline">
                            Ver produção →
                        </Link>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
