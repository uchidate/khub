"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import type { MouseEvent } from "react"
import { Command, Search } from "lucide-react"
import { UserMenu } from "@/components/features/UserMenu"
import { MobileMenu } from "@/components/features/MobileMenu"
import { NotificationBell } from "@/components/features/NotificationBell"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { useSession } from "next-auth/react"
import { useQuickSearch } from "@/lib/hooks/useQuickSearch"
import { BrandMark } from "@/components/ui/BrandMark"
import { QuickSearch } from "@/components/features/QuickSearch"

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


const SUBTITLES = [
    'k-pop · k-drama · cultura coreana, em português',
    'artistas · grupos · produções',
    'tendências · notícias · calendário',
    'tudo sobre o universo hallyu',
]

function AnimatedLogoLink() {
    const [si, setSi] = useState(0)
    const [text, setText] = useState(SUBTITLES[0])
    const [deleting, setDeleting] = useState(false)
    const pos = useRef(SUBTITLES[0].length)

    useEffect(() => {
        const target = SUBTITLES[si]
        let timeout: ReturnType<typeof setTimeout>

        if (!deleting) {
            if (pos.current < target.length) {
                timeout = setTimeout(() => {
                    pos.current++
                    setText(target.slice(0, pos.current))
                }, 40)
            } else {
                // Pausa longa antes de apagar — 8 segundos
                timeout = setTimeout(() => setDeleting(true), 8000)
            }
        } else {
            if (pos.current > 0) {
                timeout = setTimeout(() => {
                    pos.current--
                    setText(target.slice(0, pos.current))
                }, 22)
            } else {
                setDeleting(false)
                setSi(i => (i + 1) % SUBTITLES.length)
            }
        }
        return () => clearTimeout(timeout)
    }, [text, deleting, si])

    return (
        <Link href="/" className="flex items-end gap-5">
            <div className="mb-1 shrink-0 text-foreground">
                <BrandMark size={72} />
            </div>
            <div>
                <span className="block text-[58px] font-black leading-[0.86] tracking-[-0.055em] text-foreground">
                    HallyuHub<span aria-hidden="true" className="inline-flex items-end pb-[0.12em]" style={{ lineHeight: 1 }}><svg width="0.22em" height="0.22em" viewBox="0 0 1 1" style={{ display: 'inline-block', fill: '#ff246e' }}><circle cx="0.5" cy="0.5" r="0.5" /></svg></span>
                </span>
                <span className="mt-2 block text-[14px] font-semibold tracking-[-0.02em] text-muted min-w-[320px]">
                    {text}<span className="opacity-60 animate-pulse">|</span>
                </span>
            </div>
        </Link>
    )
}

function formatEditionDate(now = new Date()) {
    const date = new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(now)
    const seul = now.toLocaleTimeString("pt-BR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hour12: false })
    const sp = now.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", hour12: false })
    return `${date} · seul ${seul} · são paulo ${sp}`
}

const NavBar = ({ tickerItems = [] }: { tickerItems?: TickerItem[] }) => {
    const navRef = useRef<HTMLElement | null>(null)
    const pathname = usePathname()
    const { data: session } = useSession()
    const [isScrolled, setIsScrolled] = useState(false)
    const openSearch = useQuickSearch((state) => state.open)
    const [editionDate, setEditionDate] = useState(() => formatEditionDate())
    useEffect(() => {
        const tick = () => setEditionDate(formatEditionDate())
        const now = new Date()
        const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds()
        const t = setTimeout(() => { tick(); const iv = setInterval(tick, 60_000); return () => clearInterval(iv) }, msToNextMinute)
        return () => clearTimeout(t)
    }, [])

    const handleOpenSearch = (event?: MouseEvent) => {
        event?.preventDefault()
        openSearch()
        window.dispatchEvent(new Event("quick-search:open"))
    }

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 0)
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    useEffect(() => {
        const root = document.documentElement
        const nav = navRef.current
        if (!nav) return

        const updateHeaderHeight = () => {
            root.style.setProperty("--site-header-h", `${Math.ceil(nav.getBoundingClientRect().height)}px`)
        }

        updateHeaderHeight()
        const observer = new ResizeObserver(updateHeaderHeight)
        observer.observe(nav)
        window.addEventListener("resize", updateHeaderHeight)

        return () => {
            observer.disconnect()
            window.removeEventListener("resize", updateHeaderHeight)
            root.style.removeProperty("--site-header-h")
        }
    }, [tickerItems.length])

    if (pathname?.startsWith("/auth") || pathname?.startsWith("/admin") || pathname?.startsWith("/write")) return null

    const isActiveLink = (href: string) => {
        const cleanHref = href.split("?")[0]
        if (href === "/") return pathname === "/"
        return pathname === cleanHref || pathname?.startsWith(`${cleanHref}/`)
    }

    return (
        <nav
            ref={navRef}
            className={`sticky z-[320] bg-background transition-shadow duration-300 ${isScrolled ? "shadow-[0_1px_0_var(--color-border)]" : ""}`}
            style={{ top: 'var(--adsense-anchor-top-offset, 0px)' }}
        >
            {/* Mobile */}
            <div className="lg:hidden">
                <div className="flex h-[52px] items-center justify-between border-b border-border px-3">
                    <div className="flex items-center gap-2">
                        <MobileMenu links={navLinks} />
                        <Link href="/" className="flex items-center gap-2 text-foreground">
                            <BrandMark size={32} />
                            <span className="text-[22px] font-black tracking-[-0.035em]">
                                HallyuHub<span className="text-accent">.</span>
                            </span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-1">
                        <Link
                            href="/search"
                            onClick={handleOpenSearch}
                            className="flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-muted transition-colors hover:border-border hover:bg-surface hover:text-foreground"
                            aria-label="Buscar"
                        >
                            <Search className="h-[18px] w-[18px]" />
                        </Link>
                        <ThemeToggle />
                    </div>
                </div>
                {/* Links de navegação mobile */}
                <div className="flex h-10 items-center overflow-x-auto border-b border-foreground/20 px-2 scrollbar-none" style={{ background: '#0a0a0a' }}>
                    {navLinks.map(({ label, href }) => (
                        <Link
                            key={href}
                            href={href}
                            className={`relative flex h-full shrink-0 items-center px-3 text-[13px] font-bold tracking-[-0.01em] transition-colors after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:transition-transform ${
                                isActiveLink(href) ? 'after:scale-x-100 after:bg-accent' : 'after:scale-x-0 after:bg-accent'
                            }`}
                            style={{ color: isActiveLink(href) ? '#ff246e' : 'rgba(255,255,255,0.65)' }}
                        >
                            {label}
                        </Link>
                    ))}
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
                    <AnimatedLogoLink />

                    <div className="flex items-center gap-2 pb-2">
                        <Link
                            href="/search"
                            className="flex h-9 min-w-[320px] items-center gap-2 rounded-md border border-border bg-background px-3 text-left text-[12px] font-semibold text-muted transition-colors hover:border-foreground hover:text-foreground"
                            onClick={handleOpenSearch}
                        >
                            <Search className="h-4 w-4 shrink-0 opacity-70" />
                            <span className="min-w-0 flex-1 truncate">Buscar em artistas, grupos, produções, loja...</span>
                            <span className="inline-flex items-center gap-1 border-l border-border pl-2 font-mono text-[10px] font-black uppercase">
                                <Command className="h-2.5 w-2.5" /> K
                            </span>
                        </Link>
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

                {/* Nav links */}
                <div className="flex h-12 items-center border-b-2 border-foreground px-10" style={{ background: '#0a0a0a' }}>
                    <div className="flex h-full flex-1 items-center gap-8 overflow-x-auto">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                aria-current={isActiveLink(link.href) ? "page" : undefined}
                                className={`relative flex h-full shrink-0 items-center text-[15px] font-bold tracking-[-0.02em] transition-colors after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:transition-transform ${
                                    isActiveLink(link.href)
                                        ? "after:scale-x-100 after:bg-accent"
                                        : "after:scale-x-0 after:bg-accent"
                                }`}
                                style={{ color: isActiveLink(link.href) ? '#ff246e' : 'rgba(255,255,255,0.7)' }}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
            <QuickSearch />
        </nav>
    )
}

export default NavBar
