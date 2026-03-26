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

function getTypeLabel(type: string) {
    const map: Record<string, string> = {
        DRAMA: "Drama", FILM: "Filme", VARIETY: "Variety",
        DOCUMENTARY: "Doc", WEBSERIES: "Web",
    }
    return map[type] ?? type
}

function getInitials(title: string) {
    return title.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
}

const PROD_PLACEHOLDER_GRADIENTS = [
    "linear-gradient(135deg,#fce7f3,#ede9fe)",
    "linear-gradient(135deg,#ede9fe,#dbeafe)",
    "linear-gradient(135deg,#fef3c7,#fed7aa)",
    "linear-gradient(135deg,#e0f2fe,#dbeafe)",
    "linear-gradient(135deg,#dcfce7,#d1fae5)",
]

export function HomeBlogFeed({ blogPosts, sidebarPosts, productions }: HomeBlogFeedProps) {
    const [activeTab, setActiveTab] = useState("all")

    const filteredPosts = activeTab === "all"
        ? blogPosts
        : blogPosts.filter(p =>
            p.category?.slug?.toLowerCase().includes(activeTab) ||
            p.tags?.some(t => t.toLowerCase().includes(activeTab))
        )

    return (
        <section className="border-b border-border">
            <div className="max-w-7xl mx-auto grid md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_360px]">
                {/* LEFT — blog feed */}
                <div className="border-b md:border-b-0 md:border-r border-border">
                    <div className="flex items-center justify-between px-4 sm:px-6 lg:px-12 py-2.5 border-b border-border gap-2">
                        <h2 className="text-[13.5px] font-bold text-foreground shrink-0">Do Blog</h2>
                        <div className="flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                            {TABS.map(tab => {
                                const isActive = activeTab === tab.value
                                return (
                                    <button
                                        key={tab.value}
                                        onClick={() => setActiveTab(tab.value)}
                                        className={`shrink-0 text-[11px] font-semibold px-2.5 py-[4px] rounded-full transition-all ${
                                            isActive
                                                ? 'font-bold'
                                                : 'text-foreground/60 hover:text-foreground hover:bg-surface'
                                        }`}
                                        style={isActive ? { color: tab.color, backgroundColor: tab.bg } : undefined}
                                    >
                                        {tab.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="overflow-y-auto" style={{ maxHeight: '320px', scrollbarWidth: 'thin' }}>
                        {filteredPosts.length === 0 && (
                            <p className="text-sm text-muted p-5">Nenhum artigo encontrado.</p>
                        )}
                        {filteredPosts.map((post, idx) => (
                            <Link
                                key={post.id}
                                href={`/blog/${post.slug}`}
                                className="flex items-start gap-3.5 px-4 sm:px-6 lg:px-12 py-3 sm:py-3.5 border-b border-border hover:bg-accent-soft transition-colors group min-h-[56px]"
                            >
                                <span className="text-[8.5px] font-bold text-muted w-3.5 flex-shrink-0 pt-0.5">
                                    {String(idx + 1).padStart(2, "0")}
                                </span>
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
                                <div className="w-[58px] h-11 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center border border-border/60" style={!post.coverImageUrl ? { background: getCategoryThumbBg(post.category?.slug) } : undefined}>
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
                            </Link>
                        ))}
                    </div>
                </div>

                {/* RIGHT SIDEBAR */}
                <div className="flex flex-col divide-y divide-border">
                    {/* Artigos em destaque */}
                    <div>
                        <div className="text-[9px] font-bold uppercase tracking-[0.13em] text-muted px-4 py-2.5 border-b border-border">
                            Artigos em destaque
                        </div>
                        <div>
                            {sidebarPosts.slice(0, 4).map(post => (
                                <Link
                                    key={post.id}
                                    href={`/blog/${post.slug}`}
                                    className="block px-4 py-2.5 border-b border-border last:border-b-0 hover:bg-accent-soft transition-colors group min-h-[44px]"
                                >
                                    {post.category && (() => {
                                        const cs = getCategoryStyle(post.category.slug)
                                        return (
                                            <span className="inline-block text-[8px] font-bold uppercase tracking-[0.1em] mb-1.5 px-1.5 py-0.5 rounded" style={{ color: cs.color, backgroundColor: cs.bg }}>
                                                {post.category.name}
                                            </span>
                                        )
                                    })()}
                                    <p className="text-[13px] font-bold text-foreground group-hover:text-accent transition-colors leading-[1.35] line-clamp-2">
                                        {post.title}
                                    </p>
                                    <span className="text-[8.5px] text-muted mt-1 block">{post.readingTimeMin} min de leitura</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
