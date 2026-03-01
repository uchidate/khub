import type { Metadata } from "next"
import { Outfit, Inter } from "next/font/google"
import "../styles/globals.css"
import { GoogleAnalytics } from '@next/third-parties/google'
import { SessionProvider } from "@/components/features/SessionProvider"
import { AnalyticsProvider } from "@/components/features/AnalyticsProvider"
import { WebVitalsReporter } from "@/components/features/WebVitalsReporter"
import NavBar from "@/components/NavBar"
import { PWAInstaller } from "@/components/features/PWAInstaller"
import { QuickSearch } from "@/components/features/QuickSearch"
import { ToastContainer } from "@/components/features/ToastContainer"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { JsonLd } from "@/components/seo/JsonLd"
import { BetaBanner } from "@/components/features/BetaBanner"
import { getSystemSettings } from "@/lib/settings"

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" })
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

const BASE_URL = 'https://www.hallyuhub.com.br'

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
    const settings = await getSystemSettings()

    return (
        <html lang="pt-BR" className={`${outfit.variable} ${inter.variable}`} suppressHydrationWarning>
            <body className="font-sans text-zinc-900 dark:text-white bg-white dark:bg-black antialiased selection:bg-neon-pink selection:text-white transition-colors duration-300">
                {process.env.NEXT_PUBLIC_GA_ID && (
                    <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
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
                    "sameAs": [],
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
                    <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 z-[9999]" />
                    <BetaBanner />
                    <div className="min-h-screen flex flex-col">
                        <NavBar premiumEnabled={settings.premiumEnabled} />
                        <ErrorBoundary>
                            <main className="flex-grow">{children}</main>
                        </ErrorBoundary>
                        <QuickSearch />
                        <ToastContainer />
                        <PWAInstaller />
                        <footer className="bg-black border-t border-zinc-800 py-12">
                            <div className="max-w-7xl mx-auto px-4">
                                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                    <span className="text-2xl font-black tracking-tighter uppercase"><span className="text-purple-500">HALLYU</span><span className="text-pink-500">HUB</span></span>
                                    <div className="flex flex-wrap justify-center gap-6 text-sm text-zinc-500">
                                        <a href="/about" className="hover:text-white underline-offset-4 hover:underline">Sobre nós</a>
                                        <a href="/faq" className="hover:text-white underline-offset-4 hover:underline">FAQ</a>
                                        <a href="/privacidade" className="hover:text-white underline-offset-4 hover:underline">Privacidade</a>
                                        <a href="/termos" className="hover:text-white underline-offset-4 hover:underline">Termos de Uso</a>
                                    </div>
                                    <p className="text-zinc-600 text-xs text-center md:text-right">
                                        &copy; {new Date().getFullYear()} HallyuHub. O portal brasileiro da cultura coreana.
                                    </p>
                                </div>
                            </div>
                        </footer>
                    </div>
                    </AnalyticsProvider>
                </SessionProvider>
            </body>
        </html>
    )
}
