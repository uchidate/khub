'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'

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
        <div className="bg-background py-3 px-3 sm:px-4 space-y-3 rounded-2xl border border-border shadow-[0_8px_20px_rgba(0,0,0,0.12)]">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar grupo ou agência" />
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
