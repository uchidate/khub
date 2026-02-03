import prisma from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"

export const dynamic = 'force-dynamic'

export default async function NewsPage() {
    console.log('--- RENDERING NEWS PAGE ---')
    const news = await prisma.news.findMany({
        orderBy: { publishedAt: 'desc' }
    })

    return (
        <div className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
            <header className="mb-16">
                <h1 className="text-4xl md:text-6xl font-black mb-4 hallyu-gradient-text uppercase tracking-tighter italic">Notícias</h1>
                <p className="text-zinc-500 max-w-xl text-lg font-medium">Fique por dentro de tudo o que acontece no vibrante mundo do entretenimento coreano.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Featured News (First item) */}
                {news.length > 0 && (
                    <Link href={`/news/${news[0].id}`} className="lg:col-span-8 group cursor-pointer">
                        <div className="aspect-video rounded-3xl overflow-hidden bg-zinc-900 border border-white/5 relative shadow-2xl mb-6">
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
                            <div className="absolute top-6 left-6 z-20">
                                <span className="px-3 py-1 bg-purple-600 text-white font-black text-[10px] uppercase tracking-widest rounded-sm">DESTAQUE</span>
                            </div>
                            <div className="absolute bottom-10 left-10 right-10 z-20">
                                <h2 className="text-3xl md:text-5xl font-black mb-4 leading-tight group-hover:text-purple-400 transition-colors">{news[0].title}</h2>
                                <p className="text-zinc-300 text-lg line-clamp-2 max-w-2xl">{news[0].contentMd}</p>
                            </div>
                            {news[0].imageUrl ? (
                                <Image
                                    src={news[0].imageUrl}
                                    alt={news[0].title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.7] group-hover:brightness-90"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center text-zinc-700 font-black italic text-4xl">HALLYU NEWS</div>
                            )}
                        </div>
                    </Link>
                )}

                {/* Side Column/Grid for others */}
                <div className="lg:col-span-4 space-y-10">
                    {news.slice(1, 4).map((item: any) => (
                        <Link href={`/news/${item.id}`} key={item.id} className="group cursor-pointer block">
                            <div className="flex gap-6">
                                <div className="w-24 h-50 rounded-2xl bg-zinc-900 border border-white/5 flex-shrink-0 relative overflow-hidden">
                                    {item.imageUrl ? (
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.title}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-tr from-purple-900/20 to-black" />
                                    )}
                                </div>
                                <div>
                                    <div className="flex gap-2 mb-2">
                                        {item.tags?.slice(0, 2).map((tag: string) => (
                                            <span key={tag} className="text-[9px] font-black text-purple-600 uppercase tracking-widest">{tag}</span>
                                        ))}
                                    </div>
                                    <h3 className="font-bold text-lg mb-2 group-hover:text-purple-500 transition-colors leading-snug">{item.title}</h3>
                                    <p className="text-xs text-zinc-500 font-bold">{new Date(item.publishedAt).toLocaleDateString('pt-BR')}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Bottom Grid for the rest */}
                <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-10 mt-10">
                    {news.slice(4).map((item: any) => (
                        <Link href={`/news/${item.id}`} key={item.id} className="group cursor-pointer flex flex-col bg-zinc-900/40 p-6 rounded-3xl border border-white/5 hover:bg-zinc-900 transition-colors h-full">
                            <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-zinc-800 mb-6 relative">
                                {item.imageUrl ? (
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-zinc-700 font-black italic text-xl">NEWS</div>
                                )}
                            </div>
                            <h3 className="text-xl font-bold mb-4 group-hover:text-purple-500 transition-colors">{item.title}</h3>
                            <p className="text-sm text-zinc-400 line-clamp-3 mb-6 font-medium">{item.contentMd}</p>
                            <div className="flex justify-between items-center mt-auto border-t border-white/5 pt-4">
                                <span className="text-[10px] font-black text-zinc-600">{new Date(item.publishedAt).toLocaleDateString('pt-BR')}</span>
                                <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest group-hover:translate-x-1 transition-transform inline-block">Ler mais →</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
