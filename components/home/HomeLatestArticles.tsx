import Link from "next/link"
import { Clock } from "lucide-react"
import { BlogImage } from "@/components/ui/BlogImage"
import { SectionTitleBar } from "@/components/ui/SectionTitleBar"
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
            className="inline-flex w-fit px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em]"
            style={{ color: cfg?.color ?? 'var(--color-muted)', backgroundColor: cfg?.bg ?? 'rgba(156,163,175,0.15)' }}
        >
            {category.name}
        </span>
    )
}

export function HomeLatestArticles({ posts }: { posts: ArticleItem[] }) {
    const visiblePosts = posts.slice(0, 6)
    if (visiblePosts.length === 0) return null

    return (
        <section className="bg-background">
            <div className="page-wrap border-t border-border py-8">
                <SectionTitleBar eyebrow="Artigos" title="Mais recentes" href="/blog" />

                <div className="grid border border-foreground sm:grid-cols-2 lg:grid-cols-3">
                    {visiblePosts.map((post, index) => {
                        const categoryConfig = post.category ? BLOG_CATEGORY_BY_SLUG[post.category.slug] : null
                        const isLead = index === 0
                        return (
                            <Link
                                key={post.id}
                                href={`/blog/${post.slug}`}
                                className={`group grid overflow-hidden border-b border-border bg-background transition-colors hover:bg-surface/70 sm:border-r lg:[&:nth-child(3n)]:border-r-0 ${
                                    isLead
                                        ? "grid-cols-1 sm:col-span-2 lg:col-span-1"
                                        : "grid-cols-[88px_minmax(0,1fr)] sm:block"
                                }`}
                            >
                                <div className={`relative overflow-hidden bg-surface ${
                                    isLead
                                        ? "min-h-[220px] sm:aspect-[4/3] sm:min-h-0"
                                        : "min-h-[104px] sm:aspect-[4/3] sm:min-h-0"
                                }`}>
                                    <BlogImage
                                        src={post.coverImageUrl}
                                        alt={post.title}
                                        fill
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                        fallbackGradient={categoryConfig ? `linear-gradient(135deg, ${categoryConfig.color}18 0%, ${categoryConfig.color}35 100%)` : undefined}
                                    />
                                </div>
                                <div className={isLead ? "p-4" : "p-3"}>
                                    <CategoryPill category={post.category} />
                                    <h3
                                        className={`${isLead ? "text-[24px] sm:text-[28px]" : "text-[18px] sm:text-[20px]"} mt-2 font-serif font-medium leading-[1.05] tracking-[-0.04em] text-foreground line-clamp-2 transition-colors`}
                                        style={{ color: categoryConfig?.color }}
                                    >
                                        {post.title}
                                    </h3>
                                    {post.excerpt && (
                                        <p className={`${isLead ? "block" : "hidden sm:block"} mt-2 text-[11px] leading-relaxed text-muted line-clamp-2`}>
                                            {post.excerpt}
                                        </p>
                                    )}
                                    <div className="mt-2 flex items-center gap-2 text-[10px] text-muted sm:mt-3">
                                        <span>{formatDate(post.publishedAt)}</span>
                                        {post.readingTimeMin > 0 && (
                                            <>
                                                <span className="h-1 w-1 rounded-full bg-border" />
                                                <span className="inline-flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {post.readingTimeMin} min
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
