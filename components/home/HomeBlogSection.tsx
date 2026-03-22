import Link from "next/link"

interface BlogPost {
    id: string
    slug: string
    title: string
    excerpt: string | null
    coverImageUrl: string | null
    publishedAt: string | null
    readingTimeMin: number
    category: { name: string; slug: string } | null
    tags: string[]
}

interface HomeBlogSectionProps {
    posts: BlogPost[]
}

const CATEGORY_EMOJI: Record<string, string> = {
    opinion: "💬",
    analysis: "🔍",
    guide: "📖",
    review: "⭐",
    news: "📰",
    interview: "🎤",
    culture: "🌸",
    music: "🎵",
    drama: "🎬",
    beauty: "💄",
    default: "✍️",
}

function getCategoryEmoji(category: string | undefined | null): string {
    if (!category) return CATEGORY_EMOJI.default
    const key = category.toLowerCase()
    return (
        CATEGORY_EMOJI[key] ??
        Object.entries(CATEGORY_EMOJI).find(([k]) => key.includes(k))?.[1] ??
        CATEGORY_EMOJI.default
    )
}

export function HomeBlogSection({ posts }: HomeBlogSectionProps) {
    const safePosts = posts ?? []

    return (
        <>
            {/* Part A — Blog grid */}
            <section className="border-b border-border bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-[18px] font-extrabold tracking-[-0.04em] text-foreground">
                            Do nosso <span className="text-accent">blog</span>
                        </h2>
                        <Link
                            href="/blog"
                            className="text-[11px] font-bold text-muted hover:text-accent transition-colors"
                        >
                            Ver todos →
                        </Link>
                    </div>

                    {safePosts.length > 0 ? (
                        <div
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-[14px] overflow-hidden"
                            style={{ gap: '1.5px', backgroundColor: 'var(--color-border)', border: '1.5px solid var(--color-border)' }}
                        >
                            {safePosts.map((post) => (
                                <Link
                                    key={post.id}
                                    href={`/blog/${post.slug}`}
                                    className="group flex flex-col bg-background hover:bg-accent-soft transition-colors min-h-[44px]"
                                >
                                    <div className="p-4 pb-3 flex-1 flex flex-col">
                                        {/* Template header with line divider */}
                                        <div className="flex items-center gap-1.5 mb-3">
                                            <span className="text-[13px]" role="img" aria-label={post.category?.name ?? "post"}>
                                                {getCategoryEmoji(post.category?.slug)}
                                            </span>
                                            <span className="text-[8px] font-bold uppercase tracking-[0.11em] text-muted">
                                                {post.category?.name ?? "Blog"}
                                            </span>
                                            <div className="flex-1 h-px bg-border" />
                                        </div>
                                        {post.category && (
                                            <span className="sr-only">{post.category.name}</span>
                                        )}
                                        <h3 className="text-sm font-bold text-foreground group-hover:text-accent transition-colors leading-snug line-clamp-2 flex-1 mb-2">
                                            {post.title}
                                        </h3>
                                        {post.excerpt && (
                                            <p className="text-xs text-muted leading-relaxed line-clamp-2 mb-3">
                                                {post.excerpt}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                                            <div className="flex flex-wrap gap-1">
                                                {post.tags?.slice(0, 2).map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full bg-accent-soft text-accent border border-accent/15"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                            <span className="text-[9px] text-muted font-medium whitespace-nowrap ml-2">
                                                {post.readingTimeMin} min
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted">Nenhum post disponível no momento.</p>
                    )}
                </div>
            </section>

            {/* Part B — CTA Banner */}
            <section className="bg-background py-4 px-4 sm:px-6 lg:px-12">
                <div className="max-w-7xl mx-auto">
                    <div
                        className="relative rounded-2xl overflow-hidden"
                        style={{ padding: 'clamp(1.5rem, 4vw, 3.5rem)', backgroundColor: 'var(--color-featured-bg)' }}
                    >
                        {/* Radial pink glow */}
                        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 75% 30%, rgba(255,45,120,0.30) 0%, transparent 60%)' }} />
                        {/* Hangul decoration */}
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[6rem] lg:text-[9rem] font-extrabold select-none pointer-events-none leading-none" style={{ color: 'rgba(255,111,163,0.06)' }} aria-hidden>한</span>

                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 lg:gap-12 items-center">
                            {/* Left */}
                            <div>
                                <p className="text-[8.5px] font-bold uppercase tracking-[0.16em] text-accent mb-2.5">
                                    Comunidade HallyuHub
                                </p>
                                <h2
                                    className="text-[1.5rem] sm:text-[1.875rem] lg:text-[2.2rem] font-extrabold tracking-[-0.05em] leading-[1.1] mb-2.5"
                                    style={{ color: 'var(--color-featured-fg)' }}
                                >
                                    Junte-se à maior comunidade<br />de <span className="text-accent">cultura coreana</span> do Brasil.
                                </h2>
                                <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--color-featured-muted)' }}>
                                    Favorite artistas, acompanhe K-dramas e conecte-se com fãs de todo o Brasil.
                                </p>
                            </div>

                            {/* Right buttons */}
                            <div className="flex flex-row lg:flex-col gap-3 lg:items-end">
                                <Link
                                    href="/auth/register"
                                    className="flex-1 lg:flex-none text-center bg-accent text-white font-bold text-[13.5px] rounded-full px-6 py-3.5 hover:brightness-110 transition-all min-h-[44px] whitespace-nowrap"
                                >
                                    Criar conta grátis
                                </Link>
                                <Link
                                    href="/artists"
                                    className="cta-secondary flex-1 lg:flex-none text-center font-semibold text-[13.5px] rounded-full px-6 py-3.5 transition-all min-h-[44px] whitespace-nowrap"
                                >
                                    Explorar a plataforma
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}
