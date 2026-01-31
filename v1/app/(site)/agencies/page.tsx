import prisma from "@/lib/prisma"

export default async function AgenciesPage() {
    const agencies = await prisma.agency.findMany({
        include: { _count: { select: { artists: true } } }
    })

    return (
        <div className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
            <header className="mb-12">
                <h1 className="text-4xl md:text-6xl font-black mb-4 hallyu-gradient-text uppercase tracking-tighter italic">Agências</h1>
                <p className="text-zinc-500 max-w-xl text-lg font-medium">Os arquitetos do sucesso. Conheça as empresas que moldam o futuro do entretenimento global.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {agencies.map((agency) => (
                    <div key={agency.id} className="p-10 bg-zinc-900/50 rounded-3xl border border-white/5 card-hover shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>

                        <h3 className="text-2xl font-black mb-1 text-white group-hover:text-purple-500 transition-colors uppercase tracking-tight">{agency.name}</h3>
                        <p className="text-purple-600 font-bold text-xs mb-6 lowercase tracking-widest opacity-80">{agency.website?.replace('https://', '').replace('http://', '')}</p>

                        <div className="flex justify-between items-end mt-10">
                            <div className="bg-zinc-800 px-4 py-2 rounded-xl text-zinc-400 font-black text-[10px] uppercase">
                                {agency._count.artists} Artistas
                            </div>
                            <a href={agency.website || '#'} target="_blank" className="text-xs font-black text-white hover:text-purple-500 transition-colors flex items-center gap-2">
                                SITE OFICIAL
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
