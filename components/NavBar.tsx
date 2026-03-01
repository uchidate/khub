"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { Search } from "lucide-react"
import { GlobalSearch } from "@/components/ui/GlobalSearch"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { UserMenu } from "@/components/features/UserMenu"
import { MobileMenu } from "@/components/features/MobileMenu"
import { MobileSearchOverlay } from "@/components/features/MobileSearchOverlay"

const NavBar = ({ premiumEnabled = false, betaMode = false }: { premiumEnabled?: boolean; betaMode?: boolean }) => {
    const pathname = usePathname()
    const [isScrolled, setIsScrolled] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const closeSearch = useCallback(() => setSearchOpen(false), [])

    // Hide NavBar on auth and admin pages - AFTER all hooks
    if (pathname?.startsWith('/auth') || pathname?.startsWith('/admin')) return null

    const navLinks = [
        { label: "Início", href: "/" },
        { label: "Artistas", href: "/artists" },
        { label: "Grupos", href: "/groups" },
        { label: "Produções", href: "/productions" },
        { label: "Notícias", href: "/news" },
        ...(premiumEnabled ? [{ label: "Premium", href: "/premium" }] : []),
    ]

    return (
        <>
            <nav className={`w-full z-[100] fixed transition-all duration-300 ${betaMode && !isScrolled ? 'top-10' : 'top-0'} ${isScrolled ? 'glass-nav py-2' : 'bg-black/70 backdrop-blur-md md:bg-transparent md:backdrop-blur-none md:bg-gradient-to-b md:from-black/80 md:dark:from-black/80 md:to-transparent py-4 md:py-6'}`}>
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
                                    className={`text-sm font-medium transition-colors whitespace-nowrap ${pathname === link.href
                                        ? "text-purple-600 dark:text-white font-semibold"
                                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-300"
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
                            <div className="hidden md:flex items-center gap-2 pr-3 border-r border-zinc-200 dark:border-zinc-700/50">
                                <ThemeToggle />
                            </div>

                            {/* User menu - Always visible */}
                            <div className="hidden md:block">
                                <UserMenu premiumEnabled={premiumEnabled} />
                            </div>

                            {/* Mobile actions grouped */}
                            <div className="flex md:hidden items-center gap-2">
                                {/* Mobile search button */}
                                <button
                                    onClick={() => setSearchOpen(true)}
                                    className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                                    aria-label="Buscar"
                                >
                                    <Search className="w-5 h-5" />
                                </button>
                                <ThemeToggle />
                                <UserMenu premiumEnabled={premiumEnabled} />
                                <div className="pl-2 border-l border-zinc-200 dark:border-zinc-700/50">
                                    <MobileMenu links={navLinks} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile search overlay */}
            <MobileSearchOverlay isOpen={searchOpen} onClose={closeSearch} />
        </>
    )
}

export default NavBar
