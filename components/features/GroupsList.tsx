'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { Search, Users, X } from 'lucide-react'
import { AdminQuickEdit } from '@/components/ui/AdminQuickEdit'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { EmptyState } from '@/components/ui/EmptyState'
import { nameToGradient } from '@/lib/utils'

type Group = {
    id: string
    slug?: string | null
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[76px_minmax(0,1fr)] gap-3 border border-border bg-background p-2.5 sm:block">
                    <div className="aspect-square bg-skeleton sm:mb-3" />
                    <div className="self-center">
                        <div className="mb-1.5 h-3.5 w-3/4 bg-skeleton" />
                        <div className="mb-1 h-3 w-1/2 bg-skeleton" />
                        <div className="h-2.5 w-2/3 bg-skeleton" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export function GroupsList({ hideFilter = false, initialGroups = [] }: { hideFilter?: boolean; initialGroups?: Group[] }) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [groups, setGroups] = useState<Group[]>(initialGroups)
    const [search, setSearch] = useState(searchParams.get('search') || '')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disbanded'>('all')
    const [generationFilter, setGenerationFilter] = useState<string>('all')
    const [sortBy, setSortBy] = useState<'name' | 'debut' | 'recent' | 'members' | 'popular'>(
        (searchParams.get('sortBy') as 'name' | 'popular') || 'popular'
    )

    useEffect(() => {
        setSearch(searchParams.get('search') || '')
        setSortBy((searchParams.get('sortBy') as 'name' | 'popular') || 'popular')
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams.toString()])

    useEffect(() => {
        if (initialGroups.length > 0) return
        fetch('/api/groups/list?full=true')
            .then(r => r.json())
            .then(data => setGroups(data.groups ?? []))
            .catch(() => {})
    }, [initialGroups.length])

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
    }, [groups, search, statusFilter, generationFilter, sortBy])

    const hasActiveFilters = search || statusFilter !== 'all' || generationFilter !== 'all' || sortBy !== 'popular'

    const resetFilters = () => {
        setSearch('')
        setStatusFilter('all')
        setGenerationFilter('all')
        setSortBy('popular')
    }

    const chipClass = (active: boolean) =>
        `h-8 shrink-0 rounded-md px-3 text-[12px] font-bold transition-colors ${
            active ? 'bg-foreground text-background' : 'text-muted hover:bg-surface hover:text-foreground'
        }`
    const selectClass = 'h-8 shrink-0 !rounded-md !border-border !bg-surface !py-0 !pl-2.5 !pr-8 text-[12px] font-bold text-foreground !shadow-none focus:!border-foreground'
    const renderFilterControls = () => (
        <>
            <div className="flex shrink-0 items-center gap-1 rounded-md bg-surface p-1">
                {([
                    { value: 'all', label: 'Todos' },
                    { value: 'active', label: 'Ativos' },
                    { value: 'disbanded', label: 'Disbandados' },
                ] as const).map(opt => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => setStatusFilter(opt.value)}
                        className={chipClass(statusFilter === opt.value)}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            <label className="flex shrink-0 items-center gap-1.5">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">Geração</span>
                <select value={generationFilter} onChange={e => setGenerationFilter(e.target.value)} className={selectClass} aria-label="Filtrar por geração">
                    <option value="all">Todas</option>
                    {GENERATIONS.map(g => <option key={g.label} value={g.label}>{g.label}</option>)}
                </select>
            </label>

            <label className="flex shrink-0 items-center gap-1.5">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">Ordenar</span>
                <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className={selectClass} aria-label="Ordenar grupos">
                    {([
                        { value: 'popular', label: 'Populares' },
                        { value: 'name', label: 'A-Z' },
                        { value: 'debut', label: 'Estreia' },
                        { value: 'recent', label: 'Mais novos' },
                        { value: 'members', label: 'Membros' },
                    ] as const).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </label>
        </>
    )

    return (
        <div id="groups-list">

            {/* Filtros */}
            {!hideFilter && <nav aria-label="Filtros" className="page-wrap flex h-12 items-center border-b border-border/50">
                <div className="flex w-full items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                    <div className="flex shrink-0 items-center gap-2">
                        {renderFilterControls()}
                    </div>

                    <div className="flex h-8 w-[220px] shrink-0 items-center gap-2 rounded-md border border-border bg-background px-2.5 transition-colors focus-within:border-foreground sm:w-[360px]">
                        <Search className="h-4 w-4 shrink-0 text-muted" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar grupo, hangul ou agência..."
                            className="min-w-0 flex-1 !border-0 !bg-transparent !p-0 text-[13px] text-foreground !shadow-none placeholder:text-muted focus:outline-none"
                        />
                    </div>
                    {hasActiveFilters && (
                        <button onClick={resetFilters} className="flex h-8 shrink-0 items-center justify-center rounded-md bg-surface px-2 text-muted transition-colors hover:bg-surface-hover hover:text-foreground" title="Limpar filtros" aria-label="Limpar filtros">
                            <X className="h-4 w-4" />
                        </button>
                    )}

                    {hasActiveFilters && (
                    <div className="hidden items-center gap-3 lg:flex">
                        <p className="text-xs text-muted">
                            {filtered.length} grupo{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    )}
                </div>
            </nav>}

            {!hideFilter && (
                <div className="page-wrap border-b border-border/50 py-2">
                    <Breadcrumbs items={[{ label: 'Grupos' }]} />
                </div>
            )}

            <div className={hideFilter ? '' : 'page-wrap pt-6'}>
            {groups.length === 0 && <GroupsSkeleton />}

            {/* Grid */}
            {groups.length > 0 && filtered.length === 0 ? (
                <EmptyState
                    title="Nenhum grupo encontrado"
                    action={{ label: 'Limpar filtros', onClick: resetFilters }}
                />
            ) : groups.length > 0 ? (
                <>
                <div className="mb-5 flex flex-col gap-1 border-b border-foreground pb-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-accent">Catálogo</p>
                        <h2 className="text-xl font-black tracking-[-0.03em] text-foreground sm:text-2xl">Todos os grupos</h2>
                    </div>
                    <p className="text-xs text-muted">
                        {filtered.length.toLocaleString('pt-BR')} de {groups.length.toLocaleString('pt-BR')} grupos
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
                    {filtered.map((group, index) => {
                        const faded = !!group.disbandDate
                        const gen = getGeneration(group.debutDate)
                        return (
                            <div key={group.id} className={`group/card relative ${faded ? 'opacity-70 hover:opacity-100 transition-opacity duration-300' : ''}`}>
                                <Link href={`/groups/${group.slug ?? group.id}`} className="group grid grid-cols-[76px_minmax(0,1fr)] gap-3 border border-border bg-background p-2.5 transition-colors hover:border-accent/40 hover:bg-surface/55 sm:block">
                                    <div className="relative aspect-square overflow-hidden border border-border/80 bg-surface sm:mb-3">
                                        {group.profileImageUrl ? (
                                            <Image
                                                src={group.profileImageUrl}
                                                alt={group.name}
                                                fill
                                                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                                                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
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
                                            <div className="absolute right-2 top-2 bg-black/70 px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-[0.08em] text-white/70">
                                                Disbandado
                                            </div>
                                        )}
                                        {group._count.members > 0 && (
                                            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white/80">
                                                <Users className="w-3 h-3" />
                                                {group._count.members}
                                            </div>
                                        )}
                                        {/* Hover overlay */}
                                        <div className="absolute inset-x-0 bottom-0 flex h-1/2 flex-col justify-end gap-0.5 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-2.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
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
                                    <div className="min-w-0 self-center sm:self-auto">
                                        <h3 className="text-[15px] font-black leading-tight text-foreground transition-colors group-hover:text-accent sm:text-sm">{group.name}</h3>
                                        {group.nameHangul && (
                                            <p className="text-xs text-muted font-medium mt-0.5">{group.nameHangul}</p>
                                        )}
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5">
                                            {gen && (() => {
                                                const gc = GEN_COLORS[gen]
                                                return gc ? (
                                                    <span className="px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.04em]" style={{ backgroundColor: gc.bg, color: gc.color }}>{gen}</span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-muted">{gen}</span>
                                                )
                                            })()}
                                            {group.agency && (
                                                <span className="max-w-[140px] truncate bg-surface px-2 py-0.5 text-[10px] font-semibold text-muted sm:max-w-[100px]">{group.agency.name}</span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                                <div className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity z-10">
                                    <AdminQuickEdit href={`/admin/groups/${group.slug ?? group.id}?returnTo=${encodeURIComponent(pathname + (searchParams.toString() ? '?' + searchParams.toString() : ''))}`} label="Editar" />
                                </div>
                            </div>
                        )
                    })}
                </div>
                </>
            ) : null}
            </div>
        </div>
    )
}
