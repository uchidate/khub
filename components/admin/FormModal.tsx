'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export interface FormField {
  key: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'textarea' | 'select' | 'tags'
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
}

interface FormModalProps {
  title: string
  fields: FormField[]
  initialData?: Record<string, unknown>
  open: boolean
  onClose: () => void
  onSubmit: (data: Record<string, unknown>) => Promise<void>
}

export function FormModal({ title, fields, initialData, open, onClose, onSubmit }: FormModalProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      const data: Record<string, unknown> = {}
      fields.forEach((f) => {
        data[f.key] = initialData?.[f.key] ?? ''
      })
      setFormData(data)
      setError('')
    }
  }, [open, initialData, fields])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await onSubmit(formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
          )}

          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {field.type === 'textarea' ? (
                <textarea
                  value={String(formData[field.key] || '')}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                  rows={4}
                  className="w-full px-4 py-3 bg-black/50 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 text-sm resize-none"
                />
              ) : field.type === 'select' ? (
                <select
                  value={String(formData[field.key] || '')}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  required={field.required}
                  className="w-full px-4 py-3 bg-black/50 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-purple-500/50 text-sm"
                >
                  <option value="">Selecionar...</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'tags' ? (
                <input
                  type="text"
                  value={Array.isArray(formData[field.key]) ? (formData[field.key] as string[]).join(', ') : String(formData[field.key] || '')}
                  onChange={(e) => handleChange(field.key, e.target.value.split(',').map((t) => t.trim()).filter(Boolean))}
                  placeholder={field.placeholder || 'Separar por vírgula'}
                  className="w-full px-4 py-3 bg-black/50 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 text-sm"
                />
              ) : (
                <input
                  type={field.type}
                  value={String(formData[field.key] || '')}
                  onChange={(e) => handleChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                  className="w-full px-4 py-3 bg-black/50 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 text-sm"
                />
              )}
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-zinc-800 text-zinc-300 rounded-xl hover:bg-zinc-700 transition-colors font-medium text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-500 disabled:opacity-50 transition-colors font-bold text-sm"
            >
              {loading ? 'Salvando...' : initialData ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
