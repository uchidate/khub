'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { Users, X } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { AdminQuickEdit } from '@/components/ui/AdminQuickEdit'
import { EmptyState } from '@/components/ui/EmptyState'
import { nameToGradient } from '@/lib/utils/name-to-gradient'

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
    { label: '3ª Geração', from: 2012, to: 2017 },
    { label: '4ª Geração', from: 2018, to: 2022 },
    { label: '5ª Geração', from: 2023, to: 9999 },
]

const GEN_COLORS: Record<string, { bg: string; color: string }> = {
    '1ª Geração': { bg: '#FFF7ED', color: '#C2410C' },
    '2ª Geração': { bg: '#EFF6FF', color: '#1D4ED8' },
    '3ª Geração': { bg: '#F5F3FF', color: '#7C3AED' },
    '4ª Geração': { bg: '#FFF1F2', color: '#BE123C' },
    '5ª Geração': { bg: '#ECFDF5', color: '#065F46' },
}


function getGeneration(debutDate: string | null): string | null {
    if (!debutDate) return null
    const year = parseInt(debutDate.slice(0, 4), 10)
    if (isNaN(year)) return null
    return GENERATIONS.find(g => year >= g.from && year <= g.to)?.label ?? null
}

function GroupsSkeleton() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                    <div className="aspect-square rounded-xl bg-skeleton mb-3" />
                    <div className="h-3.5 bg-skeleton rounded w-3/4 mb-1.5" />
                    <div className="h-3 bg-skeleton rounded w-1/2 mb-1" />
                    <div className="h-2.5 bg-skeleton rounded w-2/3" />
                </div>
            ))}
        </div>
    )
}

export function GroupsList() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [groups, setGroups] = useState<Group[]>([])
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disbanded'>('all')
    const [generationFilter, setGenerationFilter] = useState<string>('all')
    const [agencyFilter, setAgencyFilter] = useState<string>('all')
    const [sortBy, setSortBy] = useState<'name' | 'debut' | 'recent' | 'members' | 'popular'>('popular')

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

        if (agencyFilter !== 'all') {
            result = result.filter(g => g.agency?.name === agencyFilter)
        }

        result = [...result].sort((a, b) => {
            if (sortBy === 'debut') {
                const ya = a.debutDate ? new Date(a.debutDate).getUTCFullYear() : 9999
                const yb = b.debutDate ? new Date(b.debutDate).getUTCFullYear() : 9999
                return ya - yb
            }
            if (sortBy === 'recent') {
                const ya = a.debutDate ? new Date(a.debutDate).getUTCFullYear() : 0
                const yb = b.debutDate ? new Date(b.debutDate).getUTCFullYear() : 0
                return yb - ya
            }
            if (sortBy === 'members') return b._count.members - a._count.members
            if (sortBy === 'popular') return b.trendingScore !== a.trendingScore
                ? b.trendingScore - a.trendingScore
                : b.viewCount - a.viewCount
            return a.name.localeCompare(b.name)
        })

        return result
    }, [groups, search, statusFilter, generationFilter, agencyFilter, sortBy])

    const agencies = useMemo(() => {
        const counts = new Map<string, number>()
        for (const g of groups) {
            const name = g.agency?.name
            if (!name) continue
            counts.set(name, (counts.get(name) ?? 0) + 1)
        }
        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 12)
    }, [groups])

    const totalActive = groups.filter(g => !g.disbandDate).length
    const totalDisbanded = groups.filter(g => !!g.disbandDate).length
    const avgMembers = groups.length > 0
        ? (groups.reduce((acc, g) => acc + (g._count.members ?? 0), 0) / groups.length).toFixed(1)
        : '0.0'
    const hasActiveFilters = search || statusFilter !== 'all' || generationFilter !== 'all' || agencyFilter !== 'all' || sortBy !== 'popular'

    if (groups.length === 0) return <GroupsSkeleton />

    return (
        <div id="groups-list">

            {/* Contadores */}
            <p className="text-muted text-xs font-medium mb-6">
                {totalActive} ativo{totalActive !== 1 ? 's' : ''}
                {totalDisbanded > 0 && ` · ${totalDisbanded} disbandado${totalDisbanded !== 1 ? 's' : ''}`}
            </p>

            {/* Filtros */}
            <div className="sticky top-[52px] sm:top-[60px] lg:top-[64px] z-20 bg-background py-3 px-3 sm:px-4 mb-8 space-y-3 rounded-2xl border border-border shadow-[0_8px_20px_rgba(0,0,0,0.12)]">
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
                                        ? 'bg-foreground text-background'
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
                                        ? 'bg-foreground text-background'
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
                            { value: 'recent', label: 'Mais novos' },
                            { value: 'members', label: 'Membros' },
                        ] as const).map(opt => (
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
                </div>

                {agencies.length > 0 && (
                    <div className="relative">
                        <div className="pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-background/95 to-transparent z-10 sm:hidden" />
                        <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-background/95 to-transparent z-10 sm:hidden" />
                        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide sm:flex-wrap">
                            <button
                                onClick={() => setAgencyFilter('all')}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                                    agencyFilter === 'all'
                                        ? 'bg-foreground text-background'
                                        : 'bg-surface text-muted hover:bg-surface-hover hover:text-foreground'
                                }`}
                            >
                                Todas as agências
                            </button>
                            {agencies.map(([name, count]) => (
                                <button
                                    key={name}
                                    onClick={() => setAgencyFilter(name)}
                                    className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-all inline-flex items-center gap-1.5 ${
                                        agencyFilter === name
                                            ? 'bg-foreground text-background'
                                            : 'bg-surface text-muted hover:bg-surface-hover hover:text-foreground'
                                    }`}
                                >
                                    <span>{name}</span>
                                    <span className="text-[10px] opacity-70">{count}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {hasActiveFilters && (
                    <div className="flex items-center gap-3 flex-wrap">
                        <p className="text-xs text-muted">
                            {filtered.length} grupo{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
                        </p>
                        {search && (
                            <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-surface border border-border text-muted inline-flex items-center gap-1">
                                busca: {search}
                            </span>
                        )}
                        {statusFilter !== 'all' && (
                            <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-surface border border-border text-muted inline-flex items-center gap-1">
                                status: {statusFilter === 'active' ? 'ativos' : 'disbandados'}
                            </span>
                        )}
                        {generationFilter !== 'all' && (
                            <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-surface border border-border text-muted inline-flex items-center gap-1">
                                {generationFilter}
                            </span>
                        )}
                        {agencyFilter !== 'all' && (
                            <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-surface border border-border text-muted inline-flex items-center gap-1">
                                agência: {agencyFilter}
                            </span>
                        )}
                        <button
                            onClick={() => { setSearch(''); setStatusFilter('all'); setGenerationFilter('all'); setAgencyFilter('all'); setSortBy('popular') }}
                            className="text-xs text-accent hover:text-accent/70 transition-colors"
                        >
                            Limpar filtros
                        </button>
                    </div>
                )}
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
                <EmptyState
                    title="Nenhum grupo encontrado"
                    action={{ label: 'Limpar filtros', onClick: () => { setSearch(''); setStatusFilter('all'); setGenerationFilter('all'); setAgencyFilter('all'); setSortBy('popular') } }}
                />
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
                    {filtered.map((group, index) => {
                        const faded = !!group.disbandDate
                        const gen = getGeneration(group.debutDate)
                        return (
                            <div key={group.id} className={`group/card relative ${faded ? 'opacity-60 hover:opacity-100 transition-opacity duration-300' : ''}`}>
                                <Link href={`/groups/${group.id}`} className="group block">
                                    <div className="aspect-square relative rounded-xl overflow-hidden bg-surface border border-border/80 shadow-sm card-hover mb-3 group-hover:shadow-md transition-all">
                                        {group.profileImageUrl ? (
                                            <Image
                                                src={group.profileImageUrl}
                                                alt={group.name}
                                                fill
                                                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                priority={index < 4}
                                            />
                                        ) : (
                                            <div
                                                className="w-full h-full flex items-center justify-center"
                                                style={{ background: nameToGradient(group.name) }}
                                            >
                                                <span className="text-4xl font-black text-white/80 drop-shadow select-none">
                                                    {group.name[0]}
                                                </span>
                                            </div>
                                        )}
                                        {group.disbandDate && (
                                            <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 backdrop-blur-sm rounded text-[10px] font-black text-white/70 uppercase tracking-wider">
                                                Disbandado
                                            </div>
                                        )}
                                        {group._count.members > 0 && (
                                            <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] font-bold text-white/80">
                                                <Users className="w-3 h-3" />
                                                {group._count.members}
                                            </div>
                                        )}
                                        {/* Hover overlay */}
                                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2.5 gap-0.5">
                                            {group.nameHangul && (
                                                <p className="text-white text-[12px] font-bold truncate leading-tight">{group.nameHangul}</p>
                                            )}
                                            {group.debutDate && (
                                                <p className="text-white/65 text-[10px] truncate leading-tight">
                                                    Estreia: {new Date(group.debutDate).getUTCFullYear()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-black text-foreground text-sm leading-tight group-hover:text-accent transition-colors">{group.name}</h3>
                                        {group.nameHangul && (
                                            <p className="text-xs text-muted font-medium mt-0.5">{group.nameHangul}</p>
                                        )}
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5">
                                            {gen && (() => {
                                                const gc = GEN_COLORS[gen]
                                                return gc ? (
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: gc.bg, color: gc.color }}>{gen}</span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-muted">{gen}</span>
                                                )
                                            })()}
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
