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

export function TrendingGroups({ groups }: TrendingGroupsProps) {
    if (groups.length === 0) return null

    return (
        <section>
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
                        <Music2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-white">Grupos</h2>
                        <p className="text-zinc-500 text-xs mt-0.5">Os mais populares da cena K-Pop</p>
                    </div>
                </div>
                <Link
                    href="/groups"
                    className="flex items-center gap-1 text-purple-400 hover:text-purple-300 font-bold text-sm transition-colors"
                >
                    Ver todos <ChevronRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {groups.map((group) => (
                    <Link
                        key={group.id}
                        href={`/groups/${group.id}`}
                        className="group flex flex-col items-center gap-2 text-center"
                    >
                        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 group-hover:border-purple-500/50 transition-all shadow-lg group-hover:shadow-purple-500/20 group-hover:shadow-xl">
                            {group.profileImageUrl ? (
                                <Image
                                    src={group.profileImageUrl}
                                    alt={group.name}
                                    fill
                                    sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 12vw"
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/60 to-pink-900/60">
                                    <span className="text-white font-black text-xl">
                                        {group.name[0]}
                                    </span>
                                </div>
                            )}
                            {group.disbandDate && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <span className="text-[9px] font-black uppercase text-zinc-300 bg-black/60 px-1.5 py-0.5 rounded">
                                        Disbandado
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="min-w-0 w-full">
                            <p className="text-white text-xs font-bold line-clamp-1 group-hover:text-purple-400 transition-colors">
                                {group.name}
                            </p>
                            {group.nameHangul && (
                                <p className="text-zinc-600 text-[10px] line-clamp-1">{group.nameHangul}</p>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    )
}
