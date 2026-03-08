"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { X, Menu } from "lucide-react"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { useSession } from "next-auth/react"
import { GlobalSearch } from "@/components/ui/GlobalSearch"

interface MobileMenuProps {
  links: Array<{ label: string; href: string }>
}

export const MobileMenu = ({ links }: MobileMenuProps) => {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      {/* Hamburger Button - Only visible on mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden text-zinc-400 hover:text-white transition-colors p-2 -mr-2"
        aria-label="Open menu"
        aria-expanded={isOpen}
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile Menu — portal para escapar do stacking context do NavBar */}
      {isOpen && createPortal(
        <div className="fixed inset-0 z-[500] flex justify-start">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer — mesmo estilo glass do NavBar */}
          <div className="relative w-[85vw] max-w-sm h-full bg-black/90 backdrop-blur-xl border-r border-white/10 flex flex-col animate-slide-in-left">
            {/* Header — espelho exato do NavBar (mesma altura h-12) */}
            <div className="flex items-center justify-between px-4 border-b border-white/10 h-12">
              <Link href="/" onClick={() => setIsOpen(false)} className="text-2xl font-black tracking-tighter uppercase hover:opacity-80 transition-opacity">
                <span className="text-purple-500">HALLYU</span><span className="text-pink-500">HUB</span>
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors p-2 -mr-2"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Mobile Search */}
            <div className="px-4 py-3 border-b border-white/10">
              <GlobalSearch />
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <ul className="space-y-0.5">
                {links.map((link) => {
                  const isActive = pathname === link.href
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                          ? "bg-purple-500/10 text-purple-400"
                          : "text-zinc-300 hover:bg-white/5 hover:text-white"
                          }`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>

              {/* Mobile Auth Buttons */}
              {!session && (
                <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                  <Link
                    href="/auth/login"
                    className="flex w-full items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-colors"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/auth/register"
                    className="flex w-full items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-purple-900/20 transition-transform active:scale-95"
                  >
                    Cadastrar
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
