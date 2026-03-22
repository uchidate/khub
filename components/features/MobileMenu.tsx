"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { useSession } from "next-auth/react"

interface MobileMenuProps {
  links: Array<{ label: string; href: string }>
}

const LINK_ICONS: Record<string, string> = {
  "/artists":    "🎤",
  "/groups":     "👥",
  "/productions":"🎬",
  "/news":       "📰",
  "/blog":       "✍️",
}

function OrbitalMark() {
  return (
    <svg viewBox="0 0 38 38" fill="none" width={26} height={26}>
      <rect x="5"  y="8" width="6" height="22" rx="3" fill="#080808"/>
      <rect x="27" y="8" width="6" height="22" rx="3" fill="#080808"/>
      <path d="M11 19 Q19 13 27 19" stroke="#ff2d78" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <circle cx="19" cy="13.5" r="2.5" fill="#ff2d78"/>
    </svg>
  )
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
        <span className="block w-5 h-0.5 bg-[#080808] rounded-sm" />
        <span className="block w-5 h-0.5 bg-[#080808] rounded-sm" />
        <span className="block w-5 h-0.5 bg-[#080808] rounded-sm" />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col" style={{ transform: 'translateX(0)' }}>
          {/* Drawer header */}
          <div className="flex items-center justify-between px-5 border-b border-[#e8e8e8] h-[52px] flex-shrink-0">
            <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2.5">
              <OrbitalMark />
              <span className="text-[14px] font-bold tracking-[-0.02em] text-[#080808]">
                Hallyu<span className="text-[#ff2d78]">Hub</span>
              </span>
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="w-9 h-9 flex items-center justify-center bg-[#f5f5f7] rounded-full text-[#6b6b6b] text-base"
              aria-label="Fechar menu"
            >
              ✕
            </button>
          </div>

          {/* Nav links */}
          <div className="flex-1 overflow-y-auto py-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3.5 px-5 py-4 text-[15px] font-semibold border-l-[3px] transition-colors ${
                  pathname === link.href
                    ? 'border-[#ff2d78] bg-[#fff0f5] text-[#ff2d78]'
                    : 'border-transparent text-[#1a1a1a] hover:bg-[#f5f5f7]'
                }`}
              >
                <span className="text-lg w-6 text-center">{LINK_ICONS[link.href] ?? '→'}</span>
                {link.label}
              </Link>
            ))}

            <div className="h-px bg-[#e8e8e8] mx-5 my-2" />

            <Link
              href="/search"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3.5 px-5 py-4 text-[15px] font-semibold text-[#1a1a1a] hover:bg-[#f5f5f7] border-l-[3px] border-transparent"
            >
              <span className="text-lg w-6 text-center">🔍</span>
              Buscar
            </Link>

            {!session && (
              <Link
                href="/auth/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3.5 px-5 py-4 text-[15px] font-semibold text-[#1a1a1a] hover:bg-[#f5f5f7] border-l-[3px] border-transparent"
              >
                <span className="text-lg w-6 text-center">👤</span>
                Entrar
              </Link>
            )}
          </div>

          {/* Footer CTA */}
          {!session && (
            <div className="px-5 pb-6 pt-4 border-t border-[#e8e8e8] flex flex-col gap-3">
              <Link
                href="/auth/register"
                onClick={() => setIsOpen(false)}
                className="w-full text-center bg-[#080808] text-white rounded-full py-3.5 text-[15px] font-bold"
              >
                Criar conta grátis
              </Link>
              <Link
                href="/artists"
                onClick={() => setIsOpen(false)}
                className="w-full text-center border border-[#e8e8e8] text-[#080808] rounded-full py-3.5 text-[15px] font-semibold"
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
