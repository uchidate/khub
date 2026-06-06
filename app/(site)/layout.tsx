import type { Metadata } from "next"
import { Outfit, Inter, Sora } from "next/font/google"
import Script from "next/script"
import { UmamiScript } from "@/components/features/UmamiScript"
import "../../styles/globals.css"
import { unstable_cache } from "next/cache"
import prisma from "@/lib/prisma"
import { SessionProvider } from "@/components/features/SessionProvider"
import { AnalyticsProvider } from "@/components/features/AnalyticsProvider"
import { WebVitalsReporter } from "@/components/features/WebVitalsReporter"
import NavBar from "@/components/NavBar"
import { PWAInstaller } from "@/components/features/PWAInstaller"
import { ToastContainer } from "@/components/features/ToastContainer"
import { AdSenseLoader } from "@/components/ui/AdSenseLoader"
import { AuthGateModal } from "@/components/features/AuthGateModal"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { JsonLd } from "@/components/seo/JsonLd"
import { CookieBanner } from "@/components/features/CookieBanner"
import { ConditionalFooter } from "@/components/ui/ConditionalFooter"


type TickerItem = { type: 'article' | 'artist'; href: string; label: string; title: string }

const getTickerData = unstable_cache(
    async (): Promise<TickerItem[]> => {
        if (process.env.SKIP_BUILD_STATIC_GENERATION) return []
        try {
            const [posts, artists] = await Promise.all([
                prisma.blogPost.findMany({
                    where: { status: 'PUBLISHED' },
                    take: 5,
                    orderBy: { publishedAt: 'desc' },
                    select: { slug: true, title: true, category: { select: { name: true } } },
                }),
                prisma.artist.findMany({
                    where: { isHidden: false, flaggedAsNonKorean: false, trendingScore: { gt: 0 } },
                    take: 8,
                    orderBy: { trendingScore: 'desc' },
                    select: { id: true, slug: true, nameRomanized: true, roles: true },
                }),
            ])
            const artistItems: TickerItem[] = artists.map(a => ({
                type: 'artist',
                href: `/artists/${a.slug ?? a.id}`,
                label: '● em alta',
                title: a.nameRomanized,
            }))
            const postItems: TickerItem[] = posts.map(p => ({
                type: 'article',
                href: `/blog/${p.slug}`,
                label: p.category?.name ?? 'Blog',
                title: p.title,
            }))
            // Interleave: artist, article, artist, article...
            const result: TickerItem[] = []
            const maxLen = Math.max(artistItems.length, postItems.length)
            for (let i = 0; i < maxLen; i++) {
                if (artistItems[i]) result.push(artistItems[i])
                if (postItems[i]) result.push(postItems[i])
            }
            return result
        } catch {
            return []
        }
    },
    ['layout-ticker-v2'],
    { revalidate: 600 }
)

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" })
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })
const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" })

import { SITE_URL } from '@/lib/constants/site'
const BASE_URL = SITE_URL
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? 'ca-pub-6015098995926392'
const ADSENSE_ENABLED = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_ADSENSE_DEV === 'true'

export const metadata: Metadata = {
    metadataBase: new URL(BASE_URL),
    title: {
        template: '%s | HallyuHub',
        default: 'HallyuHub — K-Pop, K-Drama e Cultura Coreana'
    },
    description: "Perfis de artistas K-Pop, grupos, doramas e filmes coreanos — tudo em português. O maior portal de Hallyu do Brasil.",
    keywords: "K-Pop, dorama, dorama coreano, K-Drama, artistas coreanos, grupos K-Pop, Hallyu, cultura coreana, HallyuHub, idol, fandom, bias",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "HallyuHub",
    },
    alternates: {
        canonical: BASE_URL,
        languages: {
            'pt-BR': BASE_URL,
            'x-default': BASE_URL,
        },
    },
    openGraph: {
        title: "HallyuHub — K-Pop, K-Drama e Cultura Coreana",
        description: "Perfis de artistas K-Pop, grupos, doramas e filmes coreanos — tudo em português. O maior portal de Hallyu do Brasil.",
        images: [{
            url: `${BASE_URL}/og-image.jpg`,
            width: 1200,
            height: 630,
            alt: "HallyuHub — K-Pop, K-Drama e Cultura Coreana",
        }],
        siteName: 'HallyuHub',
        locale: 'pt_BR',
        type: 'website',
        url: BASE_URL,
    },
    twitter: {
        card: 'summary_large_image',
        title: "HallyuHub — K-Pop, K-Drama e Cultura Coreana",
        description: "Perfis de artistas K-Pop, grupos, doramas e filmes coreanos — tudo em português. O maior portal de Hallyu do Brasil.",
        images: [`${BASE_URL}/og-image.jpg`],
    },
    verification: {
        google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        other: {
            'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ?? '',
        },
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-video-preview': -1,
            'max-snippet': -1,
        },
    },
}

// viewport export removido — Next.js 16 + React 19 renderiza os metas gerados
// pelo viewport export como array sem key, causando erro de build.
// Meta viewport adicionada manualmente no <head> com key prop.

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const tickerItems = await getTickerData().catch(() => [])

    return (
        <html lang="pt-BR" className={`${outfit.variable} ${inter.variable} ${sora.variable}`} suppressHydrationWarning>
            <head>
                {/* Anti-FOUC: aplica tema dark/light ANTES do primeiro paint para evitar flash branco */}
                <script key="anti-fouc" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('hallyuhub_theme');if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})()` }} />
                {/* Meta viewport manual — evita <__next_viewport_boundary__> do Next.js 16 que gera array sem key */}
                <meta key="viewport" name="viewport" content="width=device-width, initial-scale=1" />
                <meta key="theme-color" name="theme-color" content="#bc13fe" />
                <link key="alternate-rss" rel="alternate" type="application/rss+xml" title="HallyuHub - Blog" href={`${BASE_URL}/feed.xml`} />
                <link key="sitemap-main" rel="sitemap" type="application/xml" title="Sitemap" href={`${BASE_URL}/sitemap_index.xml`} />
                {/* Preconnect para CDNs usadas no LCP — reduz resource load delay */}
                <link key="preconnect-unsplash" rel="preconnect" href="https://images.unsplash.com" />
                <link key="dns-unsplash" rel="dns-prefetch" href="https://images.unsplash.com" />
                <link key="preconnect-tmdb" rel="preconnect" href="https://image.tmdb.org" />
                <link key="dns-tmdb" rel="dns-prefetch" href="https://image.tmdb.org" />
                <link key="preconnect-youtube" rel="preconnect" href="https://img.youtube.com" />
                <link key="dns-youtube" rel="dns-prefetch" href="https://img.youtube.com" />
                <link key="preconnect-wikimedia" rel="preconnect" href="https://upload.wikimedia.org" />
                <link key="dns-wikimedia" rel="dns-prefetch" href="https://upload.wikimedia.org" />
                <link key="dns-soompi" rel="dns-prefetch" href="https://0.soompi.io" />
                <link key="dns-r2" rel="dns-prefetch" href="https://pub-placeholder.r2.dev" />
                {ADSENSE_ENABLED && (
                    <>
                        <link key="preconnect-adsense" rel="preconnect" href="https://pagead2.googlesyndication.com" />
                        <link key="dns-adsense" rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
                        <link key="dns-googleads" rel="dns-prefetch" href="https://googleads.g.doubleclick.net" />
                        {/* Consent default inline — deve rodar ANTES do AdSense carregar */}
                        <script key="gtag-consent-default" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{analytics_storage:'denied',ad_storage:'granted',ad_personalization:'granted'});` }} />
                        <script
                            key="adsense-auto-ads"
                            async
                            suppressHydrationWarning
                            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
                            crossOrigin="anonymous"
                        />
                    </>
                )}
            </head>
            <body className="font-sora text-foreground bg-background antialiased selection:bg-[#ff2d78] selection:text-white">
                {/* GA4 — tag injetada diretamente para detecção pelo Google */}
                <Script
                    src="https://www.googletagmanager.com/gtag/js?id=G-KHWW1EGSK3"
                    strategy="afterInteractive"
                />
                <Script id="ga-init" strategy="afterInteractive">{`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'granted', ad_personalization: 'granted', ad_user_data: 'granted' });
                    gtag('config', 'G-KHWW1EGSK3');
                `}</Script>
                {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
                    <UmamiScript websiteId={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID} />
                )}
                <JsonLd data={{
                    "@context": "https://schema.org",
                    "@type": "Organization",
                    "name": "HallyuHub",
                    "url": BASE_URL,
                    "logo": `${BASE_URL}/og-image.jpg`,
                    "description": "O portal definitivo para fãs de K-Pop, doramas e cultura coreana no Brasil.",
                    "inLanguage": "pt-BR",
                    "contactPoint": {
                        "@type": "ContactPoint",
                        "email": "contato@hallyuhub.com.br",
                        "contactType": "customer support",
                        "availableLanguage": "Portuguese",
                    },
                    "sameAs": [
                        "https://www.instagram.com/hallyuhub_br/",
                    ],
                }} />
                <JsonLd data={{
                    "@context": "https://schema.org",
                    "@type": "WebSite",
                    "name": "HallyuHub",
                    "url": BASE_URL,
                    "description": "O portal definitivo para fãs de K-Pop, doramas e cultura coreana no Brasil.",
                    "inLanguage": "pt-BR",
                    "potentialAction": {
                        "@type": "SearchAction",
                        "target": {
                            "@type": "EntryPoint",
                            "urlTemplate": `${BASE_URL}/artists?q={search_term_string}`,
                        },
                        "query-input": "required name=search_term_string",
                    },
                }} />
                <SessionProvider>
                    <AnalyticsProvider>
                    <WebVitalsReporter />
                    <div className="site-shell min-h-screen flex flex-col max-w-[1440px] mx-auto border-x-2 border-x-accent/30 overflow-x-clip">
                        <NavBar tickerItems={tickerItems} />
                        <ErrorBoundary>
                            <main className="flex-grow">{children}</main>
                        </ErrorBoundary>
                        <AdSenseLoader />
                        <ToastContainer />
                        <AuthGateModal />
                        <PWAInstaller />
                        <CookieBanner />

                        <ConditionalFooter />
                    </div>
                    </AnalyticsProvider>
                </SessionProvider>
            </body>
        </html>
    )
}
