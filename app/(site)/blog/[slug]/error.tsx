'use client'

import { ErrorBoundaryPage } from '@/components/ui/ErrorBoundaryPage'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorBoundaryPage
      error={error}
      reset={reset}
      title="Erro ao carregar o artigo"
      description="Não foi possível carregar este artigo. Tente novamente ou volte para o blog."
      backHref="/blog"
      backLabel="Ver todos os artigos"
    />
  )
}
