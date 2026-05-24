'use client'

import { X, CheckCircle2, AlertTriangle, AlertCircle, Send } from 'lucide-react'
import type { ArticleIssue } from '@/lib/hooks/useArticleHealth'

interface Props {
    issues: ArticleIssue[]
    onConfirm: () => void
    onCancel: () => void
    isPublished: boolean
}

export function PublishChecklist({ issues, onConfirm, onCancel, isPublished }: Props) {
    const errors   = issues.filter(i => i.severity === 'error')
    const warnings = issues.filter(i => i.severity === 'warning')
    const canPublish = errors.length === 0

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-background border border-border rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <h2 className="text-base font-black text-foreground">
                        {isPublished ? 'Despublicar artigo' : 'Publicar artigo'}
                    </h2>
                    <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-surface transition-colors text-muted hover:text-foreground">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-5 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
                    {issues.length === 0 ? (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-400/20">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-emerald-600">Artigo pronto para publicar</p>
                                <p className="text-xs text-muted mt-0.5">Nenhum problema detectado.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {errors.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-red-500">Erros que impedem publicação ({errors.length})</p>
                                    {errors.map(issue => (
                                        <div key={issue.id} className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/5 border border-red-400/20">
                                            <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-semibold text-red-500">{issue.title}</p>
                                                {issue.detail && <p className="text-[11px] text-muted mt-0.5">{issue.detail}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {warnings.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-amber-500">Avisos (publicação possível)</p>
                                    {warnings.map(issue => (
                                        <div key={issue.id} className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/5 border border-amber-400/20">
                                            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-semibold text-amber-600">{issue.title}</p>
                                                {issue.detail && <p className="text-[11px] text-muted mt-0.5">{issue.detail}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border">
                    <button onClick={onCancel}
                        className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted hover:text-foreground hover:bg-surface transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!canPublish && !isPublished}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ff2d78] text-white text-sm font-bold hover:bg-[#e0256a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Send className="w-3.5 h-3.5" />
                        {isPublished ? 'Despublicar' : canPublish ? 'Publicar agora' : 'Corrigir erros primeiro'}
                    </button>
                </div>
            </div>
        </div>
    )
}
