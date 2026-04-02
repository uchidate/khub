"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { BLOG_CATEGORY_BY_SLUG, BLOG_CATEGORIES, HOME_FEED_CATEGORIES } from "@/lib/config/categories"

interface BlogFeedItem {
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

interface ProductionItem {
    id: string
    titlePt: string
    type: string
    year: number | null
    imageUrl: string | null
    voteAverage: number | null
}

interface HomeBlogFeedProps {
    blogPosts: BlogFeedItem[]
    sidebarPosts: BlogFeedItem[]
    productions: ProductionItem[]
    categoryCounts?: Record<string, number>
}

const ALL_TAB = { label: "Todos", value: "all", color: '#6b7280', bg: '#f3f4f6' }
const TABS = [
    ALL_TAB,
    ...BLOG_CATEGORIES
        .filter(c => HOME_FEED_CATEGORIES.includes(c.slug))
        .sort((a, b) => HOME_FEED_CATEGORIES.indexOf(a.slug) - HOME_FEED_CATEGORIES.indexOf(b.slug))
        .map(c => ({ label: c.name, value: c.slug, color: c.color, bg: c.bg })),
]

function getCategoryStyle(slug: string | undefined): { color: string; bg: string } {
    if (!slug) return { color: '#9ca3af', bg: '#f3f4f6' }
    const cat = BLOG_CATEGORY_BY_SLUG[slug.toLowerCase()]
    return cat ? { color: cat.color, bg: cat.bg } : { color: '#9ca3af', bg: '#f3f4f6' }
}

function getCategoryThumbBg(slug: string | undefined): string {
    const { color, bg } = getCategoryStyle(slug)
    return `linear-gradient(135deg, ${bg}, ${color}22)`
}

function formatDate(iso: string | null) {
    if (!iso) return ''
    try {
        return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    } catch { return '' }
}

function isNew(iso: string | null, days = 7): boolean {
    if (!iso) return false
    return Date.now() - new Date(iso).getTime() < days * 24 * 60 * 60 * 1000
}

// ── Card vertical para o grid de categoria ─────────────────────────────────
function CategoryCard({ post }: { post: BlogFeedItem }) {
    const cs = getCategoryStyle(post.category?.slug)
    return (
        <Link
            href={`/blog/${post.slug}`}
            className="group flex flex-col p-3 hover:bg-accent-soft transition-colors h-full"
        >
            {/* Thumbnail */}
            <div
                className="relative w-full aspect-video rounded-md overflow-hidden mb-2.5 flex-shrink-0 border border-border/50"
                style={!post.coverImageUrl ? { background: getCategoryThumbBg(post.category?.slug) } : undefined}
            >
                {post.coverImageUrl ? (
                    <Image
                        src={post.coverImageUrl}
                        alt={post.title}
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <span
                        className="absolute inset-0 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: cs.color + '80' }}
                    >
                        {post.category?.name?.slice(0, 2) ?? 'HH'}
                    </span>
                )}
                {isNew(post.publishedAt) && (
                    <span className="absolute top-1 right-1 text-[7px] font-extrabold bg-accent text-white px-[5px] py-[2px] rounded uppercase tracking-[0.1em]">
                        Novo
                    </span>
                )}
            </div>
            {/* Meta */}
            <div className="flex flex-col gap-1 flex-1">
                <h3 className="text-[12.5px] font-bold text-foreground leading-[1.4] group-hover:text-accent transition-colors line-clamp-3">
                    {post.title}
                </h3>
                <div className="flex items-center gap-1.5 text-[9px] text-muted mt-auto pt-1">
                    <span>{formatDate(post.publishedAt)}</span>
                    <span>·</span>
                    <span>{post.readingTimeMin} min</span>
                </div>
            </div>
        </Link>
    )
}

// ── Card horizontal (featured) para o grid de categoria ────────────────────
function FeaturedCategoryCard({ post }: { post: BlogFeedItem }) {
    const cs = getCategoryStyle(post.category?.slug)
    return (
        <Link
            href={`/blog/${post.slug}`}
            className="group col-span-2 flex gap-3 p-3 hover:bg-accent-soft transition-colors border-b border-border/60 sm:border-b-0"
        >
            {/* Thumbnail — min-h garante renderização com next/image fill */}
            <div
                className="relative w-[120px] sm:w-[140px] min-h-[90px] sm:min-h-[110px] rounded-md overflow-hidden flex-shrink-0 border border-border/50"
                style={!post.coverImageUrl ? { background: getCategoryThumbBg(post.category?.slug) } : undefined}
            >
                {post.coverImageUrl ? (
                    <Image
                        src={post.coverImageUrl}
                        alt={post.title}
                        fill
                        sizes="(max-width: 640px) 120px, 140px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <span
                        className="absolute inset-0 flex items-center justify-center text-[11px] font-bold uppercase tracking-widest"
                        style={{ color: cs.color + '80' }}
                    >
                        {post.category?.name?.slice(0, 2) ?? 'HH'}
                    </span>
                )}
                {isNew(post.publishedAt) && (
                    <span className="absolute top-1 right-1 text-[7px] font-extrabold bg-accent text-white px-[5px] py-[2px] rounded uppercase tracking-[0.1em]">
                        Novo
                    </span>
                )}
            </div>
            {/* Meta */}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5 py-0.5">
                <h3 className="text-[13.5px] font-bold text-foreground leading-[1.4] group-hover:text-accent transition-colors line-clamp-3 sm:line-clamp-4">
                    {post.title}
                </h3>
                {post.excerpt && (
                    <p className="text-[11px] text-muted leading-snug line-clamp-2 hidden sm:block">
                        {post.excerpt}
                    </p>
                )}
                <div className="flex items-center gap-1.5 text-[9px] text-muted mt-auto">
                    <span>{formatDate(post.publishedAt)}</span>
                    <span>·</span>
                    <span>{post.readingTimeMin} min</span>
                </div>
            </div>
        </Link>
    )
}

export function HomeBlogFeed({ blogPosts, sidebarPosts, categoryCounts = {} }: HomeBlogFeedProps) {
    const [activeTab, setActiveTab] = useState("all")

    // Para o modo "Todos": agrupar posts por categoria (na ordem de HOME_FEED_CATEGORIES)
    const postsByCategory = HOME_FEED_CATEGORIES
        .map(slug => {
            const cat = BLOG_CATEGORIES.find(c => c.slug === slug)
            if (!cat) return null
            const posts = blogPosts.filter(p => p.category?.slug === slug).slice(0, 4)
            return posts.length > 0 ? { cat, posts } : null
        })
        .filter((g): g is { cat: typeof BLOG_CATEGORIES[0]; posts: BlogFeedItem[] } => g !== null)

    // Para aba específica: lista simples filtrada
    const filteredPosts = blogPosts.filter(p => p.category?.slug === activeTab)
    const activeTabMeta = TABS.find(t => t.value === activeTab)

    return (
        <section className="border-b border-border">
            <div className="max-w-7xl mx-auto">

                {/* ── Cabeçalho editorial ─────────────────────────────────── */}
                <div className="flex items-center justify-between px-4 sm:px-6 lg:px-12 py-3 border-b border-border">
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">Últimas notícias</h2>
                    <Link href="/blog" className="text-[11px] font-semibold text-muted hover:text-accent transition-colors">
                        Ver todos →
                    </Link>
                </div>

                {/* ── Barra de categorias editorial (sticky) ───────────────── */}
                <div
                    className="sticky top-[52px] sm:top-[60px] lg:top-[64px] z-10 flex items-center gap-2 px-4 sm:px-6 lg:px-12 py-3 border-b border-border overflow-x-auto bg-background/95 backdrop-blur-sm"
                    style={{ scrollbarWidth: 'none' }}
                >
                    {TABS.map(tab => {
                        const isActive = activeTab === tab.value
                        return (
                            <button
                                key={tab.value}
                                onClick={() => setActiveTab(tab.value)}
                                className={`shrink-0 flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full border transition-all ${
                                    isActive
                                        ? 'border-transparent'
                                        : 'border-border text-muted hover:text-foreground hover:border-foreground/20'
                                }`}
                                style={isActive
                                    ? { backgroundColor: tab.bg, color: tab.color, borderColor: tab.color + '33' }
                                    : undefined
                                }
                            >
                                {tab.value !== 'all' && (
                                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: tab.color }} />
                                )}
                                {tab.label}
                                {tab.value !== 'all' && categoryCounts[tab.value] != null && (
                                    <span className="text-[10px] opacity-50 font-normal ml-0.5">
                                        {categoryCounts[tab.value]}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* ── Conteúdo: feed + sidebar ─────────────────────────────── */}
                <div className="grid md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_360px]">

                    {/* Esquerda — conteúdo principal */}
                    <div className="border-b md:border-b-0 md:border-r border-border flex flex-col">

                        {/* ── MODO TODOS: seções por categoria ──────────────── */}
                        {activeTab === 'all' && (
                            <div>
                                {postsByCategory.length === 0 && (
                                    <p className="text-sm text-muted p-5">Nenhum artigo encontrado.</p>
                                )}
                                {postsByCategory.map(({ cat, posts }) => (
                                    <div key={cat.slug} className="border-b border-border last:border-b-0">

                                        {/* Header da categoria */}
                                        <div
                                            className="flex items-center justify-between px-4 sm:px-6 lg:px-12 py-2"
                                            style={{ backgroundColor: `${cat.bg}55`, borderBottom: `1px solid ${cat.color}25` }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="inline-block w-[3px] h-4 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: cat.color }}
                                                />
                                                <span
                                                    className="text-[10px] font-extrabold uppercase tracking-[0.15em]"
                                                    style={{ color: cat.color }}
                                                >
                                                    {cat.name}
                                                </span>
                                                {categoryCounts[cat.slug] != null && (
                                                    <span
                                                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                                                        style={{ color: cat.color, backgroundColor: cat.bg }}
                                                    >
                                                        {categoryCounts[cat.slug]}
                                                    </span>
                                                )}
                                            </div>
                                            <Link
                                                href={`/blog?category=${cat.slug}`}
                                                className="text-[10px] font-semibold hover:underline transition-colors"
                                                style={{ color: cat.color }}
                                            >
                                                Ver mais →
                                            </Link>
                                        </div>

                                        {/* Grid: 1 featured (horizontal) + até 2 cards verticais ao lado */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-border">
                                            {/* Featured (col-span-2 em sm) */}
                                            <div className="col-span-2 sm:col-span-2 border-border">
                                                <FeaturedCategoryCard post={posts[0]} />
                                            </div>
                                            {/* Cards menores empilhados, apenas no sm+ */}
                                            <div className="hidden sm:flex flex-col divide-y divide-border">
                                                {posts.slice(1, 3).map(post => (
                                                    <CategoryCard key={post.id} post={post} />
                                                ))}
                                                {/* Filler se só tem 1 card pequeno */}
                                                {posts.length === 2 && (
                                                    <Link
                                                        href={`/blog?category=${cat.slug}`}
                                                        className="flex items-center justify-center gap-1.5 p-4 text-[11px] font-semibold transition-colors hover:bg-accent-soft"
                                                        style={{ color: cat.color }}
                                                    >
                                                        Ver mais em {cat.name} →
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── MODO CATEGORIA ESPECÍFICA: lista plana ─────────── */}
                        {activeTab !== 'all' && (
                            <div className="flex flex-col flex-1">
                                <div className="flex-1">
                                    {filteredPosts.length === 0 && (
                                        <p className="text-sm text-muted p-5">Nenhum artigo nessa categoria.</p>
                                    )}
                                    {filteredPosts.map((post) => (
                                        <Link
                                            key={post.id}
                                            href={`/blog/${post.slug}`}
                                            className="flex items-start gap-4 px-4 sm:px-6 lg:px-12 py-4 border-b border-border hover:bg-accent-soft transition-colors group"
                                        >
                                            <div
                                                className="w-24 h-[68px] rounded-lg flex-shrink-0 self-center overflow-hidden flex items-center justify-center border border-border/60"
                                                style={!post.coverImageUrl ? { background: getCategoryThumbBg(post.category?.slug) } : undefined}
                                            >
                                                {post.coverImageUrl ? (
                                                    <Image
                                                        src={post.coverImageUrl}
                                                        alt={post.title}
                                                        width={96}
                                                        height={68}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <span className="text-[9px] font-bold" style={{ color: getCategoryStyle(post.category?.slug).color }}>
                                                        {post.category?.name?.slice(0, 2).toUpperCase() ?? 'HH'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col gap-1">
                                                <h3 className="text-[13.5px] font-semibold text-foreground leading-[1.4] group-hover:text-accent transition-colors line-clamp-2">
                                                    {post.title}
                                                </h3>
                                                {post.excerpt && (
                                                    <p className="text-[11.5px] text-muted leading-snug line-clamp-2 hidden sm:block">
                                                        {post.excerpt}
                                                    </p>
                                                )}
                                                <div className="text-[9px] text-muted mt-auto flex items-center gap-[6px] flex-wrap pt-1">
                                                    <span>{formatDate(post.publishedAt)}</span>
                                                    <span>·</span>
                                                    <span>{post.readingTimeMin} min</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                                {/* CTA "Ver todos em [Categoria]" */}
                                {activeTabMeta && (
                                    <Link
                                        href={`/blog?category=${activeTab}`}
                                        className="flex items-center gap-1.5 px-4 sm:px-6 lg:px-12 py-2.5 border-t border-border text-[11px] font-semibold transition-colors hover:bg-accent-soft"
                                        style={{ color: activeTabMeta.color }}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeTabMeta.color }} />
                                        Ver todos em {activeTabMeta.label} →
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Direita — sidebar ──────────────────────────────────── */}
                    <div className="flex flex-col">

                        {/* Artigos em destaque */}
                        <div className="text-[9px] font-bold uppercase tracking-[0.13em] text-muted px-4 py-2.5 border-b border-border">
                            Em destaque
                        </div>
                        <div>
                            {sidebarPosts.slice(0, 4).map(post => (
                                <Link
                                    key={post.id}
                                    href={`/blog/${post.slug}`}
                                    className="flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-accent-soft transition-colors group"
                                >
                                    <div
                                        className="w-[58px] h-11 rounded-lg flex-shrink-0 overflow-hidden border border-border/60 flex items-center justify-center"
                                        style={!post.coverImageUrl ? { background: getCategoryThumbBg(post.category?.slug) } : undefined}
                                    >
                                        {post.coverImageUrl ? (
                                            <Image
                                                src={post.coverImageUrl}
                                                alt={post.title}
                                                width={58}
                                                height={44}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-[9px] font-bold" style={{ color: getCategoryStyle(post.category?.slug).color }}>
                                                {post.category?.name?.slice(0, 2).toUpperCase() ?? 'HH'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {post.category && (() => {
                                            const cs = getCategoryStyle(post.category.slug)
                                            return (
                                                <span
                                                    className="inline-block text-[8px] font-bold uppercase tracking-[0.1em] mb-1 px-1.5 py-0.5 rounded"
                                                    style={{ color: cs.color, backgroundColor: cs.bg }}
                                                >
                                                    {post.category.name}
                                                </span>
                                            )
                                        })()}
                                        <p className="text-[12.5px] font-bold text-foreground group-hover:text-accent transition-colors leading-[1.35] line-clamp-2">
                                            {post.title}
                                        </p>
                                        <span className="text-[8.5px] text-muted mt-1 block">{post.readingTimeMin} min</span>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Explorar categorias */}
                        <div className="text-[9px] font-bold uppercase tracking-[0.13em] text-muted px-4 py-2.5 border-t border-b border-border mt-auto">
                            Explorar categorias
                        </div>
                        <div className="flex flex-col">
                            {BLOG_CATEGORIES.map(cat => (
                                <Link
                                    key={cat.slug}
                                    href={`/blog?category=${cat.slug}`}
                                    className="group flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border last:border-b-0 hover:bg-accent-soft transition-colors"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span
                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: cat.color }}
                                        />
                                        <span className="text-[12.5px] font-semibold text-foreground group-hover:text-accent transition-colors truncate">
                                            {cat.name}
                                        </span>
                                    </div>
                                    {categoryCounts[cat.slug] != null && categoryCounts[cat.slug] > 0 ? (
                                        <span
                                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                                            style={{ color: cat.color, backgroundColor: cat.bg }}
                                        >
                                            {categoryCounts[cat.slug]}
                                        </span>
                                    ) : (
                                        <span className="text-[9px] text-muted/40 flex-shrink-0">→</span>
                                    )}
                                </Link>
                            ))}
                        </div>

                    </div>
                </div>
            </div>
        </section>
    )
}

