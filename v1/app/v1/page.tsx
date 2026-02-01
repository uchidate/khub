import prisma from "@/lib/prisma"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function Home() {
    console.log('--- RENDERING HOMEPAGE ---')
    const trendingArtists = await prisma.artist.findMany({ take: 6 })
    const latestProductions = await prisma.production.findMany({ take: 6, orderBy: { year: 'desc' } })
    const topNews = await prisma.news.findMany({ take: 4, orderBy: { publishedAt: 'desc' } })
    console.log(`Homepage data fetched: ${trendingArtists.length} artists, ${latestProductions.length} productions, ${topNews.length} news`)

    return (
        <div className="pb-20">
            {/* Hero Section */}
            <section className="relative h-[85vh] w-full flex items-end pb-24 px-4 sm:px-12 md:px-20 overflow-hidden">
                {/* Background Image / Placeholder */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                    <img
                        src="https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=2000"
                        alt="Hero Background"
                        className="w-full h-full object-cover brightness-[0.7]"
                    />
                </div>

                <div className="relative z-20 max-w-2xl">
                    <span className="inline-block px-3 py-1 bg-purple-600 text-[10px] font-black uppercase tracking-widest rounded-sm mb-4">
                        Versão 1.0 Oficial
                    </span>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tighter">
                        A ONDA <span className="hallyu-gradient-text italic">HALLYU</span> <br />
                        NO SEU RITMO.
                    </h1>
                    <p className="text-lg text-zinc-300 mb-8 max-w-lg leading-relaxed font-medium">
                        Explore os perfis mais detalhados de artistas, agências e as melhores produções da Coreia do Sul num portal moderno e vibrante.
                    </p>
                    <div className="flex gap-4">
                        <Link href="/v1/artists" className="btn-primary flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                            </svg>
                            Explorar
                        </Link>
                        <Link href="/v1/about" className="btn-secondary">
                            Saiba Mais
                        </Link>
                    </div>
                </div>
            </section>

            {/* Rows of Content */}
            <div className="px-4 sm:px-12 md:px-20 space-y-16 -mt-12 relative z-30">

                {/* Row: Trending Artists */}
                <section>
                    <h2 className="text-xl md:text-2xl font-bold mb-6 text-zinc-100 flex items-center justify-between">
                        Artistas em Destaque
                        <Link href="/v1/artists" className="text-xs text-purple-500 hover:text-white transition-colors">Ver todos →</Link>
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        {trendingArtists.map((artist: any) => (
                            <Link key={artist.id} href="/v1/artists" className="card-hover">
                                <div className="aspect-[3/4] rounded-lg overflow-hidden bg-zinc-900 shadow-lg border border-white/5">
                                    <img src={artist.primaryImageUrl || "https://placeholder.com/600"} alt={artist.nameRomanized} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-4">
                                        <span className="text-sm font-bold">{artist.nameRomanized}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Row: Latest Productions */}
                <section>
                    <h2 className="text-xl md:text-2xl font-bold mb-6 text-zinc-100 flex items-center justify-between">
                        Produções Recentes
                        <Link href="/v1/productions" className="text-xs text-purple-500 hover:text-white transition-colors">Ver todas →</Link>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {latestProductions.map((prod: any) => (
                            <Link key={prod.id} href="/v1/productions" className="card-hover">
                                <div className="h-56 rounded-lg overflow-hidden bg-zinc-900 relative shadow-xl group border border-white/5">
                                    <div className="absolute inset-0 bg-purple-900/10 group-hover:bg-transparent transition-colors z-10" />
                                    <div className="absolute inset-0 flex items-center justify-center p-8 bg-gradient-to-tr from-purple-900/40 to-black/20">
                                        <span className="text-xl font-black text-center uppercase tracking-tighter">{prod.titlePt}</span>
                                    </div>
                                    <div className="absolute bottom-4 left-4 z-20 flex gap-2">
                                        <span className="text-[10px] px-2 py-1 bg-white text-black font-bold rounded-sm">{prod.type}</span>
                                        <span className="text-[10px] px-2 py-1 bg-zinc-800 text-white font-bold rounded-sm">{prod.year}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Big News CTA */}
                <section className="bg-gradient-to-br from-zinc-900 to-black p-8 md:p-12 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center gap-10">
                    <div className="flex-1">
                        <h2 className="text-3xl md:text-5xl font-black mb-6 hallyu-gradient-text uppercase">Últimas do HallyuHub</h2>
                        <div className="space-y-6 mb-10">
                            {topNews.map((item: any) => (
                                <div key={item.id} className="border-l-2 border-purple-600 pl-4 py-1">
                                    <h4 className="font-bold text-lg mb-1">{item.title}</h4>
                                    <p className="text-sm text-zinc-500 line-clamp-1">{item.contentMd}</p>
                                </div>
                            ))}
                        </div>
                        <Link href="/v1/news" className="btn-primary">Ver Todas as Notícias</Link>
                    </div>
                    <div className="w-full md:w-1/3 aspect-square rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 blur-3xl opacity-20 animate-pulse pointer-events-none" />
                </section>
            </div>
        </div>
    )
}
