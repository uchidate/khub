'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Users, Search, X } from 'lucide-react'

type Group = {
    id: string
    name: string
    nameHangul: string | null
    profileImageUrl: string | null
    debutDate: string | null
    disbandDate: string | null
    agency: { id: string; name: string } | null
    _count: { members: number }
    viewCount: number
    trendingScore: number
}

// K-pop generations defined by debut year
const GENERATIONS: { label: string; from: number; to: number }[] = [
    { label: '1ª Geração', from: 1990, to: 2002 },
    { label: '2ª Geração', from: 2003, to: 2011 },
    { label: '3ª Geração', from: 2012, to: 2019 },
    { label: '4ª Geração', from: 2020, to: 2024 },
    { label: '5ª Geração', from: 2025, to: 9999 },
]

function getGeneration(debutDate: string | null): string | null {
    if (!debutDate) return null
    const year = new Date(debutDate).getFullYear()
    return GENERATIONS.find(g => year >= g.from && year <= g.to)?.label ?? null
}

export default function GroupsPage() {
    const [groups, setGroups] = useState<Group[]>([])
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disbanded'>('all')
    const [generationFilter, setGenerationFilter] = useState<string>('all')
    const [sortBy, setSortBy] = useState<'name' | 'debut' | 'members' | 'popular'>('name')

    useEffect(() => {
        fetch('/api/groups/list?full=true')
            .then(r => r.json())
            .then(data => setGroups(data.groups ?? []))
            .catch(() => {})
    }, [])

    const filtered = useMemo(() => {
        let result = groups

        if (search.trim()) {
            const q = search.toLowerCase()
            result = result.filter(g =>
                g.name.toLowerCase().includes(q) ||
                (g.nameHangul?.toLowerCase().includes(q)) ||
                (g.agency?.name.toLowerCase().includes(q))
            )
        }

        if (statusFilter === 'active') result = result.filter(g => !g.disbandDate)
        if (statusFilter === 'disbanded') result = result.filter(g => !!g.disbandDate)

        if (generationFilter !== 'all') {
            result = result.filter(g => getGeneration(g.debutDate) === generationFilter)
        }

        result = [...result].sort((a, b) => {
            if (sortBy === 'debut') {
                const ya = a.debutDate ? new Date(a.debutDate).getFullYear() : 9999
                const yb = b.debutDate ? new Date(b.debutDate).getFullYear() : 9999
                return ya - yb
            }
            if (sortBy === 'members') return b._count.members - a._count.members
            if (sortBy === 'popular') return b.trendingScore !== a.trendingScore
                ? b.trendingScore - a.trendingScore
                : b.viewCount - a.viewCount
            return a.name.localeCompare(b.name)
        })

        return result
    }, [groups, search, statusFilter, generationFilter, sortBy])

    const totalActive = groups.filter(g => !g.disbandDate).length
    const totalDisbanded = groups.filter(g => !!g.disbandDate).length

    const hasActiveFilters = search || statusFilter !== 'all' || generationFilter !== 'all'

    return (
        <div className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
            {/* Header */}
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                    <Users className="w-5 h-5 text-purple-400" />
                    <p className="text-xs font-black text-zinc-600 uppercase tracking-widest">K-pop</p>
                </div>
                <h1 className="text-5xl md:text-7xl font-black hallyu-gradient-text uppercase tracking-tighter italic">
                    Grupos Musicais
                </h1>
                <p className="text-zinc-500 font-medium mt-3">
                    {totalActive} ativo{totalActive !== 1 ? 's' : ''}
                    {totalDisbanded > 0 && ` · ${totalDisbanded} disbandado${totalDisbanded !== 1 ? 's' : ''}`}
                </p>
            </div>

            {/* Filtros */}
            <div className="mb-8 space-y-3">
                {/* Busca + Status + Sort */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Busca */}
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Buscar grupo ou agência..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full px-4 pr-10 py-3.5 bg-zinc-900/50 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/50 transition-all text-sm"
                        />
                        {search
                            ? <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
                            : <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                        }
                    </div>

                    {/* Status */}
                    <div className="flex gap-1 p-1 bg-zinc-900/50 border border-white/10 rounded-xl">
                        {(['all', 'active', 'disbanded'] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${statusFilter === s ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                            >
                                {s === 'all' ? 'Todos' : s === 'active' ? 'Ativos' : 'Disbandados'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Geração + Ordenação */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Filtro por geração */}
                    <div className="flex gap-1 p-1 bg-zinc-900/50 border border-white/10 rounded-xl overflow-x-auto">
                        <button
                            onClick={() => setGenerationFilter('all')}
                            className={`px-3 py-2 rounded-lg text-xs font-black whitespace-nowrap transition-all flex-shrink-0 ${generationFilter === 'all' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                        >
                            Toda Geração
                        </button>
                        {GENERATIONS.map(g => (
                            <button
                                key={g.label}
                                onClick={() => setGenerationFilter(g.label)}
                                className={`px-3 py-2 rounded-lg text-xs font-black whitespace-nowrap transition-all flex-shrink-0 ${generationFilter === g.label ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                            >
                                {g.label}
                            </button>
                        ))}
                    </div>

                    {/* Ordenação */}
                    <div className="flex gap-1 p-1 bg-zinc-900/50 border border-white/10 rounded-xl ml-auto">
                        {([
                            ['name', 'A-Z'],
                            ['debut', 'Estreia'],
                            ['members', 'Membros'],
                            ['popular', 'Populares'],
                        ] as const).map(([val, label]) => (
                            <button
                                key={val}
                                onClick={() => setSortBy(val)}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${sortBy === val ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {hasActiveFilters && (
                    <div className="flex items-center gap-3">
                        <p className="text-xs text-zinc-500">
                            {filtered.length} grupo{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
                        </p>
                        <button
                            onClick={() => { setSearch(''); setStatusFilter('all'); setGenerationFilter('all') }}
                            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                        >
                            Limpar filtros
                        </button>
                    </div>
                )}
            </div>

            {/* Grid */}
            {groups.length === 0 ? (
                <div className="flex items-center justify-center py-32">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-zinc-500 font-bold">Nenhum grupo encontrado</p>
                    <button onClick={() => { setSearch(''); setStatusFilter('all'); setGenerationFilter('all') }} className="mt-3 text-xs text-purple-400 hover:text-purple-300 transition-colors">
                        Limpar filtros
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {filtered.map(group => {
                        const faded = !!group.disbandDate
                        const gen = getGeneration(group.debutDate)
                        return (
                            <Link
                                key={group.id}
                                href={`/groups/${group.id}`}
                                className={`group block ${faded ? 'opacity-60 hover:opacity-100 transition-opacity duration-300' : ''}`}
                            >
                                <div className="aspect-square relative rounded-xl overflow-hidden bg-zinc-900 border border-white/5 card-hover mb-3">
                                    {group.profileImageUrl ? (
                                        <Image
                                            src={group.profileImageUrl}
                                            alt={group.name}
                                            fill
                                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                                            className="object-cover group-hover:scale-105 transition-transform duration-500 brightness-90 group-hover:brightness-100"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                                            <span className="text-3xl font-black text-zinc-600 group-hover:text-purple-500 transition-colors">
                                                {group.name[0]}
                                            </span>
                                        </div>
                                    )}
                                    {group.disbandDate && (
                                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 backdrop-blur-sm rounded text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                                            Disbandado
                                        </div>
                                    )}
                                    {group._count.members > 0 && (
                                        <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] font-bold text-zinc-300">
                                            <Users className="w-3 h-3" />
                                            {group._count.members}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-black text-white text-sm leading-tight group-hover:text-purple-300 transition-colors">{group.name}</h3>
                                    {group.nameHangul && (
                                        <p className="text-xs text-zinc-500 font-medium mt-0.5">{group.nameHangul}</p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5">
                                        {group.debutDate && (
                                            <span className="text-[10px] font-bold text-zinc-600">{new Date(group.debutDate).getFullYear()}</span>
                                        )}
                                        {gen && (
                                            <span className="text-[10px] font-bold text-zinc-700">{gen}</span>
                                        )}
                                        {group.agency && (
                                            <span className="text-[10px] font-bold text-purple-500/80 truncate max-w-[100px]">{group.agency.name}</span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
