"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Search, X } from "lucide-react"
import { SearchBar } from "@/components/features/SearchBar"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { UserMenu } from "@/components/features/UserMenu"
import { MobileMenu } from "@/components/features/MobileMenu"

const NavBar = () => {
    const pathname = usePathname()
    const [isScrolled, setIsScrolled] = useState(false)
    const [showSearch, setShowSearch] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    // Hide NavBar on auth pages - AFTER all hooks
    if (pathname?.startsWith('/auth')) return null

    const navLinks = [
        { label: "Início", href: "/" },
        { label: "Artistas", href: "/artists" },
        { label: "Agências", href: "/agencies" },
        { label: "Filmes & Séries", href: "/productions" },
        { label: "Notícias", href: "/news" },
        { label: "Premium", href: "/premium" },
        { label: "Sobre", href: "/about" },
    ]

    return (
        <nav className={`w-full z-[100] transition-all duration-300 ${isScrolled ? 'glass-nav py-2' : 'fixed top-0 bg-transparent bg-gradient-to-b from-black/80 to-transparent py-6'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 md:h-20">
                    <div className="flex items-center gap-10">
                        <Link href="/" className="text-2xl md:text-3xl font-black tracking-tighter uppercase">
                            <span className="text-purple-500">HALLYU</span><span className="text-pink-500">HUB</span>
                        </Link>
                        <div className="hidden md:flex space-x-6">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`text-sm font-medium hover:text-zinc-300 transition-colors focus-visible:outline-none focus-visible:text-white focus-visible:underline focus-visible:underline-offset-4 ${pathname === link.href ? "text-white" : "text-zinc-400"
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Mobile menu - Only visible on mobile */}
                        <MobileMenu links={navLinks} />

                        {/* Theme toggle */}
                        <ThemeToggle />

                        {/* Search button and expanded search */}
                        <div className="relative">
                            {!showSearch ? (
                                <button
                                    onClick={() => setShowSearch(true)}
                                    className="text-zinc-400 hover:text-white transition-colors"
                                >
                                    <Search className="h-6 w-6" />
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className="w-48 md:w-64">
                                        <SearchBar />
                                    </div>
                                    <button
                                        onClick={() => setShowSearch(false)}
                                        className="text-zinc-400 hover:text-white transition-colors"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* User menu */}
                        <UserMenu />
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default NavBar
