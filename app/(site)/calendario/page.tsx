import type { Metadata } from 'next'
import { Calendar } from 'lucide-react'
import prisma from '@/lib/prisma'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { AdBanner } from '@/components/ui/AdBanner'
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
    const thisYear = new Date(Date.UTC(y, m, d))
    if (thisYear >= today) return thisYear
    const nextYear = new Date(Date.UTC(y + 1, m, d))
    const windowEnd = new Date(Date.UTC(y, today.getUTCMonth(), today.getUTCDate() + 90))
    return nextYear <= windowEnd ? nextYear : null
}

export default async function CalendarioPage() {
    const now = new Date()
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const windowEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 90))
    const past14 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 14))
    const todayStr = today.toISOString().split('T')[0]

    const [artists, upcomingProductions, recentProductions] = await Promise.all([
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

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
                <Breadcrumbs items={[{ label: 'Calendário' }]} className="mb-6" />

                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-accent" />
                        </div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">Calendário Hallyu</h1>
                    </div>
                    <p className="text-muted text-sm max-w-xl">
                        Aniversários de ídolos e estreias de K-Dramas nos próximos 90 dias.
                    </p>
                </div>

                <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER!} variant="auto" className="mb-6" />

                <CalendarioClient
                    birthdays={birthdays}
                    releases={releases}
                    recentReleases={recentReleases}
                    todayStr={todayStr}
                />

                <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_MULTIPLEX!} variant="multiplex" className="mt-8" />
            </div>
        </div>
    )
}
