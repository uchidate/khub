'use client'

import { useState, useEffect, useRef } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import {
    AlertTriangle, CheckCircle, Loader2, RefreshCw,
    ExternalLink, Image as ImageIcon, Pencil, Eye, EyeOff, Search, X,
} from 'lucide-react'
import Link from 'next/link'

interface BrokenImage {
    postId: string
    slug: string
    title: string
    url: string
    blockType: string
    ok: boolean
    status: number | null
}

interface AuditState {
    status: 'idle' | 'running' | 'done'
    total: number
    checked: number
    broken: number
    ok: number
    items: BrokenImage[]
    allItems: BrokenImage[]
    runAt: string | null
}

const STORAGE_KEY = 'image-audit-last-result'
const BLOCK_TYPE_LABELS: Record<string, string> = {
    cover: 'Capa',
    blog_image: 'Imagem',
    blog_gallery: 'Galeria',
}

function loadSaved(): AuditState | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : null
    } catch { return null }
}

function saveLast(state: AuditState) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* noop */ }
}

export default function ImageAuditPage() {
    const toast = useAdminToast()
    const abortRef = useRef<AbortController | null>(null)

    const [state, setState] = useState<AuditState>({
        status: 'idle', total: 0, checked: 0, broken: 0, ok: 0, items: [], allItems: [], runAt: null,
    })
    const [showAll, setShowAll] = useState(false)
    const [postFilter, setPostFilter] = useState('')
    const [postFilterInput, setPostFilterInput] = useState('')

    // Restaurar último resultado do localStorage
    useEffect(() => {
        const saved = loadSaved()
        if (saved) setState(saved)
    }, [])

    async function runAudit() {
        if (abortRef.current) abortRef.current.abort()
        const abort = new AbortController()
        abortRef.current = abort

        setState(s => ({ ...s, status: 'running', checked: 0, total: 0, broken: 0, ok: 0, items: [], allItems: [], runAt: null }))

        try {
            const params = new URLSearchParams({ stream: '1' })
            if (postFilter) params.set('postId', postFilter)

            const res = await fetch(`/api/admin/image-audit?${params}`, { signal: abort.signal })
            if (!res.ok) throw new Error(`Erro ${res.status}`)
            if (!res.body) throw new Error('Sem stream')

            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let buf = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                buf += decoder.decode(value, { stream: true })
                const lines = buf.split('\n\n')
                buf = lines.pop() ?? ''

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue
                    try {
                        const event = JSON.parse(line.slice(6))
                        if (event.type === 'start') {
                            setState(s => ({ ...s, total: event.total }))
                        } else if (event.type === 'progress') {
                            setState(s => ({ ...s, checked: event.checked, total: event.total }))
                        } else if (event.type === 'broken') {
                            setState(s => ({ ...s, items: [...s.items, event.item] }))
                        } else if (event.type === 'done') {
                            const final: AuditState = {
                                status: 'done',
                                total: event.total,
                                checked: event.total,
                                broken: event.broken,
                                ok: event.ok,
                                items: event.items,
                                allItems: event.allItems,
                                runAt: new Date().toISOString(),
                            }
                            setState(final)
                            saveLast(final)
                        }
                    } catch { /* ignore parse errors */ }
                }
            }
        } catch (e) {
            if ((e as Error).name === 'AbortError') return
            toast.error(e instanceof Error ? e.message : 'Erro desconhecido')
            setState(s => ({ ...s, status: 'idle' }))
        }
    }

    function stopAudit() {
        abortRef.current?.abort()
        setState(s => ({ ...s, status: 'idle' }))
    }

    function applyPostFilter() {
        setPostFilter(postFilterInput.trim())
    }

    function clearPostFilter() {
        setPostFilter('')
        setPostFilterInput('')
    }

    const isRunning = state.status === 'running'
    const hasDone = state.status === 'done' || (state.status === 'idle' && state.runAt)
    const progress = state.total > 0 ? Math.round((state.checked / state.total) * 100) : 0
    const displayItems = showAll ? state.allItems : state.items

    return (
        <AdminLayout
            title="Auditoria de Imagens"
            subtitle="Verifica imagens dos artigos publicados — capas, blocos e galerias"
            actions={
                <div className="flex items-center gap-2">
                    {isRunning ? (
                        <button onClick={stopAudit}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/40 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-colors">
                            <X className="w-4 h-4" /> Parar
                        </button>
                    ) : (
                        <button onClick={runAudit}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                            <RefreshCw className="w-4 h-4" />
                            {state.runAt ? 'Re-auditar' : 'Iniciar auditoria'}
                        </button>
                    )}
                </div>
            }
        >
            <div className="max-w-4xl space-y-6">

                {/* Filtro por post */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
                        <input
                            type="text"
                            placeholder="ID do post para auditar só um artigo…"
                            value={postFilterInput}
                            onChange={e => setPostFilterInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && applyPostFilter()}
                            className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-border bg-surface text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
                        />
                    </div>
                    {postFilterInput && (
                        <button onClick={applyPostFilter}
                            className="px-3 py-2 text-xs rounded-lg border border-border bg-surface hover:bg-surface-hover text-muted hover:text-foreground transition-colors">
                            Filtrar
                        </button>
                    )}
                    {postFilter && (
                        <button onClick={clearPostFilter}
                            className="flex items-center gap-1 px-3 py-2 text-xs rounded-lg border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 transition-colors">
                            <X className="w-3 h-3" /> Limpar filtro
                        </button>
                    )}
                </div>

                {/* Barra de progresso durante execução */}
                {isRunning && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted">
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Verificando imagens…
                            </span>
                            <span className="tabular-nums">
                                {state.checked} / {state.total > 0 ? state.total : '…'}
                                {state.total > 0 && ` (${progress}%)`}
                            </span>
                        </div>
                        <div className="h-2 rounded-full bg-border overflow-hidden">
                            <div
                                className="h-full rounded-full bg-accent transition-all duration-300"
                                style={{ width: state.total > 0 ? `${progress}%` : '5%' }}
                            />
                        </div>
                        {state.items.length > 0 && (
                            <p className="text-xs text-red-400">{state.items.length} quebrada{state.items.length !== 1 ? 's' : ''} encontrada{state.items.length !== 1 ? 's' : ''} até agora</p>
                        )}
                    </div>
                )}

                {/* Resultado */}
                {hasDone && (
                    <>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-4 rounded-xl border border-border bg-surface text-center">
                                <p className="text-2xl font-black text-foreground">{state.total}</p>
                                <p className="text-xs text-muted mt-1">verificadas</p>
                            </div>
                            <div className="p-4 rounded-xl border border-emerald-400/30 bg-emerald-500/5 text-center">
                                <p className="text-2xl font-black text-emerald-500">{state.ok}</p>
                                <p className="text-xs text-muted mt-1">ok</p>
                            </div>
                            <div className={`p-4 rounded-xl border text-center ${state.broken > 0 ? 'border-red-400/30 bg-red-500/5' : 'border-border bg-surface'}`}>
                                <p className={`text-2xl font-black ${state.broken > 0 ? 'text-red-500' : 'text-muted'}`}>{state.broken}</p>
                                <p className="text-xs text-muted mt-1">quebradas</p>
                            </div>
                        </div>

                        {state.runAt && (
                            <p className="text-[10px] text-muted">
                                Último audit: {new Date(state.runAt).toLocaleString('pt-BR')}
                                {postFilter && <span className="ml-2 text-amber-400">(post filtrado)</span>}
                            </p>
                        )}

                        {state.broken === 0 && !showAll ? (
                            <div className="flex items-center gap-3 p-5 rounded-xl border border-emerald-400/30 bg-emerald-500/5">
                                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                                <p className="text-sm font-semibold text-emerald-600">Todas as imagens estão funcionando.</p>
                            </div>
                        ) : null}

                        {/* Toggle all/broken */}
                        {state.allItems.length > 0 && (
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                                    {showAll ? `Todas as imagens (${state.allItems.length})` : `Imagens quebradas (${state.items.length})`}
                                </p>
                                <button
                                    onClick={() => setShowAll(v => !v)}
                                    className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
                                >
                                    {showAll ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    {showAll ? 'Mostrar só quebradas' : 'Mostrar todas'}
                                </button>
                            </div>
                        )}

                        {displayItems.length > 0 && (
                            <div className="space-y-2">
                                {displayItems.map((item, i) => (
                                    <div key={i} className={`p-4 rounded-xl border space-y-2 ${item.ok ? 'border-border bg-surface/50' : 'border-red-400/20 bg-red-500/[.03]'}`}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-2 min-w-0">
                                                {item.ok
                                                    ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                                    : <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
                                                <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted shrink-0">
                                                    {BLOCK_TYPE_LABELS[item.blockType] ?? item.blockType}
                                                </span>
                                                {!item.ok && item.status && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 font-mono shrink-0">{item.status}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <a href={item.url} target="_blank" rel="noopener noreferrer"
                                                    className="p-1.5 rounded-lg hover:bg-surface transition-colors text-muted hover:text-foreground" title="Abrir URL">
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                                <Link href={`/admin/blog/${item.postId}/edit`}
                                                    className="p-1.5 rounded-lg hover:bg-surface transition-colors text-muted hover:text-foreground" title="Editar artigo">
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Link>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-muted font-mono break-all pl-6">{item.url}</p>
                                        {!item.ok && (
                                            <div className="pl-6">
                                                <img src={item.url} alt="" className="h-16 w-auto rounded border border-border object-cover opacity-60"
                                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {state.status === 'idle' && !state.runAt && (
                    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                        <ImageIcon className="w-10 h-10 text-muted/30" />
                        <p className="text-sm text-muted">Clique em "Iniciar auditoria" para verificar todas as imagens dos artigos publicados.</p>
                        <p className="text-xs text-muted/60">Capas, imagens em bloco e galerias são verificadas.</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
