'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Page error:', error)
    }
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-6 bg-red-50 border border-red-200 rounded-full">
            <AlertTriangle className="w-16 h-16 text-red-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Algo deu errado</h1>
          <p className="text-muted">
            Encontramos um erro inesperado. Não se preocupe, você pode tentar novamente.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="p-4 bg-surface border border-border rounded-lg text-left">
            <p className="text-xs font-mono text-red-500 break-all">{error.message}</p>
            {error.digest && (
              <p className="text-xs font-mono text-muted mt-1">digest: {error.digest}</p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#ff2d78] hover:bg-[#e0236a] text-white rounded-full font-semibold text-sm transition-colors"
          >
            <RefreshCw size={18} />
            Tentar Novamente
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-2.5 border border-border text-foreground hover:bg-surface rounded-full font-semibold text-sm transition-colors"
          >
            <Home size={18} />
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  )
}
