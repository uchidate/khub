import type { Metadata } from "next"
import { Outfit, Inter } from "next/font/google"
import "../styles/globals.css"
import "../styles/nprogress.css"
import { GoogleAnalytics } from '@next/third-parties/google'
import { SessionProvider } from "@/components/features/SessionProvider"
import { NavigationProgress } from "@/components/features/NavigationProgress"
import NavBar from "@/components/NavBar"
import { PWAInstaller } from "@/components/features/PWAInstaller"
import { QuickSearch } from "@/components/features/QuickSearch"
import { ToastContainer } from "@/components/features/ToastContainer"
import { ErrorBoundary } from "@/components/ErrorBoundary"

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" })
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
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
    openGraph: {
        title: "HallyuHub",
        description: "Cultura coreana em um só lugar.",
        images: [{ url: "https://hallyuhub.com.br/og-image.jpg" }],
        siteName: 'HallyuHub',
        locale: 'pt_BR',
        type: 'website',
    },
    verification: {
        google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
}

export const viewport = {
    themeColor: "#bc13fe",
    width: 'device-width',
    initialScale: 1,
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pt-BR" className={`${outfit.variable} ${inter.variable}`} suppressHydrationWarning>
            <body className="font-sans text-zinc-900 dark:text-white bg-white dark:bg-black antialiased selection:bg-neon-pink selection:text-white transition-colors duration-300">
                {process.env.NEXT_PUBLIC_GA_ID && (
                    <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
                )}
                <SessionProvider>
                    <NavigationProgress />
                    <div className="min-h-screen flex flex-col">
                        <NavBar />
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
                                    <div className="flex gap-8 text-sm text-zinc-500">
                                        <a href="/about" className="hover:text-white underline-offset-4 hover:underline">Sobre nós</a>
                                        <a href="#" className="hover:text-white underline-offset-4 hover:underline">Privacidade</a>
                                        <a href="#" className="hover:text-white underline-offset-4 hover:underline">Termos</a>
                                    </div>
                                    <p className="text-zinc-600 text-xs text-center md:text-right">
                                        &copy; {new Date().getFullYear()} HallyuHub. O portal brasileiro da cultura coreana.
                                    </p>
                                </div>
                            </div>
                        </footer>
                    </div>
                </SessionProvider>
            </body>
        </html>
    )
}
