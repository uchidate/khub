'use client'

import { useState } from 'react'
import { ShieldAlert, X } from 'lucide-react'

interface TakedownModalProps {
  productionId: string
  productionTitle: string
  onSuccess: () => void
  onClose: () => void
}

const REASON_LABELS: Record<string, string> = {
  DMCA: 'DMCA (Digital Millennium Copyright Act)',
  COPYRIGHT: 'Direitos Autorais',
  LEGAL_NOTICE: 'Notificação Legal / Judicial',
  MANUAL: 'Ocultação Manual Preventiva',
}

export function TakedownModal({ productionId, productionTitle, onSuccess, onClose }: TakedownModalProps) {
  const [reason, setReason] = useState('')
  const [noticeReference, setNoticeReference] = useState('')
  const [noticeDate, setNoticeDate] = useState('')
  const [notes, setNotes] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = reason && confirmed && !loading

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/productions/${productionId}/takedown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          noticeReference: noticeReference || undefined,
          noticeDate: noticeDate ? new Date(noticeDate).toISOString() : undefined,
          notes: notes || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erro ao emitir takedown')
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
      <div className="relative w-full max-w-lg rounded-xl border border-red-800/50 bg-gray-950 p-6 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-500 hover:text-white">
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-900/40">
            <ShieldAlert className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Notificação Legal</h2>
            <p className="text-sm text-gray-400 truncate max-w-xs">{productionTitle}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Tipo de Notificação <span className="text-red-400">*</span>
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
            >
              <option value="">Selecionar...</option>
              {Object.entries(REASON_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Referência da Notificação
            </label>
            <input
              type="text"
              value={noticeReference}
              onChange={e => setNoticeReference(e.target.value)}
              placeholder="Nº processo, URL, ID da notificação..."
              maxLength={500}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Data da Notificação
            </label>
            <input
              type="date"
              value={noticeDate}
              onChange={e => setNoticeDate(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Observações
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              maxLength={5000}
              placeholder="Detalhes adicionais sobre a notificação..."
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-red-500 focus:outline-none resize-none"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-red-900/40 bg-red-950/20 p-3">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-red-500"
            />
            <span className="text-sm text-red-300">
              Confirmo que recebi esta notificação e entendo que a produção será{' '}
              <strong>imediatamente ocultada</strong> do site público.
            </span>
          </label>

          {error && (
            <p className="rounded-lg border border-red-800/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? 'Emitindo...' : 'Emitir Takedown'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
