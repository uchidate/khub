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
    const { bg } = getCategoryStyle(slug)
    return `linear-gradient(135deg,${bg},${bg}dd)`
}

function formatDate(iso: string | null) {
    if (!iso) return ''
    try {
        return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    } catch { return '' }
}

export function HomeBlogFeed({ blogPosts, sidebarPosts, categoryCounts = {} }: HomeBlogFeedProps) {
    const [activeTab, setActiveTab] = useState("all")

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
                            {filteredPosts.map((post, idx) => (
                                <Link
                                    key={post.id}
                                    href={`/blog/${post.slug}`}
                                    className="flex items-center gap-3.5 px-4 sm:px-6 lg:px-12 py-3 sm:py-3.5 border-b border-border hover:bg-accent-soft transition-colors group min-h-[56px]"
                                >
                                    <span className="text-[8.5px] font-bold text-muted w-3.5 flex-shrink-0">
                                        {String(idx + 1).padStart(2, "0")}
                                    </span>
                                    <div
                                        className="w-[58px] h-11 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center border border-border/60"
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
                                            <span className="text-[9px] font-bold text-[#ff2d78]/50">
                                                {post.category?.name?.slice(0, 2).toUpperCase() ?? 'HH'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {post.category && (() => {
                                            const style = getCategoryStyle(post.category.slug)
                                            return (
                                                <span
                                                    className="inline-block text-[8px] font-bold uppercase tracking-[0.1em] mb-1.5 px-1.5 py-0.5 rounded"
                                                    style={{ color: style.color, backgroundColor: style.bg }}
                                                >
                                                    {post.category.name}
                                                </span>
                                            )
                                        })()}
                                        <h3 className="text-[13.5px] font-semibold text-foreground leading-[1.4] group-hover:text-accent transition-colors line-clamp-2">
                                            {post.title}
                                        </h3>
                                        <div className="text-[9px] text-muted mt-1.5 flex items-center gap-[6px] flex-wrap">
                                            <span>HallyuHub</span>
                                            <span>·</span>
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
