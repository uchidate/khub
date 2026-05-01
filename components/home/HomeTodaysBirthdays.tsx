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
        <section className="border-b border-border bg-gradient-to-r from-pink-500/5 to-accent/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center gap-3 mb-3">
                    <Cake className="w-4 h-4 text-pink-400 flex-shrink-0" />
                    <span className="text-xs font-black uppercase tracking-widest text-pink-400">
                        Aniversariantes de hoje
                    </span>
                    <Link href="/calendario" className="ml-auto text-[11px] text-muted hover:text-foreground transition-colors flex items-center gap-1">
                        Ver calendário <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-1">
                    {artists.map(artist => (
                        <Link
                            key={artist.id}
                            href={`/artists/${artist.slug ?? artist.id}`}
                            className="flex items-center gap-2.5 flex-shrink-0 group"
                        >
                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-surface border-2 border-pink-500/30 flex-shrink-0">
                                {artist.primaryImageUrl ? (
                                    <Image
                                        src={artist.primaryImageUrl}
                                        alt={artist.nameRomanized}
                                        fill
                                        className="object-cover object-top"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted text-xs font-bold bg-surface-hover">
                                        {artist.nameRomanized[0]}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-foreground group-hover:text-accent transition-colors leading-tight">
                                    {artist.nameRomanized}
                                </p>
                                <p className="text-[10px] text-pink-400 font-semibold">{artist.age} anos 🎂</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}
