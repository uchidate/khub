'use client'

import { ErrorBoundaryPage } from '@/components/ui/ErrorBoundaryPage'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorBoundaryPage
      error={error}
      reset={reset}
      title="Erro ao carregar o calendário"
      description="Não foi possível carregar o calendário de eventos. Tente novamente em instantes."
      backHref="/"
      backLabel="Voltar ao início"
    />
  )
}
