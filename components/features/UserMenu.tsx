'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { LogOut, Settings } from 'lucide-react'
import { accountNavGroups } from '@/lib/config/account-navigation'

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
           
          <img src={session.user.image} alt={session.user.name || 'User'} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#ff2d78] flex items-center justify-center">
            <span className="text-white text-[11px] font-bold">{initials}</span>
          </div>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-border bg-background shadow-2xl shadow-black/10 z-50">
            {/* User info */}
            <div className="border-b border-border bg-surface px-4 py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-accent">Conta HallyuHub</p>
              <p className="mt-1 truncate text-sm font-black text-foreground">{session.user.name}</p>
              <p className="truncate text-xs text-muted">{session.user.email}</p>
              {isAdmin && (
                <span className="mt-2 inline-block rounded-full bg-accent-soft px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-accent">
                  {session.user.role}
                </span>
              )}
            </div>

            {/* Menu items */}
            <div className="p-2">
              {accountNavGroups.map(group => (
                <div key={group.label}>
                  <p className="px-2 pb-1 pt-2 text-[10px] font-black uppercase tracking-[0.14em] text-muted">{group.label}</p>
                  {group.items.map(({ href, label, icon: Icon }) => (
                    <Link key={href} href={href} onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-[13px] font-bold text-foreground hover:bg-surface transition-colors">
                      <Icon size={14} className="text-muted" />
                      {label}
                    </Link>
                  ))}
                </div>
              ))}
              {isAdmin && (
                <Link href="/admin" onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-[13px] font-bold text-accent hover:bg-accent-soft transition-colors">
                  <Settings size={14} />
                  Painel Admin
                </Link>
              )}
            </div>

            {/* Logout */}
            <div className="border-t border-border p-2">
              <button
                onClick={() => { signOut({ callbackUrl: '/' }); setIsOpen(false) }}
                className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-[13px] font-bold text-muted transition-colors hover:bg-surface hover:text-foreground"
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
