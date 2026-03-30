import type { Metadata } from "next"
import { Outfit, Inter, Sora } from "next/font/google"
import Script from "next/script"
import { UmamiScript } from "@/components/features/UmamiScript"
import "../../styles/globals.css"
import { unstable_cache } from "next/cache"
import prisma from "@/lib/prisma"
import { PublicAnalytics } from "@/components/features/PublicAnalytics"
import { SessionProvider } from "@/components/features/SessionProvider"
import { AnalyticsProvider } from "@/components/features/AnalyticsProvider"
import { WebVitalsReporter } from "@/components/features/WebVitalsReporter"
import NavBar from "@/components/NavBar"
import { TickerWrapper } from "@/components/home/TickerWrapper"
import { PWAInstaller } from "@/components/features/PWAInstaller"
import { QuickSearch } from "@/components/features/QuickSearch"
import { ToastContainer } from "@/components/features/ToastContainer"
import { AuthGateModal } from "@/components/features/AuthGateModal"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { JsonLd } from "@/components/seo/JsonLd"
import { CookieBanner } from "@/components/features/CookieBanner"
import { BottomNav } from "@/components/ui/BottomNav"

const getTickerPosts = unstable_cache(
    async () => {
        if (process.env.SKIP_BUILD_STATIC_GENERATION) return []
        try {
            const posts = await prisma.blogPost.findMany({
                where: { status: 'PUBLISHED' },
                take: 8,
                orderBy: { publishedAt: 'desc' },
                select: { slug: true, title: true, category: { select: { name: true } } },
            })
            return posts
        } catch {
            return []
        }
    },
    ['layout-ticker-posts-v1'],
    { revalidate: 120 }
)

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" })
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" })

import { SITE_URL } from '@/lib/constants/site'
const BASE_URL = SITE_URL

export const metadata: Metadata = {
    metadataBase: new URL(BASE_URL),
    title: {
        template: '%s | HallyuHub',
        default: 'HallyuHub — K-Pop, K-Drama e Cultura Coreana'
    },
    description: "Perfis completos de artistas K-Pop, grupos, dramas e filmes coreanos — tudo em português. O maior portal Hallyu do Brasil.",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "HallyuHub",
    },
    alternates: {
        canonical: BASE_URL,
        types: {},
    },
    openGraph: {
        title: "HallyuHub — K-Pop, K-Drama e Cultura Coreana",
        description: "Perfis completos de artistas K-Pop, grupos, dramas e filmes coreanos — tudo em português. O maior portal Hallyu do Brasil.",
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
        description: "Perfis completos de artistas K-Pop, grupos, dramas e filmes coreanos — tudo em português. O maior portal Hallyu do Brasil.",
        images: [`${BASE_URL}/og-image.jpg`],
    },
    verification: {
        google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        other: {
            'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ?? '',
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
    const tickerPosts = await getTickerPosts().catch(() => [])

    return (
        <html lang="pt-BR" className={`${outfit.variable} ${inter.variable} ${sora.variable}`} suppressHydrationWarning>
            <head>
                {/* Anti-FOUC: aplica tema dark/light ANTES do primeiro paint para evitar flash branco */}
                <script key="anti-fouc" dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('hallyuhub_theme');if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})()` }} />
                {/* Meta viewport manual — evita <__next_viewport_boundary__> do Next.js 16 que gera array sem key */}
                <meta key="viewport" name="viewport" content="width=device-width, initial-scale=1" />
                <meta key="theme-color" name="theme-color" content="#bc13fe" />
                {/* Preconnect para CDNs usadas no LCP — reduz resource load delay */}
                <link key="preconnect-unsplash" rel="preconnect" href="https://images.unsplash.com" />
                <link key="dns-unsplash" rel="dns-prefetch" href="https://images.unsplash.com" />
                <link key="preconnect-tmdb" rel="preconnect" href="https://image.tmdb.org" />
                <link key="dns-tmdb" rel="dns-prefetch" href="https://image.tmdb.org" />
                <link key="preconnect-youtube" rel="preconnect" href="https://img.youtube.com" />
                <link key="dns-youtube" rel="dns-prefetch" href="https://img.youtube.com" />
                <link key="preconnect-wikimedia" rel="preconnect" href="https://upload.wikimedia.org" />
                <link key="dns-wikimedia" rel="dns-prefetch" href="https://upload.wikimedia.org" />
            </head>
            <body className="font-sora text-foreground bg-background antialiased selection:bg-[#ff2d78] selection:text-white">
                {/* GA4 Consent Mode — bloqueia coleta até o usuário aceitar */}
                <Script id="ga-consent-defaults" strategy="beforeInteractive">{`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied' });
                `}</Script>
                {process.env.NEXT_PUBLIC_GA_ID && (
                    <PublicAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
                )}
                {process.env.NEXT_PUBLIC_ADSENSE_CLIENT && (
                    <Script
                        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`}
                        crossOrigin="anonymous"
                        strategy="lazyOnload"
                    />
                )}
                {process.env.UMAMI_WEBSITE_ID && (
                    <UmamiScript websiteId={process.env.UMAMI_WEBSITE_ID} />
                )}
                <JsonLd data={{
                    "@context": "https://schema.org",
                    "@type": "Organization",
                    "name": "HallyuHub",
                    "url": BASE_URL,
                    "logo": `${BASE_URL}/og-image.jpg`,
                    "description": "O portal definitivo para fãs de K-Pop, K-Dramas e cultura coreana no Brasil.",
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
                    "description": "O portal definitivo para fãs de K-Pop, K-Dramas e cultura coreana no Brasil.",
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
                    <div className="min-h-screen flex flex-col">
                        <TickerWrapper posts={tickerPosts} />
                        <NavBar />
                        <ErrorBoundary>
                            <main className="flex-grow">{children}</main>
                        </ErrorBoundary>
                        <QuickSearch />
                        <ToastContainer />
                        <AuthGateModal />
                        <PWAInstaller />
                        <CookieBanner />
                        <BottomNav />
                        <footer className="bg-featured pt-4 pb-[calc(62px+1rem+env(safe-area-inset-bottom,0px))] sm:py-5 px-4 sm:px-8 lg:px-12 font-sora">
                            <div className="max-w-7xl mx-auto relative flex items-center">
                                <span className="text-[13px] font-extrabold tracking-[-0.04em] text-white shrink-0 z-10">
                                    Hallyu<span className="text-[#ff2d78]">Hub</span>
                                </span>
                                <div className="absolute inset-0 flex items-center justify-center gap-3 sm:gap-5 pointer-events-none">
                                    {[
                                        { label: "Sobre", href: "/about" },
                                        { label: "Contato", href: "/contato" },
                                        { label: "Privacidade", href: "/privacidade" },
                                    ].map(({ label, href }) => (
                                        <a key={href} href={href} className="text-[11px] text-[#555] hover:text-[#aaa] font-medium transition-colors whitespace-nowrap pointer-events-auto">{label}</a>
                                    ))}
                                </div>
                                <span className="hidden sm:inline text-[10px] text-[#444] shrink-0 ml-auto z-10">
                                    &copy; {new Date().getFullYear()} HallyuHub
                                </span>
                            </div>
                        </footer>
                    </div>
                    </AnalyticsProvider>
                </SessionProvider>
            </body>
        </html>
    )
}
