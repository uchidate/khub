import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../../styles/globals.css"
import NavBar from "@/components/NavBar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "HallyuHub - O Portal da Onda Coreana",
    description: "O portal definitivo para fãs de K-Pop, K-Dramas e cultura coreana no Brasil.",
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
            <body className={`${inter.className} bg-black text-white selection:bg-purple-500 selection:text-white`}>
                <div className="min-h-screen flex flex-col">
                    <NavBar />
                    <main className="flex-grow">{children}</main>
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
            </body>
        </html>
    )
}
