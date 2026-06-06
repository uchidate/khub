import type { Metadata } from 'next'
import { getCalendarioData } from '@/lib/repositories/CalendarioRepository'
import { CalendarioClient, type BirthdayEvent, type ProductionEvent } from './CalendarioClient'
import { JsonLd } from '@/components/seo/JsonLd'
import { SITE_URL } from '@/lib/constants/site'

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

    const { artists, upcomingProductions, recentProductions, storePool } = await getCalendarioData(today, windowEnd, past14)

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
    const _todayBirthdays = birthdays.filter(b => b.daysUntil === 0)
    const _todayReleases = releases.filter(r => r.daysUntil === 0)

    // Build Event JSON-LD for upcoming production releases (next 90 days)
    const eventSchema = releases.length > 0 ? {
        '@context': 'https://schema.org',
        '@graph': releases.slice(0, 30).map(r => ({
            '@type': 'Event',
            name: r.titlePt,
            startDate: r.date.split('T')[0],
            eventStatus: 'https://schema.org/EventScheduled',
            eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
            location: { '@type': 'VirtualLocation', url: r.slug ? `${SITE_URL}/productions/${r.slug}` : `${SITE_URL}/calendario` },
            url: r.slug ? `${SITE_URL}/productions/${r.slug}` : `${SITE_URL}/calendario`,
            organizer: { '@type': 'Organization', name: r.network ?? 'K-Drama', url: SITE_URL },
            description: `Lançamento de ${r.titlePt}${r.network ? ` na ${r.network}` : ''}.`,
        })),
    } : null

    return (
        <main className="min-h-screen bg-background pb-16">
            {eventSchema && <JsonLd data={eventSchema} />}
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
        </main>
    )
}
