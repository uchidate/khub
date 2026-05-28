'use client'

import { ErrorBoundaryPage } from '@/components/ui/ErrorBoundaryPage'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorBoundaryPage
      error={error}
      reset={reset}
      title="Erro ao carregar o blog"
      description="Não foi possível listar os artigos. Tente novamente em instantes."
      backHref="/"
      backLabel="Voltar ao início"
    />
  )
}
