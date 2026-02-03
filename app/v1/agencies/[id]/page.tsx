import prisma from "@/lib/prisma"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function AgencyDetailPage({ params }: { params: { id: string } }) {
    const agency = await prisma.agency.findUnique({
        where: { id: params.id },
        include: { artists: true }
    })

    if (!agency) {
        return (
            <div className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
                <Link href="/v1/agencies" className="text-zinc-500 hover:text-white transition-colors text-sm font-bold mb-8 inline-block">← Agências</Link>
                <h1 className="text-4xl md:text-6xl font-black hallyu-gradient-text uppercase tracking-tighter italic">Agência não encontrada</h1>
            </div>
        )
    }

    const socials = (agency.socials as Record<string, string>) || {}

    return (
        <div className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
            {/* Back */}
            <Link href="/v1/agencies" className="text-zinc-400 hover:text-white transition-colors text-sm font-bold flex items-center gap-1.5 w-fit mb-12">
                ← Agências
            </Link>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 pb-16 border-b border-white/5">
                <div>
                    <h1 className="text-5xl md:text-7xl font-black hallyu-gradient-text uppercase tracking-tighter italic">{agency.name}</h1>
                    {agency.website && (
                        <a href={agency.website} target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:text-purple-400 transition-colors text-sm font-bold mt-2 inline-flex items-center gap-1.5">
                            {agency.website.replace('https://', '').replace('http://', '')}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    )}
                </div>

                <div className="flex items-end gap-4">
                    <div className="bg-zinc-900 border border-white/5 rounded-lg px-6 py-4 text-center">
                        <p className="text-3xl font-black text-white">{agency.artists.length}</p>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1">Artistas</p>
                    </div>
                    {Object.keys(socials).length > 0 && (
                        <div className="flex gap-2">
                            {Object.entries(socials).map(([name, url]) => (
                                <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                                    className="text-xs font-bold text-white bg-zinc-800 px-3 py-1.5 rounded-sm border border-white/5 hover:border-purple-500 transition-colors">
                                    {name}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Artist Roster */}
            <div>
                <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-6">Elenco</h2>
                {agency.artists.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
                        {agency.artists.map((artist) => (
                            <Link key={artist.id} href={`/v1/artists/${artist.id}`} className="group cursor-pointer block">
                                <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-zinc-900 border border-white/5 card-hover shadow-2xl">
                                    {artist.primaryImageUrl ? (
                                        <img
                                            src={artist.primaryImageUrl}
                                            alt={artist.nameRomanized}
                                            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700 brightness-[0.8] group-hover:brightness-100"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-zinc-700 italic font-black uppercase tracking-tighter text-xl">{artist.nameRomanized}</div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                                        <h3 className="text-lg font-black text-white leading-tight mb-0.5">{artist.nameRomanized}</h3>
                                        <p className="text-xs text-purple-500 font-bold">{artist.nameHangul}</p>
                                    </div>
                                </div>
                                <div className="mt-3 group-hover:opacity-0 transition-opacity">
                                    <h4 className="font-bold text-sm">{artist.nameRomanized}</h4>
                                    <p className="text-[10px] text-zinc-500 font-medium">{artist.roles?.slice(0, 2).join(', ')}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="bg-zinc-900 rounded-lg border border-white/5 p-10 text-center">
                        <p className="text-zinc-600 font-medium">Nenhum artista registrado nesta agência.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
