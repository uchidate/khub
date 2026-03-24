import Link from "next/link"
import Image from "next/image"
import { SectionTitleBar } from '@/components/ui/SectionTitleBar'

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

export function HomeBlogSection({ posts: _ }: HomeBlogSectionProps) {
    return (
        <>
            {/* CTA Banner */}
            <section className="bg-background py-4 pb-12 sm:pb-4 px-4 sm:px-6 lg:px-12">
                <div className="max-w-7xl mx-auto">
                    <div
                        className="relative rounded-2xl overflow-hidden"
                        style={{ padding: 'clamp(1.25rem, 3vw, 2.5rem)', backgroundColor: 'var(--color-featured-bg)' }}
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
                                    Junte-se ao site<br />de <span className="text-accent">cultura coreana</span> no Brasil
                                </h2>
                                <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--color-featured-muted)' }}>
                                    Favorite artistas, acompanhe K-dramas e conecte-se com fãs de todo o Brasil.
                                </p>
                            </div>

                            {/* Right buttons */}
                            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end">
                                <Link
                                    href="/auth/register"
                                    className="w-full sm:w-auto lg:w-auto text-center bg-accent text-white font-bold text-[13.5px] rounded-full px-6 py-3.5 hover:brightness-110 transition-all min-h-[44px]"
                                >
                                    Criar conta grátis
                                </Link>
                                <Link
                                    href="/artists"
                                    className="cta-secondary w-full sm:w-auto lg:w-auto text-center font-semibold text-[13.5px] rounded-full px-6 py-3.5 transition-all min-h-[44px]"
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
