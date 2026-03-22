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
        <section className="border-b border-[#e8e8e8]">
            <div className="max-w-7xl mx-auto grid md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_360px]">
                {/* LEFT — feed */}
                <div className="border-b md:border-b-0 md:border-r border-[#e8e8e8]">
                    {/* Header row */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e8e8]">
                        <h2 className="text-sm font-black uppercase tracking-wider text-[#080808]">
                            Mais notícias
                        </h2>
                        <div className="flex items-center gap-1">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.value}
                                    onClick={() => setActiveTab(tab.value)}
                                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors min-h-[32px] ${
                                        activeTab === tab.value
                                            ? "bg-[#ff2d78] text-white"
                                            : "text-[#6b6b6b] hover:text-[#080808] hover:bg-[#f5f5f7]"
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
                            <p className="text-sm text-[#6b6b6b] p-5">Nenhuma notícia encontrada.</p>
                        )}
                        {filteredNews.map((item, idx) => (
                            <Link
                                key={item.id}
                                href={`/news/${item.id}`}
                                className="flex items-start gap-4 px-5 py-4 border-b border-[#e8e8e8] hover:bg-[#f5f5f7] transition-colors group min-h-[44px]"
                            >
                                <span className="text-2xl font-black text-[#e8e8e8] w-8 flex-shrink-0 leading-none mt-0.5 group-hover:text-[#ff2d78] transition-colors">
                                    {String(idx + 1).padStart(2, "0")}
                                </span>
                                <div className="flex-1 min-w-0">
                                    {item.tags?.[0] && (
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#ff2d78] mb-1 block">
                                            {item.tags[0]}
                                        </span>
                                    )}
                                    <h3 className="text-sm font-bold text-[#080808] leading-snug group-hover:text-[#ff2d78] transition-colors line-clamp-2 mb-1">
                                        {item.title}
                                    </h3>
                                    <span className="text-[10px] text-[#6b6b6b]">
                                        {formatDate(item.publishedAt)}
                                    </span>
                                </div>
                                {/* Thumbnail placeholder */}
                                <div className="w-14 h-14 rounded-lg bg-[#f5f5f7] flex-shrink-0 overflow-hidden">
                                    {item.imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={item.imageUrl}
                                            alt={item.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-[10px] font-black text-[#e8e8e8]">HH</span>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* RIGHT SIDEBAR */}
                <div className="flex flex-col divide-y divide-[#e8e8e8]">
                    {/* Widget 1: Productions */}
                    <div className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black uppercase tracking-wider text-[#080808]">
                                Produções em destaque
                            </h3>
                            <Link
                                href="/productions"
                                className="text-[11px] text-[#6b6b6b] hover:text-[#ff2d78] transition-colors font-semibold"
                            >
                                Ver mais →
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {productions.slice(0, 5).map((prod, idx) => (
                                <Link
                                    key={prod.id}
                                    href={`/productions/${prod.id}`}
                                    className="flex items-center gap-3 group min-h-[44px]"
                                >
                                    <div
                                        className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-[10px] font-black"
                                        style={{
                                            background: `hsl(${(idx * 60) % 360}, 70%, 55%)`,
                                        }}
                                    >
                                        {getInitialsFromTitle(prod.titlePt)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-[#080808] group-hover:text-[#ff2d78] transition-colors truncate leading-tight">
                                            {prod.titlePt}
                                        </p>
                                        <p className="text-[10px] text-[#6b6b6b] truncate">
                                            {getTypeLabel(prod.type)}
                                            {prod.year ? ` · ${prod.year}` : ""}
                                        </p>
                                    </div>
                                    {prod.voteAverage != null && prod.voteAverage > 0 && (
                                        <span className="text-[11px] font-bold text-[#10b981] flex-shrink-0">
                                            {prod.voteAverage.toFixed(1)}
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Widget 2: Blog */}
                    <div className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black uppercase tracking-wider text-[#080808]">
                                Do blog
                            </h3>
                            <Link
                                href="/blog"
                                className="text-[11px] text-[#6b6b6b] hover:text-[#ff2d78] transition-colors font-semibold"
                            >
                                Ver todos →
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {blogPosts.slice(0, 4).map((post) => (
                                <Link
                                    key={post.id}
                                    href={`/blog/${post.slug}`}
                                    className="block group min-h-[44px]"
                                >
                                    <div className="flex items-start gap-2 mb-1">
                                        {post.category && (
                                            <span className="text-[9px] font-black uppercase tracking-widest text-[#ff2d78] bg-[#fff0f5] px-1.5 py-0.5 rounded flex-shrink-0">
                                                {post.category.name}
                                            </span>
                                        )}
                                        <span className="text-[9px] font-semibold text-white bg-[#6b6b6b] px-1.5 py-0.5 rounded flex-shrink-0">
                                            Prévia
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-[#080808] group-hover:text-[#ff2d78] transition-colors leading-snug line-clamp-2">
                                        {post.title}
                                    </p>
                                    <p className="text-[10px] text-[#6b6b6b] mt-1">
                                        {post.readingTimeMin} min de leitura
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
