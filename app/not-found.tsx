import Link from 'next/link'
import { Home, Search, Newspaper, Users, Film } from 'lucide-react'

export default function NotFound() {
    const quickLinks = [
        { label: 'Artistas', href: '/artists', icon: Users },
        { label: 'Notícias', href: '/news', icon: Newspaper },
        { label: 'Filmes & Séries', href: '/productions', icon: Film },
    ]

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 text-center">
            {/* Glow background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-purple-600/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/3 w-[400px] h-[300px] bg-pink-600/8 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-lg mx-auto">
                {/* 404 */}
                <div className="mb-6">
                    <p className="text-[120px] md:text-[160px] font-black leading-none tracking-tighter bg-gradient-to-br from-purple-500 via-pink-500 to-purple-800 bg-clip-text text-transparent select-none">
                        404
                    </p>
                </div>

                {/* Logo */}
                <p className="text-xl font-black tracking-tighter uppercase mb-4">
                    <span className="text-purple-500">HALLYU</span>
                    <span className="text-pink-500">HUB</span>
                </p>

                <h1 className="text-2xl md:text-3xl font-black text-white mb-3">
                    Página não encontrada
                </h1>
                <p className="text-zinc-400 text-base mb-10">
                    O conteúdo que você procura não existe ou foi movido.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-full hover:from-purple-500 hover:to-pink-500 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-purple-900/30"
                    >
                        <Home className="w-4 h-4" />
                        Ir para o início
                    </Link>
                    <Link
                        href="/search"
                        className="flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-white/10 text-zinc-300 font-bold rounded-full hover:border-purple-500/50 hover:text-white transition-all"
                    >
                        <Search className="w-4 h-4" />
                        Buscar
                    </Link>
                </div>

                {/* Quick links */}
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-600 mb-4">
                        Explorar
                    </p>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                        {quickLinks.map(({ label, href, icon: Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900/60 border border-white/5 hover:border-purple-500/30 text-zinc-400 hover:text-white text-sm font-medium transition-all"
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
