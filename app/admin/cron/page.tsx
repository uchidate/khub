'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, RefreshCw, Clock, CheckCircle2, XCircle, Activity, Terminal } from 'lucide-react'
import Link from 'next/link'

interface CronStats {
  totalNews: number
  newsLast24h: number
  newsLast7days: number
  totalArtists: number
  artistsLast24h: number
  totalProductions: number
  productionsLast24h: number
  averageNewsPerDay: string
  lastNewsCreated: string | null
}

interface CronConfig {
  environment: string
  ollamaModel: string
  ollamaBaseUrl: string
  newsPerRun: number
  expectedFrequency: string
}

interface RecentNews {
  id: string
  title: string
  createdAt: string
}

interface CronData {
  config: CronConfig
  stats: CronStats
  recentNews: RecentNews[]
  logs: string[]
  timestamp: string
  note: string
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
  const config = data!.config

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
                Estatísticas do banco de dados
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
        <div className="mb-6 flex items-center gap-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            config.environment === 'production'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {config.environment === 'production' ? '🏭 Production' : '🧪 Staging'}
          </span>
          <span className="text-sm text-gray-600">
            Modelo: <strong>{config.ollamaModel}</strong> | Frequência: <strong>{config.expectedFrequency}</strong> | Notícias/run: <strong>{config.newsPerRun}</strong>
          </span>
        </div>

        {/* Stats Grid - Database Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total de Notícias</p>
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalNews}</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.newsLast24h} nas últimas 24h
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total de Artistas</p>
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalArtists}</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.artistsLast24h} nas últimas 24h
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total de Produções</p>
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalProductions}</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.productionsLast24h} nas últimas 24h
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Média Diária (7d)</p>
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.averageNewsPerDay}</p>
            <p className="text-xs text-gray-500 mt-1">notícias por dia</p>
          </div>
        </div>

        {/* Recent News */}
        {data!.recentNews.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Últimas Notícias Criadas</h2>
            <div className="space-y-3">
              {data!.recentNews.map((news, idx) => (
                <div key={news.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{news.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(news.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
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

        {/* Note */}
        {data!.note && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>ℹ️ Nota:</strong> {data!.note}
            </p>
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          Última atualização: {new Date(data!.timestamp).toLocaleString('pt-BR')}
        </p>
      </div>
    </div>
  )
}
