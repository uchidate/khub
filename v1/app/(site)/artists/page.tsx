import prisma from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export default async function ArtistsPage() {
    console.log('--- RENDERING ARTISTS PAGE ---')
    const artists = await prisma.artist.findMany({
        include: { agency: true }
    })
    console.log('ARTISTS FOUND:', artists.length)

    return (
        <div className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
            <header className="mb-12">
                <h1 className="text-4xl md:text-6xl font-black mb-4 hallyu-gradient-text uppercase tracking-tighter italic">Artistas</h1>
                <p className="text-zinc-500 max-w-xl text-lg font-medium">Os ícones, as vozes e o talento. Explore perfis detalhados das estrelas que definem a cultura coreana.</p>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-10">
                {artists.map((artist: any) => (
                    <div key={artist.id} className="group cursor-pointer">
                        <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-zinc-900 border border-white/5 card-hover shadow-2xl">
                            {artist.primaryImageUrl ? (
                                <img
                                    src={artist.primaryImageUrl}
                                    alt={artist.nameRomanized}
                                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700 brightness-[0.8] group-hover:brightness-100"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-zinc-700 italic font-black uppercase tracking-tighter text-2xl">No Image</div>
                            )}

                            {/* Overlay with info */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
                                <h3 className="text-2xl font-black text-white leading-tight mb-1">{artist.nameRomanized}</h3>
                                <p className="text-sm text-purple-500 font-bold mb-3">{artist.nameHangul}</p>
                                <div className="flex flex-wrap gap-2">
                                    {artist.roles?.split(',').map((role: string) => (
                                        <span key={role} className="text-[10px] uppercase font-black px-2 py-0.5 bg-white text-black rounded-sm">
                                            {role}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 group-hover:opacity-0 transition-opacity">
                            <h4 className="font-bold text-lg">{artist.nameRomanized}</h4>
                            <p className="text-xs text-zinc-500 font-medium">{artist.agency?.name || 'Independente'}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
