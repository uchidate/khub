import Link from "next/link"
import { Clock } from "lucide-react"
import { BlogImage } from "@/components/ui/BlogImage"
import { SectionTitleBar } from "@/components/ui/SectionTitleBar"
import { BLOG_CATEGORY_BY_SLUG } from "@/lib/config/categories"
import type { HomeCompositionMode } from "@/lib/home/home-composition"

type EditorialPost = {
    id: string
    slug: string
    title: string
    excerpt: string | null
    coverImageUrl: string | null
    publishedAt: string | null
    readingTimeMin: number
    category: { name: string; slug: string } | null
    relatedArtists?: Array<{ artist: { id: string; slug: string | null; nameRomanized: string; primaryImageUrl: string | null } }>
    relatedGroups?: Array<{ group: { id: string; slug: string | null; name: string; profileImageUrl: string | null } }>
    relatedProductions?: Array<{ production: { id: string; slug: string | null; titlePt: string; imageUrl: string | null } }>
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
            className="inline-flex w-fit px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em]"
            style={{ color: cfg?.color ?? 'var(--color-muted)', backgroundColor: cfg?.bg ?? 'rgba(156,163,175,0.15)' }}
        >
            {category.name}
        </span>
    )
}

function getRelatedEntities(post: EditorialPost) {
    return [
        ...(post.relatedArtists ?? []).map(({ artist }) => ({
            key: `artist-${artist.id}`,
            href: `/artists/${artist.slug ?? artist.id}`,
            label: "Artista",
            title: artist.nameRomanized,
        })),
        ...(post.relatedGroups ?? []).map(({ group }) => ({
            key: `group-${group.id}`,
            href: `/groups/${group.slug ?? group.id}`,
            label: "Grupo",
            title: group.name,
        })),
        ...(post.relatedProductions ?? []).map(({ production }) => ({
            key: `production-${production.id}`,
            href: `/productions/${production.slug ?? production.id}`,
            label: "Produção",
            title: production.titlePt,
        })),
    ].slice(0, 3)
}

export function HomeEditorialSpotlight({
    posts,
    mode,
}: {
    posts: EditorialPost[]
    mode: HomeCompositionMode
}) {
    const [lead, ...rest] = posts.slice(0, 4)
    if (!lead) return null
    const heading = mode === "editorial"
        ? "O que está movimentando o noticiário"
        : "Reportagens e histórias em destaque"
    const eyebrow = mode === "editorial" ? "Em pauta" : "Novidades"
    const leadRelatedEntities = getRelatedEntities(lead)

    return (
        <section className="bg-background">
            <div className="page-wrap border-t border-border py-8">
                <SectionTitleBar eyebrow={eyebrow} title={heading} href="/blog" />

                <div className="grid border border-foreground lg:grid-cols-[1.42fr_0.58fr]">
                    <article className="group relative min-h-[280px] overflow-hidden border-b border-foreground bg-surface transition-all sm:min-h-[390px] lg:border-b-0 lg:border-r">
                        <Link href={`/blog/${lead.slug}`} aria-label={lead.title} className="absolute inset-0 z-10" />
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
                            <h3 className="mt-3 max-w-[28ch] text-[20px] font-bold leading-tight text-white sm:text-[28px]">
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
                            {leadRelatedEntities.length > 0 && (
                                <div className="relative z-20 mt-4 flex flex-wrap gap-2">
                                    {leadRelatedEntities.map((entity) => (
                                        <Link
                                            key={entity.key}
                                            href={entity.href}
                                    className="inline-flex max-w-full items-center gap-1.5 border border-white/25 bg-black/35 px-2.5 py-1 text-[10px] text-white/80"
                                        >
                                            <span className="font-semibold text-white/60">{entity.label}</span>
                                            <span className="truncate">{entity.title}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </article>

                    <div className="grid sm:grid-cols-3 lg:grid-cols-1">
                        {rest.map((post) => (
                            <Link
                                key={post.id}
                                href={`/blog/${post.slug}`}
                                className="group grid grid-cols-[88px_minmax(0,1fr)] overflow-hidden border-b border-border bg-background transition-colors last:border-b-0 hover:bg-surface/70 sm:block sm:border-b-0 sm:border-r sm:last:border-r-0 lg:border-b lg:border-r-0"
                            >
                                <div className="relative h-24 bg-surface sm:h-auto sm:aspect-[4/3] lg:aspect-[4/3]">
                                    <BlogImage src={post.coverImageUrl} alt={post.title} fill sizes="(max-width: 1024px) 33vw, 28vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                                </div>
                                <div className="p-3">
                                    <CategoryPill category={post.category} />
                                    <h3
                                        className="mt-2 font-serif text-[18px] font-medium leading-[1.05] tracking-[-0.035em] text-foreground line-clamp-2"
                                        style={{ color: BLOG_CATEGORY_BY_SLUG[post.category?.slug ?? ""]?.color }}
                                    >
                                        {post.title}
                                    </h3>
                                    <div className="mt-2 flex items-center gap-2 text-[10px] text-muted">
                                        <span>{formatDate(post.publishedAt)}</span>
                                        {post.readingTimeMin > 0 && (
                                            <>
                                                <span className="h-1 w-1 rounded-full bg-border" />
                                                <span>{post.readingTimeMin} min</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
