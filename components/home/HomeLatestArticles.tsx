import Link from "next/link"
import { ArrowRight, Clock } from "lucide-react"
import { BlogImage } from "@/components/ui/BlogImage"
import { BLOG_CATEGORY_BY_SLUG } from "@/lib/config/categories"

interface ArticleItem {
    id: string
    slug: string
    title: string
    excerpt: string | null
    coverImageUrl: string | null
    publishedAt: string | null
    readingTimeMin: number
    category: { name: string; slug: string } | null
}

function formatDate(iso: string | null) {
    if (!iso) return ""
    return new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })
}

function CategoryPill({ category }: { category: ArticleItem["category"] }) {
    if (!category) return null
    const cfg = BLOG_CATEGORY_BY_SLUG[category.slug]
    return (
        <span
            className="inline-flex w-fit rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]"
            style={{ color: cfg?.color ?? "#374151", backgroundColor: cfg?.bg ?? "#f3f4f6" }}
        >
            {category.name}
        </span>
    )
}

export function HomeLatestArticles({ posts }: { posts: ArticleItem[] }) {
    const [lead, ...rest] = posts.slice(0, 5)
    if (!lead) return null

    const leadCategory = lead.category ? BLOG_CATEGORY_BY_SLUG[lead.category.slug] : null

    return (
        <section className="bg-background py-4 sm:py-5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="rounded-2xl border border-border bg-background overflow-hidden shadow-[0_1px_0_rgba(15,23,42,0.04)]">
                    <div className="flex items-center justify-between border-b border-border px-4 sm:px-6 py-3">
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted">Artigos</p>
                            <h2 className="text-[15px] sm:text-[17px] font-bold text-foreground mt-0.5">Leituras para entender o momento</h2>
                        </div>
                        <Link href="/blog" className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted hover:text-foreground transition-colors">
                            Ver todos <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="grid gap-0 lg:grid-cols-[1fr_1fr]">
                        <Link href={`/blog/${lead.slug}`} className="group relative min-h-[260px] sm:min-h-[320px] border-b lg:border-b-0 lg:border-r border-border overflow-hidden">
                            <BlogImage
                                src={lead.coverImageUrl}
                                alt={lead.title}
                                fill
                                sizes="(max-width: 1024px) 100vw, 58vw"
                                className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                                fallbackGradient={leadCategory ? `linear-gradient(135deg, ${leadCategory.bg}, ${leadCategory.color}55)` : "#f3f4f6"}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                                <CategoryPill category={lead.category} />
                                <h3 className="mt-2 max-w-[28ch] text-[18px] sm:text-[20px] font-bold leading-tight text-white line-clamp-3">
                                    {lead.title}
                                </h3>
                                {lead.excerpt && (
                                    <p className="mt-2 hidden max-w-[58ch] text-[12px] leading-relaxed text-white/70 sm:block line-clamp-2">
                                        {lead.excerpt}
                                    </p>
                                )}
                                <div className="mt-3 flex items-center gap-3 text-[10px] text-white/65">
                                    <span>{formatDate(lead.publishedAt)}</span>
                                    {lead.readingTimeMin > 0 && (
                                        <span className="inline-flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {lead.readingTimeMin} min
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>

                        <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:[&>*:nth-child(n+3)]:border-t sm:[&>*:nth-child(n+3)]:border-border lg:grid-cols-1 lg:divide-x-0 lg:[&>*:nth-child(n+3)]:border-t">
                            {rest.map((post, idx) => (
                                <Link
                                    key={post.id}
                                    href={`/blog/${post.slug}`}
                                    className={`group flex items-start gap-3 px-4 sm:px-5 py-4 hover:bg-surface transition-colors ${idx >= 3 ? 'hidden sm:flex' : ''}`}
                                >
                                    <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-surface border border-border/60">
                                        <BlogImage
                                            src={post.coverImageUrl}
                                            alt={post.title}
                                            fill
                                            sizes="80px"
                                            className="object-cover group-hover:scale-[1.04] transition-transform duration-300"
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <CategoryPill category={post.category} />
                                        <h3 className="mt-1.5 text-[13px] sm:text-[13.5px] font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-accent transition-colors">
                                            {post.title}
                                        </h3>
                                        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted">
                                            <span>{formatDate(post.publishedAt)}</span>
                                            {post.readingTimeMin > 0 && <span>{post.readingTimeMin} min</span>}
                                        </div>
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
