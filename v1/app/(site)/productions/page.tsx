import prisma from "@/lib/prisma"

export default async function ProductionsPage() {
    const productions = await prisma.production.findMany({
        include: {
            artists: {
                include: { artist: true }
            }
        }
    })

    return (
        <div className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
            <header className="mb-12">
                <h1 className="text-4xl md:text-6xl font-black mb-4 hallyu-gradient-text uppercase tracking-tighter italic">Filmes & Séries</h1>
                <p className="text-zinc-500 max-w-xl text-lg font-medium">De romances épicos a thrillers de tirar o fôlego. O melhor do entretenimento coreano selecionado para você.</p>
            </header>

            <div className="space-y-12">
                {productions.map((prod: any) => (
                    <div key={prod.id} className="group relative bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 flex flex-col md:flex-row h-auto md:h-80 card-hover shadow-2xl">
                        {/* Poster / Backdrop */}
                        <div className="w-full md:w-1/3 aspect-video md:aspect-auto bg-gradient-to-br from-zinc-800 to-zinc-900 relative overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                                <h2 className="text-3xl font-black uppercase tracking-tighter leading-none text-zinc-700 group-hover:text-purple-600 transition-colors">
                                    {prod.titlePt}
                                </h2>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/60 hidden md:block" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-8 md:p-10 flex flex-col relative z-20">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-3xl font-black text-white mb-1 group-hover:text-purple-500 transition-colors">{prod.titlePt}</h3>
                                    <div className="flex gap-4 items-center text-zinc-500 text-sm font-bold">
                                        <span className="text-purple-500">{prod.year}</span>
                                        <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                                        <span className="uppercase tracking-widest text-[10px] px-2 py-0.5 border border-zinc-700 rounded-sm">{prod.type}</span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-zinc-400 leading-relaxed mb-6 line-clamp-3 font-medium flex-grow">
                                {prod.synopsis}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-8 mt-auto">
                                <div>
                                    <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3">Disponível em</h4>
                                    <div className="flex gap-3">
                                        {prod.streamingPlatforms?.split(',').map((p: any) => (
                                            <span key={p} className="text-xs font-bold text-white bg-zinc-800 px-3 py-1 rounded-sm border border-white/5">
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {prod.artists.length > 0 && (
                                    <div>
                                        <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3">Com a participação de</h4>
                                        <div className="flex gap-2">
                                            {prod.artists.map((conn: any) => (
                                                <span key={conn.artistId} className="text-xs font-bold text-purple-400 hover:text-white transition-colors cursor-pointer capitalize">
                                                    {conn.artist.nameRomanized}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
