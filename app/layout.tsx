import type { Metadata } from "next"
import { Outfit, Inter, Sora } from "next/font/google"
import Script from "next/script"
import "../styles/globals.css"
import { PublicAnalytics } from "@/components/features/PublicAnalytics"
import { SessionProvider } from "@/components/features/SessionProvider"
import { AnalyticsProvider } from "@/components/features/AnalyticsProvider"
import { WebVitalsReporter } from "@/components/features/WebVitalsReporter"
import NavBar from "@/components/NavBar"
import { PWAInstaller } from "@/components/features/PWAInstaller"
import { QuickSearch } from "@/components/features/QuickSearch"
import { ToastContainer } from "@/components/features/ToastContainer"
import { AuthGateModal } from "@/components/features/AuthGateModal"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { JsonLd } from "@/components/seo/JsonLd"
import { CookieBanner } from "@/components/features/CookieBanner"
import { BottomNav } from "@/components/ui/BottomNav"

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" })
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" })

import { SITE_URL } from '@/lib/constants/site'
const BASE_URL = SITE_URL

export const metadata: Metadata = {
    metadataBase: new URL(BASE_URL),
    title: {
        template: '%s | HallyuHub',
        default: 'HallyuHub - O Portal da Onda Coreana'
    },
    description: "O portal definitivo para fãs de K-Pop, K-Dramas e cultura coreana no Brasil.",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "HallyuHub",
    },
    alternates: {
        canonical: BASE_URL,
        types: {
            'application/rss+xml': `${BASE_URL}/news/rss`,
        },
    },
    openGraph: {
        title: "HallyuHub - O Portal da Onda Coreana",
        description: "O portal definitivo para fãs de K-Pop, K-Dramas e cultura coreana no Brasil.",
        images: [{
            url: `${BASE_URL}/og-image.jpg`,
            width: 1200,
            height: 630,
            alt: "HallyuHub - O Portal da Onda Coreana",
        }],
        siteName: 'HallyuHub',
        locale: 'pt_BR',
        type: 'website',
        url: BASE_URL,
    },
    twitter: {
        card: 'summary_large_image',
        title: "HallyuHub - O Portal da Onda Coreana",
        description: "O portal definitivo para fãs de K-Pop, K-Dramas e cultura coreana no Brasil.",
        images: [`${BASE_URL}/og-image.jpg`],
    },
    verification: {
        google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        other: {
            'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ?? '',
        },
    },
}

export const viewport = {
    themeColor: "#bc13fe",
    width: 'device-width',
    initialScale: 1,
}

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pt-BR" className={`${outfit.variable} ${inter.variable} ${sora.variable}`} suppressHydrationWarning>
            <head>
                {/* Anti-FOUC: aplica tema dark/light ANTES do primeiro paint para evitar flash branco */}
                <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('hallyuhub_theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){document.documentElement.classList.add('dark');}})()` }} />
                {/* Preconnect para CDNs usadas no LCP — reduz resource load delay */}
                <link rel="preconnect" href="https://images.unsplash.com" />
                <link rel="dns-prefetch" href="https://images.unsplash.com" />
            </head>
            <body className="font-sora text-[#1a1a1a] bg-white antialiased selection:bg-[#ff2d78] selection:text-white">
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
                    {/* Decorative top accent bar */}
                    <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#ff2d78] via-[#ff6fa3] to-[#ff2d78] z-[9999]" />
                    <div className="min-h-screen flex flex-col">
                        <NavBar />
                        <ErrorBoundary>
                            <main className="flex-grow pb-[62px] sm:pb-0">{children}</main>
                        </ErrorBoundary>
                        <QuickSearch />
                        <ToastContainer />
                        <AuthGateModal />
                        <PWAInstaller />
                        <CookieBanner />
                        <BottomNav />
                        <footer className="bg-[#080808] py-5 px-4 sm:px-8 lg:px-12 font-sora">
                            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <span className="text-[14px] font-extrabold tracking-[-0.04em] text-white">
                                    Hallyu<span className="text-[#ff2d78]">Hub</span>
                                </span>
                                <div className="flex flex-wrap gap-x-5 gap-y-1">
                                    {[
                                        { label: "Sobre", href: "/about" },
                                        { label: "Blog", href: "/blog" },
                                        { label: "Artistas", href: "/artists" },
                                        { label: "Produções", href: "/productions" },
                                        { label: "Contato", href: "/contato" },
                                        { label: "Privacidade", href: "/privacidade" },
                                    ].map(({ label, href }) => (
                                        <a key={href} href={href} className="text-[11px] text-[#555] hover:text-[#aaa] font-medium transition-colors">{label}</a>
                                    ))}
                                </div>
                                <p className="text-[10px] text-[#444]">
                                    &copy; {new Date().getFullYear()} HallyuHub. Todos os direitos reservados.
                                </p>
                            </div>
                        </footer>
                    </div>
                    </AnalyticsProvider>
                </SessionProvider>
            </body>
        </html>
    )
}
