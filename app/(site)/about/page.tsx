export default function AboutPage() {
    return (
        <div className="pt-24 md:pt-40 pb-32 px-4 sm:px-12 md:px-20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[150px] -z-10" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-600/10 blur-[150px] -z-10" />

            <div className="max-w-4xl mx-auto">
                <header className="mb-20">
                    <span className="text-purple-500 font-black text-xs tracking-[0.3em] uppercase mb-4 block">Manifesto</span>
                    <h1 className="text-6xl md:text-8xl font-black mb-8 hallyu-gradient-text tracking-tighter uppercase leading-none">
                        PAIXÃO PELA <br />
                        ONDA COREANA
                    </h1>
                    <p className="text-2xl text-zinc-400 leading-relaxed font-medium">
                        O HallyuHub é mais do que um portal. É a maior hub de cultura coreana em língua portuguesa, desenhado para conectar fãs com o conteúdo que amam.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-24">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-black uppercase text-white">Missão</h2>
                        <p className="text-zinc-500 text-lg leading-relaxed">
                            Eliminar as barreiras linguísticas e geográficas, trazendo informações precisas, perfis ricos e as últimas novidades de Seul diretamente para o Brasil com uma interface de classe mundial.
                        </p>
                    </div>
                    <div className="space-y-6">
                        <h2 className="text-3xl font-black uppercase text-white">V1 & Futuro</h2>
                        <p className="text-zinc-500 text-lg leading-relaxed font-bold">
                            Esta versão 1.0 lança as bases de dados e design. No futuro, a V2 integrará inteligência artificial generativa para criar experiências personalizadas e recomendações imersivas.
                        </p>
                    </div>
                </div>

                <div className="p-12 bg-white text-black rounded-[40px] text-center">
                    <h2 className="text-4xl font-black mb-4 tracking-tighter uppercase italic">O Futuro é Hallyu.</h2>
                    <p className="font-bold text-zinc-600 mb-8 max-w-lg mx-auto leading-tight">Junte-se à revolução da cultura coreana com o portal mais moderno do país.</p>
                    <div className="w-16 h-1 w-full bg-purple-600 mx-auto rounded-full" />
                </div>
            </div>
        </div>
    )
}
