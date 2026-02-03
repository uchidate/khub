import prisma from "@/lib/prisma"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function ArtistDetailPage({ params }: { params: { id: string } }) {
    const artist = await prisma.artist.findUnique({
        where: { id: params.id },
        include: {
            agency: true,
            productions: {
                include: { production: true }
            }
        }
    })

    if (!artist) {
        return (
            <div className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
                <Link href="/v1/artists" className="text-zinc-500 hover:text-white transition-colors text-sm font-bold mb-8 inline-block">← Artistas</Link>
                <h1 className="text-4xl md:text-6xl font-black hallyu-gradient-text uppercase tracking-tighter italic">Artista não encontrado</h1>
            </div>
        )
    }

    const roles = artist.roles || []
    const stageNames = artist.stageNames || []

    const socialLinks = (artist.socialLinks as Record<string, string>) || {}

    const birthDate = artist.birthDate ? new Date(artist.birthDate) : null
    const birthDateFormatted = birthDate?.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
    const age = birthDate ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null

    return (
        <div className="min-h-screen">
            {/* Hero */}
            <div className="relative h-[65vh] md:h-[75vh]">
                {artist.primaryImageUrl ? (
                    <img src={artist.primaryImageUrl} alt={artist.nameRomanized} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />
                )}
                <div className="absolute inset-0 hero-gradient" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />

                {/* Back link */}
                <div className="absolute top-4 md:top-6 left-0 right-0 px-4 sm:px-12 md:px-20">
                    <Link href="/v1/artists" className="text-zinc-400 hover:text-white transition-colors text-sm font-bold flex items-center gap-1.5 w-fit">
                        ← Artistas
                    </Link>
                </div>

                {/* Hero content */}
                <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-12 md:px-20 pb-10 md:pb-16">
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {roles.map(role => (
                            <span key={role} className="text-[10px] uppercase font-black px-2 py-0.5 bg-white text-black rounded-sm">{role}</span>
                        ))}
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black text-white leading-none tracking-tighter">{artist.nameRomanized}</h1>
                    <p className="text-xl md:text-2xl text-purple-500 font-bold mt-1">{artist.nameHangul}</p>
                    {stageNames.length > 0 && (
                        <p className="text-zinc-500 text-sm font-medium mt-1.5">Também conhecida como: {stageNames.join(', ')}</p>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-12 md:px-20 py-16">
                <div className="grid md:grid-cols-3 gap-16">
                    {/* Sidebar: bio + details */}
                    <div className="space-y-8">
                        {artist.bio && (
                            <div>
                                <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3">Sobre</h3>
                                <p className="text-zinc-400 leading-relaxed font-medium">{artist.bio}</p>
                            </div>
                        )}

                        <div>
                            {birthDateFormatted && (
                                <div className="flex justify-between py-3 border-b border-white/5">
                                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Nascimento</span>
                                    <span className="text-sm font-bold text-zinc-300">{birthDateFormatted}</span>
                                </div>
                            )}
                            {age !== null && (
                                <div className="flex justify-between py-3 border-b border-white/5">
                                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Idade</span>
                                    <span className="text-sm font-bold text-zinc-300">{age} anos</span>
                                </div>
                            )}
                            {artist.agency && (
                                <div className="flex justify-between py-3 border-b border-white/5">
                                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Agência</span>
                                    {artist.agency.website ? (
                                        <a href={artist.agency.website} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-purple-500 hover:text-purple-400 transition-colors">
                                            {artist.agency.name}
                                        </a>
                                    ) : (
                                        <span className="text-sm font-bold text-zinc-300">{artist.agency.name}</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {Object.keys(socialLinks).length > 0 && (
                            <div>
                                <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3">Redes Sociais</h3>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(socialLinks).map(([name, url]) => (
                                        <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                                            className="text-xs font-bold text-white bg-zinc-800 px-3 py-1.5 rounded-sm border border-white/5 hover:border-purple-500 transition-colors">
                                            {name}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main: filmography */}
                    <div className="md:col-span-2">
                        <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-6">Filmografia</h3>
                        {artist.productions.length > 0 ? (
                            <div className="space-y-4">
                                {artist.productions.map(({ production }) => (
                                    <div key={production.id} className="group flex bg-zinc-900 rounded-lg border border-white/5 overflow-hidden hover:border-purple-500/30 transition-colors">
                                        <div className="w-20 md:w-28 flex-shrink-0 bg-gradient-to-b from-zinc-800 to-zinc-900 flex items-center justify-center">
                                            <span className="text-[10px] font-black text-zinc-700 uppercase group-hover:text-purple-500 transition-colors text-center px-2 leading-tight">
                                                {production.type}
                                            </span>
                                        </div>
                                        <div className="flex-1 p-5">
                                            <div className="flex flex-wrap items-center gap-3 mb-1">
                                                <h4 className="text-lg font-black text-white">{production.titlePt}</h4>
                                                {production.year && <span className="text-xs font-bold text-purple-500">{production.year}</span>}
                                            </div>
                                            {production.titleKr && <p className="text-xs text-zinc-600 font-medium mb-2">{production.titleKr}</p>}
                                            {production.synopsis && <p className="text-zinc-500 text-sm leading-relaxed line-clamp-2 font-medium">{production.synopsis}</p>}
                                            {production.streamingPlatforms && (
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {production.streamingPlatforms.split(',').map(p => (
                                                        <span key={p.trim()} className="text-[10px] font-black text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-sm border border-white/5">{p.trim()}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-zinc-900 rounded-lg border border-white/5 p-10 text-center">
                                <p className="text-zinc-600 font-medium">Nenhuma produção registrada ainda.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
