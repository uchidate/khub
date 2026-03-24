"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

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
    productions: ProductionItem[]
}

const TABS = [
    { label: "Todos", value: "all" },
    { label: "K-pop", value: "k-pop" },
    { label: "K-drama", value: "k-drama" },
    { label: "K-beauty", value: "k-beauty" },
    { label: "Cultura", value: "cultura" },
]

const CATEGORY_COLORS: Record<string, string> = {
    "k-pop": "text-[#ff2d78]",
    "k-drama": "text-[#7c3aed]",
    "k-beauty": "text-[#f59e0b]",
    "cultura": "text-[#0ea5e9]",
}

function getCategoryColor(slug: string | undefined): string {
    if (!slug) return "text-muted"
    return CATEGORY_COLORS[slug.toLowerCase()] ?? "text-[#ff2d78]"
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

export function HomeBlogFeed({ blogPosts, productions }: HomeBlogFeedProps) {
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
                    <div className="flex items-center justify-between px-4 sm:px-6 lg:px-12 py-4 sm:py-5 lg:py-6 border-b border-border">
                        <h2 className="text-[13.5px] font-bold text-foreground">Do Blog</h2>
                        <div className="flex items-center gap-1">
                            {TABS.map(tab => (
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

                    <div>
                        {filteredPosts.length === 0 && (
                            <p className="text-sm text-muted p-5">Nenhum artigo encontrado.</p>
                        )}
                        {filteredPosts.map((post, idx) => (
                            <Link
                                key={post.id}
                                href={`/blog/${post.slug}`}
                                className="flex items-start gap-3.5 px-4 sm:px-6 lg:px-12 py-4 sm:py-5 lg:py-[1.4rem] border-b border-border hover:bg-surface transition-colors group min-h-[68px]"
                            >
                                <span className="text-[8.5px] font-bold text-muted w-3.5 flex-shrink-0 pt-0.5">
                                    {String(idx + 1).padStart(2, "0")}
                                </span>
                                <div className="flex-1 min-w-0">
                                    {post.category && (
                                        <span className={`text-[8.3px] font-bold uppercase tracking-[0.12em] mb-1 block ${getCategoryColor(post.category.slug)}`}>
                                            {post.category.name}
                                        </span>
                                    )}
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
                                <div className="w-[58px] h-11 rounded-lg bg-surface flex-shrink-0 overflow-hidden flex items-center justify-center border border-border">
                                    {post.coverImageUrl ? (
                                        <Image
                                            src={post.coverImageUrl}
                                            alt={post.title}
                                            width={58}
                                            height={44}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-[9px] font-bold text-muted">
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
                    {/* Widget 1: Productions */}
                    <div>
                        <div className="text-[9px] font-bold uppercase tracking-[0.13em] text-muted px-4 py-3.5 border-b border-border">
                            Produções em destaque
                        </div>
                        <div>
                            {productions.slice(0, 5).map(prod => (
                                <Link
                                    key={prod.id}
                                    href={`/productions/${prod.id}`}
                                    className="flex items-center gap-2.5 px-4 py-3.5 border-b border-border last:border-b-0 hover:bg-surface transition-colors group min-h-[52px]"
                                >
                                    <div className="w-8 h-12 rounded-md flex-shrink-0 overflow-hidden bg-surface border border-border">
                                        {prod.imageUrl ? (
                                            <Image src={prod.imageUrl} alt={prod.titlePt} width={32} height={48} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted text-[9px] font-bold bg-surface">
                                                {getInitials(prod.titlePt)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-semibold text-foreground group-hover:text-accent transition-colors truncate leading-tight">{prod.titlePt}</p>
                                        <p className="text-[9px] text-muted truncate mt-0.5">
                                            {getTypeLabel(prod.type)}{prod.year ? ` · ${prod.year}` : ''}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Widget 2: Featured Blog Posts */}
                    <div>
                        <div className="text-[9px] font-bold uppercase tracking-[0.13em] text-muted px-4 py-3.5 border-b border-border">
                            Artigos em destaque
                        </div>
                        <div>
                            {blogPosts.slice(0, 4).map(post => (
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
