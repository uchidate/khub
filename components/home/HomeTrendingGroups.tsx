import Link from 'next/link'
import Image from 'next/image'
import { nameToGradient } from '@/lib/utils'

export interface TrendingGroup {
    id: string
    slug?: string | null
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
        <div className="border-t border-border lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-2.5 sm:px-6">
                <span className="text-[9px] font-bold uppercase tracking-[0.13em] text-accent">Grupos em alta</span>
                <Link href="/groups" className="text-[9px] font-bold text-muted transition-colors hover:text-foreground">Ver todos →</Link>
            </div>
            <div className="grid grid-cols-2">
                {groups.slice(0, 8).map((group, idx) => {
                    return (
                        <Link
                            key={group.id}
                            href={`/groups/${group.slug ?? group.id}`}
                            className={`group relative flex min-h-[48px] items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-surface
                                ${idx % 2 === 0 ? '' : ''}
                                ${idx < 6 ? 'border-b border-border' : ''}
                            `}
                        >
                            <span className="flex w-4 shrink-0 justify-center text-[8px] font-bold text-muted">{idx + 1}</span>
                            <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden border border-border transition-all group-hover:scale-105 group-hover:border-accent/50">
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
                                <p className="text-[9px] text-muted mt-0.5 truncate">
                                    {group.fanClubName ?? group.agency?.name ?? group.nameHangul ?? "Em alta agora"}
                                </p>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
