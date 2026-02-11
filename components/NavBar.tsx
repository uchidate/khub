"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { GlobalSearch } from "@/components/ui/GlobalSearch"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { UserMenu } from "@/components/features/UserMenu"
import { MobileMenu } from "@/components/features/MobileMenu"

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
        <nav className={`w-full z-[100] fixed top-0 transition-all duration-300 ${isScrolled ? 'glass-nav py-2' : 'bg-transparent bg-gradient-to-b from-black/80 to-transparent py-6'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-4 md:gap-6 h-16 md:h-20">
                    {/* Logo */}
                    <Link href="/" className="text-2xl md:text-3xl font-black tracking-tighter uppercase flex-shrink-0 hover:opacity-80 transition-opacity">
                        <span className="text-purple-500">HALLYU</span><span className="text-pink-500">HUB</span>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <div className="hidden lg:flex items-center space-x-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`text-sm font-medium hover:text-zinc-300 transition-colors whitespace-nowrap ${pathname === link.href ? "text-white" : "text-zinc-400"
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Global Search - Centered, hidden on mobile */}
                    <div className="hidden md:flex flex-1 max-w-xl mx-4">
                        <GlobalSearch />
                    </div>

                    {/* Right side actions - Grouped */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Desktop actions grouped */}
                        <div className="hidden md:flex items-center gap-2 pr-3 border-r border-zinc-700/50">
                            <ThemeToggle />
                        </div>

                        {/* User menu - Always visible */}
                        <div className="hidden md:block">
                            <UserMenu />
                        </div>

                        {/* Mobile actions grouped */}
                        <div className="flex md:hidden items-center gap-2">
                            <ThemeToggle />
                            <UserMenu />
                            <div className="pl-2 border-l border-zinc-700/50">
                                <MobileMenu links={navLinks} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default NavBar
