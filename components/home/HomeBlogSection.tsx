import Link from "next/link"

interface SiteStats {
    artists: number
    groups: number
    productions: number
}

interface HomeBlogSectionProps {
    siteStats: SiteStats
    isLoggedIn?: boolean
}

function formatCount(n: number): string {
    if (n >= 1000) return `${Math.floor(n / 100) * 100}+`
    if (n >= 100) return `${Math.floor(n / 10) * 10}+`
    return `${n}+`
}

const STATS = (stats: SiteStats) => [
    { label: 'artistas', value: formatCount(stats.artists) },
    { label: 'grupos', value: formatCount(stats.groups) },
    { label: 'produções', value: formatCount(stats.productions) },
]

export function HomeBlogSection({ siteStats, isLoggedIn }: HomeBlogSectionProps) {
    return (
        <section className="bg-background py-4 pb-12 sm:pb-4 px-4 sm:px-6 lg:px-12">
            <div className="max-w-7xl mx-auto">
                <div
                    className="relative rounded-2xl overflow-hidden border border-border bg-surface"
                    style={{ padding: 'clamp(1.25rem, 3vw, 2.5rem)' }}
                >
                    <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{ background: 'radial-gradient(ellipse at 80% 25%, rgba(148,163,184,0.7) 0%, transparent 60%)' }} />

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 lg:gap-12 items-center">
                        {/* Left */}
                        <div>
                            <p className="text-[8.5px] font-bold uppercase tracking-[0.16em] text-accent mb-2.5">
                                Comunidade HallyuHub
                            </p>
                            <h2
                                className="text-[1.5rem] sm:text-[1.875rem] lg:text-[2.2rem] font-extrabold tracking-[-0.05em] leading-[1.1] mb-2.5"
                                style={{ color: 'var(--color-foreground)' }}
                            >
                                {isLoggedIn ? (
                                    <>Obrigado por fazer parte<br />da comunidade <span className="text-accent">HallyuHub</span></>
                                ) : (
                                    <>Junte-se ao site<br />de <span className="text-accent">cultura coreana</span> no Brasil</>
                                )}
                            </h2>
                            <p className="text-[12.5px] leading-relaxed mb-4" style={{ color: 'var(--color-featured-muted)' }}>
                                {isLoggedIn
                                    ? 'Explore artistas, acompanhe K-dramas e descubra novos conteúdos todos os dias.'
                                    : 'Favorite artistas, acompanhe K-dramas e conecte-se com fãs de todo o Brasil.'}
                            </p>
                            {/* Stats pills */}
                            <div className="flex flex-wrap gap-2">
                                {STATS(siteStats).map(({ label, value }) => (
                                    <span
                                        key={label}
                                        className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full border border-border bg-background text-foreground"
                                    >
                                        <span className="text-accent font-bold">{value}</span>
                                        {label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Right buttons */}
                        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end">
                            {!isLoggedIn && (
                                <Link
                                    href="/auth/register"
                                    className="w-full sm:w-auto lg:w-auto text-center bg-foreground text-background font-bold text-[13.5px] rounded-full px-6 py-3.5 hover:opacity-90 transition-all min-h-[44px]"
                                >
                                    Criar conta grátis
                                </Link>
                            )}
                            <Link
                                href="/blog"
                                className="cta-secondary w-full sm:w-auto lg:w-auto text-center font-semibold text-[13.5px] rounded-full px-6 py-3.5 transition-all min-h-[44px]"
                            >
                                Explorar artigos
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
