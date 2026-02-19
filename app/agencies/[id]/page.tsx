import prisma from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ExternalLink, Users, Music2 } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function AgencyDetailPage({ params }: { params: { id: string } }) {
    const agency = await prisma.agency.findUnique({
        where: { id: params.id },
        include: {
            artists: {
                select: {
                    id: true, nameRomanized: true, nameHangul: true,
                    primaryImageUrl: true, roles: true,
                },
                orderBy: { trendingScore: 'desc' },
            },
            musicalGroups: {
                select: {
                    id: true, name: true, nameHangul: true,
                    profileImageUrl: true, debutDate: true, disbandDate: true,
                    _count: { select: { members: true } },
                },
                orderBy: { trendingScore: 'desc' },
            },
        },
    })

    if (!agency) notFound()

    const socials = (agency.socials as Record<string, string>) || {}
    const activeGroups = agency.musicalGroups.filter(g => !g.disbandDate)
    const disbandedGroups = agency.musicalGroups.filter(g => !!g.disbandDate)

    return (
        <div className="min-h-screen bg-black">
            <div className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20 max-w-[1600px] mx-auto">
                {/* Back */}
                <Link href="/agencies" className="text-zinc-500 hover:text-white transition-colors text-sm font-bold flex items-center gap-1.5 w-fit mb-10">
                    ← Agências
                </Link>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 pb-12 border-b border-white/5">
                    <div>
                        <h1 className="text-5xl md:text-7xl font-black hallyu-gradient-text uppercase tracking-tighter italic">{agency.name}</h1>
                        {agency.website && (
                            <a href={agency.website} target="_blank" rel="noopener noreferrer"
                                className="text-purple-500 hover:text-purple-400 transition-colors text-sm font-bold mt-2 inline-flex items-center gap-1.5">
                                {agency.website.replace('https://', '').replace('http://', '')}
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        )}
                    </div>

                    <div className="flex items-end gap-4">
                        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-4 text-center">
                            <Users className="w-4 h-4 text-zinc-500 mx-auto mb-1" />
                            <p className="text-3xl font-black text-white">{agency.artists.length}</p>
                            <p className="text-xs font-black text-zinc-600 uppercase tracking-widest mt-1">Artistas</p>
                        </div>
                        {agency.musicalGroups.length > 0 && (
                            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-4 text-center">
                                <Music2 className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                                <p className="text-3xl font-black text-purple-400">{agency.musicalGroups.length}</p>
                                <p className="text-xs font-black text-zinc-600 uppercase tracking-widest mt-1">Grupos</p>
                            </div>
                        )}
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

                {/* Grupos */}
                {agency.musicalGroups.length > 0 && (
                    <section className="mb-16">
                        <h2 className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Music2 className="w-4 h-4" />
                            Grupos Musicais
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {[...activeGroups, ...disbandedGroups].map((group) => (
                                <Link key={group.id} href={`/groups/${group.id}`}
                                    className={`group block ${group.disbandDate ? 'opacity-50 hover:opacity-80 transition-opacity' : ''}`}>
                                    <div className="aspect-square relative rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 hover:border-purple-500/30 transition-all mb-2">
                                        {group.profileImageUrl ? (
                                            <Image src={group.profileImageUrl} alt={group.name} fill
                                                sizes="(max-width: 640px) 50vw, 20vw"
                                                className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-2xl font-black text-zinc-600 group-hover:text-purple-500 transition-colors">
                                                    {group.name[0]}
                                                </span>
                                            </div>
                                        )}
                                        {group.disbandDate && (
                                            <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded text-[9px] font-black text-zinc-400 uppercase">
                                                Disbandado
                                            </div>
                                        )}
                                        {group._count.members > 0 && (
                                            <div className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[9px] font-bold text-zinc-300">
                                                <Users className="w-2.5 h-2.5" />
                                                {group._count.members}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-black text-white text-sm group-hover:text-purple-300 transition-colors">{group.name}</p>
                                        {group.nameHangul && <p className="text-xs text-zinc-600 mt-0.5">{group.nameHangul}</p>}
                                        {group.debutDate && (
                                            <p className="text-[10px] text-zinc-700 font-bold mt-0.5">
                                                {new Date(group.debutDate).getFullYear()}
                                                {group.disbandDate ? ` – ${new Date(group.disbandDate).getFullYear()}` : ''}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Artist Roster */}
                <section>
                    <h2 className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Elenco
                    </h2>
                    {agency.artists.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
                            {agency.artists.map((artist) => (
                                <Link key={artist.id} href={`/artists/${artist.id}`} className="group cursor-pointer block">
                                    <div className="aspect-[2/3] relative rounded-xl overflow-hidden bg-zinc-900 border border-white/5 hover:border-purple-500/30 transition-all shadow-lg mb-3">
                                        {artist.primaryImageUrl ? (
                                            <Image
                                                src={artist.primaryImageUrl}
                                                alt={artist.nameRomanized}
                                                fill
                                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                                                className="object-cover group-hover:scale-105 transition-transform duration-500 brightness-90 group-hover:brightness-100"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-zinc-700 italic font-black uppercase tracking-tighter text-xl">
                                                {artist.nameRomanized[0]}
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors">{artist.nameRomanized}</h4>
                                        {artist.nameHangul && <p className="text-xs text-zinc-600 mt-0.5">{artist.nameHangul}</p>}
                                        {artist.roles && artist.roles.length > 0 && (
                                            <p className="text-[10px] text-zinc-600 font-bold mt-0.5">{artist.roles.slice(0, 2).join(' · ')}</p>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-zinc-900/50 rounded-2xl border border-white/5 p-12 text-center">
                            <p className="text-zinc-600 font-medium">Nenhum artista registrado nesta agência.</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}
