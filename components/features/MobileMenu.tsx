"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { useSession } from "next-auth/react"
import { Mic2, Users, Film, PenLine, Search, User } from "lucide-react"
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
          {/* Drawer header */}
          <div className="flex items-center justify-between px-5 border-b border-border h-[52px] flex-shrink-0">
            <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2.5 text-foreground">
              <BrandMark size={26} />
              <span className="text-[14px] font-bold tracking-[-0.02em] text-foreground">
                Hallyu<span className="text-accent">Hub</span>
              </span>
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="w-9 h-9 flex items-center justify-center bg-surface rounded-full text-muted hover:text-foreground hover:bg-surface-hover transition-colors text-base"
              aria-label="Fechar menu"
            >
              ✕
            </button>
          </div>

          {/* Nav links */}
          <div className="flex-1 overflow-y-auto py-2">
            {links.map((link) => {
              const Icon = LINK_ICONS[link.href]
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3.5 px-5 py-4 text-[15px] font-semibold border-l-[3px] transition-colors ${
                    active
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-transparent text-foreground hover:bg-surface'
                  }`}
                >
                  {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
                  {link.label}
                </Link>
              )
            })}

            <div className="h-px bg-border mx-5 my-2" />

            <Link
              href="/search"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3.5 px-5 py-4 text-[15px] font-semibold text-foreground hover:bg-surface border-l-[3px] border-transparent transition-colors"
            >
              <Search className="w-5 h-5 flex-shrink-0" />
              Buscar
            </Link>

            {!session && (
              <Link
                href="/auth/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3.5 px-5 py-4 text-[15px] font-semibold text-foreground hover:bg-surface border-l-[3px] border-transparent transition-colors"
              >
                <User className="w-5 h-5 flex-shrink-0" />
                Entrar
              </Link>
            )}
          </div>

          {/* Footer CTA */}
          {!session && (
            <div className="px-5 pb-6 pt-4 border-t border-border flex flex-col gap-3">
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
