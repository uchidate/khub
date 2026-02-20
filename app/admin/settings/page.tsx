'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Settings, Shield, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'

type SystemSettings = {
  id: string
  allowAdultContent: boolean
  allowUnclassifiedContent: boolean
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const res = await fetch('/api/admin/settings/content')
      const data = await res.json()
      setSettings(data.settings)
    } catch (e) {
      console.error('Erro ao carregar settings:', e)
      setMessage({ type: 'error', text: 'Erro ao carregar configurações' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!settings) return

    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/settings/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allowAdultContent: settings.allowAdultContent,
          allowUnclassifiedContent: settings.allowUnclassifiedContent,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar')
      }

      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' })
      setSettings(data.settings)
    } catch (e) {
      console.error('Erro ao salvar:', e)
      setMessage({ type: 'error', text: 'Erro ao salvar configurações' })
    } finally {
      setSaving(false)
    }
  }

  function toggle(field: 'allowAdultContent' | 'allowUnclassifiedContent') {
    if (!settings) return
    setSettings({ ...settings, [field]: !settings[field] })
  }

  if (loading) {
    return (
      <AdminLayout title="Configurações do Sistema">
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Configurações do Sistema">
      <div className="space-y-6">
        {/* Info card */}
        <div className="bg-zinc-900 border border-blue-500/20 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-white mb-1">
                Controle de Conteúdo Global
              </p>
              <p className="text-xs text-zinc-400">
                Essas configurações controlam quais classificações etárias são permitidas no site.
                Mesmo que um usuário tente acessar conteúdo bloqueado, ele não será exibido.
              </p>
            </div>
          </div>
        </div>

        {/* Settings card */}
        <div className="bg-zinc-900 border border-purple-500/20 rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Classificação Etária</h2>
          </div>

          {/* Allow Adult Content */}
          <div className="flex items-start justify-between gap-4 py-4 border-t border-zinc-800 first:border-t-0">
            <div className="flex-1">
              <p className="text-white font-bold mb-1">Permitir conteúdo 18+</p>
              <p className="text-sm text-zinc-400">
                Quando desabilitado, produções com classificação 18+ não aparecem em nenhuma listagem do site
              </p>
            </div>
            <button
              onClick={() => toggle('allowAdultContent')}
              className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${
                settings?.allowAdultContent ? 'bg-purple-500' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings?.allowAdultContent ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Allow Unclassified Content */}
          <div className="flex items-start justify-between gap-4 py-4 border-t border-zinc-800">
            <div className="flex-1">
              <p className="text-white font-bold mb-1">Permitir conteúdo não classificado</p>
              <p className="text-sm text-zinc-400">
                Quando desabilitado, produções sem classificação etária não aparecem em nenhuma listagem do site
              </p>
            </div>
            <button
              onClick={() => toggle('allowUnclassifiedContent')}
              className={`relative w-14 h-7 rounded-full transition-colors flex-shrink-0 ${
                settings?.allowUnclassifiedContent ? 'bg-purple-500' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings?.allowUnclassifiedContent ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Save button */}
          <div className="pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Salvar Configurações
                </>
              )}
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`border rounded-xl p-4 flex items-start gap-3 ${
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
                Alterações nessas configurações afetam <strong>todo o site</strong> imediatamente,
                incluindo: home, recém adicionados, bem avaliados, listagem de produções e páginas de grupos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
