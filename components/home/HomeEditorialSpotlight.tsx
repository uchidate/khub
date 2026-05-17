import Link from "next/link"
import { ArrowRight, Clock } from "lucide-react"
import { BlogImage } from "@/components/ui/BlogImage"
import { BLOG_CATEGORY_BY_SLUG } from "@/lib/config/categories"

type EditorialPost = {
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

function CategoryPill({ category }: { category: EditorialPost["category"] }) {
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

export function HomeEditorialSpotlight({ posts }: { posts: EditorialPost[] }) {
    const [lead, ...rest] = posts.slice(0, 4)
    if (!lead) return null

    return (
        <section className="bg-background py-4 sm:py-5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-3 flex items-end justify-between">
                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted">Novidades</p>
                        <h2 className="mt-1 text-[20px] font-bold tracking-[-0.02em] text-foreground sm:text-[22px]">
                            Reportagens e histórias em destaque
                        </h2>
                    </div>
                    <Link href="/blog" className="hidden items-center gap-1 text-[11px] font-semibold text-muted transition-colors hover:text-foreground sm:inline-flex">
                        Ver todos <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
                    <Link href={`/blog/${lead.slug}`} className="group relative min-h-[300px] overflow-hidden rounded-2xl border border-border bg-surface sm:min-h-[360px]">
                        <BlogImage
                            src={lead.coverImageUrl}
                            alt={lead.title}
                            fill
                            sizes="(max-width: 1024px) 100vw, 66vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                            <CategoryPill category={lead.category} />
                            <h3 className="mt-3 max-w-[28ch] text-[22px] font-bold leading-tight text-white sm:text-[28px]">
                                {lead.title}
                            </h3>
                            {lead.excerpt && (
                                <p className="mt-3 hidden max-w-[60ch] text-[13px] leading-relaxed text-white/75 sm:block line-clamp-2">
                                    {lead.excerpt}
                                </p>
                            )}
                            <div className="mt-4 flex items-center gap-3 text-[10px] text-white/70">
                                <span>{formatDate(lead.publishedAt)}</span>
                                {lead.readingTimeMin > 0 && (
                                    <span className="inline-flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {lead.readingTimeMin} min
                                    </span>
                                )}
                            </div>
                        </div>
                    </Link>

                    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                        {rest.map((post) => (
                            <Link
                                key={post.id}
                                href={`/blog/${post.slug}`}
                                className="group overflow-hidden rounded-2xl border border-border bg-background transition-colors hover:bg-surface"
                            >
                                <div className="relative aspect-[16/9] bg-surface lg:aspect-[2.5/1]">
                                    <BlogImage src={post.coverImageUrl} alt={post.title} fill sizes="(max-width: 1024px) 33vw, 28vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                                </div>
                                <div className="p-3">
                                    <CategoryPill category={post.category} />
                                    <h3 className="mt-2 text-[13px] font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-accent">
                                        {post.title}
                                    </h3>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
