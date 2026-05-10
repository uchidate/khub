'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'

const SORT_OPTIONS = [
    { value: 'popular', label: 'Em alta' },
    { value: 'name', label: 'A–Z' },
]

export function GroupsHeroFilter() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [search, setSearch] = useState(searchParams.get('search') || '')
    const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'popular')

    const buildUrl = (s: string, sort: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (s) params.set('search', s); else params.delete('search')
        if (sort && sort !== 'popular') params.set('sortBy', sort); else params.delete('sortBy')
        return params.toString() ? `${pathname}?${params}` : pathname
    }

    useEffect(() => {
        const timer = setTimeout(() => router.push(buildUrl(search, sortBy)), 400)
        return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search])

    useEffect(() => {
        router.push(buildUrl(search, sortBy))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortBy])

    const clear = () => { setSearch(''); setSortBy('popular') }
    const hasActive = !!(search || sortBy !== 'popular')

    return (
        <div className="bg-white dark:bg-gray-900 py-3 px-3 sm:px-4 space-y-3 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-[0_8px_20px_rgba(0,0,0,0.12)]">
            <div className="relative">
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar grupo ou agência"
                    className="w-full px-4 pr-10 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-pink-400 transition-all"
                />
                {search
                    ? <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
                    : <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                }
            </div>
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1">
                    {SORT_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setSortBy(opt.value)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                                sortBy === opt.value
                                    ? 'bg-foreground text-background'
                                    : 'bg-surface text-muted hover:bg-surface-hover hover:text-foreground'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
                {hasActive && (
                    <button onClick={clear} className="p-1.5 text-muted hover:text-foreground transition-colors" title="Limpar filtros">
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    )
}
