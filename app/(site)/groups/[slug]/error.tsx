'use client'

import { ErrorBoundaryPage } from '@/components/ui/ErrorBoundaryPage'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorBoundaryPage
      error={error}
      reset={reset}
      title="Erro ao carregar o grupo"
      description="Não foi possível carregar este perfil de grupo. Tente novamente ou explore outros grupos."
      backHref="/groups"
      backLabel="Ver grupos"
    />
  )
}
