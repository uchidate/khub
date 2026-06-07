import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/seo/JsonLd'
import { PageHeader } from '@/components/ui/PageHeader'
import prisma from '@/lib/prisma'
import { SITE_URL } from '@/lib/constants/site'
import { nameToGradient } from '@/lib/utils'

export const revalidate = 86400

const BASE_URL = SITE_URL

const MONTHS = [
    { num: 1,  slug: 'janeiro',   name: 'Janeiro' },
    { num: 2,  slug: 'fevereiro', name: 'Fevereiro' },
    { num: 3,  slug: 'marco',     name: 'Março' },
    { num: 4,  slug: 'abril',     name: 'Abril' },
    { num: 5,  slug: 'maio',      name: 'Maio' },
    { num: 6,  slug: 'junho',     name: 'Junho' },
    { num: 7,  slug: 'julho',     name: 'Julho' },
    { num: 8,  slug: 'agosto',    name: 'Agosto' },
    { num: 9,  slug: 'setembro',  name: 'Setembro' },
    { num: 10, slug: 'outubro',   name: 'Outubro' },
    { num: 11, slug: 'novembro',  name: 'Novembro' },
    { num: 12, slug: 'dezembro',  name: 'Dezembro' },
]

export async function generateStaticParams() {
    return MONTHS.map(m => ({ mes: m.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ mes: string }> }): Promise<Metadata> {
    const { mes } = await params
    const month = MONTHS.find(m => m.slug === mes)
    if (!month) return {}
    const canonical = `${BASE_URL}/artists/birthdays/${mes}`
    const title = `Aniversários de idols e artistas coreanos em ${month.name}`
    const description = `Descubra quais idols de K-Pop e artistas coreanos fazem aniversário em ${month.name}. Lista completa com perfis, grupos e curiosidades em português.`
    return {
        title,
        description,
        keywords: [`aniversário kpop ${month.name.toLowerCase()}`, `idols aniversário ${month.name.toLowerCase()}`, `artistas coreanos ${month.name.toLowerCase()}`, 'kpop birthday', `kpop idol birthday ${month.name.toLowerCase()}`],
        alternates: { canonical },
        openGraph: {
            title: `${title} | HallyuHub`,
            description,
            url: canonical,
        },
    }
}

export default async function BirthdayMonthPage({ params }: { params: Promise<{ mes: string }> }) {
    const { mes } = await params
    const month = MONTHS.find(m => m.slug === mes)
    if (!month) notFound()

    if (process.env.SKIP_BUILD_STATIC_GENERATION) {
        return <main className="min-h-screen" />
    }

    const artists = await prisma.artist.findMany({
        where: {
            isHidden: false,
            flaggedAsNonKorean: false,
            birthDate: { not: null },
        },
        select: {
            id: true,
            slug: true,
            nameRomanized: true,
            nameHangul: true,
            primaryImageUrl: true,
            birthDate: true,
            roles: true,
            memberships: {
                where: { isActive: true },
                select: { group: { select: { name: true, slug: true } } },
                take: 1,
            },
        },
        orderBy: [{ trendingScore: 'desc' }],
    })

    const filtered = artists
        .filter(a => a.birthDate && new Date(a.birthDate).getUTCMonth() + 1 === month.num)
        .sort((a, b) => {
            const da = new Date(a.birthDate!).getUTCDate()
            const db = new Date(b.birthDate!).getUTCDate()
            return da - db
        })

    const grouped: Record<number, typeof filtered> = {}
    for (const artist of filtered) {
        const day = new Date(artist.birthDate!).getUTCDate()
        if (!grouped[day]) grouped[day] = []
        grouped[day].push(artist)
    }
    const days = Object.keys(grouped).map(Number).sort((a, b) => a - b)

    const currentDay = new Date().getUTCDate()
    const currentMonth = new Date().getUTCMonth() + 1
    const todayBirthdays = currentMonth === month.num ? (grouped[currentDay] ?? []) : []

    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: `Quais idols de K-Pop fazem aniversário em ${month.name}?`,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: `Em ${month.name} fazem aniversário ${filtered.length} artistas e idols coreanos cadastrados no HallyuHub, incluindo integrantes de grupos como ${filtered.slice(0, 3).map(a => a.memberships[0]?.group.name ?? a.nameRomanized).join(', ')} e muitos outros.`,
                },
            },
            {
                '@type': 'Question',
                name: 'Como encontrar o aniversário de um idol coreano?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'No HallyuHub, cada perfil de artista exibe a data de nascimento, idade e signo. Você também pode navegar pelos hubs de aniversários mensais para descobrir todos os idols que fazem aniversário em um determinado mês.',
                },
            },
        ],
    }

    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Artistas', item: `${BASE_URL}/artists` },
            { '@type': 'ListItem', position: 2, name: 'Aniversários', item: `${BASE_URL}/artists/birthdays/janeiro` },
            { '@type': 'ListItem', position: 3, name: month.name, item: `${BASE_URL}/artists/birthdays/${mes}` },
        ],
    }

    return (
        <main className="min-h-screen">
            <JsonLd data={faqSchema} />
            <JsonLd data={breadcrumbSchema} />

            <PageHeader
                title={`Aniversários em ${month.name}`}
                subtitle={`${filtered.length} artista${filtered.length !== 1 ? 's' : ''} coreano${filtered.length !== 1 ? 's' : ''} ${filtered.length !== 1 ? 'fazem' : 'faz'} aniversário neste mês`}
            />

            {/* Navegação por mês */}
            <div className="border-b border-border sticky top-0 z-10 bg-background/95 backdrop-blur">
                <div className="max-w-7xl mx-auto px-4 py-2 flex gap-1 overflow-x-auto no-scrollbar">
                    {MONTHS.map(m => (
                        <Link
                            key={m.slug}
                            href={`/artists/birthdays/${m.slug}`}
                            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-colors rounded ${
                                m.slug === mes
                                    ? 'bg-accent text-white'
                                    : 'text-muted hover:text-foreground hover:bg-surface'
                            }`}
                        >
                            {m.name.slice(0, 3)}
                        </Link>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
                {/* Hoje — destaque se estiver no mês atual */}
                {todayBirthdays.length > 0 && (
                    <section>
                        <h2 className="text-sm font-black uppercase tracking-widest text-accent mb-4">
                            Aniversário hoje — dia {currentDay}
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {todayBirthdays.map(artist => (
                                <ArtistBirthdayCard key={artist.id} artist={artist} highlight />
                            ))}
                        </div>
                    </section>
                )}

                {/* Agrupado por dia */}
                {days.map(day => {
                    if (todayBirthdays.length > 0 && currentMonth === month.num && day === currentDay) return null
                    const list = grouped[day]
                    return (
                        <section key={day}>
                            <h2 className="text-xs font-black uppercase tracking-widest text-muted mb-3 border-b border-border pb-2">
                                Dia {day} de {month.name}
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {list.map(artist => (
                                    <ArtistBirthdayCard key={artist.id} artist={artist} />
                                ))}
                            </div>
                        </section>
                    )
                })}

                {filtered.length === 0 && (
                    <p className="text-muted text-sm">Nenhum artista com aniversário neste mês cadastrado ainda.</p>
                )}

                {/* FAQ */}
                <section className="border border-border rounded p-6 space-y-4 bg-surface">
                    <h2 className="font-bold text-foreground">Perguntas frequentes</h2>
                    <div className="space-y-3">
                        <div>
                            <p className="font-semibold text-sm text-foreground">Quais idols fazem aniversário em {month.name}?</p>
                            <p className="text-sm text-muted mt-1">Em {month.name} fazem aniversário {filtered.length} artistas cadastrados no HallyuHub. A lista inclui integrantes de grupos e artistas solo do K-Pop e K-Drama.</p>
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-foreground">Como ver o perfil completo de um idol?</p>
                            <p className="text-sm text-muted mt-1">Clique no card do artista para acessar o perfil completo com curiosidades, carreira, discografia, grupos e redes sociais em português.</p>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    )
}

function ArtistBirthdayCard({
    artist,
    highlight = false,
}: {
    artist: {
        id: string
        slug: string | null
        nameRomanized: string
        nameHangul: string | null
        primaryImageUrl: string | null
        birthDate: Date | null
        memberships: { group: { name: string; slug: string | null } }[]
    }
    highlight?: boolean
}) {
    const group = artist.memberships[0]?.group
    const age = artist.birthDate
        ? Math.floor((Date.now() - new Date(artist.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000))
        : null

    return (
        <Link href={`/artists/${artist.slug ?? artist.id}`} className="group block">
            <div className={`relative aspect-[3/4] overflow-hidden mb-2 ${highlight ? 'ring-2 ring-accent' : ''}`}>
                {artist.primaryImageUrl ? (
                    <Image
                        src={artist.primaryImageUrl}
                        alt={artist.nameRomanized}
                        fill
                        sizes="(max-width: 640px) 50vw, 16vw"
                        className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: nameToGradient(artist.nameRomanized) }}>
                        <span className="text-3xl font-black text-white/80">{artist.nameRomanized[0]}</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                {highlight && (
                    <div className="absolute top-2 right-2 bg-accent text-white text-[9px] font-black px-1.5 py-0.5 uppercase tracking-wider">
                        Hoje
                    </div>
                )}
                {age && (
                    <div className="absolute bottom-2 left-2 text-white text-[10px] font-bold">
                        {age} anos
                    </div>
                )}
            </div>
            <p className="text-xs font-bold text-foreground leading-tight group-hover:text-accent transition-colors">
                {artist.nameRomanized}
            </p>
            {group && (
                <p className="text-[10px] text-muted mt-0.5">{group.name}</p>
            )}
        </Link>
    )
}
