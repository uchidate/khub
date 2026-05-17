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
    const visiblePosts = posts.slice(0, 6)
    if (visiblePosts.length === 0) return null

    return (
        <section className="bg-background py-6 sm:py-7">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-4 flex items-end justify-between">
                    <div className="border-l-2 border-accent pl-3">
                        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted">Artigos</p>
                        <h2 className="mt-1 text-[18px] font-bold tracking-[-0.02em] text-foreground sm:text-[20px]">
                            Mais recentes
                        </h2>
                    </div>
                    <Link href="/blog" className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted transition-colors hover:text-foreground">
                        Ver todos <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {visiblePosts.map((post) => {
                        const categoryConfig = post.category ? BLOG_CATEGORY_BY_SLUG[post.category.slug] : null
                        return (
                            <Link
                                key={post.id}
                                href={`/blog/${post.slug}`}
                                className={`group overflow-hidden rounded-2xl border border-border shadow-sm transition-colors hover:border-accent/20 hover:bg-surface ${
                                    post.category?.slug === "cultura"
                                        ? "bg-surface-editorial/55"
                                        : post.category?.slug === "k-drama" || post.category?.slug === "filmes"
                                            ? "bg-surface-media/55"
                                            : "bg-background"
                                }`}
                            >
                                <div className="relative aspect-[16/10] overflow-hidden bg-surface">
                                    <BlogImage
                                        src={post.coverImageUrl}
                                        alt={post.title}
                                        fill
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                        fallbackGradient={categoryConfig ? `linear-gradient(135deg, ${categoryConfig.bg}, ${categoryConfig.color}55)` : "#f3f4f6"}
                                    />
                                </div>
                                <div className="p-3.5">
                                    <CategoryPill category={post.category} />
                                    <h3 className="mt-2 text-[14px] font-semibold leading-snug text-foreground line-clamp-2 transition-colors group-hover:text-accent">
                                        {post.title}
                                    </h3>
                                    {post.excerpt && (
                                        <p className="mt-2 text-[11px] leading-relaxed text-muted line-clamp-2">
                                            {post.excerpt}
                                        </p>
                                    )}
                                    <div className="mt-3 flex items-center gap-2 text-[10px] text-muted">
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
