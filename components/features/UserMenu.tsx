'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { User, LogOut, Settings, LayoutDashboard } from 'lucide-react'

export function UserMenu() {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)

  if (status === 'loading') {
    return <div className="w-8 h-8 rounded-full bg-surface animate-pulse" />
  }

  if (!session) return null

  const initials = (session.user.name || session.user.email || '?')
    .split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()

  const isAdmin = ['admin', 'editor'].includes(session.user.role?.toLowerCase() ?? '')

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-[#ff2d78]/40 transition-all flex-shrink-0"
        aria-label="Menu do usuário"
      >
        {session.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.user.image} alt={session.user.name || 'User'} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#ff2d78] to-[#c084fc] flex items-center justify-center">
            <span className="text-white text-[11px] font-bold">{initials}</span>
          </div>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-52 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden">
            {/* User info */}
            <div className="px-4 py-3 border-b border-border">
              <p className="text-[13px] font-bold text-foreground truncate">{session.user.name}</p>
              <p className="text-[11px] text-muted truncate">{session.user.email}</p>
              {isAdmin && (
                <span className="inline-block mt-1.5 px-2 py-0.5 text-[9px] font-bold uppercase bg-[rgba(255,45,120,0.08)] text-[#ff2d78] rounded-full">
                  {session.user.role}
                </span>
              )}
            </div>

            {/* Menu items */}
            <div className="py-1">
              <Link href="/dashboard" onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-foreground hover:bg-surface transition-colors">
                <LayoutDashboard size={14} className="text-muted" />
                Dashboard
              </Link>
              <Link href="/profile" onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-foreground hover:bg-surface transition-colors">
                <User size={14} className="text-muted" />
                Meu Perfil
              </Link>
              <Link href="/settings" onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-foreground hover:bg-surface transition-colors">
                <Settings size={14} className="text-muted" />
                Configurações
              </Link>
              {isAdmin && (
                <Link href="/admin" onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#ff2d78] hover:bg-accent-soft transition-colors">
                  <Settings size={14} />
                  Painel Admin
                </Link>
              )}
            </div>

            {/* Logout */}
            <div className="border-t border-border py-1">
              <button
                onClick={() => { signOut({ callbackUrl: '/' }); setIsOpen(false) }}
                className="flex items-center gap-2.5 px-4 py-2.5 w-full text-[13px] text-muted hover:text-foreground hover:bg-surface transition-colors"
              >
                <LogOut size={14} />
                Sair
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
