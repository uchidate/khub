'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'default'
  /** Controle externo de loading (opcional — se omitido, gerenciado internamente) */
  loading?: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  loading: externalLoading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)
  const [internalLoading, setInternalLoading] = useState(false)
  const loading = externalLoading ?? internalLoading

  useEffect(() => {
    if (open) confirmRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancel()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel, loading])

  if (!open) return null

  const handleConfirm = async () => {
    const result = onConfirm()
    if (result instanceof Promise) {
      setInternalLoading(true)
      try { await result } finally { setInternalLoading(false) }
    }
  }

  const confirmStyles = {
    danger:  'bg-red-600 hover:bg-red-500 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-500 text-foreground',
    default: 'bg-surface hover:bg-surface-hover text-foreground border border-border',
  }

  const iconStyles = {
    danger:  'bg-red-500/15 text-red-400',
    warning: 'bg-yellow-500/15 text-yellow-400',
    default: 'bg-surface text-muted',
  }

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => { if (!loading) onCancel() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? 'confirm-dialog-desc' : undefined}
        className="w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 p-5 pb-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconStyles[variant]}`}>
            <AlertTriangle size={16} aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="confirm-dialog-title" className="text-sm font-bold text-foreground">{title}</h3>
            {description && (
              <p id="confirm-dialog-desc" className="mt-1 text-xs text-muted leading-relaxed">{description}</p>
            )}
          </div>
          <button
            onClick={() => { if (!loading) onCancel() }}
            disabled={loading}
            aria-label="Fechar"
            className="p-1 text-muted hover:text-foreground transition-colors flex-shrink-0 disabled:opacity-40"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-2 px-5 py-4 border-t border-border">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-muted bg-surface hover:bg-surface-hover hover:text-foreground border border-border rounded-lg transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2 text-sm font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 ${confirmStyles[variant]}`}
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            {loading ? 'Aguarde...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
