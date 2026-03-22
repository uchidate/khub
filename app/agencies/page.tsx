import { Suspense } from 'react'
import prisma from "@/lib/prisma"
import { PHASE_PRODUCTION_BUILD } from 'next/constants'
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { PageTransition } from "@/components/features/PageTransition"
import { ScrollToTop } from "@/components/ui/ScrollToTop"

export const revalidate = 3600

export const metadata: Metadata = {
    title: 'Agências K-pop',
    description: 'Os arquitetos do sucesso. Conheça as principais empresas de entretenimento coreano: HYBE, SM, JYP, YG e mais.',
    keywords: 'agências k-pop, HYBE, SM Entertainment, JYP Entertainment, YG Entertainment, empresas k-pop, entretenimento coreano',
    alternates: { canonical: 'https://www.hallyuhub.com.br/agencies' },
    openGraph: {
        title: 'Agências K-pop | HallyuHub',
        description: 'Os arquitetos do sucesso. Conheça as principais empresas de entretenimento coreano: HYBE, SM, JYP, YG e mais.',
        url: 'https://www.hallyuhub.com.br/agencies',
        type: 'website',
    },
}

function AgencySkeleton() {
    return (
        <div className="p-10 bg-surface rounded-3xl border border-border relative overflow-hidden animate-pulse">
            <div className="h-8 w-3/4 bg-[#e8e8e8] rounded mb-2" />
            <div className="h-4 w-1/2 bg-[#e8e8e8] rounded mb-8" />

            <div className="mb-8">
                <div className="flex -space-x-3 mb-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-10 h-10 rounded-full bg-[#e8e8e8] border-2 border-white flex-shrink-0" />
                    ))}
                </div>
                <div className="h-4 w-full bg-[#e8e8e8] rounded" />
            </div>

            <div className="h-4 w-1/3 bg-[#e8e8e8] rounded" />
        </div>
    )
}

function AgenciesGridSkeleton() {
    return (
        <div className="py-8 md:py-12 pb-20 px-4 sm:px-12 md:px-20">
            <header className="mb-12">
                <h1 className="text-4xl md:text-6xl font-black mb-4 hallyu-gradient-text uppercase tracking-tighter italic">Agências</h1>
                <p className="text-muted max-w-xl text-lg font-medium">Os arquitetos do sucesso. Conheça as empresas que moldam o futuro do entretenimento global.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                    <AgencySkeleton key={i} />
                ))}
            </div>
        </div>
    )
}

async function AgenciesGrid() {
    if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
        return <AgenciesGridSkeleton />
    }
    const agencies = await prisma.agency.findMany({
        include: {
            artists: {
                where: { isHidden: false, flaggedAsNonKorean: false },
                select: { id: true, nameRomanized: true, primaryImageUrl: true },
                take: 5,
                orderBy: { trendingScore: 'desc' },
            },
            musicalGroups: {
                select: { id: true, name: true, profileImageUrl: true, disbandDate: true },
                take: 4,
                orderBy: { trendingScore: 'desc' },
            },
            _count: { select: { artists: true, musicalGroups: true } },
        },
        orderBy: [{ musicalGroups: { _count: 'desc' } }, { artists: { _count: 'desc' } }],
    }).catch(() => [] as never[])

    return (
        <PageTransition className="py-8 md:py-12 pb-20 px-4 sm:px-12 md:px-20">
            <header className="mb-12">
                <h1 className="text-4xl md:text-6xl font-black mb-4 hallyu-gradient-text uppercase tracking-tighter italic">Agências</h1>
                <p className="text-muted max-w-xl text-lg font-medium">Os arquitetos do sucesso. Conheça as empresas que moldam o futuro do entretenimento global.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {agencies.map((agency: any) => (
                    <Link key={agency.id} href={`/agencies/${agency.id}`} className="p-8 bg-background rounded-3xl border border-border hover:border-[#ff2d78]/30 hover:shadow-lg transition-all relative overflow-hidden group block">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>

                        <h3 className="text-2xl font-black mb-1 text-foreground group-hover:text-[#ff2d78] transition-colors uppercase tracking-tight">{agency.name}</h3>
                        <p className="text-[#ff2d78] font-bold text-xs mb-6 lowercase tracking-widest opacity-80">{agency.website?.replace('https://', '').replace('http://', '')}</p>

                        {/* Groups */}
                        {agency.musicalGroups.length > 0 && (
                            <div className="mb-4">
                                <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-2">Grupos</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {agency.musicalGroups.map((g: any) => (
                                        <span key={g.id} className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${g.disbandDate ? 'text-muted border-border' : 'text-[#ff2d78] border-[#ff2d78]/30 bg-[#ff2d78]/10'}`}>
                                            {g.name}
                                        </span>
                                    ))}
                                    {agency._count.musicalGroups > 4 && (
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-muted border border-border">
                                            +{agency._count.musicalGroups - 4}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Artist avatars + names */}
                        {agency.artists.length > 0 && (
                            <div className="mb-6">
                                <div className="flex -space-x-3 mb-2">
                                    {agency.artists.map((artist: any) => (
                                        <div key={artist.id} className="w-9 h-9 rounded-full border-2 border-white overflow-hidden bg-surface flex-shrink-0 relative">
                                            {artist.primaryImageUrl ? (
                                                <Image src={artist.primaryImageUrl} alt="" fill sizes="36px" className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted font-black text-xs">
                                                    {artist.nameRomanized[0]}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {agency._count.artists > 5 && (
                                        <div className="w-9 h-9 rounded-full border-2 border-white bg-surface flex items-center justify-center flex-shrink-0">
                                            <span className="text-[10px] font-black text-muted">+{agency._count.artists - 5}</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-muted font-medium leading-relaxed">
                                    {agency.artists.slice(0, 3).map((a: any) => a.nameRomanized).join(', ')}
                                    {agency._count.artists > 3 && ` e mais`}
                                </p>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                                <div className="bg-surface border border-border px-3 py-1.5 rounded-lg text-muted font-black text-xs uppercase">
                                    {agency._count.artists} Artistas
                                </div>
                                {agency._count.musicalGroups > 0 && (
                                    <div className="bg-[#ff2d78]/10 border border-[#ff2d78]/20 px-3 py-1.5 rounded-lg text-[#ff2d78] font-black text-xs uppercase">
                                        {agency._count.musicalGroups} Grupos
                                    </div>
                                )}
                            </div>
                            <span className="text-xs font-black text-muted group-hover:text-[#ff2d78] transition-colors">
                                VER PERFIL →
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
            <ScrollToTop />
        </PageTransition>
    )
}

export default function AgenciesPage() {
    return (
        <Suspense fallback={<AgenciesGridSkeleton />}>
            <AgenciesGrid />
        </Suspense>
    )
}
