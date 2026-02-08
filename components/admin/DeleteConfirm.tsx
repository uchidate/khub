'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'

interface DeleteConfirmProps {
  open: boolean
  count: number
  entityName: string
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function DeleteConfirm({ open, count, entityName, onClose, onConfirm }: DeleteConfirmProps) {
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="text-red-400" size={28} />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Confirmar exclusão</h3>
        <p className="text-sm text-zinc-400 mb-6">
          Tem certeza que deseja excluir {count} {entityName}
          {count !== 1 ? 's' : ''}? Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-zinc-800 text-zinc-300 rounded-xl hover:bg-zinc-700 transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-500 disabled:opacity-50 transition-colors text-sm font-bold"
          >
            {loading ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  )
}
