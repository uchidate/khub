'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { Users, X } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { AdminQuickEdit } from '@/components/ui/AdminQuickEdit'
import { EmptyState } from '@/components/ui/EmptyState'

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

const GENERATIONS: { label: string; from: number; to: number }[] = [
    { label: '1ª Geração', from: 1990, to: 2002 },
    { label: '2ª Geração', from: 2003, to: 2011 },
    { label: '3ª Geração', from: 2012, to: 2019 },
    { label: '4ª Geração', from: 2020, to: 2024 },
    { label: '5ª Geração', from: 2025, to: 9999 },
]

function getGeneration(debutDate: string | null): string | null {
    if (!debutDate) return null
    const year = parseInt(debutDate.slice(0, 4), 10)
    if (isNaN(year)) return null
    return GENERATIONS.find(g => year >= g.from && year <= g.to)?.label ?? null
}

export function GroupsList() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [groups, setGroups] = useState<Group[]>([])
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disbanded'>('all')
    const [generationFilter, setGenerationFilter] = useState<string>('all')
    const [sortBy, setSortBy] = useState<'name' | 'debut' | 'members' | 'popular'>('popular')

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
                const ya = a.debutDate ? new Date(a.debutDate).getUTCFullYear() : 9999
                const yb = b.debutDate ? new Date(b.debutDate).getUTCFullYear() : 9999
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
        <div>
            {/* Contadores */}
            <p className="text-muted font-medium mb-8 -mt-6">
                {totalActive} ativo{totalActive !== 1 ? 's' : ''}
                {totalDisbanded > 0 && ` · ${totalDisbanded} disbandado${totalDisbanded !== 1 ? 's' : ''}`}
            </p>

            {/* Filtros */}
            <div className="mb-8 space-y-3">
                {/* Busca */}
                <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Buscar grupo ou agência"
                />

                {/* Status + Geração */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-1 flex-wrap">
                        {([
                            { value: 'all', label: 'Todos' },
                            { value: 'active', label: 'Ativos' },
                            { value: 'disbanded', label: 'Disbandados' },
                        ] as const).map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setStatusFilter(opt.value)}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                                    statusFilter === opt.value
                                        ? 'bg-accent text-white'
                                        : 'bg-surface text-muted hover:bg-surface-hover hover:text-foreground'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                        <span className="w-px h-4 bg-border mx-0.5" />
                        {([
                            { value: 'all', label: 'Toda Geração' },
                            ...GENERATIONS.map(g => ({ value: g.label, label: g.label })),
                        ]).map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setGenerationFilter(opt.value)}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                                    generationFilter === opt.value
                                        ? 'bg-accent text-white'
                                        : 'bg-surface text-muted hover:bg-surface-hover hover:text-foreground'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-1 flex-wrap">
                        {([
                            { value: 'popular', label: 'Populares' },
                            { value: 'name', label: 'A–Z' },
                            { value: 'debut', label: 'Estreia' },
                            { value: 'members', label: 'Membros' },
                        ] as const).map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setSortBy(opt.value)}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                                    sortBy === opt.value
                                        ? 'bg-accent text-white'
                                        : 'bg-surface text-muted hover:bg-surface-hover hover:text-foreground'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {hasActiveFilters && (
                    <div className="flex items-center gap-3">
                        <p className="text-xs text-muted">
                            {filtered.length} grupo{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
                        </p>
                        <button
                            onClick={() => { setSearch(''); setStatusFilter('all'); setGenerationFilter('all') }}
                            className="text-xs text-accent hover:text-accent/70 transition-colors"
                        >
                            Limpar filtros
                        </button>
                    </div>
                )}
            </div>

            {/* Grid */}
            {groups.length === 0 ? (
                <div className="flex items-center justify-center py-32">
                    <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    title="Nenhum grupo encontrado"
                    action={{ label: 'Limpar filtros', onClick: () => { setSearch(''); setStatusFilter('all'); setGenerationFilter('all') } }}
                />
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {filtered.map((group, index) => {
                        const faded = !!group.disbandDate
                        const gen = getGeneration(group.debutDate)
                        return (
                            <div key={group.id} className={`group/card relative ${faded ? 'opacity-60 hover:opacity-100 transition-opacity duration-300' : ''}`}>
                                <Link href={`/groups/${group.id}`} className="group block">
                                    <div className="aspect-square relative rounded-xl overflow-hidden bg-surface border border-border card-hover mb-3">
                                        {group.profileImageUrl ? (
                                            <Image
                                                src={group.profileImageUrl}
                                                alt={group.name}
                                                fill
                                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                                                className="object-cover group-hover:scale-105 transition-transform duration-500 brightness-90 group-hover:brightness-100"
                                                priority={index < 4}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-[#f0f0f0]">
                                                <span className="text-3xl font-black text-muted group-hover:text-accent transition-colors">
                                                    {group.name[0]}
                                                </span>
                                            </div>
                                        )}
                                        {group.disbandDate && (
                                            <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 backdrop-blur-sm rounded text-[10px] font-black text-muted uppercase tracking-wider">
                                                Disbandado
                                            </div>
                                        )}
                                        {group._count.members > 0 && (
                                            <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] font-bold text-[#e8e8e8]">
                                                <Users className="w-3 h-3" />
                                                {group._count.members}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-foreground text-sm leading-tight group-hover:text-accent transition-colors">{group.name}</h3>
                                        {group.nameHangul && (
                                            <p className="text-xs text-muted font-medium mt-0.5">{group.nameHangul}</p>
                                        )}
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5">
                                            {group.debutDate && (
                                                <span className="text-[10px] font-bold text-[#444]">{new Date(group.debutDate).getUTCFullYear()}</span>
                                            )}
                                            {gen && (
                                                <span className="text-[10px] font-bold text-[#2a2a2a]">{gen}</span>
                                            )}
                                            {group.agency && (
                                                <span className="text-[10px] font-bold text-accent/80 truncate max-w-[100px]">{group.agency.name}</span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                                <div className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity z-10">
                                    <AdminQuickEdit href={`/admin/groups/${group.id}?returnTo=${encodeURIComponent(pathname + (searchParams.toString() ? '?' + searchParams.toString() : ''))}`} label="Editar" />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
