'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Flag, X } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/lib/hooks/useToast'
import { useAuthGate } from '@/lib/hooks/useAuthGate'

const CATEGORIES = [
  { value: 'wrong_info',    label: 'Informação incorreta' },
  { value: 'wrong_image',   label: 'Imagem errada ou inadequada' },
  { value: 'duplicate',     label: 'Conteúdo duplicado' },
  { value: 'missing_info',  label: 'Informação ausente' },
  { value: 'other',         label: 'Outro problema' },
] as const

interface ReportButtonProps {
  entityType: 'artist' | 'production' | 'group'
  entityId: string
  entityName: string
  className?: string
}

export function ReportButton({ entityType, entityId, entityName, className = '' }: ReportButtonProps) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { addToast } = useToast()
  const { status } = useSession()
  const openAuthGate = useAuthGate(s => s.open)

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (status === 'unauthenticated') {
      openAuthGate('reportar um problema')
      return
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setCategory('')
    setDescription('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category || submitting) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType, entityId, entityName, category, description: description.trim() || undefined }),
      })

      if (res.ok) {
        addToast({ type: 'success', message: 'Report enviado! Obrigado pelo feedback.', duration: 4000 })
        handleClose()
      } else {
        addToast({ type: 'error', message: 'Erro ao enviar report. Tente novamente.', duration: 4000 })
      }
    } catch {
      addToast({ type: 'error', message: 'Erro de rede. Tente novamente.', duration: 4000 })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className={`p-2 rounded-full transition-colors duration-200 text-muted hover:text-orange-400 ${className}`}
        aria-label="Reportar problema"
        title="Reportar problema nesta página"
      >
        <Flag size={16} />
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        >
          <div
            className="relative w-full max-w-md bg-background border border-border rounded-xl shadow-xl p-6"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Flag size={16} className="text-orange-400" />
              <h2 className="text-base font-black text-foreground">Reportar Problema</h2>
            </div>
            <p className="text-xs text-muted mb-5 truncate">
              {entityName}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Qual é o problema? <span className="text-red-400">*</span>
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  required
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-orange-500 appearance-none"
                >
                  <option value="">Selecione uma categoria...</option>
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Descrição (opcional)
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value.slice(0, 500))}
                  placeholder="Descreva o problema com mais detalhes..."
                  rows={3}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-[#6b6b6b] focus:outline-none focus:border-orange-500 resize-none"
                />
                <p className="text-right text-[10px] text-muted mt-1">{description.length}/500</p>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-surface text-foreground text-sm font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!category || submitting}
                  className="flex-1 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Enviando...' : 'Enviar Report'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
