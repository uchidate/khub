"use client"

import { useState } from "react"
import Link from "next/link"

interface NewsItem {
    id: string
    title: string
    imageUrl: string | null
    publishedAt: string
    tags: string[]
    excerpt?: string
}

interface ProductionItem {
    id: string
    titlePt: string
    type: string
    year: number | null
    imageUrl: string | null
    voteAverage: number | null
}

interface BlogPostItem {
    id: string
    slug: string
    title: string
    tags: string[]
    readingTimeMin: number
    category: { name: string; slug: string } | null
}

interface HomeNewsFeedProps {
    news: NewsItem[]
    productions: ProductionItem[]
    blogPosts: BlogPostItem[]
}

const TABS = [
    { label: "Todos", value: "all" },
    { label: "K-pop", value: "k-pop" },
    { label: "K-drama", value: "k-drama" },
    { label: "Cultura", value: "cultura" },
]

const TAG_COLORS: Record<string, string> = {
    "k-pop": "text-[#ff2d78]",
    "k-drama": "text-[#7c3aed]",
    "cultura": "text-[#0ea5e9]",
    "k-beauty": "text-[#f59e0b]",
    "plataforma": "text-muted",
}

function getTagColor(tag: string | undefined): string {
    if (!tag) return "text-muted"
    const key = tag.toLowerCase().replace(/\s/g, "-")
    return TAG_COLORS[key] ?? (key.includes("k-") ? "text-[#ff2d78]" : key.includes("drama") ? "text-[#7c3aed]" : "text-muted")
}

function formatDate(iso: string) {
    try {
        return new Date(iso).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
        })
    } catch {
        return iso
    }
}

function getTypeLabel(type: string) {
    const map: Record<string, string> = {
        DRAMA: "Drama",
        FILM: "Filme",
        VARIETY: "Variety",
        DOCUMENTARY: "Doc",
        WEBSERIES: "Web",
    }
    return map[type] ?? type
}

function getInitialsFromTitle(title: string) {
    return title
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
}

export function HomeNewsFeed({ news, productions, blogPosts }: HomeNewsFeedProps) {
    const [activeTab, setActiveTab] = useState("all")

    const filteredNews =
        activeTab === "all"
            ? news
            : news.filter((n) =>
                  n.tags?.some((t) => t.toLowerCase().includes(activeTab))
              )

    return (
        <section className="border-b border-border">
            <div className="max-w-7xl mx-auto grid md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_360px]">
                {/* LEFT — feed */}
                <div className="border-b md:border-b-0 md:border-r border-border">
                    {/* Header row */}
                    <div className="flex items-center justify-between px-4 sm:px-6 lg:px-12 py-4 sm:py-5 lg:py-6 border-b border-border">
                        <h2 className="text-[13.5px] font-bold text-foreground">
                            Mais notícias
                        </h2>
                        <div className="flex items-center gap-1">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.value}
                                    onClick={() => setActiveTab(tab.value)}
                                    className={`text-[12.5px] font-semibold px-3.5 py-[5px] rounded-full transition-colors min-h-[32px] ${
                                        activeTab === tab.value
                                            ? "bg-accent text-white"
                                            : "text-foreground/70 hover:text-foreground hover:bg-surface border border-transparent hover:border-border"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* News rows */}
                    <div>
                        {filteredNews.length === 0 && (
                            <p className="text-sm text-muted p-5">Nenhuma notícia encontrada.</p>
                        )}
                        {filteredNews.map((item, idx) => (
                            <Link
                                key={item.id}
                                href={`/news/${item.id}`}
                                className="flex items-start gap-3.5 px-4 sm:px-6 lg:px-12 py-4 sm:py-5 lg:py-[1.4rem] border-b border-border hover:bg-surface transition-colors group min-h-[68px]"
                            >
                                <span className="text-[8.5px] font-bold text-muted w-3.5 flex-shrink-0 pt-0.5">
                                    {String(idx + 1).padStart(2, "0")}
                                </span>
                                <div className="flex-1 min-w-0">
                                    {item.tags?.[0] && (
                                        <span className={`text-[8.3px] font-bold uppercase tracking-[0.12em] mb-1 block ${getTagColor(item.tags[0])}`}>
                                            {item.tags[0]}
                                        </span>
                                    )}
                                    <h3 className="text-[13.5px] font-semibold text-foreground leading-[1.4] group-hover:text-accent transition-colors line-clamp-2">
                                        {item.title}
                                    </h3>
                                    <div className="text-[9px] text-muted mt-1.5 flex items-center gap-[6px] flex-wrap">
                                        {item.tags?.slice(1, 3).length > 0 ? (
                                            <span>{item.tags.slice(1, 3).join(' · ')}</span>
                                        ) : (
                                            <span>HallyuHub</span>
                                        )}
                                        <span>·</span>
                                        <span>{formatDate(item.publishedAt)}</span>
                                        <span>·</span>
                                        <span>3 min</span>
                                    </div>
                                </div>
                                {/* Thumbnail */}
                                <div className="w-[58px] h-11 rounded-lg bg-surface flex-shrink-0 overflow-hidden flex items-center justify-center border border-border">
                                    {item.imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-[9px] font-bold text-muted">
                                            {item.tags?.[0]?.slice(0, 2).toUpperCase() ?? 'HH'}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* RIGHT SIDEBAR */}
                <div className="flex flex-col divide-y divide-border">
                    {/* Widget 1: Productions */}
                    <div>
                        <div className="text-[9px] font-bold uppercase tracking-[0.13em] text-muted px-4 py-3.5 border-b border-border">
                            Produções em destaque
                        </div>
                        <div>
                            {productions.slice(0, 5).map((prod, idx) => {
                                const GRAD_STYLES = [
                                    'linear-gradient(135deg,#27272a,#18181b)',
                                    'linear-gradient(135deg,#1f1f22,#111114)',
                                    'linear-gradient(135deg,#27272a,#18181b)',
                                    'linear-gradient(135deg,#1f1f22,#111114)',
                                    'linear-gradient(135deg,#27272a,#18181b)',
                                ]
                                return (
                                    <Link
                                        key={prod.id}
                                        href={`/productions/${prod.id}`}
                                        className="flex items-center gap-2.5 px-4 py-3.5 border-b border-border last:border-b-0 hover:bg-surface transition-colors group min-h-[52px]"
                                    >
                                        <div
                                            className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-[9px] font-bold"
                                            style={{ background: GRAD_STYLES[idx % GRAD_STYLES.length] }}
                                        >
                                            {getInitialsFromTitle(prod.titlePt)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-semibold text-foreground group-hover:text-accent transition-colors truncate leading-tight">
                                                {prod.titlePt}
                                            </p>
                                            <p className="text-[9px] text-muted truncate mt-0.5">
                                                {getTypeLabel(prod.type)}{prod.year ? ` · ${prod.year}` : ''}
                                            </p>
                                        </div>
                                        {prod.voteAverage != null && prod.voteAverage > 0 && (
                                            <span className="text-[11px] font-bold text-accent flex-shrink-0">
                                                {prod.year ?? '—'}
                                            </span>
                                        )}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>

                    {/* Widget 2: Blog */}
                    <div>
                        <div className="text-[9px] font-bold uppercase tracking-[0.13em] text-muted px-4 py-3.5 border-b border-border">
                            Do blog
                        </div>
                        <div>
                            {blogPosts.slice(0, 4).map((post) => (
                                <Link
                                    key={post.id}
                                    href={`/blog/${post.slug}`}
                                    className="block px-4 py-3.5 border-b border-border last:border-b-0 hover:bg-surface transition-colors group min-h-[52px]"
                                >
                                    {post.category && (
                                        <p className="text-[8px] font-bold uppercase tracking-[0.11em] text-accent mb-1">
                                            {post.category.name}
                                        </p>
                                    )}
                                    <p className="text-[13px] font-bold text-foreground group-hover:text-accent transition-colors leading-[1.35] line-clamp-2">
                                        {post.title}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className="text-[8.5px] text-muted">{post.readingTimeMin} min de leitura</span>
                                        <span className="text-[8px] text-muted">·</span>
                                        <span className="inline-flex items-center gap-0.5 bg-surface rounded-full px-1.5 py-0.5 text-[8px] font-semibold text-muted border border-border">
                                            🔒 Prévia
                                        </span>
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
