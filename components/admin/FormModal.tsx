'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'

export interface FormField {
  key: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'textarea' | 'select' | 'select-async' | 'tags' | 'toggle' | 'section'
  placeholder?: string
  required?: boolean
  /** Static options for type='select' */
  options?: { value: string; label: string }[]
  /** API URL for type='select-async'. Response: { data: { id, name }[] } */
  optionsUrl?: string
  /** Description shown below label */
  description?: string
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
  const [asyncOptions, setAsyncOptions] = useState<Record<string, { value: string; label: string }[]>>({})

  // Load async options for select-async fields
  useEffect(() => {
    const asyncFields = fields.filter(f => f.type === 'select-async' && f.optionsUrl)
    if (asyncFields.length === 0) return

    asyncFields.forEach(field => {
      fetch(`${field.optionsUrl}`)
        .then(r => r.json())
        .then(data => {
          const items: { id: string; name: string }[] = data.data ?? data.items ?? data
          setAsyncOptions(prev => ({
            ...prev,
            [field.key]: items.map(item => ({ value: item.id, label: item.name })),
          }))
        })
        .catch(() => {})
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields])

  useEffect(() => {
    if (open) {
      const data: Record<string, unknown> = {}
      fields.forEach((f) => {
        if (f.type === 'section') return
        const val = initialData?.[f.key]
        data[f.key] = f.type === 'toggle' ? (val ?? false) : (val ?? '')
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

  const baseInputClass = "w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/60 focus:bg-zinc-900/80 text-sm transition-all"
  const selectClass = `${baseInputClass} cursor-pointer`

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-950 border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-base font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-500/8 border border-red-500/20 rounded-xl text-red-400 text-sm">
              <span className="flex-shrink-0 mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {fields.map((field) => {
            // Section divider
            if (field.type === 'section') {
              return (
                <div key={field.key} className="pt-2 first:pt-0">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{field.label}</span>
                    <div className="flex-1 h-px bg-zinc-800" />
                  </div>
                  {field.description && (
                    <p className="text-xs text-zinc-600 mt-1">{field.description}</p>
                  )}
                </div>
              )
            }

            return (
              <div key={field.key}>
                {field.type !== 'toggle' && (
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                    {field.description && (
                      <span className="ml-2 font-normal text-zinc-600 normal-case tracking-normal">{field.description}</span>
                    )}
                  </label>
                )}

                {field.type === 'textarea' ? (
                  <textarea
                    value={String(formData[field.key] || '')}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    rows={4}
                    className={`${baseInputClass} resize-none`}
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={String(formData[field.key] || '')}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    required={field.required}
                    className={selectClass}
                  >
                    <option value="">Selecionar...</option>
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'select-async' ? (
                  <select
                    value={String(formData[field.key] || '')}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    required={field.required}
                    className={selectClass}
                  >
                    <option value="">{asyncOptions[field.key] ? 'Nenhum' : 'Carregando...'}</option>
                    {(asyncOptions[field.key] ?? []).map((opt) => (
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
                    className={baseInputClass}
                  />
                ) : field.type === 'toggle' ? (
                  <label className="flex items-center gap-3 cursor-pointer py-1">
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={!!formData[field.key]}
                        onChange={(e) => handleChange(field.key, e.target.checked)}
                      />
                      <div className="w-10 h-6 bg-zinc-700 peer-checked:bg-green-600 rounded-full transition-colors duration-200" />
                      <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 peer-checked:translate-x-4" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-zinc-300">{field.label}</span>
                      {field.description && (
                        <p className="text-xs text-zinc-600 mt-0.5">{field.description}</p>
                      )}
                    </div>
                  </label>
                ) : (
                  <input
                    type={field.type}
                    value={String(formData[field.key] || '')}
                    onChange={(e) => handleChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    className={baseInputClass}
                  />
                )}
              </div>
            )
          })}

          <div className="flex gap-3 pt-3 border-t border-zinc-800/60">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 bg-zinc-800 text-zinc-300 rounded-xl hover:bg-zinc-700 disabled:opacity-50 transition-colors font-medium text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-500 disabled:opacity-60 transition-colors font-bold text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                initialData ? 'Atualizar' : 'Criar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
