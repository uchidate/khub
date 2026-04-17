import Link from 'next/link'
import { Home, Search, Newspaper, Users, Film } from 'lucide-react'

export default function NotFound() {
    const quickLinks = [
        { label: 'Artistas', href: '/artists', icon: Users },
        { label: 'Notícias', href: '/news', icon: Newspaper },
        { label: 'Filmes & Séries', href: '/productions', icon: Film },
    ]

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
            <div className="max-w-lg mx-auto">
                {/* 404 */}
                <p className="text-[120px] md:text-[160px] font-black leading-none tracking-tighter text-[#f0f0f0] select-none">
                    404
                </p>

                {/* Logo */}
                <p className="text-xl font-black tracking-[-0.04em] mb-4">
                    <span className="text-foreground">Hallyu</span>
                    <span className="text-[#ff2d78]">Hub</span>
                </p>

                <h1 className="text-2xl md:text-3xl font-black text-foreground mb-3">
                    Página não encontrada
                </h1>
                <p className="text-muted text-base mb-10">
                    O conteúdo que você procura não existe ou foi movido.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-6 py-3 bg-[#080808] text-white text-sm font-semibold rounded-full hover:bg-[#ff2d78] transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        Ir para o início
                    </Link>
                    <Link
                        href="/search"
                        className="flex items-center gap-2 px-6 py-3 border border-border text-foreground text-sm font-semibold rounded-full hover:bg-surface transition-colors"
                    >
                        <Search className="w-4 h-4" />
                        Buscar
                    </Link>
                </div>

                {/* Quick links */}
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted mb-4">
                        Explorar
                    </p>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                        {quickLinks.map(({ label, href, icon: Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className="flex items-center gap-2 px-4 py-2 rounded-full border border-border hover:border-[#ff2d78] text-muted hover:text-[#ff2d78] text-sm font-medium transition-all"
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
