import Link from 'next/link'
import Image from 'next/image'

function nameToGradient(name: string) {
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    const h = Math.abs(hash) % 360
    return `linear-gradient(135deg, hsl(${h},65%,52%), hsl(${(h + 40) % 360},75%,62%))`
}

export interface TrendingGroup {
    id: string
    name: string
    nameHangul: string | null
    profileImageUrl: string | null
    officialColor: string | null
    fanClubName: string | null
    trendingScore: number
    agency: { name: string } | null
}

export function HomeTrendingGroups({ groups }: { groups: TrendingGroup[] }) {
    if (!groups.length) return null

    return (
        <div className="border-t md:border-t-0 md:border-l border-border">
            <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-border">
                <span className="text-[9px] font-bold uppercase tracking-[0.13em] text-muted">Grupos em alta</span>
                <Link href="/groups" className="text-[9px] font-bold text-muted hover:text-accent transition-colors">Ver todos →</Link>
            </div>
            <div className="grid grid-cols-2">
                {groups.slice(0, 8).map((group, idx) => {
                    const color = group.officialColor ?? '#ff2d78'
                    return (
                        <Link
                            key={group.id}
                            href={`/groups/${group.id}`}
                            className={`group relative flex items-center gap-2.5 pl-3 pr-3 py-2.5 transition-colors min-h-[48px]
                                ${idx % 2 === 0 ? 'border-r border-border' : ''}
                                ${idx < 6 ? 'border-b border-border' : ''}
                            `}
                        >
                            <span className="absolute left-0 top-2 bottom-2 w-[2.5px] rounded-r-full opacity-50 transition-opacity group-hover:opacity-100" style={{ backgroundColor: color }} />
                            <span className="text-[8px] font-bold w-3 flex-shrink-0 text-center" style={{ color: `${color}80` }}>{idx + 1}</span>
                            <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden border-2 transition-all group-hover:scale-110" style={{ borderColor: `${color}50` }}>
                                {group.profileImageUrl ? (
                                    <Image src={group.profileImageUrl} alt={group.name} width={40} height={40} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: nameToGradient(group.name) }}>
                                        {group.name[0]}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-semibold text-foreground group-hover:text-accent transition-colors truncate leading-tight">
                                    {group.name}
                                </p>
                                {group.fanClubName ? (
                                    <p className="text-[9px] truncate mt-0.5" style={{ color: `${color}cc` }}>
                                        {group.fanClubName}
                                    </p>
                                ) : group.trendingScore > 0 && (
                                    <p className="text-[9px] text-muted mt-0.5">
                                        {Math.round(group.trendingScore)} pts
                                    </p>
                                )}
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
