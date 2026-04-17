import Image from 'next/image'
import Link from 'next/link'
import { Music2, ChevronRight } from 'lucide-react'

interface Group {
    id: string
    name: string
    nameHangul: string | null
    profileImageUrl: string | null
    debutDate: Date | null
    disbandDate: Date | null
    _count: { members: number }
}

interface TrendingGroupsProps {
    groups: Group[]
}

const RANK_RING: Record<number, string> = {
    0: 'ring-2 ring-yellow-400/80',
    1: 'ring-2 ring-zinc-300/60',
    2: 'ring-2 ring-amber-600/70',
}

export function TrendingGroups({ groups }: TrendingGroupsProps) {
    if (groups.length === 0) return null

    return (
        <section>
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#ff2d78]/10 border border-[#ff2d78]/20 rounded-xl">
                        <Music2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black dark:text-white text-foreground uppercase tracking-tight">Grupos em Alta</h2>
                        <p className="dark:text-muted text-[#444] text-xs mt-0.5">Os mais populares da cena K-Pop</p>
                    </div>
                </div>
                <Link
                    href="/groups"
                    className="flex items-center gap-1 text-[#ff2d78] hover:text-[#ff2d78] font-bold text-sm transition-colors"
                >
                    Ver todos <ChevronRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 md:gap-4">
                {groups.map((group, index) => {
                    const ringClass = RANK_RING[index] ?? ''
                    const debutYear = group.debutDate ? new Date(group.debutDate).getUTCFullYear() : null

                    return (
                        <Link
                            key={group.id}
                            href={`/groups/${group.id}`}
                            className="group flex flex-col items-center gap-2 text-center"
                        >
                            <div className={`relative w-full aspect-square rounded-2xl overflow-hidden dark:bg-[#080808] bg-surface dark:border-white/10 border-border border group-hover:border-[#ff2d78]/50 transition-all shadow-lg group-hover:shadow-purple-500/20 group-hover:shadow-xl ${ringClass}`}>
                                {/* Rank badge */}
                                <div className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center">
                                    <span className="text-[9px] font-black text-white">
                                        {index + 1}
                                    </span>
                                </div>

                                {group.profileImageUrl ? (
                                    <Image
                                        src={group.profileImageUrl}
                                        alt={group.name}
                                        fill
                                        sizes="(max-width: 640px) 25vw, (max-width: 768px) 20vw, 12vw"
                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#ff2d78]/60 to-pink-900/60">
                                        <span className="text-white font-black text-xl">
                                            {group.name[0]}
                                        </span>
                                    </div>
                                )}
                                {group.disbandDate && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <span className="text-[9px] font-black uppercase text-[#e8e8e8] bg-black/60 px-1.5 py-0.5 rounded">
                                            Disbandado
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 w-full">
                                <p className="dark:text-white text-foreground text-xs font-bold line-clamp-1 group-hover:text-[#ff2d78] transition-colors">
                                    {group.name}
                                </p>
                                {group.nameHangul && (
                                    <p className="text-[#444] text-[10px] line-clamp-1">{group.nameHangul}</p>
                                )}
                                {debutYear && (
                                    <p className="text-[#2a2a2a] text-[9px] font-bold mt-0.5">{debutYear}</p>
                                )}
                            </div>
                        </Link>
                    )
                })}
            </div>
        </section>
    )
}
