import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Sobre | HallyuHub',
    description: 'Conheça o HallyuHub — o portal de referência da cultura coreana em português. Perfis de artistas, K-Dramas, notícias e um feed personalizado para fãs brasileiros.',
    openGraph: {
        title: 'Sobre o HallyuHub',
        description: 'Conheça o HallyuHub — o portal de referência da cultura coreana em português. Perfis de artistas, K-Dramas, notícias e um feed personalizado para fãs brasileiros.',
        url: 'https://www.hallyuhub.com.br/about',
        type: 'website',
    },
}

const pillars = [
    {
        label: 'Artistas',
        heading: 'Perfis completos',
        body: 'Discografia, filmografia, grupos musicais, redes sociais e tudo sobre os ídolos e atores que você acompanha — em um único lugar, em português.',
    },
    {
        label: 'Produções',
        heading: 'Dramas & filmes',
        body: 'Catálogo completo de K-Dramas e filmes coreanos com sinopse, elenco e onde assistir no Brasil.',
    },
    {
        label: 'Notícias',
        heading: 'Feed personalizado',
        body: 'Acompanhe as últimas novidades sobre os artistas que você segue. Siga favoritos e receba um feed feito para você.',
    },
]

export default function AboutPage() {
    return (
        <div className="pt-24 md:pt-40 pb-32 px-4 sm:px-12 md:px-20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/10 blur-[160px] -z-10" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-600/10 blur-[160px] -z-10" />

            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <header className="mb-24">
                    <span className="text-purple-500 font-black text-xs tracking-[0.3em] uppercase mb-5 block">Sobre</span>
                    <h1 className="text-6xl md:text-8xl font-black mb-8 hallyu-gradient-text tracking-tighter uppercase leading-none">
                        CULTURA COREANA<br />
                        EM PORTUGUÊS
                    </h1>
                    <p className="text-xl md:text-2xl text-zinc-400 leading-relaxed max-w-2xl">
                        O HallyuHub é o portal de referência da Hallyu Wave para o público brasileiro — artistas, produções e notícias reunidos em uma plataforma moderna e acessível.
                    </p>
                </header>

                {/* Missão */}
                <section className="mb-20">
                    <div className="border-l-2 border-purple-500 pl-8">
                        <h2 className="text-xs font-black tracking-[0.3em] uppercase text-purple-500 mb-4">Missão</h2>
                        <p className="text-2xl md:text-3xl font-bold text-white leading-snug">
                            Eliminar as barreiras linguísticas entre o Brasil e a Coreia do Sul, entregando informações precisas e conteúdo de qualidade para os fãs que movem essa cultura.
                        </p>
                    </div>
                </section>

                {/* Pilares */}
                <section className="mb-24">
                    <h2 className="text-xs font-black tracking-[0.3em] uppercase text-zinc-500 mb-10">O que oferecemos</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {pillars.map(({ label, heading, body }) => (
                            <div key={label} className="p-8 rounded-3xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                                <span className="text-purple-400 text-xs font-black tracking-widest uppercase">{label}</span>
                                <h3 className="text-xl font-black text-white">{heading}</h3>
                                <p className="text-zinc-500 text-sm leading-relaxed">{body}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <div className="p-10 md:p-14 bg-white text-black rounded-[40px] text-center mb-10">
                    <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter uppercase italic leading-none">
                        O Brasil também é Hallyu.
                    </h2>
                    <p className="text-zinc-600 font-semibold mb-0 max-w-md mx-auto leading-snug text-lg">
                        Feito por fãs, para fãs. Com carinho e tecnologia.
                    </p>
                </div>

                {/* Links */}
                <div className="flex flex-wrap gap-4 justify-center pt-2">
                    <a
                        href="https://www.instagram.com/hallyuhub_br/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold hover:opacity-90 transition-opacity"
                    >
                        Instagram · @hallyuhub_br
                    </a>
                    <Link
                        href="/contato"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/15 text-zinc-400 text-sm font-bold hover:text-white hover:border-white/30 transition-colors"
                    >
                        Fale conosco
                    </Link>
                </div>

            </div>
        </div>
    )
}
