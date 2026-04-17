'use client'

import { useState } from 'react'
import { RotateCcw, X } from 'lucide-react'

interface RestoreModalProps {
  productionId: string
  productionTitle: string
  takedownReason: string
  onSuccess: () => void
  onClose: () => void
}

const REASON_LABELS: Record<string, string> = {
  DMCA: 'DMCA',
  COPYRIGHT: 'Direitos Autorais',
  LEGAL_NOTICE: 'Notificação Legal',
  MANUAL: 'Manual',
}

export function RestoreModal({ productionId, productionTitle, takedownReason, onSuccess, onClose }: RestoreModalProps) {
  const [restoredReason, setRestoredReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = restoredReason.length >= 10 && !loading

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/productions/${productionId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restoredReason }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erro ao restaurar produção')
        return
      }
      onSuccess()
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl border border-yellow-800/50 bg-background p-6 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-muted hover:text-foreground">
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-900/40">
            <RotateCcw className="h-5 w-5 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Restaurar Produção</h2>
            <p className="text-sm text-muted truncate max-w-xs">{productionTitle}</p>
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-yellow-900/40 bg-yellow-950/20 px-3 py-2">
          <p className="text-xs text-yellow-400">
            Takedown ativo: <strong>{REASON_LABELS[takedownReason] ?? takedownReason}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Motivo da Restauração <span className="text-red-400">*</span>
            </label>
            <textarea
              value={restoredReason}
              onChange={e => setRestoredReason(e.target.value)}
              rows={4}
              minLength={10}
              maxLength={5000}
              placeholder="Ex: Notificação contestada com sucesso. Documentação comprobatória arquivada em..."
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-yellow-500 focus:outline-none resize-none"
            />
            <p className="mt-1 text-xs text-muted">{restoredReason.length}/5000 (mínimo 10)</p>
          </div>

          {error && (
            <p className="rounded-lg border border-red-800/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border bg-surface px-4 py-2 text-sm text-foreground hover:bg-surface-hover"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 rounded-lg bg-yellow-700 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? 'Restaurando...' : 'Restaurar Produção'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
