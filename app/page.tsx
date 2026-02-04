import prisma from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { HeroSection } from "@/components/features/HeroSection"
import { MediaCard } from "@/components/ui/MediaCard"
import { ArrowRight, TrendingUp, Film, Newspaper } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'HallyuHub - A Onda Coreana no Seu Ritmo',
    description: 'Explore os perfis mais detalhados de artistas, agências e as melhores produções da Coreia do Sul.',
}

export default async function Home() {
    const trendingArtists = await prisma.artist.findMany({
        take: 5,
        orderBy: { trendingScore: 'desc' },
        include: { agency: { select: { name: true } } }
    })
    const latestProductions = await prisma.production.findMany({ take: 3, orderBy: { year: 'desc' } })
    const topNews = await prisma.news.findMany({ take: 3, orderBy: { publishedAt: 'desc' } })

    return (
        <div className="bg-black min-h-screen pb-20 overflow-x-hidden">
            <HeroSection />

            <div className="relative z-20 max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 mt-0 space-y-24">

                {/* Section: Trending Artists (Bento Grid) */}
                <section>
                    <div className="flex items-end justify-between mb-8">
                        <h2 className="text-2xl md:text-4xl font-display font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
                            <TrendingUp className="text-neon-pink" size={32} />
                            Trending Now
                        </h2>
                        <Link href="/artists" className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
                            Ver Todos <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:auto-rows-[300px]">
                        {/* Hero Item (First Artist) */}
                        {trendingArtists[0] && (
                            <div className="md:col-span-2 md:row-span-2">
                                <MediaCard
                                    key={trendingArtists[0].id}
                                    id={trendingArtists[0].id}
                                    title={trendingArtists[0].nameRomanized}
                                    subtitle={trendingArtists[0].agency?.name || 'Artista'}
                                    imageUrl={trendingArtists[0].primaryImageUrl}
                                    type="artist"
                                    href={`/artists/${trendingArtists[0].id}`}
                                    aspectRatio="square"
                                    badges={['🔥 #1 Trending']}
                                />
                            </div>
                        )}
                        {/* Secondary Items */}
                        {trendingArtists.slice(1).map((artist: any) => (
                            <div key={artist.id} className="md:col-span-1 md:row-span-1">
                                <MediaCard
                                    id={artist.id}
                                    title={artist.nameRomanized}
                                    imageUrl={artist.primaryImageUrl}
                                    type="artist"
                                    href={`/artists/${artist.id}`}
                                    aspectRatio="square"
                                />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Section: Latest Productions */}
                <section>
                    <div className="flex items-end justify-between mb-8">
                        <h2 className="text-2xl md:text-4xl font-display font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
                            <Film className="text-electric-cyan" size={32} />
                            Em Alta
                        </h2>
                        <Link href="/productions" className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
                            Ver Todas <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {latestProductions.map((prod: any) => (
                            <MediaCard
                                key={prod.id}
                                id={prod.id}
                                title={prod.titlePt}
                                subtitle={`${prod.type} • ${prod.year}`}
                                imageUrl={prod.imageUrl}
                                type="production"
                                href={`/productions/${prod.id}`}
                                aspectRatio="video"
                            />
                        ))}
                    </div>
                </section>

                {/* Section: Latest News (Glass List) */}
                <section className="relative">
                    <div className="absolute -inset-10 bg-cyber-purple/10 blur-[100px] rounded-full z-0 pointer-events-none" />
                    <div className="relative z-10 glass-card p-8 md:p-12 border-white/10 bg-black/60">
                        <div className="flex flex-col md:flex-row gap-12">
                            <div className="md:w-1/3">
                                <div className="flex items-center gap-2 text-neon-pink font-black uppercase tracking-widest text-xs mb-4">
                                    <Newspaper size={14} /> News Feed
                                </div>
                                <h2 className="text-4xl md:text-6xl font-display font-black text-white italic tracking-tighter leading-none mb-6">
                                    ÚLTIMAS<br />
                                    DO HALLYU
                                </h2>
                                <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                                    Fique por dentro dos comebacks, lançamentos de dramas e notícias exclusivas da indústria.
                                </p>
                                <Link href="/news" className="btn-primary text-xs uppercase tracking-widest">
                                    Ler Todas
                                </Link>
                            </div>

                            <div className="md:w-2/3 grid gap-4">
                                {topNews.map((item: any) => (
                                    <Link key={item.id} href={`/news/${item.id}`} className="group flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all">
                                        <div className="relative w-full md:w-32 aspect-video rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                                            {item.imageUrl ? (
                                                <Image src={item.imageUrl} alt={item.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full bg-zinc-800" />
                                            )}
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-[10px] text-cyber-purple font-black uppercase tracking-widest mb-2">
                                                {new Date(item.publishedAt).toLocaleDateString('pt-BR')}
                                            </span>
                                            <h3 className="text-lg font-bold text-white group-hover:text-neon-pink transition-colors leading-tight mb-2">
                                                {item.title}
                                            </h3>
                                            <p className="text-xs text-zinc-500 line-clamp-2 md:line-clamp-1">
                                                {item.contentMd}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}
