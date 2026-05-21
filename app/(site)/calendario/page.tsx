import type { Metadata } from 'next'
import { Cake, Film, Sparkles } from 'lucide-react'
import prisma from '@/lib/prisma'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { CalendarioClient, type BirthdayEvent, type ProductionEvent } from './CalendarioClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Calendário K-Pop e K-Drama | HallyuHub',
    description: 'Aniversários de ídolos K-Pop e lançamentos de K-Drama e filmes coreanos. Não perca nenhuma data importante do universo Hallyu.',
    openGraph: {
        title: 'Calendário K-Pop e K-Drama',
        description: 'Aniversários de ídolos K-Pop e lançamentos de K-Drama e filmes coreanos.',
    },
}

function daysBetween(from: Date, to: Date) {
    return Math.round((to.getTime() - from.getTime()) / 86400000)
}

function nextBirthday(birthDate: Date, today: Date): Date | null {
    const m = birthDate.getUTCMonth()
    const d = birthDate.getUTCDate()
    const y = today.getUTCFullYear()
    const windowEnd = new Date(Date.UTC(y, today.getUTCMonth(), today.getUTCDate() + 90))
    const thisYear = new Date(Date.UTC(y, m, d))
    if (thisYear >= today && thisYear <= windowEnd) return thisYear
    const nextYear = new Date(Date.UTC(y + 1, m, d))
    return nextYear <= windowEnd ? nextYear : null
}

export default async function CalendarioPage() {
    const now = new Date()
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const windowEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 90))
    const past14 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 14))
    const todayStr = today.toISOString().split('T')[0]

    const [artists, upcomingProductions, recentProductions, storePool] = await Promise.all([
        prisma.artist.findMany({
            where: { isHidden: false, flaggedAsNonKorean: false, birthDate: { not: null } },
            select: { id: true, slug: true, nameRomanized: true, nameHangul: true, primaryImageUrl: true, birthDate: true },
            take: 500,
            orderBy: { trendingScore: 'desc' },
        }),
        prisma.production.findMany({
            where: { isHidden: false, releaseDate: { gte: today, lte: windowEnd } },
            select: { id: true, slug: true, titlePt: true, titleKr: true, imageUrl: true, releaseDate: true, type: true, network: true },
            orderBy: { releaseDate: 'asc' },
            take: 30,
        }),
        prisma.production.findMany({
            where: { isHidden: false, releaseDate: { gte: past14, lt: today } },
            select: { id: true, slug: true, titlePt: true, titleKr: true, imageUrl: true, releaseDate: true, type: true, network: true },
            orderBy: { releaseDate: 'desc' },
            take: 12,
        }),
        prisma.storeProduct.findMany({
            where: { isActive: true },
            orderBy: [{ featured: 'desc' }, { position: 'asc' }],
            take: 8,
            select: { id: true, name: true, price: true, originalPrice: true, imageUrl: true, affiliateUrl: true, store: true, badge: true, rating: true, soldCount: true },
        }).catch(() => []),
    ])

    const birthdays: BirthdayEvent[] = artists.flatMap(a => {
        if (!a.birthDate) return []
        const nextBd = nextBirthday(a.birthDate, today)
        if (!nextBd) return []
        const age = nextBd.getUTCFullYear() - a.birthDate.getUTCFullYear()
        return [{
            artistId: a.id,
            artistSlug: a.slug,
            nameRomanized: a.nameRomanized,
            nameHangul: a.nameHangul,
            primaryImageUrl: a.primaryImageUrl,
            date: nextBd.toISOString(),
            age,
            daysUntil: daysBetween(today, nextBd),
        }]
    }).sort((a, b) => a.daysUntil - b.daysUntil)

    const releases: ProductionEvent[] = upcomingProductions
        .filter(p => p.releaseDate)
        .map(p => ({
            id: p.id,
            slug: p.slug,
            titlePt: p.titlePt,
            titleKr: p.titleKr,
            imageUrl: p.imageUrl,
            date: p.releaseDate!.toISOString(),
            type: p.type,
            network: p.network,
            daysUntil: daysBetween(today, p.releaseDate!),
        }))

    const recentReleases: ProductionEvent[] = recentProductions
        .filter(p => p.releaseDate)
        .map(p => ({
            id: p.id,
            slug: p.slug,
            titlePt: p.titlePt,
            titleKr: p.titleKr,
            imageUrl: p.imageUrl,
            date: p.releaseDate!.toISOString(),
            type: p.type,
            network: p.network,
            daysUntil: daysBetween(today, p.releaseDate!),
        }))
    const todayBirthdays = birthdays.filter(b => b.daysUntil === 0)
    const todayReleases = releases.filter(r => r.daysUntil === 0)

    return (
        <main className="min-h-screen bg-background pb-16">
            <section className="border-b border-border bg-[linear-gradient(135deg,var(--color-bg)_0%,var(--color-surface-editorial)_48%,var(--color-surface-media)_100%)]">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-12 lg:py-12">
                    <div className="max-w-3xl">
                        <Breadcrumbs items={[{ label: 'agenda' }, { label: 'calendário' }]} className="mb-1" />
                        <h1 className="text-4xl font-black leading-[0.96] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                            Datas importantes sem perder o timing.
                        </h1>
                        <p className="mt-5 max-w-2xl text-sm leading-6 text-foreground-subtle sm:text-base">
                            Aniversários de ídolos, estreias de K-dramas e filmes coreanos organizados para os próximos 90 dias.
                        </p>
                    </div>

                    <div className="mt-7 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-3xl border border-border bg-background/70 p-4">
                            <Cake className="mb-3 h-4 w-4 text-accent" />
                            <p className="text-3xl font-black text-foreground">{birthdays.length}</p>
                            <p className="mt-1 text-xs font-semibold text-muted">aniversários próximos</p>
                        </div>
                        <div className="rounded-3xl border border-border bg-background/70 p-4">
                            <Film className="mb-3 h-4 w-4 text-accent" />
                            <p className="text-3xl font-black text-foreground">{releases.length}</p>
                            <p className="mt-1 text-xs font-semibold text-muted">estreias futuras</p>
                        </div>
                        <div className="rounded-3xl border border-border bg-background/70 p-4">
                            <Sparkles className="mb-3 h-4 w-4 text-accent" />
                            <p className="text-3xl font-black text-foreground">{todayBirthdays.length + todayReleases.length}</p>
                            <p className="mt-1 text-xs font-semibold text-muted">eventos hoje</p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-12">
                <CalendarioClient
                    birthdays={birthdays}
                    releases={releases}
                    recentReleases={recentReleases}
                    todayStr={todayStr}
                    storeProducts={storePool.map(p => ({
                        ...p,
                        rating: p.rating ?? undefined,
                        originalPrice: p.originalPrice ?? undefined,
                        badge: p.badge ?? undefined,
                        soldCount: p.soldCount ?? undefined,
                    }))}
                />

            </div>
        </main>
    )
}
