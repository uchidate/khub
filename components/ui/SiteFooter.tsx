import Link from 'next/link'
import { Instagram } from 'lucide-react'
import { BrandDot } from '@/components/ui/BrandDot'
import { BrandWaveDivider } from '@/components/ui/BrandWave'

const NAV_COLUMNS = [
    {
        heading: 'Explorar',
        links: [
            { label: 'Artistas', href: '/artists' },
            { label: 'Grupos', href: '/groups' },
            { label: 'Produções', href: '/productions' },
            { label: 'Calendário', href: '/calendario' },
            { label: 'Agências', href: '/agencies' },
        ],
    },
    {
        heading: 'Descobrir',
        links: [
            { label: 'Quiz K-Pop', href: '/quiz' },
            { label: 'Melhores Dramas', href: '/melhores-dramas' },
            { label: 'Blog', href: '/blog' },
            { label: 'K-Pop', href: '/blog?category=k-pop' },
            { label: 'K-Drama', href: '/blog?category=k-drama' },
        ],
    },
    {
        heading: 'Institucional',
        links: [
            { label: 'Sobre', href: '/about' },
            { label: 'Contato', href: '/contato' },
            { label: 'FAQ', href: '/faq' },
            { label: 'Política de Privacidade', href: '/privacidade' },
            { label: 'Termos de Uso', href: '/termos' },
        ],
    },
]

export function SiteFooter() {
    const year = new Date().getFullYear()

    return (
        <>
        <BrandWaveDivider duration={5000} />
        <footer className="bg-featured px-4 sm:px-8 lg:px-12 pt-10 sm:pt-14 pb-[calc(62px+1.5rem+env(safe-area-inset-bottom,0px))] sm:pb-10 font-sora">
            <div className="max-w-7xl mx-auto">

                {/* Grid principal */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 pb-10 border-b border-white/8">

                    {/* Marca + descrição + social */}
                    <div className="col-span-2 sm:col-span-1">
                        <Link href="/" className="inline-block">
                            <span className="text-[18px] font-extrabold tracking-tight text-white">
                                HallyuHub<BrandDot />
                            </span>
                        </Link>
                        <p className="text-[12px] text-white/40 mt-3 leading-relaxed max-w-[200px]">
                            O portal de referência de K-Pop, K-Drama e cultura coreana em português para fãs brasileiros.
                        </p>
                        <a
                            href="https://www.instagram.com/hallyuhub_br/"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Instagram HallyuHub"
                            className="inline-flex items-center gap-2 mt-5 text-[12px] text-white/40 hover:text-[#ff2d78] transition-colors"
                        >
                            <Instagram className="w-3.5 h-3.5" />
                            @hallyuhub_br
                        </a>
                    </div>

                    {/* Colunas de links */}
                    {NAV_COLUMNS.map(col => (
                        <div key={col.heading}>
                            <h3 className="text-[9px] font-black uppercase tracking-[0.18em] text-white/30 mb-4">
                                {col.heading}
                            </h3>
                            <ul className="space-y-2.5">
                                {col.links.map(({ label, href }) => (
                                    <li key={href}>
                                        <Link
                                            href={href}
                                            className="text-[12px] text-white/50 hover:text-white transition-colors leading-none"
                                        >
                                            {label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Rodapé inferior */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-6">
                    <span className="text-[10px] text-white/25">
                        &copy; {year} HallyuHub. Todos os direitos reservados.
                    </span>
                    <div className="flex items-center gap-4">
                        <Link href="/privacidade" className="text-[10px] text-white/25 hover:text-white/50 transition-colors">
                            Privacidade
                        </Link>
                        <Link href="/termos" className="text-[10px] text-white/25 hover:text-white/50 transition-colors">
                            Termos
                        </Link>
                        <span className="text-[10px] text-white/20">Feito com ♥ para fãs do Hallyu</span>
                    </div>
                </div>
            </div>
        </footer>
        </>
    )
}
