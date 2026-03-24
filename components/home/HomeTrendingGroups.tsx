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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 rounded-xl overflow-hidden border border-border">
                    {groups.slice(0, 8).map((group, idx) => {
                        const color = group.officialColor ?? '#ff2d78'
                        return (
                            <Link
                                key={group.id}
                                href={`/groups/${group.id}`}
                                className={`group flex items-center gap-3 px-4 py-3.5 hover:bg-surface transition-colors min-h-[60px]
                                    ${idx % 2 === 0 ? 'sm:border-r border-border' : ''}
                                    ${idx < groups.length - 2 ? 'border-b border-border' : ''}
                                `}
                            >
                                <span className="text-[9px] font-bold text-muted w-4 flex-shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                                <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden border-2" style={{ borderColor: `${color}50` }}>
                                    {group.profileImageUrl ? (
                                        <Image src={group.profileImageUrl} alt={group.name} width={36} height={36} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: color }}>
                                            {group.name[0]}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-semibold text-foreground group-hover:text-accent transition-colors truncate leading-tight">
                                        {group.name}
                                    </p>
                                    <p className="text-[9px] text-muted mt-0.5 truncate">
                                        {group.nameHangul ?? ''}{group.agency?.name ? ` · ${group.agency.name}` : ''}
                                    </p>
                                </div>
                                {group.fanClubName && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ color, backgroundColor: `${color}15` }}>
                                        {group.fanClubName}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
