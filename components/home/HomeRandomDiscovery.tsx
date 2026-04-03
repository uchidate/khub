import Link from "next/link"

interface RandomArtist {
    id: string
    nameRomanized: string
}

interface RandomGroup {
    id: string
    name: string
}

interface RandomProduction {
    id: string
    titlePt: string
}

interface HomeRandomDiscoveryProps {
    artist: RandomArtist | null
    group: RandomGroup | null
    production: RandomProduction | null
}

export function HomeRandomDiscovery({ artist, group, production }: HomeRandomDiscoveryProps) {
    if (!artist && !group && !production) return null

    return (
        <section className="bg-background pt-3 sm:pt-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="rounded-2xl border border-border bg-surface/40">
                    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-col gap-3 sm:gap-4">
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted">Aleatorio do dia</p>
                            <h3 className="text-[15px] sm:text-[17px] font-bold text-foreground mt-1">Descubra algo novo</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                            {artist && (
                                <Link
                                    href={`/artists/${artist.id}`}
                                    className="rounded-xl border border-border bg-background px-3 py-3 hover:bg-surface transition-colors"
                                >
                                    <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted mb-1">Artista</p>
                                    <p className="text-[12.5px] font-semibold text-foreground line-clamp-1">{artist.nameRomanized}</p>
                                </Link>
                            )}

                            {group && (
                                <Link
                                    href={`/groups/${group.id}`}
                                    className="rounded-xl border border-border bg-background px-3 py-3 hover:bg-surface transition-colors"
                                >
                                    <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted mb-1">Grupo</p>
                                    <p className="text-[12.5px] font-semibold text-foreground line-clamp-1">{group.name}</p>
                                </Link>
                            )}

                            {production && (
                                <Link
                                    href={`/productions/${production.id}`}
                                    className="rounded-xl border border-border bg-background px-3 py-3 hover:bg-surface transition-colors"
                                >
                                    <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted mb-1">Producao</p>
                                    <p className="text-[12.5px] font-semibold text-foreground line-clamp-1">{production.titlePt}</p>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}