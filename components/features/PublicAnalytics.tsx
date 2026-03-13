'use client'

import { usePathname } from 'next/navigation'
import { GoogleAnalytics } from '@next/third-parties/google'

/**
 * Carrega o Google Analytics apenas em rotas públicas.
 * Rotas /admin são internas — não precisam ser mapeadas.
 */
export function PublicAnalytics({ gaId }: { gaId: string }) {
    const pathname = usePathname()
    if (pathname.startsWith('/admin')) return null
    return <GoogleAnalytics gaId={gaId} />
}
