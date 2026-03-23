"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { UserMenu } from "@/components/features/UserMenu"
import { MobileMenu } from "@/components/features/MobileMenu"
import { NotificationBell } from "@/components/features/NotificationBell"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { useSession } from "next-auth/react"
import { useQuickSearch } from "@/lib/hooks/useQuickSearch"

function OrbitalMark({ size = 28 }: { size?: number }) {
    return (
        <svg viewBox="0 0 38 38" fill="none" width={size} height={size}>
            <rect x="5"  y="8" width="6" height="22" rx="3" fill="currentColor"/>
            <rect x="27" y="8" width="6" height="22" rx="3" fill="currentColor"/>
            <path d="M11 19 Q19 13 27 19" stroke="#ff2d78" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <circle cx="19" cy="13.5" r="2.5" fill="#ff2d78"/>
        </svg>
    )
}

const NavBar = () => {
    const pathname = usePathname()
    const { data: session } = useSession()
    const [isScrolled, setIsScrolled] = useState(false)
    const openSearch = useQuickSearch(s => s.open)

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 0)
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    if (pathname?.startsWith('/auth') || pathname?.startsWith('/admin') || pathname?.startsWith('/write')) return null

    const navLinks = [
        { label: "Artistas", href: "/artists" },
        { label: "Grupos", href: "/groups" },
        { label: "Produções", href: "/productions" },
        { label: "Notícias", href: "/news" },
        { label: "Blog", href: "/blog" },
    ]

    const navBg = isScrolled
        ? 'bg-background/95 backdrop-blur-xl border-b border-border shadow-sm'
        : 'bg-background border-b border-border'

    return (
        <>
            <nav className={`w-full z-[100] sticky top-0 transition-[background-color,backdrop-filter,box-shadow] duration-300 ${navBg}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between gap-3 h-[52px] sm:h-[60px] lg:h-[64px]">

                        {/* Left: hamburger (mobile) + logo */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="flex lg:hidden">
                                <MobileMenu links={navLinks} />
                            </div>
                            <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity text-foreground">
                                <OrbitalMark size={28} />
                                <span className="text-[14px] font-bold tracking-[-0.02em] text-foreground">
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
                                            : 'text-muted hover:text-foreground hover:bg-surface'
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        {/* Right: search + theme toggle + auth */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Search bar (tablet+) */}
                            <div className="hidden sm:flex items-center gap-2 bg-surface border border-border rounded-full px-3 py-[7px] text-[11.5px] text-muted cursor-text min-w-[150px] lg:min-w-[200px]"
                                onClick={() => openSearch()}
                            >
                                <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 opacity-50">
                                    <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                                    <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                                Buscar artistas, dramas…
                            </div>

                            {/* Mobile search icon */}
                            <button
                                onClick={() => openSearch()}
                                className="sm:hidden w-10 h-10 flex items-center justify-center rounded-full text-muted hover:bg-surface transition-colors"
                                aria-label="Buscar"
                            >
                                <Search className="w-[18px] h-[18px]" />
                            </button>

                            {/* Theme toggle */}
                            <ThemeToggle />

                            {/* Logged out: Entrar + Criar conta */}
                            {!session && (
                                <>
                                    <Link
                                        href="/auth/login"
                                        className="hidden sm:block text-[11.5px] font-semibold text-muted hover:text-foreground transition-colors whitespace-nowrap"
                                    >
                                        Entrar
                                    </Link>
                                    <Link
                                        href="/auth/register"
                                        className="hidden sm:block bg-accent text-white text-[11.5px] font-semibold rounded-full px-4 py-[7px] hover:brightness-110 transition-all whitespace-nowrap"
                                    >
                                        Criar conta
                                    </Link>
                                </>
                            )}

                            {/* Logged in: notifications + user menu */}
                            {session && (
                                <div className="hidden sm:flex items-center gap-1.5">
                                    <NotificationBell />
                                    <UserMenu />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

        </>
    )
}

export default NavBar
