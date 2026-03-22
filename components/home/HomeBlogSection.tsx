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
            <section className="border-b border-[#e8e8e8] bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-[18px] font-extrabold tracking-[-0.04em] text-[#080808]">
                            Do nosso <span className="text-[#ff2d78]">blog</span>
                        </h2>
                        <Link
                            href="/blog"
                            className="text-[11px] font-bold text-[#6b6b6b] hover:text-[#ff2d78] transition-colors"
                        >
                            Ver todos →
                        </Link>
                    </div>

                    {safePosts.length > 0 ? (
                        <div
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-[14px] overflow-hidden"
                            style={{ gap: '1.5px', backgroundColor: '#e8e8e8', border: '1.5px solid #e8e8e8' }}
                        >
                            {safePosts.map((post) => (
                                <Link
                                    key={post.id}
                                    href={`/blog/${post.slug}`}
                                    className="group flex flex-col bg-white hover:bg-[#fff0f5] transition-colors min-h-[44px]"
                                >
                                    <div className="p-4 pb-3 flex-1 flex flex-col">
                                        {/* Template header with line divider */}
                                        <div className="flex items-center gap-1.5 mb-3">
                                            <span className="text-[13px]" role="img" aria-label={post.category?.name ?? "post"}>
                                                {getCategoryEmoji(post.category?.slug)}
                                            </span>
                                            <span className="text-[8px] font-bold uppercase tracking-[0.11em] text-[#6b6b6b]">
                                                {post.category?.name ?? "Blog"}
                                            </span>
                                            <div className="flex-1 h-px bg-[#e8e8e8]" />
                                        </div>
                                        {post.category && (
                                            <span className="sr-only">{post.category.name}</span>
                                        )}
                                        <h3 className="text-sm font-bold text-[#080808] group-hover:text-[#ff2d78] transition-colors leading-snug line-clamp-2 flex-1 mb-2">
                                            {post.title}
                                        </h3>
                                        {post.excerpt && (
                                            <p className="text-xs text-[#6b6b6b] leading-relaxed line-clamp-2 mb-3">
                                                {post.excerpt}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#e8e8e8]">
                                            <div className="flex flex-wrap gap-1">
                                                {post.tags?.slice(0, 2).map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full bg-[rgba(255,45,120,0.08)] text-[#ff2d78] border border-[rgba(255,45,120,0.15)]"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                            <span className="text-[9px] text-[#6b6b6b] font-medium whitespace-nowrap ml-2">
                                                {post.readingTimeMin} min
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-[#6b6b6b]">Nenhum post disponível no momento.</p>
                    )}
                </div>
            </section>

            {/* Part B — CTA Banner */}
            <section className="bg-[#f5f5f7] py-10 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="relative bg-[#080808] rounded-2xl overflow-hidden px-8 md:px-12 py-10 md:py-12">
                        {/* Hangul decoration */}
                        <span
                            className="absolute text-[12rem] font-black text-white select-none pointer-events-none leading-none"
                            style={{
                                top: "50%",
                                left: "-2rem",
                                transform: "translateY(-50%)",
                                opacity: 0.03,
                            }}
                            aria-hidden="true"
                        >
                            한
                        </span>

                        {/* Radial pink glow */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: "radial-gradient(circle at 80% 50%, rgba(255,45,120,0.15) 0%, transparent 60%)",
                            }}
                        />

                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                            {/* Left content */}
                            <div className="flex-1 max-w-xl">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#ff2d78] mb-3">
                                    Comunidade HallyuHub
                                </p>
                                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-4">
                                    Junte-se à maior comunidade de cultura coreana do Brasil.
                                </h2>
                                <p className="text-sm text-white/60 leading-relaxed">
                                    Acesse conteúdo exclusivo, acompanhe seus artistas favoritos e conecte-se com fãs de todo o país.
                                </p>
                            </div>

                            {/* Right buttons */}
                            <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full sm:w-auto md:w-48 flex-shrink-0">
                                <Link
                                    href="/auth/register"
                                    className="flex items-center justify-center gap-2 bg-white text-[#080808] font-bold text-[14px] rounded-full px-6 py-3.5 hover:bg-[#ff2d78] hover:text-white transition-colors w-full min-h-[44px]"
                                >
                                    Criar conta grátis
                                </Link>
                                <Link
                                    href="/artists"
                                    className="flex items-center justify-center gap-2 bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] text-white font-semibold text-[14px] rounded-full px-6 py-3.5 hover:bg-white/15 transition-colors w-full min-h-[44px]"
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
