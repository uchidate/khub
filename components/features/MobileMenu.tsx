"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { useSession, signOut } from "next-auth/react"
import { Mic2, Users, Film, PenLine, Search, User, LogOut, Settings, LayoutDashboard, ChevronRight, X } from "lucide-react"
import { BrandMark } from "@/components/ui/BrandMark"

interface MobileMenuProps {
  links: Array<{ label: string; href: string }>
}

const LINK_ICONS: Record<string, React.ElementType> = {
  "/artists":     Mic2,
  "/groups":      Users,
  "/productions": Film,
  "/blog":        PenLine,
}

export const MobileMenu = ({ links }: MobileMenuProps) => {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setIsOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  const initials = session?.user
    ? (session.user.name || session.user.email || '?')
        .split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
    : ''

  const isAdmin = ['admin', 'editor'].includes(session?.user?.role?.toLowerCase() ?? '')

  return (
    <>
      {/* Hamburger */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-10 h-10 flex flex-col items-center justify-center gap-[5px] lg:hidden"
        aria-label="Abrir menu"
        aria-expanded={isOpen}
      >
        <span className="block w-5 h-0.5 bg-foreground rounded-sm" />
        <span className="block w-5 h-0.5 bg-foreground rounded-sm" />
        <span className="block w-5 h-0.5 bg-foreground rounded-sm" />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-background flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-5 border-b border-border h-[56px] flex-shrink-0">
            <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2.5 text-foreground">
              <BrandMark size={26} />
              <span className="text-[15px] font-black tracking-[-0.02em]">
                Hallyu<span className="text-accent">Hub</span>
              </span>
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="w-9 h-9 flex items-center justify-center rounded-full text-muted hover:text-foreground hover:bg-surface transition-colors"
              aria-label="Fechar menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto">

            {/* User card (logged in) */}
            {session && (
              <div className="mx-4 mt-4 mb-2 rounded-2xl border border-border bg-surface p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-accent/20">
                  {session.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={session.user.image} alt={session.user.name || ''} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-accent flex items-center justify-center">
                      <span className="text-white text-[13px] font-bold">{initials}</span>
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
            <div className="px-4 pt-4 pb-1">
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
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3.5 rounded-xl text-[15px] font-semibold transition-colors mb-0.5 ${
                      active
                        ? 'bg-accent/10 text-accent'
                        : 'text-foreground hover:bg-surface'
                    }`}
                  >
                    {Icon && <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'text-accent' : 'text-muted'}`} />}
                    {link.label}
                    {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />}
                  </Link>
                )
              })}
              <Link
                href="/search"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-[15px] font-semibold text-foreground hover:bg-surface transition-colors mb-0.5"
              >
                <Search className="w-[18px] h-[18px] flex-shrink-0 text-muted" />
                Buscar
              </Link>
            </div>

            {/* Section: Conta */}
            <div className="px-4 pt-4 pb-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted mb-1 px-1">Conta</p>
            </div>
            <div className="px-3">
              {session ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-[15px] font-semibold text-foreground hover:bg-surface transition-colors mb-0.5"
                  >
                    <User className="w-[18px] h-[18px] flex-shrink-0 text-muted" />
                    Meu Perfil
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-[15px] font-semibold text-foreground hover:bg-surface transition-colors mb-0.5"
                  >
                    <Settings className="w-[18px] h-[18px] flex-shrink-0 text-muted" />
                    Configurações
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-[15px] font-semibold text-accent hover:bg-accent/10 transition-colors mb-0.5"
                    >
                      <LayoutDashboard className="w-[18px] h-[18px] flex-shrink-0" />
                      Painel Admin
                    </Link>
                  )}
                  <button
                    onClick={() => { setIsOpen(false); signOut({ callbackUrl: '/' }) }}
                    className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-[15px] font-semibold text-red-400 hover:bg-red-500/8 transition-colors w-full text-left mb-0.5"
                  >
                    <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-[15px] font-semibold text-foreground hover:bg-surface transition-colors mb-0.5"
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
            <div className="px-4 pb-6 pt-3 border-t border-border flex flex-col gap-2.5">
              <Link
                href="/auth/register"
                onClick={() => setIsOpen(false)}
                className="w-full text-center bg-accent text-white rounded-full py-3.5 text-[15px] font-bold hover:brightness-110 transition-all"
              >
                Criar conta grátis
              </Link>
              <Link
                href="/artists"
                onClick={() => setIsOpen(false)}
                className="w-full text-center border border-border text-foreground rounded-full py-3.5 text-[15px] font-semibold hover:bg-surface transition-colors"
              >
                Explorar a plataforma
              </Link>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  )
}
