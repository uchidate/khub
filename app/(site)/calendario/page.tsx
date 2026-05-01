import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import prisma from '@/lib/prisma'
import { Calendar, Cake, Film, Star, ChevronRight } from 'lucide-react'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'

export const revalidate = 3600

export const metadata: Metadata = {
    title: 'Calendário K-Pop e K-Drama | HallyuHub',
    description: 'Aniversários de ídolos K-Pop e lançamentos de K-Drama e filmes coreanos. Não perca nenhuma data importante do universo Hallyu.',
    openGraph: {
        title: 'Calendário K-Pop e K-Drama',
        description: 'Aniversários de ídolos K-Pop e lançamentos de K-Drama e filmes coreanos.',
    },
}

function getDayMonth(date: Date) {
    return { day: date.getUTCDate(), month: date.getUTCMonth() + 1 }
}

function isBirthdayInWindow(birthDate: Date, windowStart: Date, windowEnd: Date): { date: Date } | null {
    // Check if birthday (any year) falls in the window [windowStart, windowEnd]
    const year = windowStart.getUTCFullYear()
    const { day, month } = getDayMonth(birthDate)

    for (const y of [year, year + 1]) {
        const candidate = new Date(Date.UTC(y, month - 1, day))
        if (candidate >= windowStart && candidate <= windowEnd) {
            return { date: candidate }
        }
    }
    return null
}

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default async function CalendarioPage() {
    const now = new Date()
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const windowEnd = new Date(today)
    windowEnd.setUTCDate(windowEnd.getUTCDate() + 60) // next 60 days

    // Past 7 days for "recently released"
    const past7 = new Date(today)
    past7.setUTCDate(past7.getUTCDate() - 7)

    const [artists, upcomingProductions, recentProductions] = await Promise.all([
        prisma.artist.findMany({
            where: { isHidden: false, flaggedAsNonKorean: false, birthDate: { not: null } },
            select: { id: true, slug: true, nameRomanized: true, nameHangul: true, profileImageUrl: true, primaryImageUrl: true, birthDate: true },
        }),
        prisma.production.findMany({
            where: {
                isHidden: false,
                releaseDate: { gte: today, lte: windowEnd },
            },
            select: { id: true, slug: true, titlePt: true, titleKr: true, imageUrl: true, releaseDate: true, type: true, network: true },
            orderBy: { releaseDate: 'asc' },
            take: 20,
        }),
        prisma.production.findMany({
            where: {
                isHidden: false,
                releaseDate: { gte: past7, lt: today },
            },
            select: { id: true, slug: true, titlePt: true, titleKr: true, imageUrl: true, releaseDate: true, type: true, network: true },
            orderBy: { releaseDate: 'desc' },
            take: 10,
        }),
    ])

    // Map birthdays to upcoming dates
    const birthdayEvents = artists
        .flatMap(artist => {
            const bd = artist.birthDate!
            const match = isBirthdayInWindow(bd, today, windowEnd)
            if (!match) return []
            const age = today.getUTCFullYear() - bd.getUTCFullYear()
            return [{ artist, date: match.date, age }]
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime())

    // Group birthdays by month
    const birthdaysByMonth = birthdayEvents.reduce<Record<number, typeof birthdayEvents>>((acc, ev) => {
        const m = ev.date.getUTCMonth()
        if (!acc[m]) acc[m] = []
        acc[m].push(ev)
        return acc
    }, {})

    const upcomingByMonth = upcomingProductions.reduce<Record<number, typeof upcomingProductions>>((acc, p) => {
        const m = p.releaseDate!.getUTCMonth()
        if (!acc[m]) acc[m] = []
        acc[m].push(p)
        return acc
    }, {})

    // Merge months
    const allMonths = [...new Set([
        ...Object.keys(birthdaysByMonth).map(Number),
        ...Object.keys(upcomingByMonth).map(Number),
    ])].sort((a, b) => {
        // Sort relative to current month
        const curr = today.getUTCMonth()
        const normA = (a - curr + 12) % 12
        const normB = (b - curr + 12) % 12
        return normA - normB
    })

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
                <Breadcrumbs items={[{ label: 'Calendário' }]} className="mb-6" />

                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-accent" />
                        </div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">Calendário Hallyu</h1>
                    </div>
                    <p className="text-muted text-sm max-w-xl">
                        Aniversários de ídolos e lançamentos de K-Dramas e filmes coreanos nos próximos 60 dias.
                    </p>
                </div>

                {/* Recently Released */}
                {recentProductions.length > 0 && (
                    <section className="mb-12">
                        <h2 className="text-xs font-black text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Star className="w-3.5 h-3.5 text-accent" />
                            Lançamentos recentes (últimos 7 dias)
                        </h2>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {recentProductions.map(p => (
                                <Link
                                    key={p.id}
                                    href={`/productions/${p.slug ?? p.id}`}
                                    className="flex-shrink-0 w-28 group"
                                >
                                    <div className="relative w-28 h-40 rounded-xl overflow-hidden bg-surface border border-border mb-2">
                                        {p.imageUrl ? (
                                            <Image src={p.imageUrl} alt={p.titlePt} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Film className="w-8 h-8 text-muted/30" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        <div className="absolute bottom-2 left-2">
                                            <span className="text-[9px] font-bold uppercase text-accent bg-accent/10 border border-accent/20 rounded px-1.5 py-0.5">
                                                {p.type === 'movie' ? 'Filme' : 'Drama'}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] font-bold text-foreground leading-tight line-clamp-2 group-hover:text-accent transition-colors">{p.titlePt}</p>
                                    {p.releaseDate && (
                                        <p className="text-[10px] text-muted mt-0.5">
                                            {p.releaseDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })}
                                        </p>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Month sections */}
                {allMonths.length === 0 ? (
                    <div className="text-center py-16 text-muted">
                        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="font-semibold">Nenhum evento nos próximos 60 dias.</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {allMonths.map(month => {
                            const year = month < today.getUTCMonth() ? today.getUTCFullYear() + 1 : today.getUTCFullYear()
                            const birthdays = birthdaysByMonth[month] ?? []
                            const productions = upcomingByMonth[month] ?? []

                            return (
                                <section key={month}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <h2 className="text-xl font-black text-foreground">
                                            {MONTH_NAMES[month]} <span className="text-muted font-normal text-sm">{year}</span>
                                        </h2>
                                        <div className="flex-1 h-px bg-border" />
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* Birthdays */}
                                        {birthdays.length > 0 && (
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-widest text-muted mb-3 flex items-center gap-1.5">
                                                    <Cake className="w-3.5 h-3.5 text-pink-400" />
                                                    Aniversários
                                                </p>
                                                <div className="space-y-2">
                                                    {birthdays.map(({ artist, date, age }) => {
                                                        const isToday = date.getTime() === today.getTime()
                                                        const dayName = DAY_NAMES[date.getUTCDay()]
                                                        return (
                                                            <Link
                                                                key={artist.id}
                                                                href={`/artists/${artist.slug ?? artist.id}`}
                                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all group hover:border-accent/30 hover:bg-accent/5 ${isToday ? 'border-pink-500/30 bg-pink-500/5' : 'border-border bg-surface'}`}
                                                            >
                                                                <div className="flex-shrink-0 w-10 text-center">
                                                                    <p className="text-lg font-black text-foreground leading-none">{date.getUTCDate()}</p>
                                                                    <p className="text-[10px] text-muted">{dayName}</p>
                                                                </div>
                                                                <div className="relative w-9 h-9 rounded-full overflow-hidden bg-surface-hover flex-shrink-0">
                                                                    {(artist.primaryImageUrl ?? artist.profileImageUrl) ? (
                                                                        <Image
                                                                            src={artist.primaryImageUrl ?? artist.profileImageUrl!}
                                                                            alt={artist.nameRomanized}
                                                                            fill className="object-cover object-top"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-muted text-xs font-bold">
                                                                            {artist.nameRomanized[0]}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-bold text-foreground truncate group-hover:text-accent transition-colors">
                                                                        {artist.nameRomanized}
                                                                        {isToday && <span className="ml-2 text-[10px] font-black text-pink-400 uppercase">Hoje! 🎂</span>}
                                                                    </p>
                                                                    {artist.nameHangul && (
                                                                        <p className="text-[11px] text-muted">{artist.nameHangul} · {age} anos</p>
                                                                    )}
                                                                </div>
                                                                <ChevronRight className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                                            </Link>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Productions */}
                                        {productions.length > 0 && (
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-widest text-muted mb-3 flex items-center gap-1.5">
                                                    <Film className="w-3.5 h-3.5 text-blue-400" />
                                                    Lançamentos
                                                </p>
                                                <div className="space-y-2">
                                                    {productions.map(p => {
                                                        const date = p.releaseDate!
                                                        const isToday = date.getTime() === today.getTime()
                                                        const dayName = DAY_NAMES[date.getUTCDay()]
                                                        return (
                                                            <Link
                                                                key={p.id}
                                                                href={`/productions/${p.slug ?? p.id}`}
                                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all group hover:border-accent/30 hover:bg-accent/5 ${isToday ? 'border-blue-500/30 bg-blue-500/5' : 'border-border bg-surface'}`}
                                                            >
                                                                <div className="flex-shrink-0 w-10 text-center">
                                                                    <p className="text-lg font-black text-foreground leading-none">{date.getUTCDate()}</p>
                                                                    <p className="text-[10px] text-muted">{dayName}</p>
                                                                </div>
                                                                <div className="relative w-9 h-12 rounded-lg overflow-hidden bg-surface-hover flex-shrink-0">
                                                                    {p.imageUrl ? (
                                                                        <Image src={p.imageUrl} alt={p.titlePt} fill className="object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center">
                                                                            <Film className="w-4 h-4 text-muted/40" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-bold text-foreground truncate group-hover:text-accent transition-colors">
                                                                        {p.titlePt}
                                                                        {isToday && <span className="ml-2 text-[10px] font-black text-blue-400 uppercase">Hoje!</span>}
                                                                    </p>
                                                                    <p className="text-[11px] text-muted">
                                                                        {p.type === 'movie' ? 'Filme' : 'K-Drama'}
                                                                        {p.network && ` · ${p.network}`}
                                                                    </p>
                                                                </div>
                                                                <ChevronRight className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                                            </Link>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
