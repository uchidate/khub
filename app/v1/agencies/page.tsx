import prisma from "@/lib/prisma"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function AgenciesPage() {
    console.log('--- RENDERING AGENCIES PAGE ---')
    const agencies = await prisma.agency.findMany({
        include: {
            artists: {
                select: { id: true, nameRomanized: true, primaryImageUrl: true }
            }
        }
    })

    return (
        <div className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
            <header className="mb-12">
                <h1 className="text-4xl md:text-6xl font-black mb-4 hallyu-gradient-text uppercase tracking-tighter italic">Agências</h1>
                <p className="text-zinc-500 max-w-xl text-lg font-medium">Os arquitetos do sucesso. Conheça as empresas que moldam o futuro do entretenimento global.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {agencies.map((agency: any) => (
                    <Link key={agency.id} href={`/v1/agencies/${agency.id}`} className="p-10 bg-zinc-900/50 rounded-3xl border border-white/5 card-hover shadow-2xl relative overflow-hidden group block">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>

                        <h3 className="text-2xl font-black mb-1 text-white group-hover:text-purple-500 transition-colors uppercase tracking-tight">{agency.name}</h3>
                        <p className="text-purple-600 font-bold text-xs mb-8 lowercase tracking-widest opacity-80">{agency.website?.replace('https://', '').replace('http://', '')}</p>

                        {/* Artist avatars + names */}
                        {agency.artists.length > 0 && (
                            <div className="mb-8">
                                <div className="flex -space-x-3 mb-3">
                                    {agency.artists.slice(0, 5).map((artist: any) => (
                                        <div key={artist.id} className="w-10 h-10 rounded-full border-2 border-zinc-900 overflow-hidden bg-zinc-800 flex-shrink-0">
                                            {artist.primaryImageUrl ? (
                                                <img src={artist.primaryImageUrl} alt={artist.nameRomanized} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-600 font-black text-[10px]">
                                                    {artist.nameRomanized[0]}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {agency.artists.length > 5 && (
                                        <div className="w-10 h-10 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                            <span className="text-[10px] font-black text-zinc-400">+{agency.artists.length - 5}</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                                    {agency.artists.slice(0, 4).map((a: any) => a.nameRomanized).join(', ')}
                                    {agency.artists.length > 4 && ` e mais`}
                                </p>
                            </div>
                        )}

                        <div className="flex justify-between items-end">
                            <div className="bg-zinc-800 px-4 py-2 rounded-xl text-zinc-400 font-black text-[10px] uppercase">
                                {agency.artists.length} Artistas
                            </div>
                            <span className="text-xs font-black text-zinc-500 group-hover:text-purple-500 transition-colors">
                                VER PERFIL →
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
