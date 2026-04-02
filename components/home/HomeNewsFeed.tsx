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
    initialCategory?: string
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
    const { bg } = getCategoryStyle(slug)
    return `linear-gradient(135deg,${bg},${bg}dd)`
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

// ── Hero block — post mais recente, destaque no topo ──────────────────────
function HeroBlock({ post }: { post: BlogFeedItem }) {
    const cs = getCategoryStyle(post.category?.slug)
    return (
        <Link
            href={`/blog/${post.slug}`}
            className="group relative block w-full overflow-hidden border-b border-border"
            style={{ aspectRatio: '21/9' }}
        >
            {post.coverImageUrl ? (
                <Image
                    src={post.coverImageUrl}
                    alt={post.title}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 70vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
            ) : (
                <div className="absolute inset-0" style={{ background: getCategoryThumbBg(post.category?.slug) }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                {post.category && (
                    <span
                        className="inline-block text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded mb-2"
                        style={{ backgroundColor: cs.color, color: 'white' }}
                    >
                        {post.category.name}
                    </span>
                )}
                <h3 className="text-[18px] sm:text-[22px] lg:text-[24px] font-bold text-white leading-[1.25] drop-shadow-sm line-clamp-2 group-hover:text-white/90 transition-colors">
                    {post.title}
                </h3>
                {post.excerpt && (
                    <p className="text-[12px] text-white/70 mt-1.5 line-clamp-2 hidden sm:block">{post.excerpt}</p>
                )}
                <div className="flex items-center gap-2 mt-2 text-[10px] text-white/55">
                    <span>{formatRelativeDate(post.publishedAt)}</span>
                    <span>·</span>
                    <span>{post.readingTimeMin} min de leitura</span>
                </div>
            </div>
        </Link>
    )
}

// ── Seção de categoria estilo newspaper — imagem hero + lista ──────────────
function NewspaperSection({ cat, posts }: { cat: typeof BLOG_CATEGORIES[0]; posts: BlogFeedItem[] }) {
    const [featured, ...rest] = posts
    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div
                className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-border"
                style={{ backgroundColor: `${cat.bg}55`, borderBottom: `1px solid ${cat.color}25` }}
            >
                <div className="flex items-center gap-1.5">
                    <span className="inline-block w-[3px] h-4 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.15em]" style={{ color: cat.color }}>
                        {cat.name}
                    </span>
                </div>
                <Link
                    href={`/blog?category=${cat.slug}`}
                    className="text-[10px] font-semibold hover:underline"
                    style={{ color: cat.color }}
                >
                    Ver mais →
                </Link>
            </div>

            {/* Post em destaque: imagem com overlay */}
            {featured && (
                <Link href={`/blog/${featured.slug}`} className="group relative block w-full aspect-video overflow-hidden border-b border-border flex-shrink-0">
                    {featured.coverImageUrl ? (
                        <Image
                            src={featured.coverImageUrl}
                            alt={featured.title}
                            fill
                            sizes="(max-width: 640px) 100vw, 40vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="absolute inset-0" style={{ background: getCategoryThumbBg(cat.slug) }} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    {isNew(featured.publishedAt) && (
                        <span className="absolute top-2 right-2 text-[7px] font-extrabold bg-accent text-white px-[5px] py-[2px] rounded uppercase tracking-[0.1em]">Novo</span>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="text-[13px] sm:text-[14px] font-bold text-white leading-[1.3] line-clamp-2 drop-shadow">
                            {featured.title}
                        </h3>
                        <span className="text-[9px] text-white/60 mt-1 block">{formatRelativeDate(featured.publishedAt)}</span>
                    </div>
                </Link>
            )}

            {/* Lista de posts abaixo (até 3, totalizando 4 por seção) */}
            <div className="flex flex-col divide-y divide-border">
                {rest.slice(0, 3).map(post => (
                    <Link
                        key={post.id}
                        href={`/blog/${post.slug}`}
                        className="group flex items-start gap-2.5 px-3 sm:px-4 py-2.5 hover:bg-accent-soft transition-colors"
                    >
                        <span className="text-[11px] text-muted/50 leading-none mt-[3px] flex-shrink-0">›</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-foreground group-hover:text-accent transition-colors leading-[1.4] line-clamp-2">
                                {post.title}
                            </p>
                            <span className="text-[9px] text-muted">{formatRelativeDate(post.publishedAt)}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}

export function HomeBlogFeed({ blogPosts, sidebarPosts, categoryCounts = {}, initialCategory }: HomeBlogFeedProps) {
    const validInitial = initialCategory && TABS.some(t => t.value === initialCategory) ? initialCategory : 'all'
    const [activeTab, setActiveTab] = useState(validInitial)
    const [visibleCount, setVisibleCount] = useState(8)

    const filteredPosts = activeTab === "all"
        ? blogPosts
        : blogPosts.filter(p => p.category?.slug === activeTab)

    const activeTabMeta = TABS.find(t => t.value === activeTab)

    return (
        <section className="border-b border-border">
            <div className="max-w-7xl mx-auto">

                {/* ── Cabeçalho editorial ─────────────────────────────────── */}
                <div className="flex items-center justify-between px-4 sm:px-6 lg:px-12 py-3 border-b border-border">
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">Do Blog</h2>
                    <Link
                        href="/blog"
                        className="text-[11px] font-semibold text-muted hover:text-accent transition-colors"
                    >
                        Ver todos →
                    </Link>
                </div>

                {/* ── Barra de categorias editorial ───────────────────────── */}
                <div
                    className="flex items-center gap-2 px-4 sm:px-6 lg:px-12 py-3 border-b border-border overflow-x-auto"
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
                                    <span
                                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: tab.color }}
                                    />
                                )}
                                {tab.label}
                                {tab.value !== 'all' && categoryCounts[tab.value] != null && (
                                    <span className="text-[10px] opacity-50 font-normal">
                                        {categoryCounts[tab.value]}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* ── Conteúdo: feed + sidebar ─────────────────────────────── */}
                <div className="grid md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_360px]">

                    {/* Esquerda — lista de artigos */}
                    <div className="border-b md:border-b-0 md:border-r border-border flex flex-col">
                        <div className="flex-1">
                            {filteredPosts.length === 0 && (
                                <p className="text-sm text-muted p-5">Nenhum artigo encontrado.</p>
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
                                            <span className="text-[9px] font-bold text-[#ff2d78]/50">
                                                {post.category?.name?.slice(0, 2).toUpperCase() ?? 'HH'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                                        {post.category && (() => {
                                            const style = getCategoryStyle(post.category.slug)
                                            return (
                                                <span
                                                    className="inline-block text-[8px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded self-start"
                                                    style={{ color: style.color, backgroundColor: style.bg }}
                                                >
                                                    {post.category.name}
                                                </span>
                                            )
                                        })()}
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
                        {activeTab !== 'all' && activeTabMeta && (
                            <Link
                                href={`/blog?category=${activeTab}`}
                                className="flex items-center gap-1.5 px-4 sm:px-6 lg:px-12 py-2.5 border-t border-border text-[11px] font-semibold transition-colors hover:bg-accent-soft"
                                style={{ color: activeTabMeta.color }}
                            >
                                <span
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: activeTabMeta.color }}
                                />
                                Ver todos em {activeTabMeta.label} →
                            </Link>
                        )}
                    </div>

                    {/* Direita — sidebar de destaque */}
                    <div className="flex flex-col divide-y divide-border">
                        <div className="text-[9px] font-bold uppercase tracking-[0.13em] text-muted px-4 py-2.5 border-b border-border">
                            Artigos em destaque
                        </div>
                        <div>
                            {sidebarPosts.slice(0, 4).map(post => (
                                <Link
                                    key={post.id}
                                    href={`/blog/${post.slug}`}
                                    className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-accent-soft transition-colors group"
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
                                        <span className="text-[8.5px] text-muted mt-1 block">{post.readingTimeMin} min de leitura</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    )
}
