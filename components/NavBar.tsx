"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { Search } from "lucide-react"
import { GlobalSearch } from "@/components/ui/GlobalSearch"
import { UserMenu } from "@/components/features/UserMenu"
import { MobileMenu } from "@/components/features/MobileMenu"
import { MobileSearchOverlay } from "@/components/features/MobileSearchOverlay"
import { NotificationBell } from "@/components/features/NotificationBell"
import { useSession } from "next-auth/react"

function OrbitalMark({ size = 28 }: { size?: number }) {
    return (
        <svg viewBox="0 0 38 38" fill="none" width={size} height={size}>
            <rect x="5"  y="8" width="6" height="22" rx="3" fill="#080808"/>
            <rect x="27" y="8" width="6" height="22" rx="3" fill="#080808"/>
            <path d="M11 19 Q19 13 27 19" stroke="#ff2d78" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <circle cx="19" cy="13.5" r="2.5" fill="#ff2d78"/>
        </svg>
    )
}

const NavBar = () => {
    const pathname = usePathname()
    const { data: session } = useSession()
    const [isScrolled, setIsScrolled] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 0)
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const closeSearch = useCallback(() => setSearchOpen(false), [])

    if (pathname?.startsWith('/auth') || pathname?.startsWith('/admin') || pathname?.startsWith('/write')) return null

    const navLinks = [
        { label: "Artistas", href: "/artists" },
        { label: "Grupos", href: "/groups" },
        { label: "Produções", href: "/productions" },
        { label: "Notícias", href: "/news" },
        { label: "Blog", href: "/blog" },
    ]

    const navBg = isScrolled
        ? 'bg-white/95 backdrop-blur-xl border-b border-[#e8e8e8] shadow-sm'
        : 'bg-white border-b border-[#e8e8e8]'

    return (
        <>
            <nav className={`w-full z-[100] fixed top-0 transition-[background-color,backdrop-filter,box-shadow] duration-300 ${navBg}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between gap-3 h-[52px] sm:h-[60px] lg:h-[64px]">

                        {/* Left: hamburger (mobile) + logo */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="flex lg:hidden">
                                <MobileMenu links={navLinks} />
                            </div>
                            <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                                <OrbitalMark size={28} />
                                <span className="text-[14px] font-bold tracking-[-0.02em] text-[#080808]">
                                    Hallyu<span className="text-[#ff2d78]">Hub</span>
                                </span>
                            </Link>
                        </div>

                        {/* Center: desktop nav links */}
                        <div className="hidden lg:flex items-center gap-0.5">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`text-[13px] font-medium px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                                        pathname === link.href
                                            ? 'text-[#ff2d78] font-semibold'
                                            : 'text-[#6b6b6b] hover:text-[#080808] hover:bg-[#f5f5f7]'
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        {/* Right: search + auth */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Search bar (tablet+) */}
                            <div className="hidden sm:flex lg:hidden xl:flex items-center gap-2 bg-[#f5f5f7] border border-[#e8e8e8] rounded-full px-3 py-1.5 text-[12px] text-[#6b6b6b] cursor-text min-w-[160px]"
                                onClick={() => setSearchOpen(true)}
                            >
                                <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 opacity-50">
                                    <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                                    <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                                Buscar artistas, dramas…
                            </div>

                            {/* Mobile search icon */}
                            <button
                                onClick={() => setSearchOpen(true)}
                                className="sm:hidden w-10 h-10 flex items-center justify-center rounded-full text-[#6b6b6b] hover:bg-[#f5f5f7] transition-colors"
                                aria-label="Buscar"
                            >
                                <Search className="w-[18px] h-[18px]" />
                            </button>

                            {/* Notifications (logged in) */}
                            {session && (
                                <div className="hidden sm:block">
                                    <NotificationBell />
                                </div>
                            )}

                            {/* User menu */}
                            <div className="hidden sm:block">
                                <UserMenu />
                            </div>

                            {/* CTA (not logged in, desktop) */}
                            {!session && (
                                <Link
                                    href="/auth/register"
                                    className="hidden sm:block bg-[#080808] text-white text-[12px] font-semibold rounded-full px-4 py-1.5 hover:bg-[#ff2d78] transition-colors whitespace-nowrap"
                                >
                                    Criar conta
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <MobileSearchOverlay isOpen={searchOpen} onClose={closeSearch} />
        </>
    )
}

export default NavBar
