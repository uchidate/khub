'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Cake, CalendarDays, Film, Search, ShoppingBag, Sparkles, X, ChevronDown, ChevronUp } from 'lucide-react'
import { ResponsiveFilterBar } from '@/components/ui/ResponsiveFilterBar'
import { PageHeader } from '@/components/ui/PageHeader'
import { AffiliateNotice } from '@/components/ui/AffiliateNotice'
import { TrackedAffiliateLink } from '@/components/ui/TrackedAffiliateLink'

export interface StoreProductCard {
    id: string; name: string; price?: string | null; originalPrice?: string | null
    imageUrl: string; affiliateUrl: string; store: string | null; badge?: string
    rating?: number; soldCount?: string | null
}

export interface BirthdayEvent {
    artistId: string; artistSlug: string | null; nameRomanized: string
    nameHangul: string | null; primaryImageUrl: string | null
    date: string; age: number; daysUntil: number
}

export interface ProductionEvent {
    id: string; slug: string | null; titlePt: string; titleKr: string | null
    imageUrl: string | null; date: string; type: string | null
    network: string | null; daysUntil: number
}

type CalendarEvent = {
    date: string; daysUntil: number
    kind: 'birthday' | 'release'
    data: BirthdayEvent | ProductionEvent
}

interface Props {
    birthdays: BirthdayEvent[]
    releases: ProductionEvent[]
    recentReleases: ProductionEvent[]
    todayStr: string
    storeProducts?: StoreProductCard[]
}

const MONTH_NAMES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MONTH_NAMES_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
const DAY_NAMES = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const DAY_LETTERS = ['D','S','T','Q','Q','S','S']

function daysLabel(days: number) {
    if (days === 0) return { text: 'Hoje', cls: 'bg-accent text-white' }
    if (days === 1) return { text: 'Amanhã', cls: 'bg-accent/20 text-accent font-bold' }
    if (days <= 7) return { text: `${days}d`, cls: 'bg-surface-hover text-muted' }
    return { text: `${days}d`, cls: 'bg-surface-hover text-muted' }
}

function shortDate(date: string) {
    const d = new Date(date)
    return `${d.getUTCDate()} ${MONTH_NAMES_SHORT[d.getUTCMonth()]}`
}

function MiniCalendar({ year, month, birthdayDays, releaseDays, todayStr }: {
    year: number; month: number; birthdayDays: Set<number>; releaseDays: Set<number>; todayStr: string
}) {
    const todayDate = new Date(todayStr + 'T00:00:00Z')
    const isCurrentMonth = todayDate.getUTCFullYear() === year && todayDate.getUTCMonth() === month
    const todayDay = isCurrentMonth ? todayDate.getUTCDate() : -1
    const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay()
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
    const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
    while (cells.length % 7 !== 0) cells.push(null)

    return (
        <div className="rounded-xl border border-border bg-surface p-4">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-foreground">
                {MONTH_NAMES_FULL[month]} <span className="text-muted font-normal">{year}</span>
            </p>
            <div className="grid grid-cols-7 mb-1">
                {DAY_LETTERS.map((d, i) => (
                    <div key={i} className="text-center text-[9px] font-bold text-muted/40 py-0.5">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-px">
                {cells.map((day, i) => {
                    if (!day) return <div key={i} />
                    const hasBday = birthdayDays.has(day)
                    const hasRelease = releaseDays.has(day)
                    const isToday = day === todayDay
                    const isPast = isCurrentMonth && day < todayDay
                    return (
                        <div key={i} className={`relative flex min-h-[30px] flex-col items-center justify-center rounded-md py-1 ${isToday ? 'bg-accent text-white' : 'hover:bg-surface-hover'} ${isPast ? 'opacity-30' : ''}`}>
                            <span className={`text-[11px] font-bold leading-none ${isToday ? 'text-white' : 'text-foreground'}`}>{day}</span>
                            {(hasBday || hasRelease) && (
                                <div className="flex gap-px mt-0.5">
                                    {hasBday && <div className={`h-1 w-1 rounded-full ${isToday ? 'bg-white' : 'bg-pink-400'}`} />}
                                    {hasRelease && <div className={`h-1 w-1 rounded-full ${isToday ? 'bg-white/70' : 'bg-blue-400'}`} />}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
            <div className="mt-3 flex gap-4 border-t border-border pt-3">
                <span className="flex items-center gap-1.5 text-[10px] text-muted"><span className="w-2 h-2 rounded-full bg-pink-400 inline-block" /> Aniversário</span>
                <span className="flex items-center gap-1.5 text-[10px] text-muted"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Estreia</span>
            </div>
        </div>
    )
}

function EventCard({ event }: { event: CalendarEvent }) {
    if (event.kind === 'birthday') {
        const b = event.data as BirthdayEvent
        return (
            <Link href={`/artists/${b.artistSlug ?? b.artistId}`}
                className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-all hover:border-pink-400/40 hover:shadow-sm">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-surface-hover ring-2 ring-pink-400/20">
                    {b.primaryImageUrl
                        ? <Image src={b.primaryImageUrl} alt={b.nameRomanized} fill className="object-cover object-top" />
                        : <div className="flex h-full w-full items-center justify-center text-sm font-black text-muted">{b.nameRomanized[0]}</div>}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground group-hover:text-accent transition-colors">{b.nameRomanized}</p>
                    <p className="flex items-center gap-1.5 text-[11px] text-muted">
                        <Cake size={10} className="text-pink-400 shrink-0" />
                        {b.age} anos · {shortDate(b.date)}
                    </p>
                </div>
                <span className="shrink-0 rounded-full bg-pink-400/10 px-2 py-1 text-[10px] font-black text-pink-500">🎂</span>
            </Link>
        )
    }
    const r = event.data as ProductionEvent
    return (
        <Link href={`/productions/${r.slug ?? r.id}`}
            className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-all hover:border-blue-400/40 hover:shadow-sm">
            <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-surface-hover">
                {r.imageUrl
                    ? <Image src={r.imageUrl} alt={r.titlePt} fill className="object-cover" />
                    : <Film className="absolute inset-0 m-auto h-4 w-4 text-muted/30" />}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground group-hover:text-accent transition-colors">{r.titlePt}</p>
                <p className="flex items-center gap-1.5 text-[11px] text-muted">
                    <Film size={10} className="text-blue-400 shrink-0" />
                    {r.type === 'movie' ? 'Filme' : 'K-Drama'}{r.network && ` · ${r.network}`}
                </p>
                <p className="text-[10px] text-muted/70">{shortDate(r.date)}</p>
            </div>
            <span className="shrink-0 rounded-full bg-blue-400/10 px-2 py-1 text-[10px] font-black text-blue-500">▶</span>
        </Link>
    )
}

export function CalendarioClient({ birthdays, releases, recentReleases, todayStr, storeProducts = [] }: Props) {
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())

    const today = useMemo(() => new Date(todayStr + 'T00:00:00Z'), [todayStr])
    const todayBirthdays = birthdays.filter(b => b.daysUntil === 0)
    const todayReleases = releases.filter(r => r.daysUntil === 0)
    const hasToday = todayBirthdays.length > 0 || todayReleases.length > 0

    const filteredBirthdays = useMemo(() => {
        if (filter === 'releases') return []
        const q = search.toLowerCase()
        return birthdays.filter(b => !q || b.nameRomanized.toLowerCase().includes(q) || b.nameHangul?.toLowerCase().includes(q))
    }, [birthdays, filter, search])

    const filteredReleases = useMemo(() => {
        if (filter === 'birthdays') return []
        const q = search.toLowerCase()
        return releases.filter(r => !q || r.titlePt.toLowerCase().includes(q) || r.titleKr?.toLowerCase().includes(q))
    }, [releases, filter, search])

    const allEvents = useMemo(() => {
        const evs: CalendarEvent[] = [
            ...filteredBirthdays.map(b => ({ date: b.date, daysUntil: b.daysUntil, kind: 'birthday' as const, data: b })),
            ...filteredReleases.map(r => ({ date: r.date, daysUntil: r.daysUntil, kind: 'release' as const, data: r })),
        ]
        evs.sort((a, b) => a.daysUntil - b.daysUntil)
        const byMonth = new Map<string, CalendarEvent[]>()
        for (const ev of evs) {
            const d = new Date(ev.date)
            const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`
            if (!byMonth.has(key)) byMonth.set(key, [])
            byMonth.get(key)!.push(ev)
        }
        return byMonth
    }, [filteredBirthdays, filteredReleases])

    const calendarMonths = useMemo(() => {
        const months = [{ year: today.getUTCFullYear(), month: today.getUTCMonth() }]
        const next = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1))
        months.push({ year: next.getUTCFullYear(), month: next.getUTCMonth() })
        return months.map(({ year, month }) => {
            const bdDays = new Set<number>()
            const relDays = new Set<number>()
            for (const b of birthdays) { const d = new Date(b.date); if (d.getUTCFullYear() === year && d.getUTCMonth() === month) bdDays.add(d.getUTCDate()) }
            for (const r of releases) { const d = new Date(r.date); if (d.getUTCFullYear() === year && d.getUTCMonth() === month) relDays.add(d.getUTCDate()) }
            return { year, month, bdDays, relDays }
        })
    }, [birthdays, releases, today])

    const nextSevenDays = useMemo(() => [
        ...birthdays.filter(b => b.daysUntil >= 0 && b.daysUntil <= 7).map(b => ({ id: `b-${b.artistId}`, href: `/artists/${b.artistSlug ?? b.artistId}`, title: b.nameRomanized, subtitle: `${b.age} anos`, date: b.date, daysUntil: b.daysUntil, kind: 'birthday' as const, imageUrl: b.primaryImageUrl })),
        ...releases.filter(r => r.daysUntil >= 0 && r.daysUntil <= 7).map(r => ({ id: `r-${r.id}`, href: `/productions/${r.slug ?? r.id}`, title: r.titlePt, subtitle: r.type === 'movie' ? 'Filme' : 'K-Drama', date: r.date, daysUntil: r.daysUntil, kind: 'release' as const, imageUrl: r.imageUrl })),
    ].sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 10), [birthdays, releases])

    const thisMonthTotal = (birthdays.filter(b => { const d = new Date(b.date); return d.getUTCFullYear() === today.getUTCFullYear() && d.getUTCMonth() === today.getUTCMonth() }).length)
        + (releases.filter(r => { const d = new Date(r.date); return d.getUTCFullYear() === today.getUTCFullYear() && d.getUTCMonth() === today.getUTCMonth() }).length)
    const activeFilterLabel = filter === 'birthdays' ? 'Idols' : filter === 'releases' ? 'Estreias' : 'Tudo'

    const toggleMonth = (key: string) => setExpandedMonths(cur => { const n = new Set(cur); n.has(key) ? n.delete(key) : n.add(key); return n })

    return (
        <div>
            <ResponsiveFilterBar label="Calendário" value={search ? 'busca ativa' : activeFilterLabel}>
                <div className="space-y-3 lg:flex lg:w-full lg:items-center lg:gap-3 lg:space-y-0">
                    <div className="flex flex-wrap gap-1">
                        {[
                            { v: 'all', label: 'Tudo' },
                            { v: 'birthdays', label: '🎂 Idols' },
                            { v: 'releases', label: '▶ Estreias' },
                        ].map(({ v, label }) => (
                            <button key={v} onClick={() => setFilter(v)}
                                className={`h-7 rounded-full px-3 text-[12px] font-bold transition-colors ${filter === v ? 'bg-foreground text-background' : 'text-muted hover:text-foreground'}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full lg:ml-auto lg:w-[260px]">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                        <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
                            className="h-9 w-full rounded-md border border-border bg-background pl-8 pr-8 text-[13px] text-foreground placeholder:text-muted focus:border-foreground focus:outline-none lg:h-8 lg:bg-surface" />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </ResponsiveFilterBar>

            <PageHeader
                breadcrumbs={[{ label: 'Calendário' }]}
                eyebrow="Calendário Hallyu"
                title={`${MONTH_NAMES_FULL[today.getUTCMonth()]} ${today.getUTCFullYear()}`}
                subtitle={`${thisMonthTotal} eventos este mês · ${nextSevenDays.length} esta semana`}
                meta={`${birthdays.length + releases.length} total`}
            />

            <div className="border-b border-border bg-surface/70">
                <div className="page-wrap flex items-center gap-6 py-3">
                        <div className="text-center">
                            <p className="text-2xl font-black text-foreground">{thisMonthTotal}</p>
                            <p className="text-[10px] font-semibold text-muted">este mês</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-black text-foreground">{nextSevenDays.length}</p>
                            <p className="text-[10px] font-semibold text-muted">esta semana</p>
                        </div>
                        <div className="text-center hidden sm:block">
                            <p className="text-2xl font-black text-foreground">{birthdays.length + releases.length}</p>
                            <p className="text-[10px] font-semibold text-muted">total</p>
                        </div>
                </div>
            </div>

            <div className="page-wrap grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_300px]">

                {/* Coluna principal */}
                <div className="min-w-0 space-y-8">

                    {/* Hoje */}
                    {hasToday && (
                        <section>
                            <div className="mb-3 flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-accent" />
                                <h2 className="text-sm font-black uppercase tracking-[0.14em] text-accent">Hoje</h2>
                                <div className="flex-1 h-px bg-accent/20" />
                            </div>
                            <div className="grid gap-2.5 sm:grid-cols-2">
                                {[...todayBirthdays.map(b => ({ date: b.date, daysUntil: 0, kind: 'birthday' as const, data: b })),
                                  ...todayReleases.map(r => ({ date: r.date, daysUntil: 0, kind: 'release' as const, data: r }))
                                ].map((ev, i) => <EventCard key={i} event={ev} />)}
                            </div>
                        </section>
                    )}

                    {/* Próximos 7 dias */}
                    {nextSevenDays.length > 0 && (
                        <section>
                            <div className="mb-3 flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-muted" />
                                <h2 className="text-sm font-black uppercase tracking-[0.14em] text-foreground">Esta semana</h2>
                                <div className="flex-1 h-px bg-border" />
                                <span className="text-[10px] font-mono font-black text-muted">{nextSevenDays.length}</span>
                            </div>
                            {/* Timeline */}
                            <div className="relative pl-6">
                                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                                <div className="space-y-3">
                                    {nextSevenDays.map(ev => {
                                        const badge = daysLabel(ev.daysUntil)
                                        const isBday = ev.kind === 'birthday'
                                        return (
                                            <Link key={ev.id} href={ev.href}
                                                className="group relative flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-all hover:border-accent/40 hover:shadow-sm">
                                                <div className={`absolute -left-6 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 border-background ${isBday ? 'bg-pink-400' : 'bg-blue-400'}`} />
                                                {ev.imageUrl
                                                    ? <div className={`relative shrink-0 overflow-hidden bg-surface-hover ${isBday ? 'h-10 w-10 rounded-full' : 'h-12 w-9 rounded-lg'}`}>
                                                        <Image src={ev.imageUrl} alt={ev.title} fill className="object-cover object-top" />
                                                      </div>
                                                    : <div className={`flex shrink-0 items-center justify-center bg-surface-hover text-muted/40 ${isBday ? 'h-10 w-10 rounded-full' : 'h-12 w-9 rounded-lg'}`}>
                                                        {isBday ? <Cake size={14} /> : <Film size={14} />}
                                                      </div>
                                                }
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-bold text-foreground group-hover:text-accent transition-colors">{ev.title}</p>
                                                    <p className="text-[11px] text-muted">{shortDate(ev.date)} · {ev.subtitle}</p>
                                                </div>
                                                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${badge.cls}`}>{badge.text}</span>
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Lançamentos recentes */}
                    {recentReleases.length > 0 && (
                        <section>
                            <div className="mb-3 flex items-center gap-2">
                                <Film className="h-4 w-4 text-muted" />
                                <h2 className="text-sm font-black uppercase tracking-[0.14em] text-foreground">Lançamentos recentes</h2>
                                <div className="flex-1 h-px bg-border" />
                            </div>
                            <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 scrollbar-none">
                                {recentReleases.map(p => (
                                    <Link key={p.id} href={`/productions/${p.slug ?? p.id}`} className="group w-[100px] shrink-0">
                                        <div className="relative mb-2 aspect-[2/3] w-[100px] overflow-hidden rounded-xl border border-border bg-surface">
                                            {p.imageUrl
                                                ? <Image src={p.imageUrl} alt={p.titlePt} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                                                : <div className="flex h-full w-full items-center justify-center"><Film className="h-6 w-6 text-muted/30" /></div>}
                                        </div>
                                        <p className="line-clamp-2 text-[11px] font-bold leading-tight text-foreground group-hover:text-accent transition-colors">{p.titlePt}</p>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Timeline por mês */}
                    {allEvents.size === 0 ? (
                        <div className="rounded-xl border border-border bg-surface py-16 text-center text-muted">
                            <p className="font-semibold">Nenhum evento encontrado.</p>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {[...allEvents.entries()].map(([key, events]) => {
                                const [yearStr, monthStr] = key.split('-')
                                const year = Number(yearStr); const month = Number(monthStr)
                                const byDay = [...events.reduce<Map<string, CalendarEvent[]>>((acc, ev) => {
                                    const dk = ev.date.split('T')[0]
                                    if (!acc.has(dk)) acc.set(dk, [])
                                    acc.get(dk)!.push(ev)
                                    return acc
                                }, new Map()).entries()]
                                const isExpanded = expandedMonths.has(key)
                                const visible = isExpanded ? byDay : byDay.slice(0, 6)
                                const hidden = byDay.length - visible.length

                                return (
                                    <section key={key}>
                                        <div className="mb-4 flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-surface border border-border">
                                                <span className="text-[10px] font-black uppercase text-muted">{MONTH_NAMES_SHORT[month]}</span>
                                                <span className="text-lg font-black leading-none text-foreground">{year.toString().slice(2)}</span>
                                            </div>
                                            <div>
                                                <h2 className="text-base font-black text-foreground">{MONTH_NAMES_FULL[month]} {year}</h2>
                                                <p className="text-[11px] text-muted">{events.length} evento{events.length !== 1 ? 's' : ''}</p>
                                            </div>
                                            <div className="flex-1 h-px bg-border" />
                                        </div>

                                        <div className="space-y-4">
                                            {visible.map(([dayKey, dayEvents]) => {
                                                const d = new Date(`${dayKey}T00:00:00Z`)
                                                const badge = daysLabel(dayEvents[0].daysUntil)
                                                return (
                                                    <div key={dayKey}>
                                                        <div className="mb-2 flex items-center gap-2.5">
                                                            <div className={`flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-lg ${dayEvents[0].daysUntil === 0 ? 'bg-accent text-white' : 'bg-surface border border-border'}`}>
                                                                <span className={`text-sm font-black leading-none ${dayEvents[0].daysUntil === 0 ? 'text-white' : 'text-foreground'}`}>{d.getUTCDate()}</span>
                                                                <span className={`text-[8px] font-bold uppercase ${dayEvents[0].daysUntil === 0 ? 'text-white/70' : 'text-muted'}`}>{DAY_NAMES[d.getUTCDay()]}</span>
                                                            </div>
                                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${badge.cls}`}>{badge.text}</span>
                                                            <div className="flex-1 h-px bg-border/50" />
                                                            <span className="text-[10px] text-muted">{dayEvents.length} evento{dayEvents.length !== 1 ? 's' : ''}</span>
                                                        </div>
                                                        <div className="grid gap-2 sm:grid-cols-2 pl-10">
                                                            {dayEvents.map((ev, idx) => <EventCard key={idx} event={ev} />)}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        {hidden > 0 && (
                                            <button onClick={() => toggleMonth(key)}
                                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-black text-muted transition-colors hover:border-accent/40 hover:text-accent">
                                                {isExpanded ? <><ChevronUp size={14} /> Mostrar menos</> : <><ChevronDown size={14} /> Ver mais {hidden} dia{hidden !== 1 ? 's' : ''}</>}
                                            </button>
                                        )}
                                    </section>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <aside className="space-y-6 lg:sticky lg:self-start" style={{ top: 'calc(var(--site-sticky-top, 92px) + 3.5rem + 1rem)' }}>

                    {/* Resumo */}
                    <div className="rounded-xl border border-border bg-surface p-4">
                        <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-muted">Resumo</p>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { n: filteredBirthdays.length + filteredReleases.length, label: 'total' },
                                { n: filteredBirthdays.length, label: 'idols' },
                                { n: filteredReleases.length, label: 'estreias' },
                            ].map(({ n, label }) => (
                                <div key={label} className="rounded-lg bg-background p-3 text-center">
                                    <p className="text-xl font-black text-foreground">{n}</p>
                                    <p className="text-[10px] font-semibold text-muted">{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mini calendários */}
                    <div className="space-y-3">
                        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-muted">
                            <CalendarDays className="h-3.5 w-3.5 text-accent" /> Visão mensal
                        </p>
                        {calendarMonths.map(({ year, month, bdDays, relDays }) => (
                            <MiniCalendar key={`${year}-${month}`} year={year} month={month}
                                birthdayDays={bdDays} releaseDays={relDays} todayStr={todayStr} />
                        ))}
                    </div>

                    {/* Loja */}
                    {storeProducts.length > 0 && (
                        <div className="overflow-hidden rounded-xl border border-border bg-surface">
                            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                                <div className="flex min-w-0 items-center gap-2">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white">
                                        <ShoppingBag className="h-3.5 w-3.5" />
                                    </span>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-accent">Vitrine</p>
                                        <p className="text-xs font-bold text-foreground">Achados para fãs</p>
                                    </div>
                                </div>
                                <Link href="/loja" className="flex shrink-0 items-center gap-1 text-xs font-black text-muted hover:text-accent transition-colors">
                                    Ver <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                            <AffiliateNotice compact className="border-x-0 border-t-0" />
                            <div className="grid grid-cols-2 gap-3 p-3">
                                {storeProducts.slice(0, 4).map(p => (
                                    <TrackedAffiliateLink key={p.id} productId={p.id} href={p.affiliateUrl} placement="calendar_store" className="group">
                                        <div className="relative mb-1.5 aspect-square overflow-hidden rounded-lg border border-border bg-background transition-colors group-hover:border-accent/40">
                                            <Image src={p.imageUrl} alt={p.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" unoptimized />
                                            {p.badge && <span className="absolute left-1.5 top-1.5 rounded bg-accent px-1.5 py-0.5 text-[8px] font-mono font-black text-white">{p.badge}</span>}
                                        </div>
                                        <p className="line-clamp-2 text-[10px] font-semibold leading-tight text-foreground">{p.name}</p>
                                        {p.price && <p className="mt-0.5 text-[11px] font-black text-foreground">{p.price}</p>}
                                    </TrackedAffiliateLink>
                                ))}
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    )
}
