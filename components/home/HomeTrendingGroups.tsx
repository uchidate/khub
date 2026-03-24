import Link from 'next/link'
import Image from 'next/image'
import { SectionTitleBar } from '@/components/ui/SectionTitleBar'

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
        <section className="border-b border-border bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">
                <SectionTitleBar
                    title={<>Grupos em <span className="text-accent">alta</span></>}
                    href="/groups"
                />
                <div
                    className="flex gap-3 overflow-x-auto pb-2"
                    style={{ scrollbarWidth: 'none' }}
                >
                    {groups.map((group) => {
                        const color = group.officialColor ?? '#ff2d78'
                        return (
                            <Link
                                key={group.id}
                                href={`/groups/${group.id}`}
                                className="group flex-shrink-0 flex flex-col items-center gap-2.5 p-3 rounded-2xl border border-border hover:border-accent/30 bg-surface hover:bg-surface-hover transition-all w-28 md:w-32"
                            >
                                {/* Avatar with official color ring */}
                                <div
                                    className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0"
                                    style={{ boxShadow: `0 0 0 2px ${color}40, 0 0 0 4px ${color}15` }}
                                >
                                    {group.profileImageUrl ? (
                                        <Image
                                            src={group.profileImageUrl}
                                            alt={group.name}
                                            fill
                                            sizes="64px"
                                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div
                                            className="w-full h-full flex items-center justify-center text-white font-black text-lg"
                                            style={{ backgroundColor: color }}
                                        >
                                            {group.name[0]}
                                        </div>
                                    )}
                                </div>

                                {/* Name */}
                                <div className="text-center">
                                    <p className="text-[12px] font-bold text-foreground group-hover:text-accent transition-colors leading-tight line-clamp-1">
                                        {group.name}
                                    </p>
                                    {group.nameHangul && (
                                        <p className="text-[10px] text-muted mt-0.5">{group.nameHangul}</p>
                                    )}
                                    {group.fanClubName && (
                                        <p className="text-[9px] font-semibold mt-1" style={{ color }}>
                                            {group.fanClubName}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
