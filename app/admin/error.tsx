'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AdminError({ error, reset }: ErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Admin page error:', error)
    }
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-black px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-full">
            <AlertTriangle className="w-16 h-16 text-red-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Erro no painel admin</h1>
          <p className="text-zinc-400">
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-left">
            <p className="text-xs font-mono text-red-400 break-all">{error.message}</p>
            {error.digest && (
              <p className="text-xs font-mono text-zinc-500 mt-1">digest: {error.digest}</p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition-colors"
          >
            <RefreshCw size={18} />
            Tentar Novamente
          </button>
          <Link
            href="/admin"
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
          >
            <LayoutDashboard size={18} />
            Voltar ao Admin
          </Link>
        </div>
      </div>
    </div>
  )
}
