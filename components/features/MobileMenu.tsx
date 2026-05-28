"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Home, Mic2, Users, Film, PenLine, Search, User, LogOut, Settings, LayoutDashboard, ChevronRight, X, ShoppingBag, Calendar } from "lucide-react"
import { BrandMark } from "@/components/ui/BrandMark"
import Image from "next/image"
import { accountNavGroups } from "@/lib/config/account-navigation"

interface MobileMenuProps {
  links: Array<{ label: string; href: string }>
}

const LINK_ICONS: Record<string, React.ElementType> = {
  "/":            Home,
  "/artists":     Mic2,
  "/groups":      Users,
  "/productions": Film,
  "/blog":        PenLine,
  "/calendario":  Calendar,
  "/loja":        ShoppingBag,
}

export const MobileMenu = ({ links }: MobileMenuProps) => {
  const { data: session } = useSession()
  const pathname = usePathname()
  const menuId = "mobile-menu-toggle"
  const closeMenu = () => {
    const checkbox = document.getElementById(menuId) as HTMLInputElement | null
    if (checkbox) checkbox.checked = false
  }

  useEffect(() => {
    const checkbox = document.getElementById(menuId) as HTMLInputElement | null
    if (checkbox) checkbox.checked = false
  }, [pathname])

  const initials = session?.user
    ? (session.user.name || session.user.email || '?')
        .split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
    : ''

  const isAdmin = ['admin', 'editor'].includes(session?.user?.role?.toLowerCase() ?? '')

  return (
    <>
      {/* Hamburger */}
      <input
        id={menuId}
        type="checkbox"
        className="peer sr-only"
        aria-hidden="true"
      />
      <label
        htmlFor={menuId}
        className="flex h-10 w-10 items-center justify-center rounded-md border border-transparent text-foreground transition-colors hover:border-border hover:bg-surface lg:hidden"
        aria-label="Abrir menu"
        aria-controls="mobile-menu-drawer"
        role="button"
      >
        <span className="flex flex-col items-center justify-center gap-[5px]" aria-hidden="true">
          <span className="block h-0.5 w-5 rounded-sm bg-current" />
          <span className="block h-0.5 w-5 rounded-sm bg-current" />
          <span className="block h-0.5 w-5 rounded-sm bg-current" />
        </span>
      </label>

        <div className="fixed inset-0 z-[9999] hidden peer-checked:block lg:hidden" role="dialog" aria-modal="true" aria-label="Menu principal">
          <label
            htmlFor={menuId}
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            aria-label="Fechar menu"
          />
          <div
            id="mobile-menu-drawer"
            className="animate-slide-in-left relative flex h-full w-[min(88vw,380px)] flex-col overflow-hidden border-r border-border bg-background shadow-[18px_0_36px_rgba(0,0,0,0.28)]"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >

          {/* Header */}
          <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-border px-4">
            <Link href="/" onClick={closeMenu} className="flex items-center gap-2.5 text-foreground">
              <BrandMark size={30} />
              <span className="text-[18px] font-black tracking-[-0.035em]">
                HallyuHub<span className="text-accent">.</span>
              </span>
            </Link>
            <label
              htmlFor={menuId}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-border text-muted transition-colors hover:bg-surface hover:text-foreground"
              aria-label="Fechar menu"
              role="button"
            >
              <X size={20} />
            </label>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto overscroll-contain py-3">

            {/* User card (logged in) */}
            {session && (
              <div className="mx-4 mb-3 rounded-lg border border-border bg-surface p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-accent/20">
                  {session.user.image ? (
                     
                    <Image src={session.user.image} alt={session.user.name || ''} width={44} height={44} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-accent flex items-center justify-center">
                      <span className="text-white text-small font-bold">{initials}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-foreground truncate">{session.user.name || 'Usuário'}</p>
                  <p className="text-[11px] text-muted truncate">{session.user.email}</p>
                  {isAdmin && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold uppercase bg-accent/10 text-accent rounded-full">
                      {session.user.role}
                    </span>
                  )}
                </div>
                <ChevronRight size={16} className="text-muted flex-shrink-0" />
              </div>
            )}

            {/* Section: Navegar */}
            <div className="px-4 pt-2 pb-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted mb-1 px-1">Navegar</p>
            </div>
            <div className="px-3">
              {links.map((link) => {
                const Icon = LINK_ICONS[link.href]
                const active = pathname === link.href || pathname?.startsWith(link.href + '/')
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-bold transition-colors mb-0.5 ${
                      active
                        ? 'bg-accent text-white'
                        : 'text-foreground hover:bg-surface'
                    }`}
                  >
                    {Icon && <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'text-white' : 'text-muted'}`} />}
                    {link.label}
                    {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
                  </Link>
                )
              })}
              <Link
                href="/search"
                onClick={closeMenu}
                className="mb-0.5 flex min-h-11 items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-bold text-foreground transition-colors hover:bg-surface"
              >
                <Search className="w-[18px] h-[18px] flex-shrink-0 text-muted" />
                Buscar
              </Link>
            </div>

            {/* Section: Conta */}
            <div className="px-3 pt-4">
              {session ? (
                <>
                  {accountNavGroups.map(group => (
                    <section key={group.label} className="mb-3 rounded-lg border border-border bg-surface p-2">
                      <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">{group.label}</p>
                      {group.items.map(({ href, label, icon: Icon }) => {
                        const active = pathname === href || pathname?.startsWith(href + '/')
                        return (
                          <Link
                            key={href}
                            href={href}
                            onClick={closeMenu}
                            className={`mb-0.5 flex min-h-11 items-center gap-3 rounded-lg px-3 py-3 text-[14px] font-semibold transition-colors ${
                              active
                                ? 'bg-foreground text-background'
                                : 'text-foreground hover:bg-background'
                            }`}
                          >
                            <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${active ? 'text-background' : 'text-muted'}`} />
                            {label}
                            {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />}
                          </Link>
                        )
                      })}
                    </section>
                  ))}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={closeMenu}
                      className="mb-0.5 flex min-h-11 items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-semibold text-accent transition-colors hover:bg-accent/10"
                    >
                      <LayoutDashboard className="w-[18px] h-[18px] flex-shrink-0" />
                      Painel Admin
                    </Link>
                  )}
                  <button
                    onClick={() => { closeMenu(); signOut({ callbackUrl: '/' }) }}
                    className="mb-0.5 flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[15px] font-semibold text-red-400 transition-colors hover:bg-red-500/8"
                  >
                    <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={closeMenu}
                    className="mb-0.5 flex min-h-11 items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-bold text-foreground transition-colors hover:bg-surface"
                  >
                    <User className="w-[18px] h-[18px] flex-shrink-0 text-muted" />
                    Entrar
                  </Link>
                </>
              )}
            </div>

            <div className="h-6" />
          </div>

          {/* Footer CTA (logged out only) */}
          {!session && (
            <div className="flex flex-col gap-2.5 border-t border-border px-4 pb-4 pt-3">
              <Link
                href="/auth/register"
                onClick={closeMenu}
                className="w-full rounded-lg bg-accent py-3.5 text-center text-[15px] font-bold text-white transition-all hover:brightness-110"
              >
                Criar conta grátis
              </Link>
              <Link
                href="/artists"
                onClick={closeMenu}
                className="w-full rounded-lg border border-border py-3.5 text-center text-[15px] font-semibold text-foreground transition-colors hover:bg-surface"
              >
                Explorar a plataforma
              </Link>
            </div>
          )}
          </div>
        </div>
    </>
  )
}
