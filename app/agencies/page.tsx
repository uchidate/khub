import { Suspense } from 'react'
import prisma from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { PageTransition } from "@/components/features/PageTransition"
import { ScrollToTop } from "@/components/ui/ScrollToTop"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Agências',
    description: 'Os arquitetos do sucesso. Conheça as empresas que moldam o futuro do entretenimento coreano global.',
}

function AgencySkeleton() {
    return (
        <div className="p-10 bg-zinc-900/50 rounded-3xl border border-white/5 relative overflow-hidden animate-pulse">
            <div className="h-8 w-3/4 bg-zinc-800 rounded mb-2" />
            <div className="h-4 w-1/2 bg-zinc-800 rounded mb-8" />

            <div className="mb-8">
                <div className="flex -space-x-3 mb-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-zinc-900 flex-shrink-0" />
                    ))}
                </div>
                <div className="h-4 w-full bg-zinc-800 rounded" />
            </div>

            <div className="h-4 w-1/3 bg-zinc-800 rounded" />
        </div>
    )
}

function AgenciesGridSkeleton() {
    return (
        <div className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
            <header className="mb-12">
                <h1 className="text-4xl md:text-6xl font-black mb-4 hallyu-gradient-text uppercase tracking-tighter italic">Agências</h1>
                <p className="text-zinc-500 max-w-xl text-lg font-medium">Os arquitetos do sucesso. Conheça as empresas que moldam o futuro do entretenimento global.</p>
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
    const agencies = await prisma.agency.findMany({
        include: {
            artists: {
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
    })

    return (
        <PageTransition className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
            <header className="mb-12">
                <h1 className="text-4xl md:text-6xl font-black mb-4 hallyu-gradient-text uppercase tracking-tighter italic">Agências</h1>
                <p className="text-zinc-500 max-w-xl text-lg font-medium">Os arquitetos do sucesso. Conheça as empresas que moldam o futuro do entretenimento global.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {agencies.map((agency: any) => (
                    <Link key={agency.id} href={`/agencies/${agency.id}`} className="p-8 bg-zinc-900/50 rounded-3xl border border-white/5 card-hover shadow-2xl relative overflow-hidden group block">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>

                        <h3 className="text-2xl font-black mb-1 text-white group-hover:text-purple-500 transition-colors uppercase tracking-tight">{agency.name}</h3>
                        <p className="text-purple-600 font-bold text-xs mb-6 lowercase tracking-widest opacity-80">{agency.website?.replace('https://', '').replace('http://', '')}</p>

                        {/* Groups */}
                        {agency.musicalGroups.length > 0 && (
                            <div className="mb-4">
                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Grupos</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {agency.musicalGroups.map((g: any) => (
                                        <span key={g.id} className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${g.disbandDate ? 'text-zinc-600 border-zinc-700' : 'text-purple-400 border-purple-500/30 bg-purple-500/10'}`}>
                                            {g.name}
                                        </span>
                                    ))}
                                    {agency._count.musicalGroups > 4 && (
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-zinc-600 border border-zinc-700">
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
                                        <div key={artist.id} className="w-9 h-9 rounded-full border-2 border-zinc-900 overflow-hidden bg-zinc-800 flex-shrink-0 relative">
                                            {artist.primaryImageUrl ? (
                                                <Image src={artist.primaryImageUrl} alt="" fill sizes="36px" className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-600 font-black text-xs">
                                                    {artist.nameRomanized[0]}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {agency._count.artists > 5 && (
                                        <div className="w-9 h-9 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                            <span className="text-[10px] font-black text-zinc-400">+{agency._count.artists - 5}</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                                    {agency.artists.slice(0, 3).map((a: any) => a.nameRomanized).join(', ')}
                                    {agency._count.artists > 3 && ` e mais`}
                                </p>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                                <div className="bg-zinc-800 px-3 py-1.5 rounded-lg text-zinc-400 font-black text-xs uppercase">
                                    {agency._count.artists} Artistas
                                </div>
                                {agency._count.musicalGroups > 0 && (
                                    <div className="bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-lg text-purple-400 font-black text-xs uppercase">
                                        {agency._count.musicalGroups} Grupos
                                    </div>
                                )}
                            </div>
                            <span className="text-xs font-black text-zinc-500 group-hover:text-purple-500 transition-colors">
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
