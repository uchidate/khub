import prisma from "@/lib/prisma"
import { applySeoOverride } from '@/lib/seo/apply-override'
import { cache } from "react"
import Image from "next/image"
import Link from "next/link"
import { getRoleLabels } from "@/lib/utils/role-labels"
import { ViewTracker } from "@/components/features/ViewTracker"
import { DiscographySection } from "@/components/features/DiscographySection"
import { CuriosidadesAside } from "@/components/features/CuriosidadesAside"
import { ArtistFilmographyList } from "@/components/features/ArtistFilmographyList"
import { GroupMVPlayer } from "@/components/groups/GroupMVPlayer"
import { extractYoutubeId } from "@/lib/utils/youtube"
import { TikTokSection } from "@/components/groups/TikTokSection"
import { ErrorMessage } from "@/components/ui/ErrorMessage"
import { Breadcrumbs } from "@/components/ui/Breadcrumbs"
import { FavoriteButton } from "@/components/ui/FavoriteButton"
import { ReportButton } from "@/components/ui/ReportButton"
import { AdminQuickEdit } from "@/components/ui/AdminQuickEdit"
import { JsonLd } from "@/components/seo/JsonLd"
import { AnniversaryCountdown } from "@/components/ui/AnniversaryCountdown"
import { ScrollToTop } from "@/components/ui/ScrollToTop"
import { getTranslation, getTranslations } from "@/lib/translations"
import { buildArtistSeoDescription, buildArtistSeoTitle } from "@/lib/seo/metadata-builders"
import { Music, Globe } from 'lucide-react'
import { Instagram, Twitter, Youtube } from '@/components/ui/BrandIcons'
import type { Metadata } from "next"
import { permanentRedirect } from "next/navigation"

import { SITE_URL } from '@/lib/constants/site'
import { StoreProductsRail } from '@/components/store/StoreProductsRail'
import { inferContentType } from '@/lib/store/product-matcher'
import { BrandDot } from '@/components/ui/BrandDot'
import { getPrimaryMusicLink, getPublicMusicCatalog, toSpotifyEmbedUrl } from '@/lib/music/public-music-catalog'
const BASE_URL = SITE_URL

type ArtistWithExtras = Awaited<ReturnType<typeof getArtist>> & {
  seoTags?: string[]
  deathDate?: Date | null
  debutDate?: Date | null
  awards?: Array<{ premio: string; categoria: string; ano: number }>
  faq?: Array<{ pergunta: string; resposta: string }>
}

// ISR: página cacheada 1h — revalidada sob demanda via revalidatePath no admin
// ISR ativo — revalidate abaixo substitui force-dynamic
export const revalidate = 3600

// Pré-gera os top artistas no build → first-paint rápido, melhor SEO e Core Web Vitals
export async function generateStaticParams() {
    if (process.env.SKIP_BUILD_STATIC_GENERATION) return []
    const artists = await prisma.artist.findMany({
        where: { isHidden: false, flaggedAsNonKorean: false, slug: { not: null } },
        select: { slug: true },
        orderBy: { trendingScore: 'desc' },
        take: 200,
    })
    return artists.map(a => ({ slug: a.slug! }))
}

const isCuid = (s: string) => /^c[a-z0-9]{24}$/.test(s)

// React.cache deduplica a query dentro do mesmo render pass (generateMetadata + page)
const getArtist = cache(async (slugOrId: string) => {
    const where = isCuid(slugOrId) ? { id: slugOrId } : { slug: slugOrId }
    return prisma.artist.findFirst({
        where,
        include: {
            agency: { select: { id: true, name: true, slug: true, logoUrl: true } },
            productions: {
                where: {
                    production: {
                        flaggedAsNonKorean: false,
                        isHidden: false,
                        AND: [
                            { OR: [{ ageRating: null }, { ageRating: { not: '18' } }] },
                            { OR: [{ isAdultContent: null }, { isAdultContent: false }] },
                        ],
                    }
                },
                include: { production: { select: {
                    id: true, slug: true, titlePt: true, type: true, year: true, imageUrl: true,
                    voteAverage: true, synopsis: true, tmdbId: true, releaseDate: true,
                    ageRating: true, isAdultContent: true,
                } } },
                orderBy: [
                    { production: { releaseDate: { sort: 'desc', nulls: 'last' } } },
                    { production: { year: { sort: 'desc', nulls: 'last' } } },
                    { production: { createdAt: 'desc' } },
                ],
                take: 60,
            },
            memberships: {
                include: { group: { select: { id: true, slug: true, name: true, nameHangul: true, profileImageUrl: true } } },
                orderBy: [{ isActive: 'desc' }, { joinDate: 'asc' }],
            },
            streamingSignals: {
                where: { expiresAt: { gt: new Date() } },
                select: { showTitle: true, showTmdbId: true, rank: true, source: true },
                orderBy: { rank: 'asc' },
            },
        }
    }).catch(() => null)
})

interface SocialPlatform {
    icon: React.ElementType | string
    label: string
    action: string
    color: string
    bg: string
}

const SOCIAL_PLATFORMS: Record<string, SocialPlatform> = {
    instagram:  { icon: Instagram, label: 'Instagram', action: 'Seguir',    color: 'text-pink-400',    bg: 'hover:border-pink-500/50 hover:bg-pink-500/10' },
    twitter:    { icon: Twitter,   label: 'Twitter / X', action: 'Seguir',  color: 'text-sky-400',     bg: 'hover:border-sky-500/50 hover:bg-sky-500/10' },
    youtube:    { icon: Youtube,   label: 'YouTube',   action: 'Inscrever', color: 'text-red-400',     bg: 'hover:border-red-500/50 hover:bg-red-500/10' },
    tiktok:     { icon: '▶',       label: 'TikTok',    action: 'Seguir',    color: 'text-zinc-700 dark:text-white', bg: 'hover:border-zinc-500/40 hover:bg-zinc-500/10' },
    weverse:    { icon: '⬡',       label: 'Weverse',   action: 'Entrar',    color: 'text-green-400',   bg: 'hover:border-green-500/50 hover:bg-green-500/10' },
    fancafe:    { icon: '☕',       label: 'Fancafe',   action: 'Entrar',    color: 'text-yellow-400',  bg: 'hover:border-yellow-500/50 hover:bg-yellow-500/10' },
    naverBlog:  { icon: 'N',       label: 'Naver Blog', action: 'Visitar',  color: 'text-emerald-400', bg: 'hover:border-emerald-500/50 hover:bg-emerald-500/10' },
    spotify:    { icon: Music,     label: 'Spotify',   action: 'Ouvir',     color: 'text-green-500',   bg: 'hover:border-green-500/50 hover:bg-green-500/10' },
}

function getSocialPlatform(key: string): SocialPlatform {
    const lower = key.toLowerCase()
    if (SOCIAL_PLATFORMS[lower]) return SOCIAL_PLATFORMS[lower]
    if (lower.includes('instagram')) return SOCIAL_PLATFORMS.instagram
    if (lower.includes('twitter') || lower.includes('x.com')) return SOCIAL_PLATFORMS.twitter
    if (lower.includes('youtube')) return SOCIAL_PLATFORMS.youtube
    if (lower.includes('tiktok')) return SOCIAL_PLATFORMS.tiktok
    if (lower.includes('weverse')) return SOCIAL_PLATFORMS.weverse
    if (lower.includes('cafe.daum') || lower.includes('fancafe')) return SOCIAL_PLATFORMS.fancafe
    if (lower.includes('naver')) return SOCIAL_PLATFORMS.naverBlog
    if (lower.includes('spotify')) return SOCIAL_PLATFORMS.spotify
    return { icon: Globe, label: key, action: 'Visitar', color: 'text-muted', bg: 'hover:border-border' }
}

type OfficialProfileLink = {
    key: string
    url: string
    platform: SocialPlatform
}

function normalizeOfficialLinkKey(key: string, url: string) {
    const lower = key.toLowerCase().replace(/[_\s]+/g, '-')
    const value = url.toLowerCase()
    if (lower.includes('instagram') || value.includes('instagram.com')) return 'instagram'
    if (lower.includes('youtube') || value.includes('youtube.com') || value.includes('youtu.be')) return 'youtube'
    if (lower.includes('twitter') || lower === 'x' || value.includes('twitter.com') || value.includes('x.com')) return 'twitter'
    if (lower.includes('spotify') || value.includes('open.spotify.com')) return 'spotify'
    if (lower.includes('weverse') || value.includes('weverse.io')) return 'weverse'
    if (lower.includes('tiktok') || value.includes('tiktok.com')) return 'tiktok'
    if (lower.includes('naver') || value.includes('naver.com')) return 'naverBlog'
    if (lower.includes('fancafe') || value.includes('cafe.daum.net')) return 'fancafe'
    return lower
}

function buildOfficialProfileLinks(options: {
    socialLinks: Record<string, unknown> | null
    musicProfileLinks: { platform: string; platformName: string; url: string }[]
}): OfficialProfileLink[] {
    const merged: Array<[string, string]> = []

    for (const [key, value] of Object.entries(options.socialLinks ?? {})) {
        if (typeof value === 'string' && value.trim()) merged.push([key, value.trim()])
    }
    for (const link of options.musicProfileLinks) {
        if (link.url.trim()) merged.push([link.platform, link.url.trim()])
    }

    const byKey = new Map<string, OfficialProfileLink>()
    const seenUrls = new Set<string>()
    for (const [rawKey, url] of merged) {
        const normalizedUrl = url.replace(/\/+$/, '')
        const urlKey = normalizedUrl.toLowerCase()
        if (seenUrls.has(urlKey)) continue

        const key = normalizeOfficialLinkKey(rawKey, normalizedUrl)
        if (byKey.has(key)) continue

        seenUrls.add(urlKey)
        byKey.set(key, {
            key,
            url: normalizedUrl,
            platform: getSocialPlatform(key),
        })
    }

    const priority = ['instagram', 'youtube', 'twitter', 'spotify', 'weverse', 'tiktok', 'naverBlog', 'fancafe']
    return [...byKey.values()]
        .sort((a, b) => {
            const ai = priority.indexOf(a.key)
            const bi = priority.indexOf(b.key)
            return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
        })
        .slice(0, 8)
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const params = await props.params;
    const artist = await getArtist(params.slug) as ArtistWithExtras

    if (!artist) {
        return {
            title: 'Artista não encontrado',
            description: 'Este artista não foi encontrado em nossa base de dados.'
        }
    }
    if (artist.isHidden) return { title: 'Artista não encontrado', robots: { index: false, follow: false } }

    // URL com ID puro não deve ser indexada (redirect já redireciona quando há slug)
    // Página renderiza normalmente para AdSense, mas noindex evita validação no Search Console
    if (!artist.slug || (isCuid(params.slug) && artist.slug !== params.slug)) return {
        title: artist.nameRomanized,
        robots: { index: false, follow: false },
    }

    const roles = artist.roles || []
    const GENERIC_BIO = /conhecido\(a\) na ind[uú]stria|talentoso\(a\).*ind[uú]stria|de destaque na ind[uú]stria/i
    const cleanBio = artist.bio && !GENERIC_BIO.test(artist.bio) ? artist.bio : null
    const description = cleanBio || `${artist.nameRomanized}${artist.nameHangul ? ` (${artist.nameHangul})` : ''} - ${roles.join(', ')}${artist.agency ? ` · ${artist.agency.name}` : ''}`
    const isThinContent = !artist.primaryImageUrl && !cleanBio

    const canonicalUrl = `${BASE_URL}/artists/${artist.slug ?? artist.id}`
    const primaryGroup = artist.memberships?.find(m => m.isActive)?.group ?? artist.memberships?.[0]?.group ?? null
    const roleLabels = getRoleLabels(roles)
    const seoTitle = buildArtistSeoTitle({
        name: artist.nameRomanized,
        hangul: artist.nameHangul,
        roleLabels,
        agencyName: artist.agency?.name,
        groupNames: artist.memberships?.map(m => m.group.name),
        productions: artist.productions?.map(item => ({
            titlePt: item.production.titlePt,
            year: item.production.year,
        })),
    })
    const seoDescription = buildArtistSeoDescription({
        name: artist.nameRomanized,
        hangul: artist.nameHangul,
        roleLabels,
        agencyName: artist.agency?.name,
        groupNames: artist.memberships?.map(m => m.group.name),
        productions: artist.productions?.map(item => ({
            titlePt: item.production.titlePt,
            year: item.production.year,
        })),
    })
    const keywords = [
        artist.nameRomanized,
        ...(artist.nameHangul ? [artist.nameHangul] : []),
        ...roles.map(r => `${artist.nameRomanized} ${r}`),
        ...(primaryGroup ? [`${primaryGroup.name}`, `${artist.nameRomanized} ${primaryGroup.name}`] : []),
        ...(artist.seoTags ?? []),
        'K-Pop', 'artista coreano', 'HallyuHub',
    ].filter(Boolean).join(', ')

    return applySeoOverride({
        title: seoTitle,
        description: seoDescription,
        keywords,
        alternates: {
            canonical: canonicalUrl,
            languages: { 'pt-BR': canonicalUrl, 'x-default': canonicalUrl },
        },
        ...(isThinContent ? { robots: { index: false, follow: true } } : {}),
        openGraph: {
            title: `${artist.nameRomanized} | HallyuHub`,
            description: description.slice(0, 160),
            type: 'profile',
            url: `${BASE_URL}/artists/${artist.slug ?? artist.id}`,
            images: artist.primaryImageUrl ? [{ url: artist.primaryImageUrl, width: 1200, height: 630, alt: artist.nameRomanized }] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${artist.nameRomanized} | HallyuHub`,
            description: description.slice(0, 160),
            images: artist.primaryImageUrl ? [artist.primaryImageUrl] : [],
        }
    }, 'artist', artist.id)
}

// ── Editorial block renderer ──────────────────────────────────────────────────
// Marcadores suportados em analiseEditorial:
//
//   **Título da seção**                  → cabeçalho monospace accent com separador
//   [QUOTE]texto[/QUOTE]                 → blockquote com aspas decorativas
//   [DESTAQUE]texto[/DESTAQUE]           → callout border-left accent
//   [RECORDE]texto[/RECORDE]             → caixa dourada com ★ (recordes/conquistas)
//   [TAGS]tag1,tag2,tag3[/TAGS]          → pills coloridas (gênero, estilo, era, influências)
//   [FATOS]label:valor|label:valor[/FATOS] → grid de fatos rápidos 2-col
//   [TIMELINE]ano:texto|ano:texto[/TIMELINE] → linha do tempo compacta
//   [MOMENTO]rótulo:texto[/MOMENTO]       → bloco editorial com rótulo
//   [DIVISOR]                            → separador decorativo com ponto accent
//   texto puro                           → parágrafo (drop-cap no primeiro)

type EditorialBlock =
    | { type: 'section-title'; text: string }
    | { type: 'quote'; text: string }
    | { type: 'destaque'; text: string }
    | { type: 'recorde'; text: string }
    | { type: 'tags'; items: string[] }
    | { type: 'fatos'; items: { label: string; valor: string }[] }
    | { type: 'timeline'; items: { label: string; valor: string }[] }
    | { type: 'momento'; label: string; text: string }
    | { type: 'video'; url: string }
    | { type: 'divisor' }
    | { type: 'paragraph'; text: string }

const SECTION_TITLE_RE = /^\*\*(.+?)\*\*\s*$/m

// All self-closing or paired tags we parse inline
const INLINE_TAGS = ['[QUOTE]', '[DESTAQUE]', '[RECORDE]', '[TAGS]', '[FATOS]', '[TIMELINE]', '[MOMENTO]', '[VIDEO]', '[DIVISOR]']

function nextTagPosition(s: string): number {
    return Math.min(...INLINE_TAGS.map(t => { const i = s.indexOf(t); return i >= 0 ? i : Infinity }))
}

function createParagraphBlocks(text: string): EditorialBlock[] {
    return text
        .split(/\n{2,}/)
        .map(part => part.replace(/\s*\n\s*/g, ' ').trim())
        .filter(Boolean)
        .map(part => ({ type: 'paragraph', text: part }))
}

function parseEditorialBlocks(raw: string): EditorialBlock[] {
    const blocks: EditorialBlock[] = []
    const parts = raw.split(/(\n\*\*[^\n*]+\*\*\n?|\*\*[^\n*]+\*\*\n)/).filter(Boolean)

    for (const part of parts) {
        const titleMatch = part.match(SECTION_TITLE_RE)
        if (titleMatch) {
            blocks.push({ type: 'section-title', text: titleMatch[1].trim() })
            continue
        }

        let remaining = part.trim()
        while (remaining.length > 0) {
            const next = nextTagPosition(remaining)

            if (next === Infinity) {
                const text = remaining.trim()
                if (text) blocks.push(...createParagraphBlocks(text))
                break
            }
            if (next > 0) {
                const text = remaining.slice(0, next).trim()
                if (text) blocks.push(...createParagraphBlocks(text))
                remaining = remaining.slice(next)
                continue
            }

            if (remaining.startsWith('[DIVISOR]')) {
                blocks.push({ type: 'divisor' })
                remaining = remaining.slice(9).trim()
                continue
            }

            if (remaining.startsWith('[VIDEO]')) {
                const end = remaining.indexOf('[/VIDEO]')
                if (end === -1) { blocks.push({ type: 'paragraph', text: remaining.trim() }); remaining = ''; break }
                const url = remaining.slice(7, end).trim()
                if (url) blocks.push({ type: 'video', url })
                remaining = remaining.slice(end + 8).trim()
                continue
            }

            const pairs: Array<[string, string, (text: string) => EditorialBlock]> = [
                ['[QUOTE]', '[/QUOTE]', (t) => ({ type: 'quote', text: t })],
                ['[DESTAQUE]', '[/DESTAQUE]', (t) => ({ type: 'destaque', text: t })],
                ['[RECORDE]', '[/RECORDE]', (t) => ({ type: 'recorde', text: t })],
                ['[TAGS]', '[/TAGS]', (t) => ({ type: 'tags', items: t.split(',').map(s => s.trim()).filter(Boolean) })],
                ['[FATOS]', '[/FATOS]', (t) => ({
                    type: 'fatos',
                    items: t.split('|').map(s => {
                        const colon = s.indexOf(':')
                        if (colon === -1) return { label: s.trim(), valor: '' }
                        return { label: s.slice(0, colon).trim(), valor: s.slice(colon + 1).trim() }
                    }).filter(f => f.label),
                })],
                ['[TIMELINE]', '[/TIMELINE]', (t) => ({
                    type: 'timeline',
                    items: t.split('|').map(s => {
                        const colon = s.indexOf(':')
                        if (colon === -1) return { label: s.trim(), valor: '' }
                        return { label: s.slice(0, colon).trim(), valor: s.slice(colon + 1).trim() }
                    }).filter(f => f.label),
                })],
                ['[MOMENTO]', '[/MOMENTO]', (t) => {
                    const colon = t.indexOf(':')
                    return colon === -1
                        ? { type: 'momento', label: 'Momento-chave', text: t }
                        : { type: 'momento', label: t.slice(0, colon).trim(), text: t.slice(colon + 1).trim() }
                }],
            ]

            let matched = false
            for (const [open, close, builder] of pairs) {
                if (remaining.startsWith(open)) {
                    const end = remaining.indexOf(close)
                    if (end === -1) { blocks.push({ type: 'paragraph', text: remaining.trim() }); remaining = ''; break }
                    const text = remaining.slice(open.length, end).trim()
                    if (text) blocks.push(builder(text))
                    remaining = remaining.slice(end + close.length).trim()
                    matched = true
                    break
                }
            }
            if (!matched) break
        }
    }
    return blocks
}

function renderPlainBio(raw: string) {
    const paragraphs = parseEditorialBlocks(raw)
        .filter(block => block.type === 'paragraph')

    return paragraphs.map((block, i) => (
        <p key={i} className={i === 0
            ? "text-[16px] sm:text-[18px] leading-[1.7] font-semibold text-foreground"
            : "text-[15px] sm:text-[16px] leading-[1.78] text-[#2b2b2b] dark:text-[#d0d0d0]"
        }>
            {block.text}
        </p>
    ))
}

function renderBiographyContent(options: { bioText: string | null }) {
    const { bioText } = options
    if (!bioText) return null
    return (
        <div className="border border-border/60 bg-background">
            <div className="p-5 sm:p-7">
                <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent mb-4">Perfil</div>
                <div className="space-y-4 max-w-[760px]">
                    {renderPlainBio(bioText)}
                </div>
            </div>
        </div>
    )
}

function getFirstVideoBlock(raw: string | null): Extract<EditorialBlock, { type: 'video' }> | null {
    if (!raw) return null
    return parseEditorialBlocks(raw).find((block): block is Extract<EditorialBlock, { type: 'video' }> => block.type === 'video') ?? null
}

function getFirstTimelineBlock(raw: string | null): Extract<EditorialBlock, { type: 'timeline' }> | null {
    if (!raw) return null
    return parseEditorialBlocks(raw).find((block): block is Extract<EditorialBlock, { type: 'timeline' }> => block.type === 'timeline') ?? null
}

function getFirstTagsBlock(raw: string | null): Extract<EditorialBlock, { type: 'tags' }> | null {
    if (!raw) return null
    return parseEditorialBlocks(raw).find((block): block is Extract<EditorialBlock, { type: 'tags' }> => block.type === 'tags') ?? null
}

function getFirstFactsBlock(raw: string | null): Extract<EditorialBlock, { type: 'fatos' }> | null {
    if (!raw) return null
    return parseEditorialBlocks(raw).find((block): block is Extract<EditorialBlock, { type: 'fatos' }> => block.type === 'fatos') ?? null
}

function getStarterBlocks(raw: string | null): EditorialBlock[] {
    if (!raw) return []
    const blocks = parseEditorialBlocks(raw)
    const start = blocks.findIndex(block => block.type === 'section-title' && /por onde começar/i.test(block.text))
    if (start === -1) return []

    const items: EditorialBlock[] = []
    for (let i = start + 1; i < blocks.length; i++) {
        const block = blocks[i]
        if (block.type === 'section-title') break
        if (block.type !== 'divisor') items.push(block)
    }
    return items
}

function getEditorialImpactCards(raw: string | null) {
    if (!raw) return []
    const cards: { label: string; text: string; tone: 'moment' | 'highlight' | 'record' }[] = []

    for (const block of parseEditorialBlocks(raw)) {
        if (block.type === 'momento') cards.push({ label: block.label, text: block.text, tone: 'moment' })
        if (block.type === 'destaque') cards.push({ label: 'Por que importa', text: block.text, tone: 'highlight' })
        if (block.type === 'recorde') cards.push({ label: 'Conquista', text: block.text, tone: 'record' })
        if (cards.length >= 2) break
    }

    return cards
}

function renderImpactCards(cards: ReturnType<typeof getEditorialImpactCards>) {
    if (cards.length === 0) return null

    return (
        <div className="grid gap-3 sm:grid-cols-2">
            {cards.map((card, i) => (
                <div key={`${card.label}-${i}`} className="border border-border bg-background px-4 py-4">
                    <div className={`font-mono text-[9px] uppercase tracking-[0.14em] mb-2 ${
                        card.tone === 'record' ? 'text-amber-600 dark:text-amber-300' : 'text-accent'
                    }`}>
                        {card.label}
                    </div>
                    <p className="text-[14px] leading-[1.55] font-semibold text-foreground">
                        {card.text}
                    </p>
                </div>
            ))}
        </div>
    )
}

function renderEditorialSignals(options: {
    tagsBlock: Extract<EditorialBlock, { type: 'tags' }> | null
    factsBlock: Extract<EditorialBlock, { type: 'fatos' }> | null
}) {
    const { tagsBlock, factsBlock } = options
    const editorialFacts = (factsBlock?.items ?? []).filter(item => {
        const label = item.label.trim().toLowerCase()
        return !/^(debut|estreia|ag[eê]ncia|nascimento|anivers[aá]rio|local|altura|tipo sangu[ií]neo|nacionalidade)$/.test(label)
    })
    if (!tagsBlock && editorialFacts.length === 0) return null

    return (
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.75fr)]">
            {editorialFacts.length > 0 && (
                <div className="grid grid-cols-2 border border-border bg-background sm:grid-cols-4">
                    {editorialFacts.slice(0, 4).map((item, index) => (
                        <div key={`${item.label}-${index}`} className={`px-4 py-3 ${index % 2 === 0 ? 'border-r border-border/40 sm:border-r' : ''} ${index < 2 ? 'border-b border-border/40 sm:border-b-0' : ''} sm:border-r sm:last:border-r-0`}>
                            <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">{item.label}</div>
                            <div className="mt-1 text-[13px] font-black leading-tight text-foreground">{item.valor}</div>
                        </div>
                    ))}
                </div>
            )}
            {tagsBlock && (
                <div className="flex flex-wrap content-center gap-1.5 border border-border bg-background px-4 py-3">
                    {tagsBlock.items.slice(0, 6).map(tag => (
                        <span key={tag} className="rounded-full border border-accent/25 bg-accent/[0.06] px-3 py-1 font-mono text-[10px] font-semibold text-accent">
                            {tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}

function renderTimelineBlock(block: Extract<EditorialBlock, { type: 'timeline' }>) {
    return (
        <div className="border border-border/60 bg-background">
            <div className="border-b border-border/50 px-5 py-4 sm:px-6">
                <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent">Viradas</div>
            </div>
            <div className="px-5 py-1 sm:px-6">
                {block.items.map((item, index) => (
                    <div key={`${item.label}-${index}`} className="grid grid-cols-[56px_1fr] gap-4 border-b border-border/35 py-4 last:border-b-0">
                        <div className="font-mono text-[12px] font-black text-accent">{item.label}</div>
                        <div className="text-[14px] leading-[1.55] font-medium text-foreground/85">{item.valor}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function youtubeId(url: string): string | null {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/))([a-zA-Z0-9_-]{11})/)
    return m?.[1] ?? null
}

function renderVideoBlock(url: string) {
    const id = youtubeId(url)
    if (!id) return null
    return (
        <div className="my-6 overflow-hidden border border-border/50 aspect-video w-full">
            <iframe
                src={`https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`}
                title="Vídeo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
                loading="lazy"
            />
        </div>
    )
}

function renderStarterBlocks(blocks: EditorialBlock[]) {
    if (blocks.length === 0) return null
    return (
        <div className="border border-foreground bg-foreground text-background">
            <div className="border-b border-background/20 px-5 py-4 sm:px-6">
                <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-background/70">Por onde começar</div>
            </div>
            <div className="space-y-4 px-5 py-5 sm:px-6">
                {blocks.map((block, index) => {
                    if (block.type === 'destaque' || block.type === 'recorde' || block.type === 'momento') {
                        return (
                            <p key={index} className="border-l-2 border-accent pl-4 text-[15px] leading-[1.6] font-semibold">
                                {block.type === 'momento' ? block.text : block.text}
                            </p>
                        )
                    }
                    if (block.type === 'paragraph') {
                        return <p key={index} className="text-[14px] sm:text-[15px] leading-[1.65] text-background/85">{block.text}</p>
                    }
                    if (block.type === 'timeline') {
                        return (
                            <div key={index} className="grid gap-2">
                                {block.items.map((item, itemIndex) => (
                                    <div key={`${item.label}-${itemIndex}`} className="grid grid-cols-[52px_1fr] gap-3 text-[13px] leading-[1.5]">
                                        <span className="font-mono font-black text-accent">{item.label}</span>
                                        <span className="text-background/85">{item.valor}</span>
                                    </div>
                                ))}
                            </div>
                        )
                    }
                    return null
                })}
            </div>
        </div>
    )
}

async function fetchTikTokThumbnail(url: string): Promise<string | null> {
    try {
        const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
            next: { revalidate: 86400 },
        })
        if (!res.ok) return null
        const data = await res.json() as { thumbnail_url?: string }
        return data.thumbnail_url ?? null
    } catch { return null }
}

async function ArtistVideoSections({
    videoBlock,
    videos,
    accent,
    artistName,
    artistImageUrl,
}: {
    videoBlock: Extract<EditorialBlock, { type: 'video' }> | null | undefined
    videos: { title: string; url: string }[]
    accent: string
    artistName?: string
    artistImageUrl?: string | null
}) {
    const allVideos = videoBlock
        ? [{ title: 'Vídeo em Destaque', url: videoBlock.url }, ...videos.filter(v => v.url !== videoBlock.url)]
        : videos

    const youtubeVideos = allVideos.filter(v => !!extractYoutubeId(v.url))
    const rawTiktok = allVideos.filter(v => v.url.includes('tiktok.com'))

    const tiktokVideos = await Promise.all(
        rawTiktok.map(async v => ({
            ...v,
            thumbnail: await fetchTikTokThumbnail(v.url),
        }))
    )

    return (
        <>
            {youtubeVideos.length > 0 && (
                <div className="scroll-mt-24 mt-12 pt-10 border-t border-border/40">
                    <GroupMVPlayer videos={youtubeVideos} accent={accent} embedFeaturedByDefault />
                </div>
            )}
            {tiktokVideos.length > 0 && (
                <div id="tiktoks" className="scroll-mt-24 mt-12 pt-10 border-t border-border/40">
                    <TikTokSection videos={tiktokVideos} accent={accent} artistName={artistName} artistImageUrl={artistImageUrl} />
                </div>
            )}
        </>
    )
}

export default async function ArtistDetailPage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    // Step 1: fetch artist (deduplica com generateMetadata via React.cache)
    const artist = await getArtist(params.slug) as ArtistWithExtras

    // Redireciona ID puro para URL canônica com slug (301 permanente para SEO)
    if (artist && isCuid(params.slug) && artist.slug && artist.slug !== params.slug) {
        permanentRedirect(`/artists/${artist.slug}`)
    }

    if (!artist || artist.isHidden) {
        return (
            <div className="pb-20 px-4 sm:px-6 lg:px-12">
                <Breadcrumbs items={[{ label: 'Artistas', href: '/artists' }, { label: 'Não Encontrado' }]} />
                <ErrorMessage
                    title="Artista não encontrado"
                    message="Este artista pode ter sido removido ou o link está incorreto."
                    showSupport={true}
                />
            </div>
        )
    }

    // Step 2: queries secundárias todas em paralelo (incluindo relatedArtists)
    const activeGroupId = artist.memberships.find(m => m.isActive)?.group?.id ?? null
    const productionIds = artist.productions.map(ap => ap.production.id)
    const productionWhere = {
        artistId: artist.id,
        production: {
            flaggedAsNonKorean: false, isHidden: false,
            AND: [
                { OR: [{ ageRating: null }, { ageRating: { not: '18' } }] },
                { OR: [{ isAdultContent: null }, { isAdultContent: false }] },
            ],
        },
    }
    const [_newsCount, bioPt, _productionTranslations, relatedArtists, blogArticles, totalProductions, musicCatalog] = await Promise.all([
        prisma.news.count({ where: { isHidden: false, status: 'published', artists: { some: { artistId: artist.id } } } }).catch(() => 0),
        getTranslation('artist', artist.id, 'bio', 'pt-BR').catch(() => null),
        getTranslations('production', productionIds, ['synopsis']).catch(() => new Map<string, Map<string, string>>()),
        activeGroupId
            ? prisma.artist.findMany({
                where: {
                    id: { not: artist.id },
                    isHidden: false,
                    flaggedAsNonKorean: false,
                    memberships: { some: { groupId: activeGroupId, isActive: true } },
                },
                take: 8,
                select: { id: true, nameRomanized: true, nameHangul: true, primaryImageUrl: true, roles: true, gender: true },
                orderBy: { trendingScore: 'desc' },
            }).catch(() => [])
            : Promise.resolve([]),
        prisma.blogPost.findMany({
            where: {
                status: 'PUBLISHED',
                isPrivate: false,
                relatedArtists: { some: { artistId: artist.id } },
            },
            select: { slug: true, title: true, excerpt: true, coverImageUrl: true, publishedAt: true, readingTimeMin: true },
            orderBy: { publishedAt: 'desc' },
            take: 6,
        }).catch(() => []),
        prisma.artistProduction.count({ where: productionWhere }).catch(() => artist.productions.length),
        getPublicMusicCatalog({ artistId: artist.id }),
    ])

    const discographyReleases = musicCatalog.releases.map(release => {
        const releasePrimaryLink = getPrimaryMusicLink(release.links)
        return {
        id: release.id,
        title: release.title,
        type: release.type,
        releaseDate: release.releaseDate,
        coverUrl: release.coverUrl,
        spotifyUrl: release.links.find(link => link.platform === 'spotify')?.url ?? releasePrimaryLink?.url ?? null,
        appleMusicUrl: null,
        youtubeUrl: null,
        mbid: null,
        tracks: release.tracks.map(track => ({
            id: track.id,
            title: track.title,
            trackNumber: track.trackNumber,
            durationMs: track.durationMs,
            spotifyUrl: getPrimaryMusicLink(track.links)?.url ?? null,
            links: track.links,
        })),
        links: release.links,
    }})

    const roles = artist.roles || []
    const stageNames = artist.stageNames || []
    const videos = (artist.videos as Array<{ title: string; url: string }> | null) ?? []
    const officialProfileLinks = buildOfficialProfileLinks({
        socialLinks: artist.socialLinks as Record<string, unknown> | null,
        musicProfileLinks: musicCatalog.profileLinks,
    })
    const spotifyArtistUrl = officialProfileLinks.find(link => link.key === 'spotify')?.url
    const birthDate = artist.birthDate ? new Date(artist.birthDate) : null
    const deathDate = artist.deathDate ? new Date(artist.deathDate) : null
    const birthDateFormatted = birthDate?.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
    const _deathDateFormatted = deathDate?.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
    const ageRef = deathDate ?? new Date()
    const age = birthDate ? Math.floor((ageRef.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null

    const activeGroup = artist.memberships.find(m => m.isActive)?.group ?? null
    const allGroups = artist.memberships

    const GENERIC_BIO_RE = /conhecido\(a\) na ind[uú]stria|talentoso\(a\).*ind[uú]stria|de destaque na ind[uú]stria/i
    const cleanBioPt = bioPt && !GENERIC_BIO_RE.test(bioPt) ? bioPt : null
    const cleanBioRaw = artist.bio && !GENERIC_BIO_RE.test(artist.bio) ? artist.bio : null
    const bioText = cleanBioPt ?? cleanBioRaw
    const primaryBio = bioText ?? null
    const debutYear = artist.debutDate ? new Date(artist.debutDate).getUTCFullYear() : null
    const awardsData = artist.awards as Array<{ premio: string; categoria: string; ano: number }> | null
    const quickFacts = [
        ['Estreia', debutYear ? String(debutYear) : '—'],
        ['Obras', String(totalProductions)],
        ['Nascimento', birthDateFormatted ?? '—'],
    ] as [string, string][]
    const heroFacts = quickFacts
    const hiddenProductionsCount = Math.max(totalProductions - 10, 0)
    const socialEntries = officialProfileLinks
    const pageAnchors = [
        { href: '#biografia', label: 'Biografia' },
        ...(artist.productions.length > 0 ? [{ href: '#filmografia', label: 'Filmografia' }] : []),
        ...(videos.length > 0 ? [{ href: '#mvs', label: 'Vídeos' }] : []),
        ...(discographyReleases.length > 0 ? [{ href: '#discografia', label: 'Discografia' }] : []),
        ...(blogArticles.length > 0 ? [{ href: '#artigos', label: 'Artigos' }] : []),
    ]
    const heroRoles = getRoleLabels(roles, artist.gender).slice(0, 3).map(label => label.toLowerCase())
    const heroMeta = [
        artist.nameHangul,
        ...(stageNames.length > 0 ? [stageNames.join(', ')] : []),
        ...(age !== null ? [`${age} anos${deathDate ? ' †' : ''}`] : []),
        ...(artist.agency?.name ? [artist.agency.name] : []),
    ].filter(Boolean)
    const hasMusicRole = roles.some(role => ['CANTOR', 'CANTORA', 'SINGER', 'IDOL', 'RAPPER', 'VOCALIST', 'DANÇARINO', 'DANCER'].includes(role.toUpperCase()))
    const hasActingRole = roles.some(role => ['ATOR', 'ATRIZ', 'ACTOR', 'ACTRESS'].includes(role.toUpperCase()))
    const fallbackHeroCopy = hasMusicRole && hasActingRole
        ? `${artist.nameRomanized} construiu uma carreira entre canções, palcos e personagens desde ${debutYear ?? 'o debut'}.`
        : `${artist.nameRomanized} é ${heroRoles.length > 0 ? heroRoles.join(', ') : 'artista'} sul-coreana em atividade desde ${debutYear ?? 'o debut'}.`
    const heroCopy = bioText
        ? bioText.split(/\n+/)[0]?.split(/(?<=[.!?])\s+/)[0] ?? fallbackHeroCopy
        : fallbackHeroCopy
    const impactCards = getEditorialImpactCards(artist.analiseEditorial)
    const timelineBlock = getFirstTimelineBlock(artist.analiseEditorial)
    const videoBlock = getFirstVideoBlock(artist.analiseEditorial)
    const tagsBlock = getFirstTagsBlock(artist.analiseEditorial)
    const factsBlock = getFirstFactsBlock(artist.analiseEditorial)
    const starterBlocks = getStarterBlocks(artist.analiseEditorial)
    const spotifyEmbedUrl = toSpotifyEmbedUrl(spotifyArtistUrl)
    const biographySection = (primaryBio || (artist.curiosidades?.length ?? 0) > 0) ? (
        <section id="biografia" className="scroll-mt-20 border-t border-border/40 bg-[#fafafa] dark:bg-surface">
            <div className="page-wrap py-10 sm:py-14">
                <div className="mb-7 max-w-[900px]">
                    <div className="font-mono text-[11px] text-muted tracking-[0.06em]">01 · BIOGRAFIA</div>
                    <h2 className="text-[32px] sm:text-[44px] font-bold tracking-[-0.04em] leading-[0.98] sm:leading-tight mt-1.5">
                        A trajetória de {artist.nameRomanized}
                    </h2>
                </div>
                {(impactCards.length > 0 || tagsBlock || factsBlock) && (
                    <div className="mb-7">
                        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">Essência</div>
                        {renderImpactCards(impactCards)}
                        {renderEditorialSignals({ tagsBlock, factsBlock })}
                    </div>
                )}
                <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] lg:gap-12">
                    <div className="min-w-0 space-y-6">
                        {renderBiographyContent({
                            bioText: bioText ?? (!artist.analiseEditorial ? primaryBio : null),
                        })}
                        {timelineBlock && renderTimelineBlock(timelineBlock)}
                        {starterBlocks.length > 0 && renderStarterBlocks(starterBlocks)}
                    </div>

                    {(artist.curiosidades?.length ?? 0) > 0 && (
                        <CuriosidadesAside curiosidades={artist.curiosidades ?? []} />
                    )}
                </div>

                {spotifyEmbedUrl && (
                    <div className="mt-8 pt-8 border-t border-border/40">
                        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted mb-3">Ouça no Spotify</div>
                        <iframe
                            src={`${spotifyEmbedUrl}?utm_source=generator&theme=0`}
                            width="100%"
                            height="152"
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            loading="lazy"
                            className="border-0 rounded-xl"
                        />
                    </div>
                )}
                <ArtistVideoSections videoBlock={videoBlock} videos={videos} accent="#ef4444" artistName={artist.nameRomanized ?? undefined} artistImageUrl={artist.primaryImageUrl} />
                {discographyReleases.length > 0 && (
                    <div id="discografia" className="scroll-mt-20 mt-12 pt-10 border-t border-border/40">
                        <DiscographySection albums={discographyReleases} />
                    </div>
                )}
            </div>
        </section>
    ) : null

    return (
        <div className="min-h-screen bg-background">
            <ViewTracker artistId={artist.id} />
            <JsonLd data={{
                "@context": "https://schema.org",
                "@type": artist.roles?.some(r => ['singer', 'rapper', 'dancer', 'vocalist', 'idol'].includes(r.toLowerCase()))
                    ? ["Person", "MusicArtist"] : "Person",
                "name": artist.nameRomanized,
                "alternateName": [
                    ...(artist.nameHangul ? [artist.nameHangul] : []),
                    ...(artist.stageNames ?? []),
                ].filter(Boolean),
                "description": (artist.bio ?? artist.analiseEditorial)?.slice(0, 300) ?? undefined,
                "image": artist.primaryImageUrl ?? undefined,
                "url": `${BASE_URL}/artists/${artist.slug ?? artist.id}`,
                "birthDate": artist.birthDate ? new Date(artist.birthDate).toISOString().split('T')[0] : undefined,
                "deathDate": deathDate ? deathDate.toISOString().split('T')[0] : undefined,
                "birthPlace": artist.placeOfBirth ? { "@type": "Place", "name": artist.placeOfBirth } : undefined,
                "jobTitle": artist.roles?.[0] ?? undefined,
                ...(artist.debutDate ? { "foundingDate": new Date(artist.debutDate).toISOString().split('T')[0] } : {}),
                "nationality": { "@type": "Country", "name": "Korea, Republic of" },
                ...(activeGroup ? { "memberOf": { "@type": "MusicGroup", "name": activeGroup.name, "url": `${BASE_URL}/groups/${activeGroup.slug ?? activeGroup.id}` } } : {}),
                ...(artist.agency ? { "worksFor": { "@type": "Organization", "name": artist.agency.name } } : {}),
                ...(() => {
                    const sameAs = officialProfileLinks.map(link => link.url).filter(Boolean)
                    return sameAs.length > 0 ? { "sameAs": sameAs } : {}
                })(),
            }} />
            <JsonLd data={{
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Artistas", "item": `${BASE_URL}/artists` },
                    { "@type": "ListItem", "position": 2, "name": artist.nameRomanized, "item": `${BASE_URL}/artists/${artist.slug ?? artist.id}` },
                ],
            }} />

            {(() => {
                const faq = artist.faq as { pergunta: string; resposta: string }[] | null
                if (!faq?.length) return null
                return (
                    <JsonLd data={{
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": faq.map(f => ({
                            "@type": "Question",
                            "name": f.pergunta,
                            "acceptedAnswer": { "@type": "Answer", "text": f.resposta },
                        })),
                    }} />
                )
            })()}

            {/* ── BREADCRUMB ── */}
            <div className="border-b border-border/40">
                <div className="page-wrap flex items-center gap-3 py-3">
                    <Breadcrumbs items={[{ label: 'Artistas', href: '/artists' }, { label: artist.nameRomanized }]} className="min-w-0" />
                    <AdminQuickEdit href={`/admin/artists/${artist.id}?returnTo=${encodeURIComponent(`/artists/${artist.id}`)}`} label="Editar" />
                    <span className="ml-auto hidden sm:block text-muted/50">
                        {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* ── HERO ── */}
            <section className="page-wrap py-5 sm:py-9">
                <div className="grid grid-cols-[124px_minmax(0,1fr)] gap-4 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-7 lg:grid-cols-[320px_minmax(0,720px)] lg:gap-9">
                    {/* Portrait */}
                    <div className="relative aspect-[3/4] w-full max-w-[124px] sm:max-w-[200px] lg:max-w-[320px] mx-auto lg:mx-0 overflow-hidden"
                        style={{ background: 'repeating-linear-gradient(135deg, #f0f0f0 0 12px, #e8e8e8 12px 24px)' }}>
                        {artist.primaryImageUrl && (
                            <Image
                                src={artist.primaryImageUrl}
                                alt={artist.nameRomanized}
                                fill
                                priority
                                sizes="(max-width: 640px) 248px, (max-width: 1024px) 400px, 320px"
                                className="object-cover object-top"
                            />
                        )}
                        {artist.nameHangul && (
                            <div className="absolute top-3.5 left-3.5 bg-foreground text-background font-mono text-[10px] px-2 py-1 leading-none">
                                {artist.nameHangul}
                            </div>
                        )}
                    </div>

                    {/* Hero content */}
                    <div className="flex flex-col min-w-0">
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mb-3 sm:mb-4">
                            {getRoleLabels(roles, artist.gender).map(role => (
                                <span key={role} className="font-mono text-[11px] px-2 py-1 border border-border rounded-full text-muted">{role}</span>
                            ))}
                            {activeGroup && (
                                <Link href={`/groups/${activeGroup.slug ?? activeGroup.id}`}
                                    className="font-mono text-[11px] px-2 py-1 border border-accent/40 rounded-full text-accent hover:bg-accent/5 transition-colors">
                                    {activeGroup.name}
                                </Link>
                            )}
                            {artist.birthDate && (
                                <AnniversaryCountdown
                                    date={new Date(artist.birthDate).toISOString()}
                                    label="aniversário"
                                    groupName={artist.nameRomanized}
                                />
                            )}
                        </div>

                        {/* Name */}
                        <h1 className="font-black tracking-[-0.04em] leading-[0.92] text-[clamp(36px,9vw,88px)]">
                            {artist.nameRomanized}<BrandDot />
                        </h1>
                        {heroMeta.length > 0 && (
                            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] sm:text-[15px] font-medium leading-snug text-muted">
                                {heroMeta.map((item, index) => (
                                    <span key={`${item}-${index}`} className="inline-flex items-center gap-2">
                                        {index > 0 && <span className="text-muted/40">/</span>}
                                        {item}
                                    </span>
                                ))}
                            </div>
                        )}

                        <p className="text-[14px] sm:text-[16px] leading-[1.5] mt-3 sm:mt-4 text-[#333] dark:text-[#ccc] max-w-[620px]">
                            {heroCopy}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border/60 pb-3">
                            {pageAnchors.map(anchor => (
                                <Link key={anchor.href} href={anchor.href}
                                    className="font-mono text-[11px] font-semibold text-muted underline-offset-4 transition-colors hover:text-accent hover:underline">
                                    {anchor.label}
                                </Link>
                            ))}
                        </div>

                        {/* Quick facts */}
                        <div className="col-span-2 mt-4 flex flex-wrap items-start gap-y-3 sm:col-span-1">
                            {(heroFacts).map(([k, v], i) => (
                                <div key={k} className={`min-w-[92px] ${i < heroFacts.length - 1 ? 'mr-4 border-r border-border/60 pr-4' : ''}`}>
                                    <div className="font-mono text-[10px] text-muted uppercase tracking-[0.06em]">{k}</div>
                                    <div className="text-[15px] font-semibold mt-1 text-foreground">{v}</div>
                                </div>
                            ))}
                        </div>

                        {socialEntries.length > 0 && (
                            <div className="hidden sm:flex mt-5 flex-wrap items-center justify-between gap-x-5 gap-y-3 border-t border-border/60 pt-4">
                                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                                    <span className="font-mono text-[10px] text-muted uppercase tracking-[0.08em]">Links oficiais</span>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                        {socialEntries.map((link, i) => {
                                            const Icon = link.platform.icon
                                            return (
                                                <a key={link.key} href={link.url} target="_blank" rel="noopener noreferrer"
                                                    className={`inline-flex items-center gap-1.5 text-[12px] font-semibold underline-offset-4 hover:underline ${link.platform.color}`}>
                                                    {typeof Icon === 'string'
                                                        ? <span className="font-mono text-[11px]">{Icon}</span>
                                                        : <Icon className="h-3.5 w-3.5" />}
                                                    {link.platform.label}{i < socialEntries.length - 1 ? <span className="ml-2 text-muted/40">/</span> : null}
                                                </a>
                                            )
                                        })}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted">
                                        <FavoriteButton id={artist.id} itemName={artist.nameRomanized} itemType="artista" className="rounded-none border border-border p-1.5" />
                                        <span>Favoritar</span>
                                    </div>
                                    <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted">
                                        <ReportButton entityType="artist" entityId={artist.id} entityName={artist.nameRomanized} className="rounded-none border border-border p-1.5" />
                                        <span>Sugerir correção</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {socialEntries.length > 0 && (
                    <div className="sm:hidden mt-4 border-t border-border/60 pt-3">
                        <div className="font-mono text-[10px] text-muted uppercase tracking-[0.08em] mb-2">Links oficiais</div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            {socialEntries.map((link, i) => {
                                const Icon = link.platform.icon
                                return (
                                    <a key={link.key} href={link.url} target="_blank" rel="noopener noreferrer"
                                        className={`inline-flex items-center gap-1.5 text-[12px] font-semibold underline-offset-4 hover:underline ${link.platform.color}`}>
                                        {typeof Icon === 'string'
                                            ? <span className="font-mono text-[11px]">{Icon}</span>
                                            : <Icon className="h-3.5 w-3.5" />}
                                        {link.platform.label}{i < socialEntries.length - 1 ? <span className="ml-2 text-muted/40">/</span> : null}
                                    </a>
                                )
                            })}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted">
                                <FavoriteButton id={artist.id} itemName={artist.nameRomanized} itemType="artista" className="rounded-none border border-border p-1.5" />
                                <span>Favoritar</span>
                            </div>
                            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted">
                                <ReportButton entityType="artist" entityId={artist.id} entityName={artist.nameRomanized} className="rounded-none border border-border p-1.5" />
                                <span>Sugerir correção</span>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {biographySection}

            {/* ── FILMOGRAFIA ── */}
            {artist.productions.length > 0 && (
                <section id="filmografia" className="page-wrap scroll-mt-20 py-14">
                    <div className="mb-7">
                        <div className="font-mono text-[11px] text-muted tracking-[0.06em]">02 · FILMOGRAFIA</div>
                        <h2 className="text-[36px] sm:text-[44px] font-bold tracking-[-0.04em] leading-tight mt-1.5">Toda a obra, listada</h2>
                        {hiddenProductionsCount > 0 && (
                            <p className="mt-2 max-w-[620px] text-[14px] leading-relaxed text-muted">
                                Começa pelos trabalhos mais recentes e expande sem tirar o leitor do perfil.
                            </p>
                        )}
                    </div>

                    <ArtistFilmographyList
                        productions={artist.productions.map(({ production }) => ({
                            id: production.id,
                            slug: production.slug,
                            titlePt: production.titlePt,
                            type: production.type,
                            year: production.year,
                            imageUrl: production.imageUrl,
                            voteAverage: production.voteAverage,
                            tmdbId: production.tmdbId,
                        }))}
                        streamingSignals={(artist.streamingSignals ?? []).map(signal => ({
                            showTitle: signal.showTitle,
                            showTmdbId: signal.showTmdbId,
                            rank: signal.rank,
                            source: signal.source,
                        }))}
                    />
                </section>
            )}

            {/* ── PRÊMIOS ── */}
            {awardsData && awardsData.length > 0 && (
                <section className="page-wrap py-14">
                    <div className="font-mono text-[11px] text-muted tracking-[0.06em]">03 · PRÊMIOS</div>
                    <h2 className="text-[36px] sm:text-[44px] font-bold tracking-[-0.04em] leading-tight mt-1.5 mb-8">O que já ganhou</h2>
                    <div className="grid sm:grid-cols-2">
                        {awardsData.map((a, i) => (
                            <div key={i} className={`flex gap-4 py-5 border-t border-border/40 ${i % 2 === 0 ? 'sm:pr-7 sm:border-r sm:border-border/40' : 'sm:pl-7'}`}>
                                <div className="font-mono text-[13px] text-accent font-semibold min-w-[44px] shrink-0">{a.ano}</div>
                                <div>
                                    <div className="text-[15px] font-semibold text-foreground">{a.categoria}</div>
                                    <div className="text-[13px] text-muted mt-0.5">{a.premio}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── GRUPOS & CONEXÕES ── */}
            {(relatedArtists.length > 0 || allGroups.length > 0) && (
                <section className="page-wrap border-t border-border/40 py-14">
                    <div className="font-mono text-[11px] text-muted tracking-[0.06em]">
                        {activeGroup ? '04 · CONEXÕES' : '04 · GRUPOS'}
                    </div>
                    <h2 className="text-[36px] sm:text-[44px] font-bold tracking-[-0.04em] leading-tight mt-1.5 mb-8">
                        {relatedArtists.length > 0 && activeGroup ? `Membros de ${activeGroup.name}` : 'Grupos'}
                    </h2>

                    {relatedArtists.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 sm:gap-6">
                            {relatedArtists.map(ra => (
                                <Link key={ra.id} href={`/artists/${ra.id}`} className="group flex flex-col gap-3">
                                    <div className="relative aspect-square overflow-hidden bg-[#efefef]"
                                        style={{ background: 'repeating-linear-gradient(135deg, #f0f0f0 0 10px, #e8e8e8 10px 20px)' }}>
                                        {ra.primaryImageUrl && (
                                            <Image src={ra.primaryImageUrl} alt={ra.nameRomanized} fill sizes="200px" className="object-cover object-top" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-[15px] font-semibold text-foreground group-hover:text-accent transition-colors">{ra.nameRomanized}</div>
                                        {ra.nameHangul && <div className="text-[12px] text-muted mt-0.5">{ra.nameHangul}</div>}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {allGroups.length > 0 && relatedArtists.length === 0 && (
                        <div className="flex flex-col divide-y divide-border/40">
                            {allGroups.map(m => {
                                const startYear = m.joinDate ? new Date(m.joinDate).getFullYear() : null
                                const endYear = m.leaveDate ? new Date(m.leaveDate).getFullYear() : null
                                const period = startYear ? (endYear ? `${startYear}–${endYear}` : `${startYear}–presente`) : m.isActive ? 'Ativo' : null
                                return (
                                    <Link key={m.id} href={`/groups/${m.group.slug ?? m.group.id}`}
                                        className="flex items-center gap-4 py-4 group hover:opacity-75 transition-opacity">
                                        <div className="relative h-10 w-10 shrink-0 overflow-hidden bg-[#efefef]">
                                            {m.group.profileImageUrl && (
                                                <Image src={m.group.profileImageUrl} alt={m.group.name} fill sizes="40px" className="object-cover object-top" />
                                            )}
                                        </div>
                                        <div>
                                            <div className={`text-[15px] font-semibold ${m.isActive ? 'text-accent' : 'text-foreground'}`}>{m.group.name}</div>
                                            <div className="font-mono text-[11px] text-muted">{[m.role, period].filter(Boolean).join(' · ')}</div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </section>
            )}

            {/* ── ARTIGOS ── */}
            {blogArticles.length > 0 && (
                <section id="artigos" className="page-wrap scroll-mt-20 border-t border-border/40 py-14">
                    <div className="font-mono text-[11px] text-muted tracking-[0.06em]">05 · LEITURAS</div>
                    <h2 className="text-[36px] sm:text-[44px] font-bold tracking-[-0.04em] leading-tight mt-1.5 mb-8">Artigos publicados</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
                        {blogArticles.map((article, i) => (
                            <Link key={article.slug} href={`/blog/${article.slug}`}
                                className={`group flex gap-4 py-5 border-b border-border/40 hover:opacity-75 transition-opacity ${i < 3 ? 'border-t border-border/40' : ''}`}>
                                {article.coverImageUrl && (
                                    <div className="relative h-16 w-[88px] shrink-0 overflow-hidden bg-[#efefef]">
                                        <img src={article.coverImageUrl} alt="" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="text-[14px] font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-snug">{article.title}</p>
                                    <p className="font-mono text-[10px] text-muted mt-1.5">{article.readingTimeMin} min</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* ── LOJA ── */}
            <div id="loja" className="scroll-mt-20 border-t border-border/40">
                <div className="page-wrap py-14">
                    <StoreProductsRail
                        entityType="artist"
                        entityId={artist.id}
                        names={[
                            artist.nameRomanized,
                            ...(artist.nameHangul ? [artist.nameHangul] : []),
                            ...(activeGroup ? [activeGroup.name] : []),
                        ]}
                        contentType={inferContentType(artist.roles ?? [], artist.productions.map(ap => ap.production))}
                        title={`Produtos — ${artist.nameRomanized}`}
                        limit={6}
                    />
                </div>
            </div>

            <ScrollToTop />
        </div>
    )
}
