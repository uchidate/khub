"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { X, Menu } from "lucide-react"
import { useState, useEffect } from "react"

interface MobileMenuProps {
  links: Array<{ label: string; href: string }>
}

export const MobileMenu = ({ links }: MobileMenuProps) => {
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

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-zinc-900 z-50 md:hidden animate-slide-in-right">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <span className="text-xl font-black tracking-tighter uppercase">
                  <span className="text-purple-500">HALLYU</span>
                  <span className="text-pink-500">HUB</span>
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-zinc-400 hover:text-white transition-colors p-2 -mr-2"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 overflow-y-auto p-4">
                <ul className="space-y-1">
                  {links.map((link) => {
                    const isActive = pathname === link.href
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                            isActive
                              ? "bg-purple-500/10 text-purple-400"
                              : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                          }`}
                        >
                          {link.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-zinc-800">
                <p className="text-xs text-zinc-500 text-center">
                  HallyuHub © 2026
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
