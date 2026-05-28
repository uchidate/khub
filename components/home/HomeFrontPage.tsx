import Link from "next/link"
import Image from "next/image"
import { BlogImage } from "@/components/ui/BlogImage"
import { type ArtistForBadge } from "@/lib/trending/badges"
import { getArtistBadgeDisplay } from "@/lib/trending/display"
import { BLOG_CATEGORY_BY_SLUG } from "@/lib/config/categories"
import { nameToGradient } from "@/lib/utils"
import { SectionTitleBar } from "@/components/ui/SectionTitleBar"

interface FeaturedStory {
    id: string
    slug: string
    title: string
    coverImageUrl: string | null
    publishedAt: string | null
    excerpt?: string | null
    readingTimeMin: number
    category: { name: string; slug: string } | null
    tags: string[]
}

interface TrendingArtist extends ArtistForBadge {
    id: string
    slug?: string | null
    nameRomanized: string
    nameHangul: string | null
    roles: string[]
    primaryImageUrl: string | null
    agency?: { name: string } | null
    trendingScore?: number | null
    viewCount?: number
    gender?: string | number | null
}

interface SpotlightProduction {
    id: string
    slug?: string | null
    titlePt: string
    type: string
    year: number | null
    imageUrl: string | null
    voteAverage: number | null
}

interface HomeFrontPageProps {
    featuredStory: FeaturedStory | undefined
    carouselPosts?: FeaturedStory[]
    spotlightPosts?: FeaturedStory[]
    trendingArtists: TrendingArtist[]
    spotlightArtist: TrendingArtist | null
    spotlightProduction: SpotlightProduction | null
    latestPosts?: FeaturedStory[]
}

const ROLE_LABELS: Record<string, [string, string]> = {
    ATOR: ["Ator", "Atriz"],
    ACTRIZ: ["Atriz", "Atriz"],
    CANTOR: ["Cantor", "Cantora"],
    RAPPER: ["Rapper", "Rapper"],
    "DANÇARINO": ["Dançarino", "Dançarina"],
    MODELO: ["Modelo", "Modelo"],
    PRODUTOR: ["Produtor", "Produtora"],
    "Ator/Atriz": ["Ator", "Atriz"],
}

const EDITORIAL_HUBS = [
    { label: "K-Drama", href: "/blog?category=k-drama", hangul: "드라마", detail: "케이드라마", count: 412 },
    { label: "K-Pop", href: "/blog?category=k-pop", hangul: "케이팝", detail: "케이팝", count: 287 },
    { label: "Artistas", href: "/artists", hangul: "아티스트", detail: "아티스트", count: 1240 },
    { label: "Cinema", href: "/productions", hangul: "영화", detail: "영화", count: 96 },
    { label: "Cultura", href: "/blog?category=cultura", hangul: "문화", detail: "문화", count: 156 },
    { label: "K-Beauty", href: "/blog?category=k-beauty", hangul: "케이뷰티", detail: "케이뷰티", count: 84 },
]

function getCategoryStyle(slug: string | undefined): { color: string; bg: string } {
    if (!slug) return { color: "#ee2244", bg: "#fff0f4" }
    const key = slug.toLowerCase().replace(/\s/g, "-")
    const cat = BLOG_CATEGORY_BY_SLUG[key]
    return cat ? { color: cat.color, bg: cat.bg } : { color: "#ee2244", bg: "#fff0f4" }
}

function formatDate(value: string | null | undefined) {
    if (!value) return "edição recente"
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value))
}

function formatRole(role: string, gender?: string | number | null): string {
    const entry = ROLE_LABELS[role.toUpperCase()] ?? ROLE_LABELS[role]
    if (!entry) return role
    const isFemale = gender === 1 || gender === "1" || gender === "FEMALE" || gender === "female"
    return isFemale ? entry[1] : entry[0]
}

function getInitials(name: string) {
    return name
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
}

function StoryImage({ story, className, priority = false }: { story: FeaturedStory; className?: string; priority?: boolean }) {
    const imageUrl = story.coverImageUrl?.trim()

    return (
        <div className={`relative overflow-hidden bg-[#f6f6f7] ${className ?? ""}`}>
            {imageUrl ? (
                <BlogImage
                    src={imageUrl}
                    alt={story.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 52vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    priority={priority}
                    fallbackGradient="linear-gradient(135deg, #f6f6f7 0%, #e8e8ec 100%)"
                />
            ) : (
                <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,#fbfbfc_0_16px,#eeeeF1_16px_32px)]">
                    <span className="absolute left-4 top-4 text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                        capa editorial
                    </span>
                    <span className="absolute bottom-3 left-3 right-3 font-serif text-[26px] font-medium leading-[0.95] tracking-[-0.06em] text-black/12 sm:bottom-4 sm:left-4 sm:right-4 sm:text-[42px]">
                        HallyuHub
                    </span>
                    <span className="absolute right-3 top-3 text-[58px] font-black leading-none tracking-[-0.1em] text-accent/10 sm:right-4 sm:top-4 sm:text-[86px]">
                        한류
                    </span>
                </div>
            )}
        </div>
    )
}

function StoryKicker({ story }: { story: FeaturedStory }) {
    const style = getCategoryStyle(story.category?.slug ?? story.tags?.[0])
    return (
        <span
            className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]"
            style={{ color: style.color, backgroundColor: style.bg }}
        >
            {story.category?.name ?? story.tags?.[0] ?? "Artigo"}
        </span>
    )
}

function StoryEyebrow({ story }: { story: FeaturedStory }) {
    return (
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em]">
            <span className="text-accent">Capa</span>
            <span className="text-accent">·</span>
            <span className="text-accent">{story.category?.name ?? story.tags?.[0] ?? "Artigo"}</span>
            <span className="text-muted/45">·</span>
            <span className="text-muted">{story.readingTimeMin ? `${story.readingTimeMin} min` : "leitura"}</span>
        </div>
    )
}

function EmptyLinkCard({ href, label, description }: { href: string; label: string; description: string }) {
    return (
        <Link
            href={href}
            className="group flex items-center justify-between gap-4 border-b border-border py-4 transition-colors last:border-b-0 hover:bg-background/70 sm:py-5"
        >
            <span className="min-w-0">
                <span className="block text-[15px] font-black tracking-[-0.02em] text-foreground group-hover:text-accent sm:text-[17px]">
                    {label}
                </span>
                <span className="mt-1 block text-[13px] leading-5 text-muted">
                    {description}
                </span>
            </span>
            <span className="shrink-0 font-mono text-sm font-black text-accent transition-transform group-hover:translate-x-1">→</span>
        </Link>
    )
}

export function HomeFrontPage({
    featuredStory,
    carouselPosts = [],
    spotlightPosts = [],
    trendingArtists,
    spotlightArtist,
    spotlightProduction,
    latestPosts = [],
}: HomeFrontPageProps) {
    const heroStory = featuredStory ?? carouselPosts[0]
    const editorialPosts = carouselPosts
        .filter((post) => post.id !== heroStory?.id)
        .slice(0, 8)
    const featurePosts = editorialPosts.slice(0, 4)
    const highlightSource = spotlightPosts.length > 0 ? spotlightPosts : featurePosts
    const highlightStories = highlightSource
        .filter((post, index, arr) => post.id !== heroStory?.id && arr.findIndex((item) => item.id === post.id) === index)
        .slice(0, 4)
    const usedIds = new Set([heroStory?.id, ...highlightStories.map(p => p.id)].filter(Boolean))
    const longreadsFromCarousel = editorialPosts.slice(4, 8)
    const longreadsFromFeed = latestPosts.filter(p => !usedIds.has(p.id))
    const longreads = longreadsFromCarousel.length >= 4
        ? longreadsFromCarousel
        : [...longreadsFromCarousel, ...longreadsFromFeed.filter(p => !longreadsFromCarousel.some(c => c.id === p.id))].slice(0, 4)
    const safeArtists = trendingArtists.slice(0, 8)

    return (
        <section className="bg-background">
            <div className="mx-auto max-w-[1440px] border-y border-border bg-background">
                {heroStory ? (
                    <div className="lg:flex lg:min-h-[560px]">
                        <Link href={`/blog/${heroStory.slug}`} className="group block min-w-0 border-b border-border lg:w-[58%] lg:shrink-0 lg:border-b-0 lg:border-r">
                            <StoryImage story={heroStory} className="aspect-[4/3] w-full lg:h-full lg:min-h-[560px]" priority />
                        </Link>
                        <div className="relative z-10 flex min-w-0 flex-1 flex-col bg-background px-4 py-7 sm:px-8 sm:py-12 lg:min-h-[560px] lg:px-10 lg:py-12">
                            <div className="mb-4 sm:mb-5">
                                <StoryEyebrow story={heroStory} />
                            </div>
                            <Link href={`/blog/${heroStory.slug}`} className="group">
                                <h1 className="max-w-[18ch] break-words font-serif text-[28px] font-medium leading-[0.96] tracking-[-0.045em] text-foreground transition-colors group-hover:text-accent sm:text-[46px] sm:tracking-[-0.055em] lg:text-[54px] xl:text-[62px]">
                                    {heroStory.title}
                                </h1>
                            </Link>
                            {heroStory.excerpt && (
                                <p className="mt-5 max-w-[62ch] text-[14px] leading-6 text-foreground/78 sm:mt-8 sm:text-[17px] sm:leading-7">
                                    {heroStory.excerpt}
                                </p>
                            )}
                            <div className="mt-6 flex flex-wrap gap-2 sm:mt-8">
                                {(heroStory.tags ?? []).slice(0, 3).map((tag) => (
                                    <span key={tag} className="rounded-full border border-border px-3 py-1 text-[11px] font-semibold text-muted">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                            <div className="mt-7 flex flex-col gap-3 border-t border-border pt-5 text-[12px] text-muted sm:mt-auto sm:flex-row sm:items-center sm:justify-between sm:pt-6">
                                <span><b className="text-foreground">HallyuHub Redação</b> · {formatDate(heroStory.publishedAt)}</span>
                                <Link href={`/blog/${heroStory.slug}`} className="font-black text-accent">continuar a leitura →</Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid min-h-[360px] border-b border-border lg:grid-cols-[1.05fr_0.95fr]">
                        <div className="flex flex-col justify-center px-4 py-12 sm:px-8 lg:px-10">
                            <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-accent">Edição em atualização</p>
                            <h1 className="mt-3 max-w-[12ch] text-[40px] font-black leading-[0.95] tracking-[-0.055em] text-foreground sm:text-[58px] lg:text-[72px]">
                                A cultura coreana em português, sem ruído.
                            </h1>
                            <p className="mt-5 max-w-[58ch] text-[15px] leading-7 text-muted sm:text-[17px]">
                                A capa editorial ainda está sendo montada. Enquanto os destaques carregam, você pode navegar pelos perfis, guias e matérias do HallyuHub.
                            </p>
                            <div className="mt-7 flex flex-wrap gap-2">
                                <Link href="/blog" className="bg-accent px-4 py-2 text-[12px] font-black uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-90">
                                    Ver artigos
                                </Link>
                                <Link href="/artists" className="border border-foreground px-4 py-2 text-[12px] font-black uppercase tracking-[0.12em] text-foreground transition-colors hover:bg-foreground hover:text-background">
                                    Explorar artistas
                                </Link>
                            </div>
                        </div>
                        <div className="relative hidden overflow-hidden border-l border-border bg-foreground text-background lg:block">
                            <span className="absolute -right-10 top-4 font-sans text-[180px] font-black leading-none tracking-[-0.12em] text-white/[0.07]">한류</span>
                            <div className="relative flex h-full flex-col justify-end p-10">
                                <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-accent">HallyuHub</p>
                                <p className="mt-3 max-w-[28ch] text-[30px] font-black leading-[1] tracking-[-0.04em]">
                                    K-Pop, K-Drama, cinema, artistas e cultura pop coreana em um só lugar.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="border-t border-border px-4 py-8 sm:px-6 lg:px-10">
                    <SectionTitleBar
                        title="Navegar por seção"
                        action={<span className="hidden font-mono text-[11px] font-bold tracking-[0.08em] text-muted sm:block">
                            {EDITORIAL_HUBS.length} hubs · {EDITORIAL_HUBS.reduce((total, hub) => total + hub.count, 0).toLocaleString("pt-BR")} matérias
                        </span>}
                    />
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                        {EDITORIAL_HUBS.map(({ label, href, hangul, detail, count }, index) => {
                            const dark = index % 2 === 0
                            return (
                            <Link
                                key={href}
                                href={href}
                                className={`group relative min-h-[160px] overflow-hidden border border-foreground p-4 transition-transform hover:-translate-y-0.5 sm:p-5 lg:min-h-[220px] ${
                                    dark ? "bg-foreground text-background" : "bg-background text-foreground"
                                }`}
                            >
                                <span
                                    className={`pointer-events-none absolute -right-6 -top-4 font-sans text-[88px] font-black leading-none tracking-[-0.12em] ${
                                        dark ? "text-white/[0.07]" : "text-black/[0.045]"
                                    }`}
                                >
                                    {hangul}
                                </span>
                                <div className="relative flex h-full flex-col justify-between">
                                    <div>
                                        <h3 className="text-[18px] font-black leading-none tracking-[-0.04em] sm:text-[22px] lg:text-[24px] lg:tracking-[-0.055em]">{label}</h3>
                                        <p className={`mt-2 text-[12px] font-semibold ${dark ? "text-background/45" : "text-muted"}`}>{detail}</p>
                                    </div>
                                    <div className={`flex items-center justify-between font-mono text-[11px] font-black tracking-[0.04em] ${dark ? "text-background/45" : "text-muted"}`}>
                                        <span>{count.toLocaleString("pt-BR")} matérias</span>
                                        <span className={`text-base leading-none transition-transform group-hover:translate-x-1 ${dark ? "text-background" : "text-foreground"}`}>→</span>
                                    </div>
                                </div>
                            </Link>
                            )
                        })}
                    </div>
                </div>

                {highlightStories.length > 0 && (
                    <div className="border-t border-border px-4 py-7 sm:px-6 sm:py-8 lg:px-10">
                        <SectionTitleBar
                            title="Em destaque"
                            action={<span className="hidden font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted sm:block">seleção editorial</span>}
                        />
                        <div className="grid grid-cols-2 gap-x-4 gap-y-7 lg:grid-cols-4 lg:gap-5">
                            {highlightStories.map((post) => (
                                <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                                    <StoryImage story={post} className="aspect-[4/3] border border-border" />
                                    <div className="mt-3">
                                        <StoryKicker story={post} />
                                        <h3 className="mt-2 font-serif text-[16px] font-medium leading-[1.08] tracking-[-0.025em] text-foreground group-hover:text-accent sm:text-[20px] lg:text-[24px] lg:leading-[1.05] lg:tracking-[-0.04em]">
                                            {post.title}
                                        </h3>
                                        {post.excerpt && <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-muted max-sm:line-clamp-3">{post.excerpt}</p>}
                                        <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{formatDate(post.publishedAt)}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid border-t border-border bg-surface/55 lg:grid-cols-[minmax(0,1.55fr)_minmax(330px,0.75fr)]">
                    <div className="border-b border-border px-4 py-8 sm:px-6 lg:border-b-0 lg:border-r lg:px-10">
                        <SectionTitleBar title="Para ler com calma" href="/blog" linkText="arquivo →" className="mb-3" />
                        <div>
                            {longreads.length > 0 ? longreads.slice(0, 4).map((post, index) => (
                                <Link
                                    key={post.id}
                                    href={`/blog/${post.slug}`}
                                    className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 border-b border-border py-4 transition-colors last:border-b-0 hover:bg-background/70 sm:grid-cols-[104px_1fr_88px] sm:gap-4 sm:py-5"
                                >
                                    <StoryImage story={post} className="aspect-[4/5] border border-border" />
                                    <div>
                                        <StoryKicker story={post} />
                                        <h3 className="mt-2 font-serif text-[17px] font-medium leading-[1.07] tracking-[-0.025em] text-foreground sm:text-[22px] lg:text-[26px] lg:tracking-[-0.04em]">
                                            {post.title}
                                        </h3>
                                        {post.excerpt && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{post.excerpt}</p>}
                                    </div>
                                    <span className="hidden text-right text-[11px] font-bold uppercase tracking-[0.12em] text-muted sm:block">
                                        {index === 0 ? "capa" : formatDate(post.publishedAt)}
                                    </span>
                                </Link>
                            )) : (
                                <>
                                    <EmptyLinkCard href="/blog?category=k-drama" label="Guias de K-Drama" description="Descubra dramas, críticas e listas para escolher a próxima maratona." />
                                    <EmptyLinkCard href="/blog?category=k-pop" label="Radar K-Pop" description="Acompanhe lançamentos, grupos e movimentos do fandom." />
                                    <EmptyLinkCard href="/productions" label="Produções coreanas" description="Explore filmes, séries e programas organizados por perfil." />
                                </>
                            )}
                        </div>
                    </div>

                    <aside className="px-4 py-8 sm:px-6 lg:px-8">
                        <SectionTitleBar
                            title="Em alta agora"
                            action={<span className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-accent">● ao vivo</span>}
                            className="mb-3"
                        />
                        <div>
                            {safeArtists.length > 0 ? safeArtists.map((artist, index) => {
                                const badge = getArtistBadgeDisplay(artist)
                                return (
                                    <Link
                                        key={artist.id}
                                        href={`/artists/${artist.slug ?? artist.id}`}
                                        className="grid grid-cols-[42px_44px_1fr] items-center gap-3 border-b border-border py-3 transition-colors last:border-b-0 hover:bg-background/70"
                                    >
                                        <span className={`font-serif text-[32px] italic leading-none ${index < 3 ? "text-accent" : "text-muted/45"}`}>
                                            {String(index + 1).padStart(2, "0")}
                                        </span>
                                        <span className="relative h-11 w-11 overflow-hidden rounded-full border border-border bg-surface" style={{ background: nameToGradient(artist.nameRomanized || artist.nameHangul || "artist") }}>
                                            {artist.primaryImageUrl ? (
                                                <Image src={artist.primaryImageUrl} alt={artist.nameRomanized} fill sizes="44px" className="object-cover" />
                                            ) : (
                                                <span className="flex h-full w-full items-center justify-center text-[10px] font-black text-white">
                                                    {getInitials(artist.nameRomanized || artist.nameHangul || "?")}
                                                </span>
                                            )}
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-black text-foreground">{artist.nameRomanized || artist.nameHangul}</span>
                                            <span className="mt-0.5 block truncate text-[11px] text-muted">
                                                {artist.roles?.slice(0, 2).map((role) => formatRole(role, artist.gender)).join(", ")}
                                                {artist.agency?.name ? ` · ${artist.agency.name}` : ""}
                                            </span>
                                            {badge && <span className={`mt-1 inline-flex text-[9px] font-black ${badge.className}`}>{badge.label}</span>}
                                        </span>
                                    </Link>
                                )
                            }) : (
                                <div className="py-1">
                                    <EmptyLinkCard href="/artists" label="Artistas em destaque" description="Veja perfis completos, grupos, agências e aniversários." />
                                    <EmptyLinkCard href="/groups" label="Grupos populares" description="Navegue por discografias, integrantes e eras." />
                                    <EmptyLinkCard href="/calendario" label="Calendário Hallyu" description="Acompanhe comebacks, estreias e datas importantes." />
                                </div>
                            )}
                        </div>
                        {spotlightArtist && (
                            <Link href={`/artists/${spotlightArtist.slug ?? spotlightArtist.id}`} className="mt-6 block border border-foreground bg-foreground p-5 text-background transition-opacity hover:opacity-95">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Destaque da semana</p>
                                <h3 className="mt-2 text-2xl font-black tracking-[-0.04em]">{spotlightArtist.nameRomanized}</h3>
                                <p className="mt-1 text-xs text-background/65">{spotlightArtist.nameHangul ?? spotlightArtist.agency?.name ?? "Perfil em foco"}</p>
                                {spotlightProduction && (
                                    <p className="mt-4 border-t border-background/20 pt-3 text-xs text-background/75">
                                        Última produção: <b>{spotlightProduction.titlePt}</b>
                                    </p>
                                )}
                            </Link>
                        )}
                    </aside>
                </div>

                {latestPosts.length > 0 && (
                    <div className="border-t border-border px-4 py-8 sm:px-6 lg:px-10">
                        <SectionTitleBar title="Últimas publicações" href="/blog" linkText="RSS · ver feed →" />
                        <div className="grid sm:grid-cols-2">
                            {latestPosts.slice(0, 10).map((post, i) => {
                                const cfg = post.category ? BLOG_CATEGORY_BY_SLUG[post.category.slug] : null
                                return (
                                    <Link
                                        key={post.id}
                                        href={`/blog/${post.slug}`}
                                        className={`group grid grid-cols-[72px_minmax(0,1fr)] items-center gap-3 border-b border-border py-3.5 transition-colors hover:bg-surface/60 sm:grid-cols-[96px_minmax(0,1fr)_88px] sm:gap-4
                                            ${i % 2 === 0 ? "sm:border-r sm:pr-5" : "sm:pl-5"}
                                        `}
                                    >
                                        <span
                                            className="inline-block truncate text-[9px] font-black uppercase tracking-[0.12em]"
                                            style={{ color: cfg?.color ?? "#ee2244" }}
                                        >
                                            {post.category?.name ?? "Artigo"}
                                        </span>
                                        <span className="text-[13px] font-medium leading-[1.3] text-foreground line-clamp-2 group-hover:text-accent transition-colors sm:text-[14px]">
                                            {post.title}
                                        </span>
                                        <span className="hidden text-right font-mono text-[10px] text-muted sm:block">
                                            {formatDate(post.publishedAt)}
                                        </span>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}
