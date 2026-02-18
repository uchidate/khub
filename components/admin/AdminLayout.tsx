'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shield, Users, Music2, Building2, Film, Newspaper, Disc3, Tag, Activity, Settings, ChevronLeft, Share2, Languages, UsersRound, GitMerge } from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: Shield, exact: true },
  { href: '/admin/users', label: 'Usuários', icon: Users },
  { href: '/admin/artists', label: 'Artistas', icon: Music2 },
  { href: '/admin/artists/social-links', label: 'Redes Sociais', icon: Share2 },
  { href: '/admin/artists/fix-names', label: 'Corrigir Nomes', icon: Languages },
  { href: '/admin/artists/duplicates', label: 'Duplicados', icon: GitMerge },
  { href: '/admin/artists/groups', label: 'Grupos Musicais', icon: UsersRound },
  { href: '/admin/groups', label: 'Gerir Grupos', icon: UsersRound },
  { href: '/admin/agencies', label: 'Agências', icon: Building2 },
  { href: '/admin/productions', label: 'Produções', icon: Film },
  { href: '/admin/news', label: 'Notícias', icon: Newspaper },
  { href: '/admin/albums', label: 'Álbuns', icon: Disc3 },
  { href: '/admin/tags', label: 'Tags', icon: Tag },
  { href: '/admin/filmography', label: 'Filmografias', icon: Film },
  { href: '/admin/activity', label: 'Atividade', icon: Activity },
  { href: '/admin/settings', label: 'Configurações', icon: Settings },
]

export function AdminLayout({ children, title }: { children: React.ReactNode; title: string }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-black">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-zinc-950 border-r border-zinc-800 fixed">
          <div className="p-6 border-b border-zinc-800">
            <Link href="/admin" className="flex items-center gap-2">
              <Shield className="text-red-500" size={24} />
              <span className="text-lg font-black text-white">Admin</span>
            </Link>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="p-4 border-t border-zinc-800">
            <Link href="/" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors">
              <ChevronLeft size={16} />
              Voltar ao site
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64">
          {/* Mobile header */}
          <div className="lg:hidden sticky top-0 z-50 bg-zinc-950 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="text-red-500" size={20} />
              <span className="font-bold text-white">{title}</span>
            </div>
            <Link href="/" className="text-sm text-zinc-500">
              ← Site
            </Link>
          </div>
          <div className="p-6 lg:p-8">
            <h1 className="text-3xl font-black text-white mb-8">{title}</h1>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
