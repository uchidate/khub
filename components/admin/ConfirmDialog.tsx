'use client'

import { useEffect, useRef } from 'react'
import { AlertTriangle, X } from 'lucide-react'

/**
 * ConfirmDialog
 *
 * Modal de confirmação padronizado para ações destrutivas no admin.
 * Substitui `window.confirm()` e alerts inline espalhados pelas páginas.
 *
 * Uso:
 *   const [confirming, setConfirming] = useState(false)
 *
 *   <ConfirmDialog
 *     open={confirming}
 *     title="Excluir artista"
 *     description="Esta ação não pode ser desfeita."
 *     confirmLabel="Excluir"
 *     variant="danger"
 *     onConfirm={async () => { await deleteArtist(id); setConfirming(false) }}
 *     onCancel={() => setConfirming(false)}
 *   />
 */

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'default'
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
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) confirmRef.current?.focus()
  }, [open])

  // Fecha com Esc
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  const confirmStyles = {
    danger: 'bg-red-600 hover:bg-red-500 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-500 text-white',
    default: 'bg-zinc-700 hover:bg-zinc-600 text-white',
  }

  const iconStyles = {
    danger: 'bg-red-500/15 text-red-400',
    warning: 'bg-yellow-500/15 text-yellow-400',
    default: 'bg-zinc-800 text-zinc-400',
  }

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-5 pb-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconStyles[variant]}`}>
            <AlertTriangle size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white">{title}</h3>
            {description && (
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">{description}</p>
            )}
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors flex-shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-zinc-800">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-zinc-400 bg-zinc-800 hover:bg-zinc-700 hover:text-white border border-zinc-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2 text-sm font-bold rounded-lg transition-colors disabled:opacity-50 ${confirmStyles[variant]}`}
          >
            {loading ? 'Aguarde...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
