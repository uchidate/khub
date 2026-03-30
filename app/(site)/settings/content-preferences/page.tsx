'use client'

import { useState, useEffect } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Shield, ArrowLeft, CheckCircle, RefreshCw, AlertTriangle, Info } from 'lucide-react'

type Rating = {
  value: string
  label: string
  description: string
  color: string
}

const RATINGS: Rating[] = [
  { value: 'L', label: 'Livre', description: 'Livre para todos os públicos', color: 'bg-green-600' },
  { value: '10', label: '10+', description: 'Não recomendado para menores de 10 anos', color: 'bg-blue-600' },
  { value: '12', label: '12+', description: 'Não recomendado para menores de 12 anos', color: 'bg-yellow-500' },
  { value: '14', label: '14+', description: 'Não recomendado para menores de 14 anos', color: 'bg-orange-500' },
  { value: '16', label: '16+', description: 'Não recomendado para menores de 16 anos', color: 'bg-red-600' },
  { value: '18', label: '18+', description: 'Conteúdo adulto', color: 'bg-red-900' },
  { value: 'null', label: 'Sem classificação', description: 'Produções sem classificação etária', color: 'bg-[#2a2a2a]' },
]

type SystemSettings = {
  allowAdultContent: boolean
  allowUnclassifiedContent: boolean
}

export default function ContentPreferencesPage() {
  const [allowedRatings, setAllowedRatings] = useState<string[]>([])
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchPreferences()
  }, [])

  async function fetchPreferences() {
    try {
      const res = await fetch('/api/settings/content-preferences')
      const data = await res.json()

      if (!res.ok) {
        if (res.status === 401) {
          redirect('/auth/login?callbackUrl=/settings/content-preferences')
        }
        throw new Error(data.error)
      }

      setSystemSettings(data.systemSettings)

      // Se já tem preferências salvas, usar
      if (data.preferences?.allowedRatings) {
        setAllowedRatings(data.preferences.allowedRatings)
      } else {
        // Padrão seguro: L, 10, 12, 14, 16 (sem 18+ e null)
        setAllowedRatings(['L', '10', '12', '14', '16'])
      }
    } catch (e) {
      console.error('Erro ao carregar preferências:', e)
      setMessage({ type: 'error', text: 'Erro ao carregar preferências' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/settings/content-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowedRatings }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar')
      }

      setMessage({ type: 'success', text: 'Preferências salvas com sucesso!' })
    } catch (e: unknown) {
      console.error('Erro ao salvar:', e)
      const errorMsg = e instanceof Error ? e.message : 'Erro ao salvar preferências'
      setMessage({ type: 'error', text: errorMsg })
    } finally {
      setSaving(false)
    }
  }

  function toggleRating(value: string) {
    if (allowedRatings.includes(value)) {
      setAllowedRatings(allowedRatings.filter(r => r !== value))
    } else {
      setAllowedRatings([...allowedRatings, value])
    }
  }

  function isDisabled(value: string): boolean {
    if (!systemSettings) return false
    if (value === '18' && !systemSettings.allowAdultContent) return true
    if (value === 'null' && !systemSettings.allowUnclassifiedContent) return true
    return false
  }

  if (loading) {
    return (
      <>
        
        <div className="min-h-screen bg-background py-8 px-4">
          <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-[#ff2d78] animate-spin" />
          </div>
        </div>
      </>
    )
  }

  return (
      
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12 animate-fade-in">
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 text-[#ff2d78] hover:text-[#ff2d78] transition-colors mb-6"
            >
              <ArrowLeft size={20} />
              Voltar às Configurações
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="text-[#ff2d78]" size={40} />
              <h1 className="text-4xl md:text-5xl font-black text-foreground">
                Preferências de Conteúdo
              </h1>
            </div>
            <p className="text-xl text-muted">
              Escolha quais classificações etárias você deseja ver
            </p>
          </div>

          {/* Info card */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-400">
                <p className="font-bold mb-1">Como funciona?</p>
                <p>
                  Selecione abaixo quais classificações você quer ver ao navegar pelo site.
                  Apenas produções com as classificações selecionadas aparecerão em todas as listagens.
                </p>
              </div>
            </div>
          </div>

          {/* Ratings selection */}
          <div className="bg-background border border-border rounded-2xl p-8 mb-6">
            <h2 className="text-xl font-bold text-foreground mb-6">Classificações Permitidas</h2>
            <div className="space-y-4">
              {RATINGS.map((rating) => {
                const disabled = isDisabled(rating.value)
                const checked = allowedRatings.includes(rating.value)

                return (
                  <div
                    key={rating.value}
                    className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
                      disabled
                        ? 'bg-surface/50 border-border/50 opacity-50 cursor-not-allowed'
                        : checked
                        ? 'bg-[#ff2d78]/10 border-[#ff2d78]/30'
                        : 'bg-surface border-border hover:border-[#6b6b6b]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRating(rating.value)}
                      disabled={disabled}
                      className="w-5 h-5 rounded border-border bg-background text-[#ff2d78] focus:ring-[#ff2d78] focus:ring-offset-0 cursor-pointer disabled:cursor-not-allowed mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-black text-white ${rating.color}`}>
                          {rating.label}
                        </span>
                        <span className="text-foreground font-bold">{rating.label === 'Sem classificação' ? rating.label : `Classificação ${rating.label}`}</span>
                        {disabled && (
                          <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                            Bloqueado pelo administrador
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted">{rating.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Save button */}
            <div className="mt-8 flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-[#ff2d78] hover:bg-[#ff2d78] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Salvar Preferências
                  </>
                )}
              </button>
              <span className="text-sm text-muted">
                {allowedRatings.length} classificação{allowedRatings.length !== 1 ? 'ões' : ''} selecionada{allowedRatings.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`border rounded-xl p-4 flex items-start gap-3 mb-6 ${
                message.type === 'success'
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-red-500/10 border-red-500/20'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm font-medium ${
                message.type === 'success' ? 'text-green-400' : 'text-red-400'
              }`}>
                {message.text}
              </p>
            </div>
          )}

          {/* Warning */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-400">
                <p className="font-bold mb-1">Atenção</p>
                <p>
                  Suas preferências afetam todas as listagens do site: home, recém adicionados,
                  bem avaliados, produções, grupos e muito mais.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}
