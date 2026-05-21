"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Command, Search } from "lucide-react"
import { UserMenu } from "@/components/features/UserMenu"
import { MobileMenu } from "@/components/features/MobileMenu"
import { NotificationBell } from "@/components/features/NotificationBell"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { useSession } from "next-auth/react"
import { useQuickSearch } from "@/lib/hooks/useQuickSearch"
import { BrandMark } from "@/components/ui/BrandMark"

interface TickerItem {
    type: 'article' | 'artist'
    href: string
    label: string
    title: string
}

const navLinks = [
    { label: "Início", href: "/" },
    { label: "Artigos", href: "/blog" },
    { label: "Artistas", href: "/artists" },
    { label: "Grupos", href: "/groups" },
    { label: "Produções", href: "/productions" },
    { label: "Calendário", href: "/calendario" },
    { label: "Loja", href: "/loja" },
]

function formatEditionDate() {
    const date = new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(new Date())
    return `${date} · seul 23:41 · são paulo 11:41`
}

const NavBar = ({ tickerItems = [] }: { tickerItems?: TickerItem[] }) => {
    const pathname = usePathname()
    const { data: session } = useSession()
    const [isScrolled, setIsScrolled] = useState(false)
    const openSearch = useQuickSearch((state) => state.open)
    const editionDate = useMemo(() => formatEditionDate(), [])

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 0)
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    useEffect(() => {
        const root = document.documentElement
        root.style.setProperty("--site-header-h", tickerItems.length > 0 ? "220px" : "192px")
        return () => { root.style.removeProperty("--site-header-h") }
    }, [tickerItems.length])

    if (pathname?.startsWith("/auth") || pathname?.startsWith("/admin") || pathname?.startsWith("/write")) return null

    const isActiveLink = (href: string) => {
        const cleanHref = href.split("?")[0]
        if (href === "/") return pathname === "/"
        return pathname === cleanHref || pathname?.startsWith(`${cleanHref}/`)
    }

    return (
        <nav className={`sticky top-0 z-[320] bg-background transition-shadow duration-300 ${isScrolled ? "shadow-[0_1px_0_var(--color-border)]" : ""}`}>
            {/* Mobile */}
            <div className="lg:hidden">
                <div className="flex h-[52px] items-center justify-between border-b border-border px-3">
                    <div className="flex items-center gap-2">
                        <MobileMenu links={navLinks} />
                        <Link href="/" className="flex items-center gap-2 text-foreground">
                            <BrandMark size={32} />
                            <span className="text-[22px] font-black tracking-[-0.035em]">
                                Hallyu<span className="text-accent">Hub</span>
                            </span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => openSearch()}
                            className="flex h-10 w-10 items-center justify-center text-muted transition-colors hover:bg-surface"
                            aria-label="Buscar"
                        >
                            <Search className="h-[18px] w-[18px]" />
                        </button>
                        <ThemeToggle />
                    </div>
                </div>
            </div>

            {/* Desktop */}
            <div className="hidden lg:block">
                {/* Faixa de data */}
                <div className="flex h-9 items-center border-b border-border px-10 font-mono text-[12px] lowercase tracking-[0.02em] text-muted">
                    <span>{editionDate}</span>
                </div>

                {/* Logo + botões */}
                <div className="flex h-[112px] items-end justify-between border-b-2 border-foreground px-10 pb-5">
                    <Link href="/" className="group">
                        <span className="block text-[58px] font-black leading-[0.86] tracking-[-0.055em] text-foreground transition-colors group-hover:text-accent">
                            HallyuHub<span className="text-accent">.</span>
                        </span>
                        <span className="mt-2 block text-[14px] font-semibold tracking-[-0.02em] text-muted">
                            k-pop · k-drama · cultura coreana, em português
                        </span>
                    </Link>

                    <div className="flex items-center gap-2 pb-2">
                        <button
                            type="button"
                            className="flex min-w-[260px] items-center gap-2 border border-border bg-background px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-muted transition-colors hover:border-foreground hover:text-foreground"
                            onClick={() => openSearch()}
                        >
                            <Search className="h-3.5 w-3.5 shrink-0 opacity-70" />
                            <span className="min-w-0 flex-1 truncate">Buscar artistas, artigos, dramas...</span>
                            <span className="inline-flex items-center gap-1 border-l border-border pl-2 text-[10px] font-black">
                                <Command className="h-2.5 w-2.5" /> K
                            </span>
                        </button>
                        <ThemeToggle />
                        {!session ? (
                            <>
                                <Link
                                    href="/auth/login"
                                    className="border border-border px-4 py-2 text-[11px] font-black uppercase tracking-[0.1em] text-foreground transition-colors hover:border-foreground"
                                >
                                    Entrar
                                </Link>
                                <Link
                                    href="/auth/register"
                                    className="bg-accent px-4 py-2 text-[11px] font-black uppercase tracking-[0.1em] text-white transition-opacity hover:opacity-90"
                                >
                                    Criar conta
                                </Link>
                            </>
                        ) : (
                            <div className="flex items-center gap-1.5">
                                <NotificationBell />
                                <UserMenu />
                            </div>
                        )}
                    </div>
                </div>

                {/* Ticker */}
                {tickerItems.length > 0 && (() => {
                    const items = [...tickerItems, ...tickerItems]
                    return (
                        <div className="flex h-[28px] items-center overflow-hidden border-b border-border/40">
                            <div className="flex shrink-0 items-center self-stretch bg-foreground px-3.5">
                                <span className="whitespace-nowrap font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-background">Em alta</span>
                            </div>
                            <div className="min-w-0 flex-1 overflow-hidden">
                                <div className="flex w-max items-center whitespace-nowrap animate-home-ticker">
                                    {items.map((item, index) => (
                                        <Link
                                            key={`ticker-${item.href}-${index}`}
                                            href={item.href}
                                            className="inline-flex h-[28px] shrink-0 items-center gap-2 border-r border-border/40 px-5 transition-opacity hover:opacity-70"
                                        >
                                            <span className={`font-mono text-[9px] font-bold uppercase tracking-[0.12em] ${item.type === 'artist' ? 'text-accent' : 'text-muted'}`}>
                                                {item.label}
                                            </span>
                                            <span className="text-[12px] font-medium text-foreground">{item.title}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )
                })()}

                {/* Nav links */}
                <div className="flex h-11 items-center border-b border-border px-10">
                    <div className="flex h-full flex-1 items-center gap-8 overflow-x-auto">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                aria-current={isActiveLink(link.href) ? "page" : undefined}
                                className={`relative flex h-full shrink-0 items-center text-[14px] font-semibold tracking-[-0.01em] transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-left after:transition-transform ${
                                    isActiveLink(link.href)
                                        ? "text-foreground after:scale-x-100 after:bg-accent"
                                        : "text-muted after:scale-x-0 after:bg-accent hover:text-foreground hover:after:scale-x-100"
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default NavBar
