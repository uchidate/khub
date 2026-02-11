'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { User, LogOut, Settings, LogIn, UserPlus, LayoutDashboard, Zap } from 'lucide-react'

export function UserMenu() {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)

  // Loading state
  if (status === 'loading') {
    return (
      <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
    )
  }

  // Not authenticated
  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/auth/login"
          prefetch={false}
          className="flex items-center gap-2 px-3 md:px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors hover:bg-zinc-800/50 rounded-lg"
          title="Entrar"
        >
          <LogIn size={16} />
          <span className="hidden md:inline">Entrar</span>
        </Link>
        <Link
          href="/auth/register"
          prefetch={false}
          className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-purple-900/20"
          title="Cadastrar"
        >
          <UserPlus size={16} />
          <span className="hidden md:inline">Cadastrar</span>
        </Link>
      </div>
    )
  }

  // Authenticated
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
      >
        {session.user.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || 'User'}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
        )}
        <span className="hidden md:inline text-sm font-medium text-white">
          {session.user.name || session.user.email}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl z-50 animate-scale-in">
            {/* User Info */}
            <div className="p-4 border-b border-zinc-800">
              <p className="text-sm font-medium text-white truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-zinc-500 truncate">
                {session.user.email}
              </p>
              <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold uppercase bg-purple-600/20 text-purple-400 rounded">
                {session.user.role}
              </span>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <Link
                onClick={() => setIsOpen(false)}
                href="/dashboard"
                className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>

              <Link
                onClick={() => setIsOpen(false)}
                href="/premium"
                className="flex items-center gap-3 px-4 py-2 text-sm text-yellow-500 hover:text-yellow-400 hover:bg-zinc-800 rounded-lg transition-colors font-bold"
              >
                <Zap size={16} />
                Hallyu Premium
              </Link>

              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <User size={16} />
                Meu Perfil
              </Link>

              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <Settings size={16} />
                Configurações
              </Link>

              {(session.user.role?.toLowerCase() === 'admin' || session.user.role?.toLowerCase() === 'editor') && (
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-purple-400 hover:text-purple-300 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <Settings size={16} />
                  Painel Admin
                </Link>
              )}
            </div>

            {/* Logout */}
            <div className="p-2 border-t border-zinc-800">
              <button
                onClick={() => {
                  signOut({ callbackUrl: '/' })
                  setIsOpen(false)
                }}
                className="flex items-center gap-3 px-4 py-2 w-full text-sm text-red-400 hover:text-red-300 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
