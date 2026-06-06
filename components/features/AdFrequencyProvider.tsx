'use client'

import { createContext, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'

interface AdFrequencyCtx {
    /** Tenta registrar um slot acima do fold. Retorna true se permitido, false se limite atingido. */
    register: () => boolean
    unregister: () => void
}

export const AdFrequencyContext = createContext<AdFrequencyCtx>({
    register: () => true,
    unregister: () => {},
})

const MAX_ABOVE_FOLD = 3

export function AdFrequencyProvider({ children }: { children: React.ReactNode }) {
    const count = useRef(0)
    const pathname = usePathname()

    // Zera o contador a cada navegação
    const lastPath = useRef(pathname)
    if (pathname !== lastPath.current) {
        lastPath.current = pathname
        count.current = 0
    }

    const register = useCallback(() => {
        if (count.current >= MAX_ABOVE_FOLD) return false
        count.current++
        return true
    }, [])

    const unregister = useCallback(() => {
        count.current = Math.max(0, count.current - 1)
    }, [])

    return (
        <AdFrequencyContext.Provider value={{ register, unregister }}>
            {children}
        </AdFrequencyContext.Provider>
    )
}
