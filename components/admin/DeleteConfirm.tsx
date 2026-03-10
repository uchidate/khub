'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'

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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl">
        <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 className="text-red-400" size={24} />
        </div>
        <h3 className="text-base font-bold text-white mb-1.5">Confirmar exclusão</h3>
        <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
          Você está prestes a excluir{' '}
          <span className="text-white font-semibold">
            {count} {entityName}{count !== 1 ? 's' : ''}
          </span>
          . Esta ação <span className="text-red-400 font-medium">não pode ser desfeita</span>.
        </p>
        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 bg-zinc-800 text-zinc-300 rounded-xl hover:bg-zinc-700 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-500 disabled:opacity-60 transition-colors text-sm font-bold flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Excluindo...
              </>
            ) : (
              'Excluir'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
