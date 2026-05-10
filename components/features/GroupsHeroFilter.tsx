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
        <div className="flex items-center gap-2 flex-wrap bg-black/50 backdrop-blur-md border border-white/15 rounded-2xl px-3 py-2.5 shadow-lg">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar grupo ou agência..."
                    className="w-full px-4 pr-9 py-2 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 transition-all backdrop-blur-sm"
                />
                {search
                    ? <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"><X className="w-3.5 h-3.5" /></button>
                    : <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
                }
            </div>
            <div className="flex items-center gap-1">
                {SORT_OPTIONS.map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => setSortBy(opt.value)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                            sortBy === opt.value
                                ? 'bg-white text-black'
                                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
            {hasActive && (
                <button onClick={clear} className="p-1.5 text-white/50 hover:text-white transition-colors" title="Limpar filtros">
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    )
}
