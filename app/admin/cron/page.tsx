'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, RefreshCw, Clock, CheckCircle2, XCircle, Activity, Terminal } from 'lucide-react'
import Link from 'next/link'

interface CronStats {
  totalRuns: number
  successRuns: number
  failedRuns: number
  lastRun: string | null
  averageDuration: number | null
}

interface CronData {
  environment: string
  cronSchedule: string
  lastCronResult: any
  ollamaStatus: string
  logs: string[]
  stats: CronStats
  timestamp: string
}

export default function AdminCronPage() {
  const [data, setData] = useState<CronData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchCronData = async () => {
    try {
      const res = await fetch('/api/admin/cron')
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const json = await res.json()
      setData(json)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCronData()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchCronData, 10000) // 10s
    return () => clearInterval(interval)
  }, [autoRefresh])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Carregando informações...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-700 font-medium mb-2">Erro ao carregar dados</p>
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={fetchCronData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  const stats = data!.stats
  const successRate = stats.totalRuns > 0
    ? ((stats.successRuns / stats.totalRuns) * 100).toFixed(1)
    : '0'

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cron Jobs</h1>
              <p className="text-gray-600 mt-1">
                Monitoramento e logs de execução
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300"
              />
              Auto-refresh (10s)
            </label>
            <button
              onClick={fetchCronData}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
          </div>
        </div>

        {/* Environment Badge */}
        <div className="mb-6">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            data!.environment === 'production'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {data!.environment === 'production' ? '🏭 Production' : '🧪 Staging'}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total de Execuções</p>
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalRuns}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Taxa de Sucesso</p>
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{successRate}%</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.successRuns} / {stats.totalRuns}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Duração Média</p>
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.averageDuration ? `${stats.averageDuration.toFixed(1)}s` : 'N/A'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Última Execução</p>
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">
              {stats.lastRun || 'Nenhuma'}
            </p>
          </div>
        </div>

        {/* Ollama Status */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status do Ollama</h2>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              data!.ollamaStatus.includes('Up') ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <p className="text-gray-700">{data!.ollamaStatus}</p>
          </div>
        </div>

        {/* Cron Schedule */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Agendamento</h2>
          <pre className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 overflow-x-auto">
            {data!.cronSchedule}
          </pre>
        </div>

        {/* Last Cron Result */}
        {data!.lastCronResult && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Último Resultado</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Artistas</p>
                <p className="text-2xl font-bold text-purple-900">
                  {data!.lastCronResult.results?.artists?.updated || 0}
                </p>
              </div>
              <div className="text-center p-3 bg-pink-50 rounded-lg">
                <p className="text-sm text-pink-600 font-medium">Notícias</p>
                <p className="text-2xl font-bold text-pink-900">
                  {data!.lastCronResult.results?.news?.updated || 0}
                </p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Produções</p>
                <p className="text-2xl font-bold text-blue-900">
                  {data!.lastCronResult.results?.productions?.updated || 0}
                </p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Duração</p>
                <p className="text-2xl font-bold text-green-900">
                  {((data!.lastCronResult.duration || 0) / 1000).toFixed(0)}s
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Executado em: {new Date(data!.lastCronResult.timestamp).toLocaleString('pt-BR')}
            </p>
          </div>
        )}

        {/* Logs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Logs Recentes</h2>
            </div>
          </div>
          <div className="p-6 bg-gray-900 max-h-[600px] overflow-y-auto">
            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
              {data!.logs.length > 0 ? data!.logs.join('\n') : 'Nenhum log disponível'}
            </pre>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Última atualização: {new Date(data!.timestamp).toLocaleString('pt-BR')}
        </p>
      </div>
    </div>
  )
}
