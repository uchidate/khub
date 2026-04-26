import Link from 'next/link'
import Image from 'next/image'
import { nameToGradient } from '@/lib/utils'

interface Agency {
    id: string
    name: string
    logoUrl: string | null
    accentColor: string | null
    type: string
    _count: { artists: number; musicalGroups: number }
}

export function HomeTopAgencies({ agencies }: { agencies: Agency[] }) {
    if (!agencies.length) return null

    return (
        <section className="border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
                <div className="flex items-center justify-between mb-5">
                    <span className="text-[9px] font-bold uppercase tracking-[0.13em] text-muted">Principais agências</span>
                    <Link href="/agencies" className="text-[9px] font-bold text-muted hover:text-accent transition-colors">Ver todas →</Link>
                </div>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
                    {agencies.slice(0, 12).map((agency) => {
                        const color = agency.accentColor ?? '#ff2d78'
                        return (
                            <Link
                                key={agency.id}
                                href={`/agencies/${agency.id}`}
                                className="group flex-shrink-0 flex flex-col items-center gap-2.5 w-[80px]"
                            >
                                {/* Logo */}
                                <div
                                    className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center border bg-surface transition-all duration-300 group-hover:shadow-md group-hover:scale-105"
                                    style={{ borderColor: `${color}25`, boxShadow: `0 0 0 0px ${color}00` }}
                                >
                                    {agency.logoUrl ? (
                                        <Image
                                            src={agency.logoUrl}
                                            alt={agency.name}
                                            width={56}
                                            height={56}
                                            className="object-contain w-full h-full p-2"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center" style={{ background: nameToGradient(agency.name) }}>
                                            <span className="text-lg font-black text-white drop-shadow-sm">
                                                {agency.name[0]}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="text-center w-full">
                                    <p className="text-[10px] font-semibold text-foreground group-hover:text-accent transition-colors leading-tight line-clamp-2">
                                        {agency.name}
                                    </p>
                                    <p className="text-[9px] text-muted/70 mt-0.5">
                                        {agency._count.artists} artistas
                                    </p>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
