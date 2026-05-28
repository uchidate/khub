'use client'

import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

interface ErrorBoundaryPageProps {
  error: Error & { digest?: string }
  reset: () => void
  title?: string
  description?: string
  backHref?: string
  backLabel?: string
}

export function ErrorBoundaryPage({
  error,
  reset,
  title = 'Algo deu errado',
  description = 'Encontramos um erro inesperado. Não se preocupe, você pode tentar novamente.',
  backHref = '/',
  backLabel = 'Voltar ao Início',
}: ErrorBoundaryPageProps) {
  if (process.env.NODE_ENV === 'development') {
    console.error(error)
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-full">
            <AlertTriangle className="w-12 h-12 text-red-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-foreground">{title}</h1>
          <p className="text-small text-muted">{description}</p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="p-4 bg-surface border border-border rounded-lg text-left">
            <p className="text-xs font-mono text-red-400 break-all">{error.message}</p>
            {error.digest && (
              <p className="text-xs font-mono text-muted mt-1">digest: {error.digest}</p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-full font-semibold text-sm transition-colors"
          >
            <RefreshCw size={16} />
            Tentar novamente
          </button>
          <Link
            href={backHref}
            className="flex items-center justify-center gap-2 px-6 py-2.5 border border-border text-foreground hover:bg-surface rounded-full font-semibold text-sm transition-colors"
          >
            <Home size={16} />
            {backLabel}
          </Link>
        </div>
      </div>
    </div>
  )
}
