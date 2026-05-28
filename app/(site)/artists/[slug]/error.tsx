'use client'

import { ErrorBoundaryPage } from '@/components/ui/ErrorBoundaryPage'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorBoundaryPage
      error={error}
      reset={reset}
      title="Erro ao carregar o artista"
      description="Não foi possível carregar este perfil. Tente novamente ou explore outros artistas."
      backHref="/artists"
      backLabel="Ver artistas"
    />
  )
}
