import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../styles/globals.css"
import { SessionProvider } from "@/components/features/SessionProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "HallyuHub - O Portal da Onda Coreana",
    description: "O portal definitivo para fãs de K-Pop, K-Dramas e cultura coreana no Brasil.",
    manifest: "/manifest.json",
    themeColor: "#a855f7",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "HallyuHub",
    },
    openGraph: {
        title: "HallyuHub",
        description: "Cultura coreana em um só lugar.",
        images: [{ url: "https://staging.seu-dominio.com/og-image.jpg" }],
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pt-BR">
            <body className={`${inter.className} bg-white dark:bg-black text-zinc-900 dark:text-white selection:bg-purple-500 selection:text-white transition-colors duration-300`}>
                <SessionProvider>
                    {children}
                </SessionProvider>
            </body>
        </html>
    )
}
