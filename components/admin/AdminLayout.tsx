'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Shield, Users, Music2, Building2, Film, Newspaper, Disc3, Tag, Activity,
  Settings, ChevronLeft, Share2, GitMerge, Instagram, AlertTriangle, Link2,
  UsersRound, RefreshCw, Clapperboard, MessageSquare, Flag, Sparkles,
} from 'lucide-react'

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
}

type NavSection = {
  label: string | null
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    label: null,
    items: [
      { href: '/admin', label: 'Dashboard', icon: Shield, exact: true },
    ],
  },
  {
    label: 'Artistas',
    items: [
      { href: '/admin/artists', label: 'Gerenciar', icon: Music2, exact: true },
      { href: '/admin/artists/fix-names', label: 'Enriquecimento TMDB', icon: Sparkles },
      { href: '/admin/artists/duplicates', label: 'Enriquecimento MB', icon: GitMerge },
      { href: '/admin/artists/social-links', label: 'Redes Sociais', icon: Share2 },
      { href: '/admin/artists/moderation', label: 'Moderação', icon: AlertTriangle },
    ],
  },
  {
    label: 'Grupos',
    items: [
      { href: '/admin/groups', label: 'Gerenciar', icon: UsersRound, exact: true },
      { href: '/admin/artists/groups', label: 'Sync Artista↔Grupo', icon: RefreshCw },
      { href: '/admin/kpopping', label: 'Curadoria Kpopping', icon: Link2 },
    ],
  },
  {
    label: 'Produções',
    items: [
      { href: '/admin/productions', label: 'Gerenciar', icon: Film, exact: true },
      { href: '/admin/filmography', label: 'Filmografias', icon: Clapperboard },
      { href: '/admin/productions/moderation', label: 'Moderação', icon: AlertTriangle },
    ],
  },
  {
    label: 'Conteúdo',
    items: [
      { href: '/admin/news', label: 'Notícias', icon: Newspaper },
      { href: '/admin/albums', label: 'Álbuns', icon: Disc3 },
      { href: '/admin/tags', label: 'Tags', icon: Tag },
      { href: '/admin/comments', label: 'Comentários', icon: MessageSquare },
      { href: '/admin/reports', label: 'Reportes', icon: Flag },
    ],
  },
  {
    label: 'Plataforma',
    items: [
      { href: '/admin/users', label: 'Usuários', icon: Users },
      { href: '/admin/agencies', label: 'Agências', icon: Building2 },
      { href: '/admin/instagram', label: 'Instagram Feeds', icon: Instagram },
      { href: '/admin/activity', label: 'Atividade', icon: Activity },
      { href: '/admin/cron', label: 'Cron Jobs', icon: RefreshCw },
      { href: '/admin/settings', label: 'Configurações', icon: Settings },
    ],
  },
]

function NavLink({ item, pathname }: { item: NavItem; pathname: string | null }) {
  const isActive = item.exact
    ? pathname === item.href
    : pathname?.startsWith(item.href) ?? false

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
      }`}
    >
      <item.icon size={16} />
      {item.label}
    </Link>
  )
}

export function AdminLayout({ children, title }: { children: React.ReactNode; title: string }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-black">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-zinc-950 border-r border-zinc-800 fixed">
          <div className="p-4 border-b border-zinc-800 space-y-3">
            <Link href="/admin" className="flex items-center gap-2">
              <Shield className="text-red-500" size={22} />
              <span className="text-base font-black text-white">HallyuHub Admin</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 px-3 py-1.5 rounded-md transition-colors w-full"
            >
              <ChevronLeft size={13} />
              Voltar ao site
            </Link>
          </div>

          <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
            {navSections.map((section, i) => (
              <div key={i}>
                {section.label && (
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-3 mb-1.5">
                    {section.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <NavLink key={item.href} item={item} pathname={pathname} />
                  ))}
                </div>
              </div>
            ))}
          </nav>

        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-60">
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
