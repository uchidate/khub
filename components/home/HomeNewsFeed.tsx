"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { SafeImage } from "@/components/ui/SafeImage"
import { BLOG_CATEGORY_BY_SLUG, BLOG_CATEGORIES, HOME_FEED_CATEGORIES } from "@/lib/config/categories"
import { AdBanner } from "@/components/ui/AdBanner"

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
    initialTag?: string
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

function formatRelativeDate(iso: string | null): string {
    if (!iso) return ''
    try {
        const diff = Date.now() - new Date(iso).getTime()
        const minutes = Math.floor(diff / 60_000)
        const hours = Math.floor(diff / 3_600_000)
        const days = Math.floor(diff / 86_400_000)
        if (minutes < 2) return 'Agora'
        if (minutes < 60) return `${minutes}min atrás`
        if (hours < 24) return `${hours}h atrás`
        if (days === 1) return 'Ontem'
        if (days < 7) return `há ${days} dias`
        if (days < 30) return `há ${Math.ceil(days / 7)} sem.`
        return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
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
            style={{ aspectRatio: '16/9' }}
        >
            {post.coverImageUrl ? (
                <SafeImage
                    src={post.coverImageUrl}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 70vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    fallback={<div className="absolute inset-0" style={{ background: getCategoryThumbBg(post.category?.slug) }} />}
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
                        <SafeImage
                            src={featured.coverImageUrl}
                            alt={featured.title}
                            fill
                            sizes="(max-width: 640px) 100vw, 40vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            fallback={<div className="absolute inset-0" style={{ background: getCategoryThumbBg(cat.slug) }} />}
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

// Componente minúsculo só para ler searchParams — permite SSR do componente pai
function CategoryUrlSync({ onSync }: { onSync: (cat: string | null) => void }) {
    const searchParams = useSearchParams()
    useEffect(() => {
        const cat = searchParams.get('category')
        onSync(cat)
    }, [searchParams, onSync])
    return null
}

export function HomeBlogFeed({ blogPosts, sidebarPosts, categoryCounts = {}, initialCategory, initialTag }: HomeBlogFeedProps) {
    const validInitial = initialCategory && TABS.some(t => t.value === initialCategory) ? initialCategory : 'all'
    const [activeTab, setActiveTab] = useState(validInitial)
    const availableTags = Object.entries(
        blogPosts.reduce<Record<string, number>>((acc, post) => {
            for (const t of post.tags ?? []) {
                const tag = t.trim().toLowerCase()
                if (!tag) continue
                acc[tag] = (acc[tag] ?? 0) + 1
            }
            return acc
        }, {})
    )
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 10)
    const validInitialTag = initialTag && availableTags.some(([t]) => t === initialTag) ? initialTag : 'all'
    const [activeTag, setActiveTag] = useState(validInitialTag)
    const [visibleCount, setVisibleCount] = useState(8)

    function handleTabChange(value: string) {
        setActiveTab(value)
        setVisibleCount(8)
    }

    function handleTagChange(value: string) {
        setActiveTag(value)
        setVisibleCount(8)
    }

    const basePosts = activeTab === 'all'
        ? blogPosts
        : blogPosts.filter(p => p.category?.slug === activeTab)

    const scopedPosts = activeTag === 'all'
        ? basePosts
        : basePosts.filter(p => (p.tags ?? []).map(t => t.toLowerCase()).includes(activeTag))

    // Hero: post mais recente apenas no modo Todos sem filtro de tag
    const heroPost = activeTab === 'all' && activeTag === 'all' ? (scopedPosts[0] ?? null) : null
    const postsForCategories = heroPost ? scopedPosts.slice(1) : scopedPosts

    // Para o modo "Todos": agrupar posts por categoria (na ordem de HOME_FEED_CATEGORIES)
    const postsByCategory = HOME_FEED_CATEGORIES
        .map(slug => {
            const cat = BLOG_CATEGORIES.find(c => c.slug === slug)
            if (!cat) return null
            const posts = postsForCategories.filter(p => p.category?.slug === slug).slice(0, 4)
            return posts.length > 0 ? { cat, posts } : null
        })
        .filter((g): g is { cat: typeof BLOG_CATEGORIES[0]; posts: BlogFeedItem[] } => g !== null)

    // Para aba específica: lista simples filtrada
    const filteredPosts = scopedPosts
    const activeTabMeta = TABS.find(t => t.value === activeTab)

    return (
        <section className="bg-background pt-3 pb-4 sm:pt-5 sm:pb-6">
            {/* Sync de categoria via URL — isolado em Suspense para permitir SSR do restante */}
            <Suspense>
                <CategoryUrlSync onSync={(cat) => {
                    if (cat && TABS.some(t => t.value === cat)) setActiveTab(cat)
                    else if (!cat) setActiveTab('all')
                }} />
            </Suspense>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="rounded-2xl border border-border bg-background shadow-[0_1px_0_rgba(15,23,42,0.04)]">

                {/* ── Cabeçalho editorial ─────────────────────────────────── */}
                <div className="flex items-center justify-between px-4 sm:px-6 lg:px-12 py-3 border-b border-border">
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">Últimas notícias</h2>
                    <Link href="/blog" className="text-[11px] font-semibold text-muted hover:text-foreground transition-colors">
                        Ver todos →
                    </Link>
                </div>

                {/* ── Barra de categorias editorial (sticky) ───────────────── */}
                <div
                    className="sticky top-[52px] sm:top-[60px] lg:top-[64px] z-10 flex items-center gap-2 px-4 sm:px-6 lg:px-12 py-3 border-b border-border overflow-x-auto bg-background"
                    style={{ scrollbarWidth: 'none' }}
                >
                    {TABS.map(tab => {
                        const isActive = activeTab === tab.value
                        return (
                            <button
                                key={tab.value}
                                onClick={() => handleTabChange(tab.value)}
                                className={`shrink-0 flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full border transition-all ${
                                    isActive
                                        ? 'border-foreground bg-foreground text-background'
                                        : 'border-border text-muted hover:text-foreground hover:border-foreground/20'
                                }`}
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

                {/* ── Tags populares ─────────────────────────────────────────── */}
                {availableTags.length > 0 && (
                    <div className="sticky top-[96px] sm:top-[104px] lg:top-[108px] z-10 flex items-center gap-2 px-4 sm:px-6 lg:px-12 py-2.5 border-b border-border overflow-x-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85" style={{ scrollbarWidth: 'none' }}>
                        <button
                            onClick={() => handleTagChange('all')}
                            className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                                activeTag === 'all'
                                    ? 'bg-foreground text-background border-foreground'
                                    : 'bg-surface text-muted border-border hover:text-foreground'
                            }`}
                        >
                            Todas as tags
                        </button>
                        {availableTags.map(([tag, count]) => (
                            <button
                                key={tag}
                                onClick={() => handleTagChange(tag)}
                                className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors inline-flex items-center gap-1 ${
                                    activeTag === tag
                                        ? 'bg-foreground text-background border-foreground'
                                        : 'bg-surface text-muted border-border hover:text-foreground'
                                }`}
                            >
                                <span>#{tag}</span>
                                <span className="text-[10px] opacity-60">{count}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Conteúdo: feed + sidebar ─────────────────────────────── */}
                <div className="grid md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_360px] rounded-b-2xl">

                    {/* Esquerda — conteúdo principal */}
                    <div className="border-b md:border-b-0 md:border-r border-border flex flex-col">

                        {/* ── MODO TODOS: hero + grade newspaper ────────────── */}
                        {activeTab === 'all' && (
                            <div>
                                {/* Hero: post mais recente */}
                                {heroPost && <HeroBlock post={heroPost} />}

                                {postsByCategory.length === 0 && (
                                    <p className="text-sm text-muted p-5">Nenhum artigo encontrado.</p>
                                )}

                                {/* Grade 2 colunas estilo newspaper */}
                                <div className="grid sm:grid-cols-2">
                                    {postsByCategory.map(({ cat, posts }, idx) => {
                                        const isLastOdd = idx === postsByCategory.length - 1 && postsByCategory.length % 2 !== 0
                                        return (
                                            <div
                                                key={cat.slug}
                                                className={[
                                                    'border-b border-border',
                                                    idx % 2 === 0 && !isLastOdd ? 'sm:border-r sm:border-border' : '',
                                                    isLastOdd ? 'sm:col-span-2 sm:border-r-0' : '',
                                                ].filter(Boolean).join(' ')}
                                            >
                                                <NewspaperSection cat={cat} posts={posts} />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── MODO CATEGORIA ESPECÍFICA: lista com paginação ─── */}
                        {activeTab !== 'all' && (
                            <div className="flex flex-col flex-1">
                                <div className="flex-1">
                                    {filteredPosts.length === 0 && (
                                        <p className="text-sm text-muted p-5">Nenhum artigo nessa combinação de tema e tag.</p>
                                    )}
                                    {filteredPosts.slice(0, visibleCount).map((post) => (
                                        <Link
                                            key={post.id}
                                            href={`/blog/${post.slug}`}
                                            className="flex items-start gap-3 sm:gap-4 px-4 sm:px-6 lg:px-12 py-3 sm:py-4 border-b border-border hover:bg-surface transition-colors group"
                                        >
                                            <div
                                                className="w-20 h-[58px] sm:w-24 sm:h-[68px] rounded-lg flex-shrink-0 self-center overflow-hidden flex items-center justify-center border border-border/60"
                                                style={!post.coverImageUrl ? { background: getCategoryThumbBg(post.category?.slug) } : undefined}
                                            >
                                                {post.coverImageUrl ? (
                                                    <SafeImage
                                                        src={post.coverImageUrl}
                                                        alt={post.title}
                                                        width={80}
                                                        height={58}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        fallback={<span className="text-[9px] font-bold" style={{ color: getCategoryStyle(post.category?.slug).color }}>{post.category?.name?.slice(0, 2).toUpperCase() ?? 'HH'}</span>}
                                                    />
                                                ) : (
                                                    <span className="text-[9px] font-bold" style={{ color: getCategoryStyle(post.category?.slug).color }}>
                                                        {post.category?.name?.slice(0, 2).toUpperCase() ?? 'HH'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col gap-1">
                                                <h3 className="text-[13px] sm:text-[13.5px] font-semibold text-foreground leading-[1.35] sm:leading-[1.4] group-hover:text-accent transition-colors line-clamp-2">
                                                    {post.title}
                                                </h3>
                                                {post.excerpt && (
                                                    <p className="text-[11.5px] text-muted leading-snug line-clamp-2 hidden sm:block">
                                                        {post.excerpt}
                                                    </p>
                                                )}
                                                <div className="text-[9px] text-muted mt-auto flex items-center gap-[6px] flex-wrap pt-1">
                                                    <span>{formatRelativeDate(post.publishedAt)}</span>
                                                    <span>·</span>
                                                    <span>{post.readingTimeMin} min</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                                {/* Carregar mais */}
                                {visibleCount < filteredPosts.length && (
                                    <button
                                        onClick={() => setVisibleCount(v => v + 8)}
                                        className="flex items-center justify-center gap-2 w-full py-3 border-t border-border text-[11px] font-semibold text-muted hover:text-accent hover:bg-accent-soft transition-colors"
                                    >
                                        Carregar mais
                                        <span className="text-[10px] opacity-60">({filteredPosts.length - visibleCount} restantes)</span>
                                    </button>
                                )}

                                {/* CTA "Ver todos em [Categoria]" */}
                                {activeTabMeta && visibleCount >= filteredPosts.length && (
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
                        <div className="text-[9px] font-bold uppercase tracking-[0.13em] text-muted px-4 py-2.5 border-b border-border bg-surface/35">
                            Em destaque
                        </div>
                        <div>
                            {sidebarPosts.slice(0, 8).map((post, idx) => (
                                <Link
                                    key={post.id}
                                    href={`/blog/${post.slug}`}
                                    className="flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-surface transition-colors group"
                                >
                                    <span className="text-[22px] font-black text-muted/15 leading-none w-7 flex-shrink-0 text-right tabular-nums select-none">
                                        {String(idx + 1).padStart(2, '0')}
                                    </span>
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
                                        <p className="text-[12.5px] font-bold text-foreground group-hover:text-foreground/80 transition-colors leading-[1.35] line-clamp-2">
                                            {post.title}
                                        </p>
                                        <span className="text-[8.5px] text-muted mt-1 block">{post.readingTimeMin} min · {formatRelativeDate(post.publishedAt)}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Ad entre Em destaque e Explorar categorias */}
                        <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_AUTO!} variant="auto" minimal className="px-3 py-2 border-b border-border" />

                        {/* Explorar categorias */}
                        <div className="text-[9px] font-bold uppercase tracking-[0.13em] text-muted px-4 py-2.5 border-t border-b border-border bg-surface/35">
                            Explorar categorias
                        </div>
                        <div className="flex flex-col">
                            {BLOG_CATEGORIES.map(cat => (
                                <Link
                                    key={cat.slug}
                                    href={`/blog?category=${cat.slug}`}
                                    className="group flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border last:border-b-0 hover:bg-surface transition-colors"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span
                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: cat.color }}
                                        />
                                        <span className="text-[12.5px] font-semibold text-foreground group-hover:text-foreground/80 transition-colors truncate">
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
            </div>
        </section>
    )
}

