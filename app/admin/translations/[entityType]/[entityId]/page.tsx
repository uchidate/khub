'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { ArrowLeft, Save, ExternalLink, Clock } from 'lucide-react'
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
        : null

  return (
    <AdminLayout title={`Traduzir: ${entityName || '...'}`}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin/translations"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" /> {config?.backLabel ?? 'Traduções'}
          </Link>
          {adminLink && (
            <Link
              href={adminLink}
              className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-700 ml-auto"
            >
              Ver no admin <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Campos */}
        {config?.fields.map(fieldConfig => {
          const original = originals[fieldConfig.originalKey] ?? originals[fieldConfig.key]
          return (
            <div key={fieldConfig.key} className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <h2 className="font-medium text-gray-800">{fieldConfig.label}</h2>
                {translations[fieldConfig.key] && (
                  <span className="text-xs text-gray-400">
                    · atualizado {new Date(translations[fieldConfig.key]!.updatedAt).toLocaleString('pt-BR')}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                {/* Original */}
                <div className="p-4">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Original (EN/KR)</div>
                  {original ? (
                    fieldConfig.multiline ? (
                      <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                        {original}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-700">{original}</div>
                    )
                  ) : (
                    <div className="text-sm text-gray-400 italic">Sem conteúdo original</div>
                  )}
                </div>

                {/* Tradução */}
                <div className="p-4 space-y-3">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tradução (PT-BR)</div>
                  {fieldConfig.multiline ? (
                    <textarea
                      value={drafts[fieldConfig.key] ?? ''}
                      onChange={e => setDrafts(d => ({ ...d, [fieldConfig.key]: e.target.value }))}
                      rows={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                      placeholder="Digite a tradução..."
                    />
                  ) : (
                    <input
                      type="text"
                      value={drafts[fieldConfig.key] ?? ''}
                      onChange={e => setDrafts(d => ({ ...d, [fieldConfig.key]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Digite a tradução..."
                    />
                  )}
                  <div className="flex items-center gap-3">
                    <select
                      value={statuses[fieldConfig.key] ?? 'draft'}
                      onChange={e => setStatuses(s => ({ ...s, [fieldConfig.key]: e.target.value as TranslationStatus }))}
                      className="text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="draft">Rascunho</option>
                      <option value="approved">Aprovado</option>
                    </select>
                    <button
                      onClick={() => handleSave(fieldConfig.key)}
                      disabled={saving[fieldConfig.key]}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <h2 className="font-medium text-gray-800">Histórico de alterações</h2>
          </div>
          {logsLoading ? (
            <div className="p-6 text-center text-gray-400 text-sm">Carregando...</div>
          ) : logs.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">Nenhuma alteração registrada</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {logs.map(log => (
                <li key={log.id} className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                      {log.field}
                    </span>
                    <span>{log.changedBy}</span>
                    <span className="ml-auto text-xs text-gray-400">
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="text-gray-700 line-clamp-2">{log.newValue}</div>
                  {log.previousValue && (
                    <div className="text-gray-400 line-clamp-1 text-xs mt-0.5">
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
