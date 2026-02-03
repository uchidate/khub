"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"

const NavBar = () => {
    const pathname = usePathname()
    const [isScrolled, setIsScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const navLinks = [
        { label: "Início", href: "/v1" },
        { label: "Artistas", href: "/v1/artists" },
        { label: "Agências", href: "/v1/agencies" },
        { label: "Filmes & Séries", href: "/v1/productions" },
        { label: "Notícias", href: "/v1/news" },
        { label: "Sobre", href: "/v1/about" },
    ]

    return (
        <nav className={`fixed top-0 w-full z-50 transition-colors duration-300 ${isScrolled ? 'bg-black' : 'bg-transparent bg-gradient-to-b from-black/80 to-transparent'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 md:h-20">
                    <div className="flex items-center gap-10">
                        <Link href="/v1" className="text-2xl md:text-3xl font-black tracking-tighter uppercase">
                            <span className="text-purple-500">HALLYU</span><span className="text-pink-500">HUB</span>
                        </Link>
                        <div className="hidden md:flex space-x-6">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`text-sm font-medium hover:text-zinc-300 transition-colors ${pathname === link.href ? "text-white" : "text-zinc-400"
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="text-zinc-400 hover:text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                        <div className="w-8 h-8 rounded bg-gradient-to-tr from-purple-600 to-pink-500 cursor-pointer"></div>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default NavBar
