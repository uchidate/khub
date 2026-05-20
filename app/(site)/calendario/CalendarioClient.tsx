'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Cake, CalendarDays, Film, Search, ShoppingBag, Sparkles, X } from 'lucide-react'
import { FilterPills } from '@/components/ui/FilterPills'

export interface StoreProductCard {
    id: string
    name: string
    price?: string | null
    originalPrice?: string | null
    imageUrl: string
    affiliateUrl: string
    store: string | null
    badge?: string
    rating?: number
    soldCount?: string | null
}

export interface BirthdayEvent {
    artistId: string
    artistSlug: string | null
    nameRomanized: string
    nameHangul: string | null
    primaryImageUrl: string | null
    date: string // ISO
    age: number
    daysUntil: number
}

export interface ProductionEvent {
    id: string
    slug: string | null
    titlePt: string
    titleKr: string | null
    imageUrl: string | null
    date: string // ISO
    type: string | null
    network: string | null
    daysUntil: number
}

type CalendarEvent = {
    date: string
    daysUntil: number
    kind: 'birthday' | 'release'
    data: BirthdayEvent | ProductionEvent
}

interface Props {
    birthdays: BirthdayEvent[]
    releases: ProductionEvent[]
    recentReleases: ProductionEvent[]
    todayStr: string // YYYY-MM-DD
    storeProducts?: StoreProductCard[]
}

const MONTH_NAMES_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const MONTH_NAMES_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DAY_LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function daysUntilLabel(days: number) {
    if (days === 0) return { text: 'Hoje', cls: 'bg-accent text-white' }
    if (days === 1) return { text: 'Amanhã', cls: 'bg-accent/15 text-accent' }
    if (days <= 7) return { text: `Em ${days} dias`, cls: 'bg-surface-hover text-muted' }
    return { text: `Em ${days} dias`, cls: 'bg-surface-hover text-muted' }
}

function shortDateLabel(date: string) {
    const d = new Date(date)
    return `${d.getUTCDate()} ${MONTH_NAMES_SHORT[d.getUTCMonth()]}`
}

function MiniCalendar({ year, month, birthdayDays, releaseDays, todayStr }: {
    year: number
    month: number
    birthdayDays: Set<number>
    releaseDays: Set<number>
    todayStr: string
}) {
    const todayDate = new Date(todayStr + 'T00:00:00Z')
    const isCurrentMonth = todayDate.getUTCFullYear() === year && todayDate.getUTCMonth() === month
    const todayDay = isCurrentMonth ? todayDate.getUTCDate() : -1

    const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay()
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
    const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
    while (cells.length % 7 !== 0) cells.push(null)

    return (
        <div className="rounded-3xl border border-border bg-surface p-4 shadow-sm">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-muted">
                {MONTH_NAMES_FULL[month]} {year}
            </p>
            <div className="grid grid-cols-7 gap-0.5 mb-1">
                {DAY_LETTERS.map((d, i) => (
                    <div key={i} className="text-center text-[9px] font-bold text-muted/50 py-0.5">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
                {cells.map((day, i) => {
                    if (!day) return <div key={i} />
                    const hasBday = birthdayDays.has(day)
                    const hasRelease = releaseDays.has(day)
                    const isToday = day === todayDay
                    const isPast = isCurrentMonth && day < todayDay
                    return (
                        <div key={i} className={`relative flex min-h-8 flex-col items-center justify-center rounded-xl py-1 ${isToday ? 'bg-accent text-white' : 'hover:bg-surface-hover'} ${isPast ? 'opacity-35' : ''}`}>
                            <span className={`text-[11px] font-bold leading-none ${isToday ? 'text-white' : 'text-foreground'}`}>{day}</span>
                            {(hasBday || hasRelease) && (
                                <div className="flex gap-0.5 mt-0.5">
                                    {hasBday && <div className={`h-1 w-1 rounded-full ${isToday ? 'bg-white' : 'bg-pink-400'}`} />}
                                    {hasRelease && <div className={`h-1 w-1 rounded-full ${isToday ? 'bg-white/70' : 'bg-blue-400'}`} />}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
            <div className="mt-3 flex gap-3 border-t border-border pt-3">
                <span className="flex items-center gap-1 text-[10px] text-muted"><span className="w-2 h-2 rounded-full bg-pink-400 inline-block" /> Aniversário</span>
                <span className="flex items-center gap-1 text-[10px] text-muted"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Lançamento</span>
            </div>
        </div>
    )
}

function CompactEventLink({ event }: { event: CalendarEvent }) {
    if (event.kind === 'birthday') {
        const b = event.data as BirthdayEvent
        return (
            <Link href={`/artists/${b.artistSlug ?? b.artistId}`} className="group flex min-w-0 items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-surface-hover">
                <div className="relative h-7 w-7 flex-shrink-0 overflow-hidden rounded-full bg-background">
                    {b.primaryImageUrl ? (
                        <Image src={b.primaryImageUrl} alt={b.nameRomanized} fill className="object-cover object-top" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-muted">{b.nameRomanized[0]}</div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold leading-tight text-foreground group-hover:text-accent">{b.nameRomanized}</p>
                    <p className="text-[10px] leading-tight text-muted">{b.age} anos</p>
                </div>
                <Cake className="h-3 w-3 flex-shrink-0 text-accent" />
            </Link>
        )
    }

    const r = event.data as ProductionEvent
    return (
        <Link href={`/productions/${r.slug ?? r.id}`} className="group flex min-w-0 items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-surface-hover">
            <div className="relative h-8 w-6 flex-shrink-0 overflow-hidden rounded-lg bg-background">
                {r.imageUrl ? (
                    <Image src={r.imageUrl} alt={r.titlePt} fill className="object-cover" />
                ) : (
                    <Film className="absolute inset-0 m-auto h-3 w-3 text-muted/40" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold leading-tight text-foreground group-hover:text-accent">{r.titlePt}</p>
                <p className="truncate text-[10px] leading-tight text-muted">{r.type === 'movie' ? 'Filme' : 'K-Drama'}{r.network && ` · ${r.network}`}</p>
            </div>
            <Film className="h-3 w-3 flex-shrink-0 text-accent" />
        </Link>
    )
}

export function CalendarioClient({ birthdays, releases, recentReleases, todayStr, storeProducts = [] }: Props) {
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())

    const todayBirthdays = birthdays.filter(b => b.daysUntil === 0)
    const todayReleases = releases.filter(r => r.daysUntil === 0)
    const hasToday = todayBirthdays.length > 0 || todayReleases.length > 0

    const filteredBirthdays = useMemo(() => {
        if (filter === 'releases') return []
        const q = search.toLowerCase()
        return birthdays.filter(b =>
            !q || b.nameRomanized.toLowerCase().includes(q) || b.nameHangul?.toLowerCase().includes(q)
        )
    }, [birthdays, filter, search])

    const filteredReleases = useMemo(() => {
        if (filter === 'birthdays') return []
        const q = search.toLowerCase()
        return releases.filter(r =>
            !q || r.titlePt.toLowerCase().includes(q) || r.titleKr?.toLowerCase().includes(q)
        )
    }, [releases, filter, search])

    // Group by month
    const allEvents = useMemo(() => {
        const evs: CalendarEvent[] = [
            ...filteredBirthdays.map(b => ({ date: b.date, daysUntil: b.daysUntil, kind: 'birthday' as const, data: b })),
            ...filteredReleases.map(r => ({ date: r.date, daysUntil: r.daysUntil, kind: 'release' as const, data: r })),
        ]
        evs.sort((a, b) => a.daysUntil - b.daysUntil)

        const byMonth: Map<string, CalendarEvent[]> = new Map()
        for (const ev of evs) {
            const d = new Date(ev.date)
            const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`
            if (!byMonth.has(key)) byMonth.set(key, [])
            byMonth.get(key)!.push(ev)
        }
        return byMonth
    }, [filteredBirthdays, filteredReleases])

    // Build calendar dot sets for current & next month
    const calendarMonths = useMemo(() => {
        const today = new Date(todayStr + 'T00:00:00Z')
        const months = [
            { year: today.getUTCFullYear(), month: today.getUTCMonth() },
        ]
        const next = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1))
        months.push({ year: next.getUTCFullYear(), month: next.getUTCMonth() })
        return months.map(({ year, month }) => {
            const bdDays = new Set<number>()
            const relDays = new Set<number>()
            for (const b of birthdays) {
                const d = new Date(b.date)
                if (d.getUTCFullYear() === year && d.getUTCMonth() === month) bdDays.add(d.getUTCDate())
            }
            for (const r of releases) {
                const d = new Date(r.date)
                if (d.getUTCFullYear() === year && d.getUTCMonth() === month) relDays.add(d.getUTCDate())
            }
            return { year, month, bdDays, relDays }
        })
    }, [birthdays, releases, todayStr])

    const filterOptions = [
        { value: 'all', label: 'Tudo' },
        { value: 'birthdays', label: 'Aniversários' },
        { value: 'releases', label: 'Lançamentos' },
    ]

    const nextSevenDays = useMemo(() => {
        type QuickEvent = { id: string; href: string; title: string; subtitle: string; date: string; daysUntil: number; kind: 'birthday' | 'release'; imageUrl: string | null }
        const items: QuickEvent[] = [
            ...birthdays
                .filter(b => b.daysUntil >= 0 && b.daysUntil <= 7)
                .map(b => ({
                    id: `b-${b.artistId}`,
                    href: `/artists/${b.artistSlug ?? b.artistId}`,
                    title: b.nameRomanized,
                    subtitle: `${b.age} anos`,
                    date: b.date,
                    daysUntil: b.daysUntil,
                    kind: 'birthday' as const,
                    imageUrl: b.primaryImageUrl,
                })),
            ...releases
                .filter(r => r.daysUntil >= 0 && r.daysUntil <= 7)
                .map(r => ({
                    id: `r-${r.id}`,
                    href: `/productions/${r.slug ?? r.id}`,
                    title: r.titlePt,
                    subtitle: r.type === 'movie' ? 'Filme' : 'K-Drama',
                    date: r.date,
                    daysUntil: r.daysUntil,
                    kind: 'release' as const,
                    imageUrl: r.imageUrl,
                })),
        ]
        return items.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 8)
    }, [birthdays, releases])

    const nextBirthdays = birthdays.slice(0, 4)
    const nextReleases = releases.slice(0, 4)
    const totalVisibleEvents = filteredBirthdays.length + filteredReleases.length
    const toggleMonth = (key: string) => {
        setExpandedMonths(current => {
            const next = new Set(current)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    return (
        <div className="space-y-8">
            {/* Today section */}
            {hasToday && (
                <section className="rounded-3xl border border-accent/20 bg-accent-soft p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-accent" />
                        <h2 className="text-sm font-black uppercase tracking-[0.14em] text-accent">Hoje</h2>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {todayBirthdays.map(b => (
                            <Link key={b.artistId} href={`/artists/${b.artistSlug ?? b.artistId}`}
                                className="group flex items-center gap-2.5 rounded-2xl border border-border bg-surface/90 px-3 py-2 transition-all hover:border-accent/40">
                                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-surface-hover flex-shrink-0">
                                    {b.primaryImageUrl ? (
                                        <Image src={b.primaryImageUrl} alt={b.nameRomanized} fill className="object-cover object-top" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-muted">{b.nameRomanized[0]}</div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-foreground group-hover:text-accent transition-colors">{b.nameRomanized}</p>
                                    <p className="text-[10px] text-muted">Aniversário, {b.age} anos</p>
                                </div>
                            </Link>
                        ))}
                        {todayReleases.map(r => (
                            <Link key={r.id} href={`/productions/${r.slug ?? r.id}`}
                                className="group flex items-center gap-2.5 rounded-2xl border border-border bg-surface/90 px-3 py-2 transition-all hover:border-accent/40">
                                <div className="relative w-8 h-11 rounded-lg overflow-hidden bg-surface-hover flex-shrink-0">
                                    {r.imageUrl ? (
                                        <Image src={r.imageUrl} alt={r.titlePt} fill className="object-cover" />
                                    ) : (
                                        <Film className="w-4 h-4 text-muted/40 absolute inset-0 m-auto" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-foreground group-hover:text-accent transition-colors line-clamp-1">{r.titlePt}</p>
                                    <p className="text-[10px] text-muted">{r.type === 'movie' ? 'Filme' : 'K-Drama'}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Filters */}
            <div className="rounded-3xl border border-border bg-surface p-3 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <FilterPills options={filterOptions} value={filter} onChange={setFilter} />
                    <div className="relative w-full lg:max-w-sm">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                        <input
                            type="text"
                            placeholder="Buscar artista ou drama..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full rounded-2xl border border-border bg-background py-3 pl-9 pr-9 text-sm text-foreground placeholder:text-muted transition-colors focus:border-accent focus:outline-none"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground" aria-label="Limpar busca">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(260px,0.75fr)_minmax(260px,0.75fr)]">
                <div className="rounded-3xl border border-border bg-surface p-4 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-accent">Próximos 7 dias</p>
                            <h2 className="mt-1 text-lg font-black text-foreground">Agenda imediata</h2>
                        </div>
                        <span className="rounded-full bg-background px-2.5 py-1 text-[10px] font-black text-muted">
                            {nextSevenDays.length} item{nextSevenDays.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    {nextSevenDays.length > 0 ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                            {nextSevenDays.map(event => {
                                const badge = daysUntilLabel(event.daysUntil)
                                return (
                                    <Link key={event.id} href={event.href} className="group flex items-center gap-3 rounded-2xl border border-border bg-background p-2.5 transition-colors hover:border-accent/40">
                                        <div className={`relative h-11 w-11 flex-shrink-0 overflow-hidden ${event.kind === 'birthday' ? 'rounded-full' : 'rounded-xl'} bg-surface-hover`}>
                                            {event.imageUrl ? (
                                                <Image src={event.imageUrl} alt={event.title} fill className="object-cover object-top" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center">
                                                    {event.kind === 'birthday' ? <Cake className="h-4 w-4 text-muted/40" /> : <Film className="h-4 w-4 text-muted/40" />}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-bold text-foreground group-hover:text-accent">{event.title}</p>
                                            <p className="text-[11px] text-muted">{shortDateLabel(event.date)} · {event.subtitle}</p>
                                        </div>
                                        <span className={`flex-shrink-0 rounded-full px-2 py-1 text-[9px] font-black ${badge.cls}`}>{badge.text}</span>
                                    </Link>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-border bg-background p-5 text-sm text-muted">
                            Nenhuma data nos próximos 7 dias.
                        </div>
                    )}
                </div>

                <div className="rounded-3xl border border-border bg-surface p-4 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <Cake className="h-4 w-4 text-accent" />
                        <h2 className="text-sm font-black uppercase tracking-[0.14em] text-foreground">Próximos aniversários</h2>
                    </div>
                    <div className="space-y-2">
                        {nextBirthdays.map(b => (
                            <Link key={b.artistId} href={`/artists/${b.artistSlug ?? b.artistId}`} className="group flex items-center gap-2.5 rounded-2xl bg-background p-2.5 transition-colors hover:bg-surface-hover">
                                <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-surface-hover">
                                    {b.primaryImageUrl ? <Image src={b.primaryImageUrl} alt={b.nameRomanized} fill className="object-cover object-top" /> : <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-muted">{b.nameRomanized[0]}</div>}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-bold text-foreground group-hover:text-accent">{b.nameRomanized}</p>
                                    <p className="text-[10px] text-muted">{shortDateLabel(b.date)} · {b.age} anos</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="rounded-3xl border border-border bg-surface p-4 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <Film className="h-4 w-4 text-accent" />
                        <h2 className="text-sm font-black uppercase tracking-[0.14em] text-foreground">Próximas estreias</h2>
                    </div>
                    <div className="space-y-2">
                        {nextReleases.map(r => (
                            <Link key={r.id} href={`/productions/${r.slug ?? r.id}`} className="group flex items-center gap-2.5 rounded-2xl bg-background p-2.5 transition-colors hover:bg-surface-hover">
                                <div className="relative h-11 w-8 flex-shrink-0 overflow-hidden rounded-lg bg-surface-hover">
                                    {r.imageUrl ? <Image src={r.imageUrl} alt={r.titlePt} fill className="object-cover" /> : <Film className="absolute inset-0 m-auto h-3.5 w-3.5 text-muted/40" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-bold text-foreground group-hover:text-accent">{r.titlePt}</p>
                                    <p className="text-[10px] text-muted">{shortDateLabel(r.date)}{r.network && ` · ${r.network}`}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="min-w-0 space-y-8">
                    {/* Recent releases horizontal scroll */}
                    {recentReleases.length > 0 && (
                        <section>
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-muted">
                                    <Film className="h-3.5 w-3.5 text-accent" />
                                    Lançamentos recentes
                                </h2>
                                <span className="text-[10px] font-bold text-muted">{recentReleases.length} recentes</span>
                            </div>
                            <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 scrollbar-none">
                                {recentReleases.map(p => (
                                    <Link key={p.id} href={`/productions/${p.slug ?? p.id}`} className="group w-28 flex-shrink-0">
                                        <div className="relative mb-2 h-40 w-28 overflow-hidden rounded-2xl border border-border bg-surface">
                                            {p.imageUrl ? (
                                                <Image src={p.imageUrl} alt={p.titlePt} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center">
                                                    <Film className="h-6 w-6 text-muted/30" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="line-clamp-2 text-[11px] font-bold leading-tight text-foreground group-hover:text-accent">{p.titlePt}</p>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Timeline by month */}
                    {allEvents.size === 0 ? (
                        <div className="rounded-3xl border border-border bg-surface py-16 text-center text-muted">
                            <p className="font-semibold">Nenhum evento encontrado.</p>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {[...allEvents.entries()].map(([key, events]) => {
                                const [yearStr, monthStr] = key.split('-')
                                const year = Number(yearStr)
                                const month = Number(monthStr)
                                const dayGroups = [...events.reduce<Map<string, CalendarEvent[]>>((acc, event) => {
                                    const dayKey = event.date.split('T')[0]
                                    if (!acc.has(dayKey)) acc.set(dayKey, [])
                                    acc.get(dayKey)!.push(event)
                                    return acc
                                }, new Map()).entries()]
                                const isExpanded = expandedMonths.has(key)
                                const visibleDayGroups = isExpanded ? dayGroups : dayGroups.slice(0, 8)
                                const hiddenDays = dayGroups.length - visibleDayGroups.length

                                return (
                                    <section key={key}>
                                        <div className="mb-4 flex items-center gap-3">
                                            <h2 className="text-lg font-black text-foreground">
                                                {MONTH_NAMES_FULL[month]} <span className="text-sm font-normal text-muted">{year}</span>
                                            </h2>
                                            <div className="h-px flex-1 bg-border" />
                                            <span className="text-[10px] font-bold text-muted">{events.length} evento{events.length !== 1 ? 's' : ''}</span>
                                        </div>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            {visibleDayGroups.map(([dayKey, dayEvents]) => {
                                                const d = new Date(`${dayKey}T00:00:00Z`)
                                                const badge = daysUntilLabel(dayEvents[0].daysUntil)
                                                const birthdayCount = dayEvents.filter(event => event.kind === 'birthday').length
                                                const releaseCount = dayEvents.length - birthdayCount

                                                return (
                                                    <div key={dayKey} className="rounded-3xl border border-border bg-surface p-3 shadow-sm">
                                                        <div className="mb-2 flex items-center gap-3">
                                                            <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-2xl bg-background">
                                                                <p className="text-lg font-black leading-none text-foreground">{d.getUTCDate()}</p>
                                                                <p className="text-[10px] font-bold uppercase text-muted">{DAY_NAMES[d.getUTCDay()]}</p>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs font-black uppercase tracking-[0.12em] text-muted">{shortDateLabel(dayEvents[0].date)}</p>
                                                                <div className="mt-1 flex flex-wrap gap-1.5">
                                                                    {birthdayCount > 0 && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[9px] font-black text-accent">{birthdayCount} aniversário{birthdayCount !== 1 ? 's' : ''}</span>}
                                                                    {releaseCount > 0 && <span className="rounded-full bg-surface-hover px-2 py-0.5 text-[9px] font-black text-muted">{releaseCount} estreia{releaseCount !== 1 ? 's' : ''}</span>}
                                                                </div>
                                                            </div>
                                                            <span className={`flex-shrink-0 rounded-full px-2 py-1 text-[9px] font-black ${badge.cls}`}>{badge.text}</span>
                                                        </div>
                                                        <div className="space-y-1">
                                                            {dayEvents.slice(0, 4).map((event, idx) => (
                                                                <CompactEventLink key={`${dayKey}-${event.kind}-${idx}`} event={event} />
                                                            ))}
                                                            {dayEvents.length > 4 && (
                                                                <p className="px-2 pt-1 text-[10px] font-bold text-muted">+ {dayEvents.length - 4} evento{dayEvents.length - 4 !== 1 ? 's' : ''} nesse dia</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        {hiddenDays > 0 && (
                                            <button
                                                onClick={() => toggleMonth(key)}
                                                className="mt-4 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-xs font-black text-muted transition-colors hover:border-accent/40 hover:text-accent"
                                            >
                                                {isExpanded ? 'Mostrar menos' : `Mostrar mais ${hiddenDays} dia${hiddenDays !== 1 ? 's' : ''}`}
                                            </button>
                                        )}
                                    </section>
                                )
                            })}
                        </div>
                    )}
                </div>

                <aside className="space-y-5 lg:sticky lg:top-[calc(var(--site-sticky-top)+1rem)] lg:self-start">
                    <div className="rounded-3xl border border-border bg-surface p-4 shadow-sm">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-muted">Resumo filtrado</p>
                        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-2xl bg-background p-3">
                                <p className="text-xl font-black text-foreground">{totalVisibleEvents}</p>
                                <p className="mt-1 text-[10px] font-semibold text-muted">total</p>
                            </div>
                            <div className="rounded-2xl bg-background p-3">
                                <p className="text-xl font-black text-foreground">{filteredBirthdays.length}</p>
                                <p className="mt-1 text-[10px] font-semibold text-muted">idols</p>
                            </div>
                            <div className="rounded-2xl bg-background p-3">
                                <p className="text-xl font-black text-foreground">{filteredReleases.length}</p>
                                <p className="mt-1 text-[10px] font-semibold text-muted">estreias</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-muted">
                            <CalendarDays className="h-3.5 w-3.5 text-accent" />
                            Visão mensal
                        </div>
                        {calendarMonths.map(({ year, month, bdDays, relDays }) => (
                            <MiniCalendar key={`${year}-${month}`} year={year} month={month}
                                birthdayDays={bdDays} releaseDays={relDays} todayStr={todayStr} />
                        ))}
                    </div>

                    {storeProducts.length > 0 && (
                        <section className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
                            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                                <div className="flex min-w-0 items-center gap-2">
                                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-2xl bg-accent text-white">
                                        <ShoppingBag className="h-3.5 w-3.5" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-accent">Vitrine</p>
                                        <p className="truncate text-xs font-bold text-foreground">Achados para fãs</p>
                                    </div>
                                </div>
                                <Link href="/loja" className="inline-flex flex-shrink-0 items-center gap-1 text-xs font-black text-muted transition-colors hover:text-accent">
                                    Ver <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                            <div className="grid grid-cols-2 gap-3 p-3">
                                {storeProducts.slice(0, 4).map(p => (
                                    <a
                                        key={p.id}
                                        href={p.affiliateUrl}
                                        target="_blank"
                                        rel="noopener noreferrer sponsored"
                                        className="group min-w-0"
                                    >
                                        <div className="relative mb-1.5 aspect-square overflow-hidden rounded-2xl border border-border bg-background transition-colors group-hover:border-accent/40">
                                            <Image src={p.imageUrl} alt={p.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" unoptimized />
                                            {p.badge && (
                                                <span className="absolute left-1.5 top-1.5 rounded-full bg-accent px-1.5 py-0.5 text-[8px] font-black text-white">{p.badge}</span>
                                            )}
                                        </div>
                                        <p className="line-clamp-2 text-[10px] font-semibold leading-tight text-foreground">{p.name}</p>
                                        {p.price && <p className="mt-0.5 text-[11px] font-black text-foreground">{p.price}</p>}
                                    </a>
                                ))}
                            </div>
                        </section>
                    )}
                </aside>
            </div>
        </div>
    )
}
