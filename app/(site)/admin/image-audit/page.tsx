'use client'

import { useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import { AlertTriangle, CheckCircle, Loader2, RefreshCw, ExternalLink, Image as ImageIcon, Pencil } from 'lucide-react'
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

interface AuditResult {
    total: number
    broken: number
    ok: number
    items: BrokenImage[]
}

export default function ImageAuditPage() {
    const toast = useAdminToast()
    const [result, setResult] = useState<AuditResult | null>(null)
    const [loading, setLoading] = useState(false)

    async function runAudit() {
        setLoading(true)
        setResult(null)
        try {
            const res = await fetch('/api/admin/image-audit')
            if (!res.ok) throw new Error(`Erro ${res.status}`)
            setResult(await res.json())
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Erro desconhecido')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AdminLayout
            title="Auditoria de Imagens"
            subtitle="Verifica todas as imagens dos artigos publicados"
            actions={
                <button
                    onClick={runAudit}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    {loading ? 'Verificando…' : 'Iniciar auditoria'}
                </button>
            }
        >
            <div className="max-w-4xl space-y-6">
                {result && (
                    <>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-4 rounded-xl border border-border bg-surface text-center">
                                <p className="text-2xl font-black text-foreground">{result.total}</p>
                                <p className="text-xs text-muted mt-1">imagens verificadas</p>
                            </div>
                            <div className="p-4 rounded-xl border border-emerald-400/30 bg-emerald-500/5 text-center">
                                <p className="text-2xl font-black text-emerald-500">{result.ok}</p>
                                <p className="text-xs text-muted mt-1">funcionando</p>
                            </div>
                            <div className={`p-4 rounded-xl border text-center ${result.broken > 0 ? 'border-red-400/30 bg-red-500/5' : 'border-border bg-surface'}`}>
                                <p className={`text-2xl font-black ${result.broken > 0 ? 'text-red-500' : 'text-muted'}`}>{result.broken}</p>
                                <p className="text-xs text-muted mt-1">quebradas</p>
                            </div>
                        </div>

                        {result.broken === 0 ? (
                            <div className="flex items-center gap-3 p-5 rounded-xl border border-emerald-400/30 bg-emerald-500/5">
                                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                                <p className="text-sm font-semibold text-emerald-600">Todas as imagens estão funcionando.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-muted">Imagens quebradas</p>
                                {result.items.map((item, i) => (
                                    <div key={i} className="p-4 rounded-xl border border-red-400/20 bg-red-500/[.03] space-y-2">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                                                <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted shrink-0">{item.blockType}</span>
                                                {item.status && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 font-mono shrink-0">{item.status}</span>}
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <a href={item.url} target="_blank" rel="noopener noreferrer"
                                                    className="p-1.5 rounded-lg hover:bg-surface transition-colors text-muted hover:text-foreground"
                                                    title="Abrir URL">
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                                <Link href={`/admin/blog/${item.postId}/edit`}
                                                    className="p-1.5 rounded-lg hover:bg-surface transition-colors text-muted hover:text-foreground"
                                                    title="Editar artigo">
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Link>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-muted font-mono break-all pl-6">{item.url}</p>
                                        <div className="pl-6">
                                            <img
                                                src={item.url}
                                                alt=""
                                                className="h-16 w-auto rounded border border-border object-cover opacity-60"
                                                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {!result && !loading && (
                    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                        <ImageIcon className="w-10 h-10 text-muted/30" />
                        <p className="text-sm text-muted">Clique em "Iniciar auditoria" para verificar todas as imagens dos artigos publicados.</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
