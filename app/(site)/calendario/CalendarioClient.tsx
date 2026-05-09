'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Cake, Film, ChevronRight, Search, X, Sparkles, ShoppingBag } from 'lucide-react'
import { FilterPills } from '@/components/ui/FilterPills'

export interface StoreProductCard {
    id: string
    name: string
    price: string
    originalPrice?: string
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

interface Props {
    birthdays: BirthdayEvent[]
    releases: ProductionEvent[]
    recentReleases: ProductionEvent[]
    todayStr: string // YYYY-MM-DD
    storeProducts?: StoreProductCard[]
}

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const MONTH_NAMES_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DAY_LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function daysUntilLabel(days: number) {
    if (days === 0) return { text: 'Hoje', cls: 'bg-pink-500/20 text-pink-400' }
    if (days === 1) return { text: 'Amanhã', cls: 'bg-accent/15 text-accent' }
    if (days <= 7) return { text: `Em ${days} dias`, cls: 'bg-surface-hover text-muted' }
    return { text: `Em ${days} dias`, cls: 'bg-surface-hover text-muted' }
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
        <div className="bg-surface border border-border rounded-2xl p-4">
            <p className="text-xs font-black uppercase tracking-widest text-muted mb-3">
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
                        <div key={i} className={`relative flex flex-col items-center py-1 rounded-lg ${isToday ? 'bg-accent/15' : ''} ${isPast ? 'opacity-35' : ''}`}>
                            <span className={`text-[11px] font-bold leading-none ${isToday ? 'text-accent' : 'text-foreground'}`}>{day}</span>
                            {(hasBday || hasRelease) && (
                                <div className="flex gap-0.5 mt-0.5">
                                    {hasBday && <div className="w-1 h-1 rounded-full bg-pink-400" />}
                                    {hasRelease && <div className="w-1 h-1 rounded-full bg-blue-400" />}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
            <div className="flex gap-3 mt-3 pt-3 border-t border-border">
                <span className="flex items-center gap-1 text-[10px] text-muted"><span className="w-2 h-2 rounded-full bg-pink-400 inline-block" /> Aniversário</span>
                <span className="flex items-center gap-1 text-[10px] text-muted"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Lançamento</span>
            </div>
        </div>
    )
}

export function CalendarioClient({ birthdays, releases, recentReleases, todayStr, storeProducts = [] }: Props) {
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')

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
        type Event = { date: string; daysUntil: number; kind: 'birthday' | 'release'; data: BirthdayEvent | ProductionEvent }
        const evs: Event[] = [
            ...filteredBirthdays.map(b => ({ date: b.date, daysUntil: b.daysUntil, kind: 'birthday' as const, data: b })),
            ...filteredReleases.map(r => ({ date: r.date, daysUntil: r.daysUntil, kind: 'release' as const, data: r })),
        ]
        evs.sort((a, b) => a.daysUntil - b.daysUntil)

        const byMonth: Map<string, Event[]> = new Map()
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
        { value: 'birthdays', label: '🎂 Aniversários' },
        { value: 'releases', label: '🎬 Lançamentos' },
    ]

    return (
        <div className="space-y-8">
            {/* Today section */}
            {hasToday && (
                <section className="rounded-2xl border border-pink-500/20 bg-gradient-to-br from-pink-500/8 to-accent/5 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4 text-pink-400" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-pink-400">Hoje</h2>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {todayBirthdays.map(b => (
                            <Link key={b.artistId} href={`/artists/${b.artistSlug ?? b.artistId}`}
                                className="flex items-center gap-2.5 bg-surface/80 border border-pink-500/20 rounded-xl px-3 py-2 hover:border-pink-400/40 transition-all group">
                                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-surface-hover flex-shrink-0">
                                    {b.primaryImageUrl ? (
                                        <Image src={b.primaryImageUrl} alt={b.nameRomanized} fill className="object-cover object-top" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-muted">{b.nameRomanized[0]}</div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-foreground group-hover:text-accent transition-colors">{b.nameRomanized}</p>
                                    <p className="text-[10px] text-pink-400">🎂 {b.age} anos</p>
                                </div>
                            </Link>
                        ))}
                        {todayReleases.map(r => (
                            <Link key={r.id} href={`/productions/${r.slug ?? r.id}`}
                                className="flex items-center gap-2.5 bg-surface/80 border border-blue-500/20 rounded-xl px-3 py-2 hover:border-blue-400/40 transition-all group">
                                <div className="relative w-8 h-11 rounded-lg overflow-hidden bg-surface-hover flex-shrink-0">
                                    {r.imageUrl ? (
                                        <Image src={r.imageUrl} alt={r.titlePt} fill className="object-cover" />
                                    ) : (
                                        <Film className="w-4 h-4 text-muted/40 absolute inset-0 m-auto" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-foreground group-hover:text-accent transition-colors line-clamp-1">{r.titlePt}</p>
                                    <p className="text-[10px] text-blue-400">🎬 {r.type === 'movie' ? 'Filme' : 'K-Drama'}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Recent releases horizontal scroll */}
            {recentReleases.length > 0 && (
                <section>
                    <h2 className="text-xs font-black text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Film className="w-3.5 h-3.5 text-accent" />
                        Lançamentos recentes
                    </h2>
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                        {recentReleases.map(p => (
                            <Link key={p.id} href={`/productions/${p.slug ?? p.id}`} className="flex-shrink-0 w-24 group">
                                <div className="relative w-24 h-36 rounded-xl overflow-hidden bg-surface border border-border mb-1.5">
                                    {p.imageUrl ? (
                                        <Image src={p.imageUrl} alt={p.titlePt} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Film className="w-6 h-6 text-muted/30" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] font-bold text-foreground leading-tight line-clamp-2">{p.titlePt}</p>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Mini calendars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {calendarMonths.map(({ year, month, bdDays, relDays }) => (
                    <MiniCalendar key={`${year}-${month}`} year={year} month={month}
                        birthdayDays={bdDays} releaseDays={relDays} todayStr={todayStr} />
                ))}
            </div>

            {/* Loja inline */}
            {storeProducts.length > 0 && (
                <section className="rounded-2xl border border-orange-500/15 bg-orange-500/5 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-bold text-foreground">Produtos K-Pop</span>
                            <span className="text-[10px] font-semibold bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2 py-0.5 rounded-full">Afiliado</span>
                        </div>
                        <Link href="/loja" className="text-xs text-muted hover:text-orange-500 transition-colors">Ver loja →</Link>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
                        {storeProducts.map(p => (
                            <a
                                key={p.id}
                                href={p.affiliateUrl}
                                target="_blank"
                                rel="noopener noreferrer sponsored"
                                className="flex-shrink-0 w-24 group"
                            >
                                <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-surface border border-border mb-1.5 group-hover:border-orange-400/40 transition-colors">
                                    <Image src={p.imageUrl} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                                </div>
                                <p className="text-[10px] font-medium text-foreground leading-tight line-clamp-2 mb-0.5">{p.name}</p>
                                <p className="text-[11px] font-black text-orange-500">{p.price}</p>
                            </a>
                        ))}
                    </div>
                </section>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <FilterPills options={filterOptions} value={filter} onChange={setFilter} />
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                    <input
                        type="text"
                        placeholder="Buscar artista ou drama..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full h-full pl-8 pr-8 py-2.5 bg-surface border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Timeline by month */}
            {allEvents.size === 0 ? (
                <div className="text-center py-16 text-muted">
                    <p className="font-semibold">Nenhum evento encontrado.</p>
                </div>
            ) : (
                <div className="space-y-10">
                    {[...allEvents.entries()].map(([key, events]) => {
                        const [yearStr, monthStr] = key.split('-')
                        const year = Number(yearStr)
                        const month = Number(monthStr)
                        return (
                            <section key={key}>
                                <div className="flex items-center gap-3 mb-4">
                                    <h2 className="text-lg font-black text-foreground">
                                        {MONTH_NAMES_FULL[month]} <span className="text-muted font-normal text-sm">{year}</span>
                                    </h2>
                                    <div className="flex-1 h-px bg-border" />
                                    <span className="text-[10px] text-muted font-bold">{events.length} evento{events.length !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="space-y-2">
                                    {events.map((ev, idx) => {
                                        const d = new Date(ev.date)
                                        const badge = daysUntilLabel(ev.daysUntil)
                                        if (ev.kind === 'birthday') {
                                            const b = ev.data as BirthdayEvent
                                            return (
                                                <Link key={`b-${b.artistId}-${idx}`}
                                                    href={`/artists/${b.artistSlug ?? b.artistId}`}
                                                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface hover:border-pink-400/30 hover:bg-pink-500/5 transition-all group">
                                                    <div className="flex-shrink-0 w-12 text-center">
                                                        <p className="text-base font-black text-foreground leading-none">{d.getUTCDate()}</p>
                                                        <p className="text-[10px] text-muted">{DAY_NAMES[d.getUTCDay()]}</p>
                                                    </div>
                                                    <div className="relative w-9 h-9 rounded-full overflow-hidden bg-surface-hover flex-shrink-0">
                                                        {b.primaryImageUrl ? (
                                                            <Image src={b.primaryImageUrl} alt={b.nameRomanized} fill className="object-cover object-top" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-muted">{b.nameRomanized[0]}</div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-foreground truncate group-hover:text-accent transition-colors">{b.nameRomanized}</p>
                                                        <p className="text-[11px] text-muted">{b.nameHangul && `${b.nameHangul} · `}{b.age} anos <Cake className="inline w-3 h-3 text-pink-400 ml-0.5" /></p>
                                                    </div>
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0 ${badge.cls}`}>{badge.text}</span>
                                                    <ChevronRight className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                                </Link>
                                            )
                                        } else {
                                            const r = ev.data as ProductionEvent
                                            return (
                                                <Link key={`r-${r.id}-${idx}`}
                                                    href={`/productions/${r.slug ?? r.id}`}
                                                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface hover:border-blue-400/30 hover:bg-blue-500/5 transition-all group">
                                                    <div className="flex-shrink-0 w-12 text-center">
                                                        <p className="text-base font-black text-foreground leading-none">{d.getUTCDate()}</p>
                                                        <p className="text-[10px] text-muted">{DAY_NAMES[d.getUTCDay()]}</p>
                                                    </div>
                                                    <div className="relative w-9 h-12 rounded-lg overflow-hidden bg-surface-hover flex-shrink-0">
                                                        {r.imageUrl ? (
                                                            <Image src={r.imageUrl} alt={r.titlePt} fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center"><Film className="w-3.5 h-3.5 text-muted/40" /></div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-foreground truncate group-hover:text-accent transition-colors">{r.titlePt}</p>
                                                        <p className="text-[11px] text-muted">
                                                            {r.type === 'movie' ? 'Filme' : 'K-Drama'}{r.network && ` · ${r.network}`}
                                                        </p>
                                                    </div>
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0 ${badge.cls}`}>{badge.text}</span>
                                                    <ChevronRight className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                                </Link>
                                            )
                                        }
                                    })}
                                </div>
                            </section>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
