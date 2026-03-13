'use client'

import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react'

export type StreamResult = 'updated' | 'skipped' | 'exists' | 'error'

export interface StreamLogEntry {
    title: string
    result: StreamResult
    artistCount: number
}

export interface StreamProgress {
    phase: 'running' | 'done' | 'error'
    label: string
    total: number
    current: number
    updated: number
    skipped: number
    exists: number
    errors: number
    log: StreamLogEntry[]
}

export function BatchProgressPanel({
    progress,
    onClose,
    existsLabel = 'já existem',
    updatedLabel = 'atualizadas',
    skippedLabel = 'sem conteúdo',
    doneHint,
}: {
    progress: StreamProgress
    onClose: () => void
    existsLabel?: string
    updatedLabel?: string
    skippedLabel?: string
    doneHint?: React.ReactNode
}) {
    const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0
    const isDone = progress.phase === 'done'
    const isError = progress.phase === 'error'

    return (
        <div className={`rounded-xl border overflow-hidden transition-all ${
            isError   ? 'border-red-500/30 bg-red-500/5'
            : isDone  ? 'border-emerald-500/30 bg-emerald-500/5'
            : 'border-purple-500/30 bg-purple-500/5'
        }`}>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3">
                {isError ? (
                    <AlertTriangle size={16} className="text-red-400 shrink-0" />
                ) : isDone ? (
                    <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                ) : (
                    <Loader2 size={16} className="text-purple-400 animate-spin shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                        <span className="text-sm font-semibold text-white truncate">
                            {isError  ? 'Erro no processamento'
                            : isDone  ? `Concluído — ${progress.label}`
                            : progress.label}
                        </span>
                        <span className="text-xs text-zinc-400 shrink-0 font-mono">
                            {progress.current}/{progress.total}
                        </span>
                    </div>

                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-300 ${
                                isError ? 'bg-red-500' : isDone ? 'bg-emerald-500' : 'bg-purple-500'
                            }`}
                            style={{ width: `${isDone ? 100 : pct}%` }}
                        />
                    </div>
                </div>

                {(isDone || isError) && (
                    <button onClick={onClose} className="text-zinc-500 hover:text-white text-xs shrink-0 ml-1">
                        ✕
                    </button>
                )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 px-4 pb-2 text-xs flex-wrap">
                <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle size={11} />
                    <strong>{progress.updated}</strong> {updatedLabel}
                </span>
                {progress.exists > 0 && (
                    <span className="flex items-center gap-1 text-blue-400">
                        <span className="w-2.5 h-2.5 rounded-full border border-blue-500/50 inline-block" />
                        <strong>{progress.exists}</strong> {existsLabel}
                    </span>
                )}
                {progress.skipped > 0 && (
                    <span className="flex items-center gap-1 text-zinc-500">
                        <span className="w-2.5 h-2.5 rounded-full border border-zinc-600 inline-block" />
                        <strong>{progress.skipped}</strong> {skippedLabel}
                    </span>
                )}
                <span className="flex items-center gap-1 text-red-400">
                    <XCircle size={11} />
                    <strong>{progress.errors}</strong> erros
                </span>
                {!isDone && !isError && (
                    <span className="ml-auto text-zinc-500 font-mono">{pct}%</span>
                )}
            </div>

            {/* Custom done hint */}
            {isDone && doneHint && (
                <div className="px-4 pb-2 pt-1 text-xs border-t border-white/5">
                    {doneHint}
                </div>
            )}

            {/* Live log */}
            {progress.log.length > 0 && (
                <div className="border-t border-white/5 max-h-48 overflow-y-auto">
                    {[...progress.log].reverse().map((entry, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-2.5 px-4 py-1.5 border-b border-white/[0.03] last:border-0"
                        >
                            <span className={`mt-0.5 shrink-0 ${
                                entry.result === 'updated' ? 'text-emerald-400' :
                                entry.result === 'exists'  ? 'text-blue-500' :
                                entry.result === 'skipped' ? 'text-zinc-600' :
                                'text-red-400'
                            }`}>
                                {entry.result === 'updated' ? '✓' :
                                 entry.result === 'exists'  ? '=' :
                                 entry.result === 'skipped' ? '—' : '✕'}
                            </span>
                            <span className="text-xs text-zinc-400 leading-snug truncate flex-1">
                                {entry.title}
                            </span>
                            {entry.result === 'updated' && entry.artistCount > 0 && (
                                <span className="text-[10px] text-purple-400 shrink-0">
                                    +{entry.artistCount} artista{entry.artistCount !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
