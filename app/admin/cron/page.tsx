'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, RefreshCw, Clock, CheckCircle2, XCircle, Activity, Terminal, Calendar } from 'lucide-react'
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

interface CronJob {
  name: string
  schedule: string
  description: string
  frequency: string
  script: string
  nextRun: string
}

interface RecentNews {
  id: string
  title: string
  createdAt: string
}

interface CronData {
  config: CronConfig
  cronJobs: CronJob[]
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
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-500" />
          <p className="text-zinc-400">Carregando informações...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-950/50 border border-red-800/50 rounded-xl p-6 text-center backdrop-blur-sm">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-400 font-medium mb-2">Erro ao carregar dados</p>
            <p className="text-red-300 text-sm">{error}</p>
            <button
              onClick={fetchCronData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors group"
            >
              <ArrowLeft className="w-6 h-6 text-zinc-400 group-hover:text-white transition-colors" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-indigo-500" />
                <h1 className="text-3xl font-bold text-white">Cron Jobs</h1>
              </div>
              <p className="text-zinc-400 mt-1">
                Monitoramento e estatísticas do sistema
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-zinc-400 bg-zinc-800/50 px-3 py-2 rounded-lg backdrop-blur-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-zinc-600 bg-zinc-700 text-indigo-600 focus:ring-indigo-500"
              />
              Auto-refresh (10s)
            </label>
            <button
              onClick={fetchCronData}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all hover:scale-105"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
          </div>
        </div>

        {/* Environment Badge */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold backdrop-blur-sm ${
            config.environment === 'production'
              ? 'bg-green-950/50 text-green-400 border border-green-800/50'
              : 'bg-yellow-950/50 text-yellow-400 border border-yellow-800/50'
          }`}>
            {config.environment === 'production' ? '🏭 Production' : '🧪 Staging'}
          </span>
          <div className="flex items-center gap-4 text-sm text-zinc-400 bg-zinc-800/30 px-4 py-2 rounded-lg backdrop-blur-sm border border-zinc-700/50">
            <span>Modelo: <strong className="text-white">{config.ollamaModel}</strong></span>
            <span className="text-zinc-600">|</span>
            <span>Frequência: <strong className="text-white">{config.expectedFrequency}</strong></span>
            <span className="text-zinc-600">|</span>
            <span>Notícias/run: <strong className="text-white">{config.newsPerRun}</strong></span>
          </div>
        </div>

        {/* Cron Jobs Schedule */}
        <div className="bg-zinc-900/50 rounded-xl shadow-2xl p-6 border border-zinc-800/50 mb-8 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-indigo-500" />
            <h2 className="text-xl font-semibold text-white">Cron Jobs Agendados</h2>
          </div>
          <div className="space-y-4">
            {data!.cronJobs.map((job, idx) => (
              <div key={idx} className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 hover:border-indigo-500/50 transition-all hover:shadow-lg hover:shadow-indigo-500/10">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-lg">{job.name}</h3>
                    <p className="text-sm text-zinc-400 mt-1">{job.description}</p>
                  </div>
                  <span className="ml-4 px-3 py-1 bg-indigo-950/50 text-indigo-300 text-xs font-mono rounded border border-indigo-800/50">
                    {job.schedule}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-zinc-700/50">
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Periodicidade</p>
                    <p className="text-sm font-medium text-white">{job.frequency}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Próxima Execução</p>
                    <p className="text-sm font-medium text-white">{job.nextRun}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Script</p>
                    <p className="text-sm font-mono text-zinc-300 truncate">{job.script}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Grid - Database Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-950/50 to-purple-900/30 rounded-xl shadow-lg p-6 border border-purple-800/50 backdrop-blur-sm hover:border-purple-600/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-purple-300 font-medium">Total de Notícias</p>
              <Activity className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-4xl font-bold text-white mb-2">{stats.totalNews}</p>
            <p className="text-xs text-purple-300">
              +{stats.newsLast24h} nas últimas 24h
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-950/50 to-green-900/30 rounded-xl shadow-lg p-6 border border-green-800/50 backdrop-blur-sm hover:border-green-600/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-green-300 font-medium">Total de Artistas</p>
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-4xl font-bold text-white mb-2">{stats.totalArtists}</p>
            <p className="text-xs text-green-300">
              +{stats.artistsLast24h} nas últimas 24h
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-950/50 to-blue-900/30 rounded-xl shadow-lg p-6 border border-blue-800/50 backdrop-blur-sm hover:border-blue-600/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-blue-300 font-medium">Total de Produções</p>
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
            <p className="text-4xl font-bold text-white mb-2">{stats.totalProductions}</p>
            <p className="text-xs text-blue-300">
              +{stats.productionsLast24h} nas últimas 24h
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-950/50 to-orange-900/30 rounded-xl shadow-lg p-6 border border-orange-800/50 backdrop-blur-sm hover:border-orange-600/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-orange-300 font-medium">Média Diária (7d)</p>
              <Activity className="w-6 h-6 text-orange-400" />
            </div>
            <p className="text-4xl font-bold text-white mb-2">{stats.averageNewsPerDay}</p>
            <p className="text-xs text-orange-300">notícias por dia</p>
          </div>
        </div>

        {/* Recent News */}
        {data!.recentNews.length > 0 && (
          <div className="bg-zinc-900/50 rounded-xl shadow-2xl p-6 border border-zinc-800/50 mb-8 backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-white mb-5 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-500" />
              Últimas Notícias Criadas
            </h2>
            <div className="space-y-3">
              {data!.recentNews.map((news, idx) => (
                <div key={news.id} className="flex items-start gap-3 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50 hover:border-purple-500/50 transition-all">
                  <span className="flex-shrink-0 w-7 h-7 bg-purple-950/50 text-purple-400 border border-purple-800/50 rounded-full flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{news.title}</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      {new Date(news.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logs */}
        <div className="bg-zinc-900/50 rounded-xl shadow-2xl border border-zinc-800/50 overflow-hidden backdrop-blur-sm mb-8">
          <div className="p-6 border-b border-zinc-800/50">
            <div className="flex items-center gap-3">
              <Terminal className="w-6 h-6 text-green-500" />
              <h2 className="text-xl font-semibold text-white">Logs Recentes</h2>
            </div>
          </div>
          <div className="p-6 bg-black/50 max-h-[600px] overflow-y-auto">
            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap leading-relaxed">
              {data!.logs.length > 0 ? data!.logs.join('\n') : 'Nenhum log disponível'}
            </pre>
          </div>
        </div>

        {/* Note */}
        {data!.note && (
          <div className="bg-blue-950/50 border border-blue-800/50 rounded-lg p-4 mb-6 backdrop-blur-sm">
            <p className="text-sm text-blue-300">
              <strong className="text-blue-200">ℹ️ Nota:</strong> {data!.note}
            </p>
          </div>
        )}

        <p className="text-center text-sm text-zinc-500 mt-8 pb-8">
          Última atualização: <span className="text-zinc-400">{new Date(data!.timestamp).toLocaleString('pt-BR')}</span>
        </p>
      </div>
    </div>
  )
}
