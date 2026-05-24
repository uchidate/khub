'use client'

import { useState } from 'react'
import { AlertTriangle, AlertCircle, Info, CheckCircle2, Loader2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import type { ArticleIssue, IssueSeverity } from '@/lib/hooks/useArticleHealth'

const FIELD_LABELS: Record<string, string> = {
    title: 'Título', excerpt: 'Resumo', cover: 'Capa', category: 'Categoria',
    tags: 'Tags', blocks: 'Conteúdo', seo: 'SEO',
}

const SEVERITY_CONFIG: Record<IssueSeverity, {
    icon: React.ReactNode
    color: string
    bg: string
    border: string
    label: string
}> = {
    error: {
        icon: <AlertTriangle className="w-3.5 h-3.5 shrink-0" />,
        color: 'text-red-500',
        bg: 'bg-red-500/[.04]',
        border: 'border-red-400/25',
        label: 'Erro',
    },
    warning: {
        icon: <AlertCircle className="w-3.5 h-3.5 shrink-0" />,
        color: 'text-amber-500',
        bg: 'bg-amber-500/[.04]',
        border: 'border-amber-400/25',
        label: 'Atenção',
    },
    info: {
        icon: <Info className="w-3.5 h-3.5 shrink-0" />,
        color: 'text-blue-400',
        bg: 'bg-blue-500/[.04]',
        border: 'border-blue-400/25',
        label: 'Sugestão',
    },
}

interface Props {
    issues: ArticleIssue[]
    errors: number
    warnings: number
    checking: boolean
    onJumpToField?: (field: string) => void
    onJumpToBlock?: (index: number) => void
}

export function ArticleHealthPanel({ issues, errors, warnings, checking, onJumpToField, onJumpToBlock }: Props) {
    const [open, setOpen] = useState(true)

    const isHealthy = !checking && issues.length === 0
    const score = isHealthy ? 100 : Math.max(0, 100 - errors * 20 - warnings * 8 - (issues.length - errors - warnings) * 3)

    const scoreColor =
        score >= 80 ? 'text-emerald-500' :
        score >= 50 ? 'text-amber-500' :
        'text-red-500'

    const grouped = issues.reduce<Record<IssueSeverity, ArticleIssue[]>>((acc, issue) => {
        acc[issue.severity].push(issue)
        return acc
    }, { error: [], warning: [], info: [] })

    return (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-hover transition-colors"
            >
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-black uppercase tracking-wide text-foreground whitespace-nowrap">Saúde</span>
                    {checking && <Loader2 className="w-3 h-3 animate-spin text-muted shrink-0" />}
                    {!checking && (
                        <span className={`text-[11px] font-black tabular-nums shrink-0 ${scoreColor}`}>{score}/100</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {errors > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full">
                            <AlertTriangle className="w-2.5 h-2.5" />{errors}
                        </span>
                    )}
                    {warnings > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                            <AlertCircle className="w-2.5 h-2.5" />{warnings}
                        </span>
                    )}
                    {open ? <ChevronUp className="w-3.5 h-3.5 text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-muted" />}
                </div>
            </button>

            {open && (
                <div className="border-t border-border">
                    {/* Score bar */}
                    <div className="px-4 pt-3 pb-2">
                        <div className="h-1.5 rounded-full bg-border overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${score}%` }}
                            />
                        </div>
                    </div>

                    {isHealthy ? (
                        <div className="flex items-center gap-2 px-4 py-3 text-emerald-500 text-xs font-semibold">
                            <CheckCircle2 className="w-4 h-4" />
                            Artigo sem problemas detectados
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {(['error', 'warning', 'info'] as IssueSeverity[]).map(severity => {
                                const group = grouped[severity]
                                if (group.length === 0) return null
                                const cfg = SEVERITY_CONFIG[severity]
                                return (
                                    <div key={severity} className="px-3 py-2 space-y-1.5">
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${cfg.color} px-1`}>
                                            {cfg.label}s ({group.length})
                                        </p>
                                        {group.map(issue => (
                                            <IssueRow
                                                key={issue.id}
                                                issue={issue}
                                                cfg={cfg}
                                                onJump={() => {
                                                    if (issue.blockIndex !== undefined) onJumpToBlock?.(issue.blockIndex)
                                                    else if (issue.field) onJumpToField?.(issue.field)
                                                }}
                                            />
                                        ))}
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {checking && (
                        <div className="flex items-center gap-2 px-4 py-2.5 border-t border-border text-[11px] text-muted">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Verificando imagens e vídeos…
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function IssueRow({ issue, cfg, onJump }: {
    issue: ArticleIssue
    cfg: typeof SEVERITY_CONFIG[IssueSeverity]
    onJump: () => void
}) {
    return (
        <button
            onClick={onJump}
            className={`w-full flex items-start gap-2 px-2.5 py-2 rounded-lg border text-left transition-colors hover:brightness-[.97] ${cfg.bg} ${cfg.border}`}
        >
            <span className={`mt-0.5 ${cfg.color}`}>{cfg.icon}</span>
            <div className="flex-1 min-w-0">
                <p className={`text-[12px] font-semibold leading-snug ${cfg.color}`}>{issue.title}</p>
                {issue.detail && (
                    <p className="text-[11px] text-muted mt-0.5 leading-snug truncate">{issue.detail}</p>
                )}
                {issue.field && (
                    <p className="text-[10px] text-muted/60 mt-0.5">{FIELD_LABELS[issue.field] ?? issue.field}</p>
                )}
            </div>
            {(issue.blockIndex !== undefined || issue.field) && (
                <ExternalLink className="w-3 h-3 text-muted/50 shrink-0 mt-0.5" />
            )}
        </button>
    )
}
