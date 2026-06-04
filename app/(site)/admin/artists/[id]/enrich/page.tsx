'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { PageHeader } from '@/components/admin/PageHeader'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import { CheckCircle, XCircle, AlertTriangle, ChevronLeft, Send, RefreshCw, Eye, Copy, ClipboardCheck } from 'lucide-react'

interface ArtistCurrent {
    id: string
    nameRomanized: string
    nameHangul: string | null
    height: string | null
    bloodType: string | null
    bio: string | null
    analiseEditorial: string | null
    curiosidades: string[]
    musicalStyle: string | null
    fanInfo: unknown
    awards: unknown
    destaques: unknown
    videos: unknown
    faq: unknown
    nationality: string | null
    debutDate: string | null
    enrichedAt: string | null
    agency: { name: string } | null
}

interface ValidationError {
    field: string
    message: string
}

interface DiffField {
    field: string
    label: string
    current: string
    incoming: string
    changed: boolean
}

function FanColorSwatch({ color }: { color: string }) {
    return (
        <span
            className="inline-block w-3 h-3 rounded-full border border-white/20 align-middle mr-1"
            style={{ backgroundColor: color }}
            title={color}
        />
    )
}

function summarize(val: unknown): string {
    if (val === null || val === undefined) return '(vazio)'
    if (typeof val === 'string') return val
    if (Array.isArray(val)) return (val as unknown[]).map((v, i) => `${i + 1}. ${typeof v === 'string' ? v : JSON.stringify(v)}`).join('\n\n')
    return JSON.stringify(val, null, 2)
}

function buildDiff(current: ArtistCurrent, incoming: Record<string, unknown>): DiffField[] {
    const fields: Array<{ key: keyof ArtistCurrent; label: string }> = [
        { key: 'nameRomanized', label: 'Nome Romanizado' },
        { key: 'nameHangul', label: 'Nome Hangul' },
        { key: 'height', label: 'Altura' },
        { key: 'bloodType', label: 'Tipo Sanguíneo' },
        { key: 'nationality', label: 'Nacionalidade' },
        { key: 'debutDate', label: 'Debut' },
        { key: 'bio', label: 'Bio' },
        { key: 'analiseEditorial', label: 'Análise Editorial' },
        { key: 'curiosidades', label: 'Curiosidades' },
        { key: 'musicalStyle', label: 'Estilo Musical' },
        { key: 'fanInfo', label: 'Info do Fandom' },
        { key: 'awards', label: 'Prêmios' },
        { key: 'destaques', label: 'Destaques' },
        { key: 'videos', label: 'Vídeos YouTube' },
        { key: 'faq', label: 'FAQ' },
    ]

    return fields
        .filter(f => incoming[f.key] !== undefined)
        .map(f => {
            const curr = current[f.key]
            const inc = incoming[f.key]
            return {
                field: f.key,
                label: f.label,
                current: summarize(curr),
                incoming: summarize(inc),
                changed: JSON.stringify(curr) !== JSON.stringify(inc),
            }
        })
}

export default function ArtistEnrichPage() {
    const { id } = useParams<{ id: string }>()
    const toast = useAdminToast()

    const [current, setCurrent] = useState<ArtistCurrent | null>(null)
    const [_loadingCurrent, setLoadingCurrent] = useState(true)
    const [jsonInput, setJsonInput] = useState('')
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
    const [parsed, setParsed] = useState<Record<string, unknown> | null>(null)
    const [diff, setDiff] = useState<DiffField[]>([])
    const [applying, setApplying] = useState(false)
    const [applied, setApplied] = useState<string[] | null>(null)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        fetch(`/api/admin/artists/${id}/enrich`)
            .then(r => r.json())
            .then(d => setCurrent(d.artist))
            .finally(() => setLoadingCurrent(false))
    }, [id])

    const validate = useCallback(() => {
        setValidationErrors([])
        setParsed(null)
        setDiff([])
        setApplied(null)

        let obj: Record<string, unknown>
        try {
            obj = JSON.parse(jsonInput.trim())
        } catch {
            setValidationErrors([{ field: 'json', message: 'JSON inválido — verifique a formatação' }])
            return
        }

        // Client-side quick checks
        const errors: ValidationError[] = []

        if (obj.bio && typeof obj.bio === 'string' && obj.bio.length < 100)
            errors.push({ field: 'bio', message: `Bio muito curta: ${obj.bio.length} chars (mín. 100)` })

        if (obj.analiseEditorial && typeof obj.analiseEditorial === 'string' && obj.analiseEditorial.length < 100)
            errors.push({ field: 'analiseEditorial', message: `Análise muito curta: ${obj.analiseEditorial.length} chars (mín. 100)` })

        if (obj.bio && obj.analiseEditorial &&
            typeof obj.bio === 'string' && typeof obj.analiseEditorial === 'string' &&
            obj.bio.trim() === obj.analiseEditorial.trim())
            errors.push({ field: 'analiseEditorial', message: 'Análise editorial idêntica à bio — devem ser diferentes' })

        if (obj.height && typeof obj.height === 'string' && !/^\d{2,3}$/.test(obj.height))
            errors.push({ field: 'height', message: 'Altura deve ser apenas número (ex: 183)' })

        if (obj.bloodType && !['A', 'B', 'AB', 'O'].includes(obj.bloodType as string))
            errors.push({ field: 'bloodType', message: 'Tipo sanguíneo inválido — usar A, B, AB ou O' })

        if (obj.curiosidades && Array.isArray(obj.curiosidades) && (obj.curiosidades as string[]).length < 3)
            errors.push({ field: 'curiosidades', message: `Poucas curiosidades: ${(obj.curiosidades as string[]).length} (mín. 3)` })

        if (errors.length > 0) {
            setValidationErrors(errors)
            return
        }

        setParsed(obj)
        if (current) setDiff(buildDiff(current, obj))
    }, [jsonInput, current])

    const handleApply = async () => {
        if (!parsed) return
        setApplying(true)
        try {
            const res = await fetch(`/api/admin/artists/${id}/enrich`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsed),
            })
            const data = await res.json()
            if (!res.ok) {
                if (data.details) {
                    setValidationErrors(data.details)
                } else {
                    toast.error(data.error || 'Erro ao aplicar')
                }
                return
            }
            setApplied(data.fieldsUpdated)
            toast.success('Curadoria aplicada com sucesso!')
            // Recarregar dados atuais
            const r = await fetch(`/api/admin/artists/${id}/enrich`)
            const d = await r.json()
            setCurrent(d.artist)
            setDiff([])
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erro ao aplicar')
        } finally {
            setApplying(false)
        }
    }

    const hasChanges = diff.some(d => d.changed)
    const isValid = parsed !== null && validationErrors.length === 0

    const copyPrompt = async () => {
        if (!current) return
        const res = await fetch(`/api/admin/artists/enrich-prompt?artistId=${id}`)
        if (!res.ok) { toast.error('Erro ao carregar prompt'); return }
        const { prompt, productions } = await res.json()

        const artistName = current.nameHangul
            ? `${current.nameRomanized} (${current.nameHangul})`
            : current.nameRomanized
        const agencyLine = current.agency ? ` — ${current.agency.name}` : ''
        const productionsLine = productions?.length
            ? `\nConheço produções deste artista: ${(productions as string[]).join(', ')}.`
            : ''

        const context = `${artistName}${agencyLine}${productionsLine}`
        const filled = prompt.replace('[COLE O NOME AQUI]', context)
        await navigator.clipboard.writeText(filled)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <AdminLayout title={`Curar no Gemini: ${current?.nameRomanized ?? '…'}`} hideTitle>
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                <div className="flex items-center gap-3">
                    <Link
                        href={`/admin/artists/${id}`}
                        className="text-muted hover:text-foreground transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <PageHeader
                        title={`Curar no Gemini: ${current?.nameRomanized ?? '…'}`}
                        subtitle="Cole o JSON gerado pelo Gemini para validar e aplicar"
                    />
                </div>

                {/* Status do artista atual */}
                {current && (
                    <div className="bg-surface border border-border rounded-lg p-4">
                        <p className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Estado atual</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { label: 'Bio', ok: !!current.bio },
                                { label: 'Análise', ok: !!current.analiseEditorial },
                                { label: 'Curiosidades', ok: current.curiosidades.length > 0, count: current.curiosidades.length },
                                { label: 'Altura', ok: !!current.height },
                                { label: 'Tipo Sang.', ok: !!current.bloodType },
                                { label: 'Fandom', ok: !!current.fanInfo },
                                { label: 'Prêmios', ok: !!current.awards },
                                { label: 'Destaques', ok: !!current.destaques },
                            ].map(item => (
                                <div key={item.label} className="flex items-center gap-2">
                                    {item.ok
                                        ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                                        : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                                    <span className="text-sm text-muted">
                                        {item.label}
                                        {item.count !== undefined && ` (${item.count})`}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {current.enrichedAt && (
                            <p className="text-xs text-muted mt-3">
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
                                <li>Copie o prompt com o nome já preenchido</li>
                                <li>Cole no Gemini e envie</li>
                                <li>Copie o JSON retornado e cole abaixo</li>
                                <li>Clique em <strong className="text-foreground">Validar</strong> → <strong className="text-foreground">Aplicar</strong></li>
                            </ol>
                        </div>
                        <button
                            onClick={copyPrompt}
                            disabled={!current || copied}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold shrink-0 transition-all ${
                                copied
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-accent text-white hover:bg-accent/90 disabled:opacity-40'
                            }`}
                        >
                            {copied ? (
                                <><ClipboardCheck className="w-4 h-4" /> Copiado!</>
                            ) : (
                                <><Copy className="w-4 h-4" /> Copiar prompt</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Input JSON */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted uppercase tracking-widest">
                        JSON do Gemini
                    </label>
                    <textarea
                        value={jsonInput}
                        onChange={e => {
                            setJsonInput(e.target.value)
                            setParsed(null)
                            setValidationErrors([])
                            setDiff([])
                            setApplied(null)
                        }}
                        placeholder={'{\n  "bio": "...",\n  "curiosidades": [...],\n  ...\n}'}
                        rows={14}
                        className="w-full bg-surface border border-border rounded-lg p-3 text-sm font-mono text-foreground resize-y focus:outline-none focus:border-accent/50 placeholder:text-muted/40"
                        spellCheck={false}
                    />
                    <button
                        type="button"
                        onClick={validate}
                        disabled={!jsonInput.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-accent/90 transition-colors"
                    >
                        <Eye className="w-4 h-4" />
                        Validar e ver diff
                    </button>
                </div>

                {/* Erros de validação */}
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

                {/* Diff visual */}
                {isValid && diff.length > 0 && (
                    <div className="space-y-3">
                        <p className="text-xs font-bold text-muted uppercase tracking-widest">
                            Diff — {diff.filter(d => d.changed).length} campo{diff.filter(d => d.changed).length !== 1 ? 's' : ''} alterado{diff.filter(d => d.changed).length !== 1 ? 's' : ''}
                        </p>
                        <div className="space-y-2">
                            {diff.map(item => (
                                <div
                                    key={item.field}
                                    className={`border rounded-lg p-3 ${
                                        item.changed
                                            ? 'border-accent/40 bg-accent/5'
                                            : 'border-border bg-surface opacity-60'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        {item.changed
                                            ? <CheckCircle className="w-3.5 h-3.5 text-accent" />
                                            : <RefreshCw className="w-3.5 h-3.5 text-muted" />}
                                        <span className="text-xs font-bold text-foreground">{item.label}</span>
                                        {!item.changed && <span className="text-xs text-muted">(sem alteração)</span>}
                                    </div>
                                    {item.changed && (
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            {([
                                                { label: 'Atual', text: item.current, cls: 'text-foreground/70 bg-red-500/10' },
                                                { label: 'Novo',  text: item.incoming, cls: 'text-foreground bg-green-500/10' },
                                            ] as const).map(side => {
                                                const colorMatch = item.field === 'fanInfo' && side.text.match(/#[0-9a-fA-F]{3,6}|rgb\([^)]+\)/)?.[0]
                                                return (
                                                    <div key={side.label}>
                                                        <p className="text-muted mb-1">{side.label}</p>
                                                        {colorMatch && (
                                                            <div className="flex items-center gap-2 px-3 py-1.5 mb-1 rounded bg-white/5">
                                                                <FanColorSwatch color={colorMatch} />
                                                                <span className="font-mono text-[11px] text-foreground">{colorMatch}</span>
                                                            </div>
                                                        )}
                                                        <pre className={`font-mono px-3 py-2 rounded whitespace-pre-wrap break-words max-h-64 overflow-y-auto leading-relaxed ${side.cls}`}>{side.text}</pre>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={handleApply}
                            disabled={!hasChanges || applying}
                            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-green-500 transition-colors"
                        >
                            {applying
                                ? <RefreshCw className="w-4 h-4 animate-spin" />
                                : <Send className="w-4 h-4" />}
                            {applying ? 'Aplicando…' : 'Aplicar no banco'}
                        </button>
                    </div>
                )}

                {/* Sucesso */}
                {applied && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                        <p className="text-sm font-bold text-green-400 flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4" />
                            Curadoria aplicada!
                        </p>
                        <p className="text-xs text-muted">
                            Campos atualizados: <span className="text-foreground font-mono">{applied.join(', ')}</span>
                        </p>
                        <Link
                            href={`/admin/artists/${id}`}
                            className="mt-3 inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
                        >
                            Ver artista completo →
                        </Link>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
