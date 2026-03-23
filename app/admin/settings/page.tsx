'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import {
  Shield, AlertTriangle, CheckCircle, RefreshCw, Wrench,
  Layers, Clock, RotateCcw, ChevronRight,
} from 'lucide-react'

type SystemSettings = {
  id: string
  allowAdultContent: boolean
  allowUnclassifiedContent: boolean
  maintenanceMode: boolean
  updatedAt: string
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

type RevalidateTarget = 'system-settings' | 'productions' | 'artists' | 'news' | 'all'

const REVALIDATE_TARGETS: { target: RevalidateTarget; label: string; desc: string }[] = [
  { target: 'productions', label: 'Produções', desc: '/productions e listagens' },
  { target: 'artists', label: 'Artistas', desc: '/artists e listagens' },
  { target: 'news', label: 'Notícias', desc: '/news e feeds' },
  { target: 'system-settings', label: 'Configurações', desc: 'Cache interno de settings' },
  { target: 'all', label: 'Tudo', desc: 'Revalidar todo o cache de uma vez' },
]

function Toggle({
  checked,
  onChange,
  color = 'purple',
  disabled = false,
}: {
  checked: boolean
  onChange: () => void
  color?: 'purple' | 'amber' | 'red'
  disabled?: boolean
}) {
  const activeColor = {
    purple: 'bg-purple-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  }[color]

  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
        checked ? activeColor : 'bg-surface'
      }`}
    >
      <div
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function SettingRow({
  label,
  description,
  checked,
  onChange,
  color,
  saving,
  warning,
}: {
  label: string
  description: string
  checked: boolean
  onChange: () => void
  color?: 'purple' | 'amber' | 'red'
  saving: boolean
  warning?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-t border-border first:border-t-0">
      <div className="flex-1 min-w-0">
        <p className="text-foreground font-medium mb-0.5">{label}</p>
        <p className="text-sm text-muted">{description}</p>
        {warning && checked && (
          <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            {warning}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
        {saving && <RefreshCw className="w-3 h-3 text-muted animate-spin" />}
        <Toggle checked={checked} onChange={onChange} color={color} disabled={saving} />
      </div>
    </div>
  )
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [fieldSaving, setFieldSaving] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [revalidating, setRevalidating] = useState<RevalidateTarget | null>(null)
  const [revalidateMessage, setRevalidateMessage] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/settings/content')
      .then(r => r.json())
      .then(d => setSettings(d.settings))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function saveField(field: keyof Omit<SystemSettings, 'id' | 'updatedAt'>, value: boolean) {
    if (!settings) return
    setFieldSaving(field)
    setSaveState('saving')

    try {
      const res = await fetch('/api/admin/settings/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSettings(data.settings)
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('error')
      // revert optimistic update
      setSettings(prev => prev ? { ...prev, [field]: !value } : prev)
      setTimeout(() => setSaveState('idle'), 3000)
    } finally {
      setFieldSaving(null)
    }
  }

  function toggle(field: keyof Omit<SystemSettings, 'id' | 'updatedAt'>) {
    if (!settings || fieldSaving) return
    const newValue = !settings[field]
    setSettings({ ...settings, [field]: newValue })
    saveField(field, newValue)
  }

  async function revalidate(target: RevalidateTarget) {
    setRevalidating(target)
    setRevalidateMessage(null)
    try {
      const res = await fetch('/api/admin/settings/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRevalidateMessage(`✓ ${data.label} revalidado`)
    } catch {
      setRevalidateMessage('Erro ao revalidar')
    } finally {
      setRevalidating(null)
      setTimeout(() => setRevalidateMessage(null), 4000)
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Configurações do Sistema">
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-7 h-7 text-purple-500 animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  const updatedAt = settings?.updatedAt
    ? new Date(settings.updatedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    : null

  return (
    <AdminLayout title="Configurações do Sistema">
      <div className="space-y-5 max-w-2xl">

        {/* Status bar */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {updatedAt ? `Última alteração: ${updatedAt}` : 'Carregando…'}
          </p>
          {saveState === 'saving' && (
            <span className="text-xs text-muted flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" /> Salvando…
            </span>
          )}
          {saveState === 'saved' && (
            <span className="text-xs text-green-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Salvo
            </span>
          )}
          {saveState === 'error' && (
            <span className="text-xs text-red-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Erro ao salvar
            </span>
          )}
        </div>

        {/* Maintenance Mode — highlight if on */}
        {settings?.maintenanceMode && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-400">Modo manutenção ATIVO</p>
              <p className="text-xs text-muted mt-0.5">O site está exibindo o aviso de manutenção para todos os usuários.</p>
            </div>
          </div>
        )}

        {/* Plataforma */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <Wrench className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-foreground">Plataforma</h2>
          </div>

          <SettingRow
            label="Modo manutenção"
            description="Exibe um aviso de manutenção para todos os visitantes. Use durante deploys ou atualizações críticas."
            checked={settings?.maintenanceMode ?? false}
            onChange={() => toggle('maintenanceMode')}
            color="red"
            saving={fieldSaving === 'maintenanceMode'}
            warning="Todos os usuários estão vendo o aviso de manutenção."
          />
        </div>

        {/* Classificação Etária */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <Shield className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-foreground">Classificação Etária</h2>
          </div>

          <SettingRow
            label="Permitir conteúdo 18+"
            description="Quando desabilitado, produções com classificação 18+ são ocultadas de todas as listagens do site."
            checked={settings?.allowAdultContent ?? false}
            onChange={() => toggle('allowAdultContent')}
            color="purple"
            saving={fieldSaving === 'allowAdultContent'}
          />
          <SettingRow
            label="Permitir conteúdo sem classificação"
            description="Quando desabilitado, produções sem classificação etária são ocultadas das listagens públicas."
            checked={settings?.allowUnclassifiedContent ?? false}
            onChange={() => toggle('allowUnclassifiedContent')}
            color="purple"
            saving={fieldSaving === 'allowUnclassifiedContent'}
          />
        </div>

        {/* Cache ISR */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-2.5 mb-1">
            <Layers className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-foreground">Cache ISR</h2>
          </div>
          <p className="text-xs text-muted mb-5">
            Invalida o cache de renderização estática. Use após alterações em massa que não disparam revalidação automática.
          </p>

          <div className="space-y-2">
            {REVALIDATE_TARGETS.map(({ target, label, desc }) => (
              <button
                key={target}
                onClick={() => revalidate(target)}
                disabled={revalidating !== null}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left ${
                  target === 'all'
                    ? 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-blue-300'
                    : 'border-border hover:border-border hover:bg-surface text-foreground'
                }`}
              >
                <div>
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-xs text-muted ml-2">{desc}</span>
                </div>
                {revalidating === target ? (
                  <RotateCcw className="w-4 h-4 animate-spin text-muted" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted" />
                )}
              </button>
            ))}
          </div>

          {revalidateMessage && (
            <p className={`mt-3 text-xs ${revalidateMessage.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
              {revalidateMessage}
            </p>
          )}
        </div>

        <p className="text-xs text-muted pb-2">
          As alterações nas configurações de conteúdo são aplicadas imediatamente. O cache ISR das páginas públicas é invalidado automaticamente ao salvar.
        </p>
      </div>
    </AdminLayout>
  )
}
