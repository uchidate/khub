'use client'

import Link from 'next/link'
import { useCookieConsent } from '@/hooks/useCookieConsent'

export function CookieBanner() {
    const { consent, loaded, acceptAll, acceptNecessary } = useCookieConsent()

    if (!loaded || consent !== null) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[9998] border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <p className="flex-1 text-sm text-zinc-400 leading-relaxed">
                    Usamos cookies essenciais para manter sua sessão e cookies analíticos para entender
                    como o site é utilizado.{' '}
                    <Link href="/privacidade" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">
                        Política de Privacidade
                    </Link>
                </p>
                <div className="flex gap-3 shrink-0">
                    <button
                        onClick={acceptNecessary}
                        className="px-4 py-2 text-sm font-bold text-zinc-300 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
                    >
                        Apenas essenciais
                    </button>
                    <button
                        onClick={acceptAll}
                        className="px-4 py-2 text-sm font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors"
                    >
                        Aceitar todos
                    </button>
                </div>
            </div>
        </div>
    )
}
