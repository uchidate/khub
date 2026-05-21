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
        <div className="border-t border-border/40 lg:border-l lg:border-t-0 lg:border-border/40">
            <div className="flex items-center justify-between border-b border-foreground pb-3 px-4 pt-4 sm:px-6 lg:px-8">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-accent">Grupos em alta</span>
                <Link href="/groups" className="font-mono text-[11px] font-bold text-muted transition-opacity hover:opacity-60">Ver todos →</Link>
            </div>
            <div className="grid grid-cols-2 px-4 sm:px-6 lg:px-8">
                {groups.slice(0, 8).map((group, idx) => (
                    <Link
                        key={group.id}
                        href={`/groups/${group.slug ?? group.id}`}
                        className={`group grid grid-cols-[28px_36px_minmax(0,1fr)] items-center gap-3 py-3 transition-opacity hover:opacity-70
                            ${idx % 2 === 0 ? 'pr-4 border-r border-border/40' : 'pl-4'}
                            ${idx < groups.slice(0, 8).length - 2 ? 'border-b border-border/40' : ''}
                        `}
                    >
                        <span className={`font-serif text-[22px] italic leading-none ${idx < 3 ? 'text-accent' : 'text-muted/40'}`}>
                            {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className="h-9 w-9 flex-shrink-0 overflow-hidden bg-surface">
                            {group.profileImageUrl ? (
                                <Image src={group.profileImageUrl} alt={group.name} width={36} height={36} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: nameToGradient(group.name) }}>
                                    {group.name[0]}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[12px] font-bold text-foreground group-hover:text-accent transition-colors truncate leading-tight">
                                {group.name}
                            </p>
                            <p className="font-mono text-[9px] text-muted mt-0.5 truncate">
                                {group.agency?.name ?? group.nameHangul ?? 'Em alta'}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
