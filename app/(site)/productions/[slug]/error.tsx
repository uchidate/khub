'use client'

import { ErrorBoundaryPage } from '@/components/ui/ErrorBoundaryPage'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorBoundaryPage
      error={error}
      reset={reset}
      title="Erro ao carregar a produção"
      description="Não foi possível carregar este K-Drama ou filme. Tente novamente ou explore outras produções."
      backHref="/productions"
      backLabel="Ver produções"
    />
  )
}
