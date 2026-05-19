import Link from 'next/link'
import Image from 'next/image'
import { Cake, ChevronRight } from 'lucide-react'

export interface BirthdayArtist {
    id: string
    slug: string | null
    nameRomanized: string
    nameHangul: string | null
    primaryImageUrl: string | null
    age: number
}

interface Props {
    artists: BirthdayArtist[]
}

export function HomeTodaysBirthdays({ artists }: Props) {
    if (artists.length === 0) return null

    return (
        <section className="bg-background py-5 sm:py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="home-border-pop overflow-hidden rounded-2xl border-violet bg-background shadow-sm">
                    <div className="flex items-center gap-2 border-b border-violet/20 bg-surface-media px-4 py-3 sm:px-6">
                        <Cake className="w-4 h-4 text-violet flex-shrink-0" />
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-violet">Calendário</p>
                            <p className="mt-0.5 text-[15px] sm:text-[17px] font-bold text-foreground">Aniversariantes de hoje</p>
                        </div>
                        <Link
                            href="/calendario"
                            className="ml-auto text-[11px] text-muted hover:text-foreground transition-colors flex items-center gap-1"
                        >
                            Ver calendário <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="flex gap-2.5 overflow-x-auto p-4 sm:gap-3 sm:p-5">
                        {artists.map(artist => (
                            <Link
                                key={artist.id}
                                href={`/artists/${artist.slug ?? artist.id}`}
                                className="group flex-shrink-0 w-20 sm:w-24 rounded-xl overflow-hidden border-2 border-violet/35 hover:border-violet transition-all duration-300"
                            >
                                <div className="relative h-24 sm:h-32 bg-surface">
                                    {artist.primaryImageUrl ? (
                                        <Image
                                            src={artist.primaryImageUrl}
                                            alt={artist.nameRomanized}
                                            fill
                                            className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                                            sizes="96px"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface to-surface-hover">
                                            <span className="text-2xl font-black text-muted/60">{artist.nameRomanized[0]}</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 p-2">
                                        <p className="text-white font-bold text-[10px] leading-tight truncate">
                                            {artist.nameRomanized}
                                        </p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <Cake className="w-2.5 h-2.5 text-violet" />
                                            <span className="text-violet text-[9px] font-semibold">{artist.age} anos</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
