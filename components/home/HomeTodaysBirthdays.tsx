import Link from 'next/link'
import Image from 'next/image'
import { Cake, ChevronRight, Star } from 'lucide-react'

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

    const featured = artists[0]
    const rest = artists.slice(1)

    return (
        <section className="bg-background px-4 sm:px-6 lg:px-12 py-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                    <Cake className="w-4 h-4 text-pink-400 flex-shrink-0" />
                    <span className="text-xs font-black uppercase tracking-widest text-pink-400">
                        Aniversariantes de hoje
                    </span>
                    <Link
                        href="/calendario"
                        className="ml-auto text-[11px] text-muted hover:text-foreground transition-colors flex items-center gap-1"
                    >
                        Ver calendário <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                    {/* Card destaque — primeiro aniversariante */}
                    <Link
                        href={`/artists/${featured.slug ?? featured.id}`}
                        className="group relative flex-shrink-0 w-32 rounded-xl overflow-hidden border border-pink-500/20 hover:border-pink-500/50 transition-all duration-300"
                    >
                        {/* Imagem de fundo */}
                        <div className="relative h-40 bg-surface">
                            {featured.primaryImageUrl ? (
                                <Image
                                    src={featured.primaryImageUrl}
                                    alt={featured.nameRomanized}
                                    fill
                                    className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                                    sizes="192px"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-500/20 to-accent/20">
                                    <span className="text-4xl font-black text-pink-400/60">{featured.nameRomanized[0]}</span>
                                </div>
                            )}
                            {/* Gradiente inferior */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                            {/* Badge de destaque */}
                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-pink-500 text-white text-[9px] font-black uppercase tracking-wider rounded-full px-2 py-1">
                                <Star className="w-2.5 h-2.5 fill-current" />
                                Destaque
                            </div>

                            {/* Info no rodapé */}
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                                <p className="text-white font-black text-sm leading-tight truncate">
                                    {featured.nameRomanized}
                                </p>
                                {featured.nameHangul && (
                                    <p className="text-white/60 text-[10px] truncate">{featured.nameHangul}</p>
                                )}
                                <div className="flex items-center gap-1 mt-1.5">
                                    <Cake className="w-3 h-3 text-pink-400" />
                                    <span className="text-pink-300 text-[11px] font-bold">{featured.age} anos hoje</span>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Demais aniversariantes — cards compactos */}
                    {rest.map(artist => (
                        <Link
                            key={artist.id}
                            href={`/artists/${artist.slug ?? artist.id}`}
                            className="group relative flex-shrink-0 w-24 rounded-xl overflow-hidden border border-border hover:border-pink-500/40 transition-all duration-300"
                        >
                            <div className="relative h-40 bg-surface">
                                {artist.primaryImageUrl ? (
                                    <Image
                                        src={artist.primaryImageUrl}
                                        alt={artist.nameRomanized}
                                        fill
                                        className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                                        sizes="128px"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface to-surface-hover">
                                        <span className="text-2xl font-black text-muted/60">{artist.nameRomanized[0]}</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                                    <p className="text-white font-bold text-[11px] leading-tight truncate">
                                        {artist.nameRomanized}
                                    </p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <Cake className="w-2.5 h-2.5 text-pink-400" />
                                        <span className="text-pink-300 text-[10px] font-semibold">{artist.age} anos</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}
