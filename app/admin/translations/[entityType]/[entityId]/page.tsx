'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { ArrowLeft, Save, ExternalLink, Clock, CheckCircle2, FileEdit } from 'lucide-react'
import Link from 'next/link'

type EntityType = 'artist' | 'group' | 'production' | 'news'
type TranslationStatus = 'draft' | 'approved' | 'ai'

interface FieldConfig {
  key: string
  label: string
  multiline: boolean
  originalKey: string  // chave no objeto original
}

interface Translation {
  field: string
  value: string
  status: TranslationStatus
  updatedAt: string
  sourceLang?: string
}

interface LogEntry {
  id: string
  field: string
  previousValue: string | null
  newValue: string
  changedBy: string
  source: string
  createdAt: string
}

const ENTITY_CONFIG: Record<EntityType, { label: string; backLabel: string; fields: FieldConfig[] }> = {
  artist: {
    label: 'Artista',
    backLabel: 'Artistas',
    fields: [{ key: 'bio', label: 'Bio', multiline: true, originalKey: 'bio' }],
  },
  group: {
    label: 'Grupo',
    backLabel: 'Grupos',
    fields: [{ key: 'bio', label: 'Bio', multiline: true, originalKey: 'bio' }],
  },
  production: {
    label: 'Produção',
    backLabel: 'Produções',
    fields: [
      { key: 'synopsis', label: 'Sinopse', multiline: true, originalKey: 'synopsis' },
      { key: 'tagline', label: 'Tagline', multiline: false, originalKey: 'tagline' },
    ],
  },
  news: {
    label: 'Notícia',
    backLabel: 'Notícias',
    fields: [
      { key: 'title', label: 'Título', multiline: false, originalKey: 'originalTitle' },
      { key: 'contentMd', label: 'Conteúdo', multiline: true, originalKey: 'originalContent' },
    ],
  },
}

const STATUS_LABELS: Record<TranslationStatus, string> = {
  draft: 'Rascunho',
  approved: 'Aprovado',
  ai: 'Traduzido (IA)',
}

export default function TranslationEditorPage() {
  const params = useParams()
  const entityType = params.entityType as EntityType
  const entityId = params.entityId as string

  const config = ENTITY_CONFIG[entityType]

  const [entityName, setEntityName] = useState('')
  const [originals, setOriginals] = useState<Record<string, string | null>>({})
  const [translations, setTranslations] = useState<Record<string, Translation | null>>({})
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [statuses, setStatuses] = useState<Record<string, TranslationStatus>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [logsLoading, setLogsLoading] = useState(true)

  // Busca entidade original
  const fetchEntity = useCallback(async () => {
    let url = ''
    if (entityType === 'artist') url = `/api/admin/artists?id=${entityId}`
    else if (entityType === 'group') url = `/api/admin/groups?id=${entityId}`
    else if (entityType === 'production') url = `/api/admin/productions?id=${entityId}`
    else if (entityType === 'news') url = `/api/admin/news?id=${entityId}`

    const res = await fetch(url)
    if (!res.ok) return
    const data = await res.json()

    if (entityType === 'artist') {
      setEntityName(data.nameRomanized)
      setOriginals({ bio: data.bio })
    } else if (entityType === 'group') {
      setEntityName(data.name)
      setOriginals({ bio: data.bio })
    } else if (entityType === 'production') {
      setEntityName(data.titlePt)
      setOriginals({ synopsis: data.synopsis, tagline: data.tagline })
    } else if (entityType === 'news') {
      setEntityName(data.originalTitle ?? data.title)
      setOriginals({ title: data.originalTitle ?? data.title, contentMd: data.originalContent ?? data.contentMd })
    }
  }, [entityType, entityId])

  // Busca traduções existentes
  const fetchTranslations = useCallback(async () => {
    const res = await fetch(`/api/admin/translations?entityType=${entityType}&entityId=${entityId}&locale=pt-BR`)
    if (!res.ok) return
    const data = await res.json()
    const map: Record<string, Translation> = {}
    const draftMap: Record<string, string> = {}
    const statusMap: Record<string, TranslationStatus> = {}
    for (const t of data.translations) {
      map[t.field] = t
      draftMap[t.field] = t.value
      statusMap[t.field] = t.status
    }
    setTranslations(map)
    setDrafts(draftMap)
    setStatuses(statusMap)
  }, [entityType, entityId])

  // Busca log
  const fetchLogs = useCallback(async () => {
    setLogsLoading(true)
    const res = await fetch(`/api/admin/translations/log?entityType=${entityType}&entityId=${entityId}&limit=20`)
    if (res.ok) {
      const data = await res.json()
      setLogs(data.logs)
    }
    setLogsLoading(false)
  }, [entityType, entityId])

  useEffect(() => {
    fetchEntity()
    fetchTranslations()
    fetchLogs()
  }, [fetchEntity, fetchTranslations, fetchLogs])

  const handleSave = async (field: string) => {
    setSaving(s => ({ ...s, [field]: true }))
    const res = await fetch('/api/admin/translations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entityType,
        entityId,
        field,
        locale: 'pt-BR',
        value: drafts[field] ?? '',
        status: statuses[field] ?? 'draft',
      }),
    })
    setSaving(s => ({ ...s, [field]: false }))
    if (res.ok) {
      setSaved(s => ({ ...s, [field]: true }))
      setTimeout(() => setSaved(s => ({ ...s, [field]: false })), 2000)
      fetchTranslations()
      fetchLogs()
    }
  }

  const adminLink = entityType === 'artist'
    ? `/admin/artists/${entityId}`
    : entityType === 'group'
      ? `/admin/groups/${entityId}`
      : entityType === 'production'
        ? `/admin/productions/${entityId}`
        : entityType === 'news'
          ? `/admin/news/${entityId}`
          : null

  return (
    <AdminLayout title={`Traduzir: ${entityName || '...'}`}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Breadcrumb / header */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/admin/translations"
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {config?.backLabel ?? 'Traduções'}
          </Link>
          {entityName && (
            <>
              <span className="text-zinc-700">/</span>
              <span className="text-sm text-zinc-400 truncate max-w-xs">{entityName}</span>
            </>
          )}
          {adminLink && (
            <Link
              href={adminLink}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 ml-auto transition-colors border border-white/10 rounded-lg px-2.5 py-1.5 hover:bg-zinc-800"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ver no admin
            </Link>
          )}
        </div>

        {/* Campos */}
        {config?.fields.map(fieldConfig => {
          const original = originals[fieldConfig.originalKey] ?? originals[fieldConfig.key]
          const translation = translations[fieldConfig.key]
          const currentStatus = statuses[fieldConfig.key] ?? 'draft'

          return (
            <div key={fieldConfig.key} className="bg-zinc-900 rounded-xl border border-white/10 overflow-hidden">
              {/* Field header */}
              <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 bg-zinc-800/40">
                <FileEdit className="w-4 h-4 text-zinc-500" />
                <h2 className="font-semibold text-zinc-200 text-sm">{fieldConfig.label}</h2>
                {translation?.sourceLang && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/40 text-blue-400 border border-blue-700/30">
                    {translation.sourceLang}
                  </span>
                )}
                {translation?.status && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    translation.status === 'approved'
                      ? 'bg-green-900/40 text-green-400 border-green-700/30'
                      : translation.status === 'draft' || translation.status === 'ai'
                        ? 'bg-yellow-900/40 text-yellow-400 border-yellow-700/30'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}>
                    {STATUS_LABELS[translation.status] ?? translation.status}
                  </span>
                )}
                {translation?.updatedAt && (
                  <span className="text-xs text-zinc-600 ml-auto">
                    atualizado {new Date(translation.updatedAt).toLocaleString('pt-BR')}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
                {/* Original */}
                <div className="p-4 bg-zinc-950/30">
                  <div className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest mb-3">
                    Original (EN/KR)
                  </div>
                  {original ? (
                    fieldConfig.multiline ? (
                      <div className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                        {original}
                      </div>
                    ) : (
                      <div className="text-sm text-zinc-400">{original}</div>
                    )
                  ) : (
                    <div className="text-sm text-zinc-600 italic">Sem conteúdo original</div>
                  )}
                </div>

                {/* Tradução */}
                <div className="p-4 space-y-3">
                  <div className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest">
                    Tradução (PT-BR)
                  </div>
                  {fieldConfig.multiline ? (
                    <textarea
                      value={drafts[fieldConfig.key] ?? ''}
                      onChange={e => setDrafts(d => ({ ...d, [fieldConfig.key]: e.target.value }))}
                      rows={10}
                      className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 resize-y"
                      placeholder="Digite a tradução..."
                    />
                  ) : (
                    <input
                      type="text"
                      value={drafts[fieldConfig.key] ?? ''}
                      onChange={e => setDrafts(d => ({ ...d, [fieldConfig.key]: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
                      placeholder="Digite a tradução..."
                    />
                  )}

                  {/* Status toggle + salvar */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Toggle de status */}
                    <div className="flex rounded-lg overflow-hidden border border-white/10">
                      <button
                        type="button"
                        onClick={() => setStatuses(s => ({ ...s, [fieldConfig.key]: 'draft' }))}
                        className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                          currentStatus === 'draft' || currentStatus === 'ai'
                            ? 'bg-zinc-700 text-zinc-200'
                            : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                        }`}
                      >
                        Rascunho
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatuses(s => ({ ...s, [fieldConfig.key]: 'approved' }))}
                        className={`px-3 py-1.5 text-xs font-bold transition-colors border-l border-white/10 ${
                          currentStatus === 'approved'
                            ? 'bg-green-900/50 text-green-300'
                            : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3 inline mr-1" />
                        Aprovado
                      </button>
                    </div>

                    <button
                      onClick={() => handleSave(fieldConfig.key)}
                      disabled={saving[fieldConfig.key]}
                      className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ml-auto ${
                        saved[fieldConfig.key]
                          ? 'bg-green-700 text-white'
                          : 'bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50'
                      }`}
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saved[fieldConfig.key] ? 'Salvo!' : saving[fieldConfig.key] ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Histórico */}
        <div className="bg-zinc-900 rounded-xl border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2 bg-zinc-800/40">
            <Clock className="w-4 h-4 text-zinc-500" />
            <h2 className="font-semibold text-sm text-zinc-200">Histórico de alterações</h2>
          </div>
          {logsLoading ? (
            <div className="p-6 text-center text-zinc-600 text-sm">Carregando...</div>
          ) : logs.length === 0 ? (
            <div className="p-6 text-center text-zinc-600 text-sm">Nenhuma alteração registrada</div>
          ) : (
            <ul className="divide-y divide-white/5">
              {logs.map(log => (
                <li key={log.id} className="px-4 py-3 text-sm hover:bg-zinc-800/30 transition-colors">
                  <div className="flex items-center gap-2 text-zinc-500 mb-1.5">
                    <span className="font-mono text-xs bg-zinc-800 border border-white/10 px-1.5 py-0.5 rounded text-zinc-400">
                      {log.field}
                    </span>
                    <span className="text-xs text-zinc-500">{log.changedBy}</span>
                    {log.source && log.source !== 'manual' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-900/30 text-purple-400 border border-purple-700/20">
                        {log.source}
                      </span>
                    )}
                    <span className="ml-auto text-xs text-zinc-600">
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="text-zinc-300 line-clamp-2 text-sm">{log.newValue}</div>
                  {log.previousValue && (
                    <div className="text-zinc-600 line-clamp-1 text-xs mt-0.5">
                      anterior: {log.previousValue}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </AdminLayout>
  )
}
