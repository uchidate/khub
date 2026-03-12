'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Shield, Users, Music2, Building2, Film, Newspaper, Disc3, Tag, Activity,
  Settings, ChevronLeft, ChevronDown, Share2, GitMerge, Instagram, AlertTriangle, Link2,
  UsersRound, RefreshCw, Clapperboard, MessageSquare, Flag, Sparkles, EyeOff, Languages,
  Mail, FileText, Bot, Menu, X,
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
      { href: '/admin/translations', label: 'Traduções', icon: Languages },
    ],
  },
  {
    label: 'Emails',
    items: [
      { href: '/admin/emails', label: 'Histórico', icon: Mail, exact: true },
      { href: '/admin/emails/templates', label: 'Templates', icon: FileText },
    ],
  },
  {
    label: 'Inteligência Artificial',
    items: [
      { href: '/admin/ai', label: 'Dashboard IA', icon: Bot, exact: true },
      { href: '/admin/ai/config', label: 'Config de Providers', icon: Settings },
    ],
  },
  {
    label: 'Plataforma',
    items: [
      { href: '/admin/users', label: 'Usuários', icon: Users },
      { href: '/admin/hidden', label: 'Itens Ocultos', icon: EyeOff },
      { href: '/admin/agencies', label: 'Agências', icon: Building2 },
      { href: '/admin/instagram', label: 'Instagram Feeds', icon: Instagram },
      { href: '/admin/activity', label: 'Atividade', icon: Activity },
      { href: '/admin/bot-logs', label: 'Robôs de Busca', icon: Bot },
      { href: '/admin/server-logs', label: 'Server Logs', icon: AlertTriangle },
      { href: '/admin/cron', label: 'Cron Jobs', icon: RefreshCw },
      { href: '/admin/settings', label: 'Configurações', icon: Settings },
    ],
  },
]

function isSectionActive(section: NavSection, pathname: string | null): boolean {
  if (!pathname) return false
  return section.items.some(item =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  )
}

function NavLink({ item, pathname, onNav }: { item: NavItem; pathname: string | null; onNav?: () => void }) {
  const isActive = item.exact
    ? pathname === item.href
    : pathname?.startsWith(item.href) ?? false

  return (
    <Link
      href={item.href}
      onClick={onNav}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
        isActive
          ? 'bg-purple-500/15 text-purple-300 font-semibold'
          : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 font-medium'
      }`}
    >
      <item.icon
        size={15}
        className={isActive ? 'text-purple-400' : 'text-zinc-600'}
      />
      <span className="truncate">{item.label}</span>
      {isActive && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
      )}
    </Link>
  )
}

function NavSectionBlock({
  section,
  pathname,
  onNav,
}: {
  section: NavSection
  pathname: string | null
  onNav?: () => void
}) {
  const active = isSectionActive(section, pathname)
  const [open, setOpen] = useState(active)

  // Quando a rota muda (ex: navegação), abre a seção correspondente
  useEffect(() => {
    if (active) setOpen(true)
  }, [active])

  if (!section.label) {
    return (
      <div className="space-y-0.5">
        {section.items.map(item => (
          <NavLink key={item.href} item={item} pathname={pathname} onNav={onNav} />
        ))}
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors rounded-lg ${
          active ? 'text-purple-400/80' : 'text-zinc-600 hover:text-zinc-400'
        }`}
      >
        <span>{section.label}</span>
        <ChevronDown
          size={11}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="mt-0.5 space-y-0.5">
          {section.items.map(item => (
            <NavLink key={item.href} item={item} pathname={pathname} onNav={onNav} />
          ))}
        </div>
      )}
    </div>
  )
}

// Conteúdo da sidebar — reutilizado no desktop e no drawer mobile
function SidebarContent({ pathname, onNav }: { pathname: string | null; onNav?: () => void }) {
  return (
    <>
      {/* Header */}
      <div className="p-4 border-b border-zinc-800/80">
        <Link href="/admin" className="flex items-center gap-2.5 mb-3 group" onClick={onNav}>
          <div className="w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/20 flex items-center justify-center flex-shrink-0">
            <Shield className="text-red-400" size={15} />
          </div>
          <span className="text-sm font-black text-white tracking-tight">HallyuHub Admin</span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-lg transition-all w-full"
          onClick={onNav}
        >
          <ChevronLeft size={12} />
          Voltar ao site
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navSections.map((section, i) => (
          <NavSectionBlock key={i} section={section} pathname={pathname} onNav={onNav} />
        ))}
      </nav>
    </>
  )
}

export function AdminLayout({ children, title }: { children: React.ReactNode; title: string }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Fecha o drawer ao navegar
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="flex">

        {/* Sidebar desktop */}
        <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-[#0a0a0a] border-r border-zinc-800/80 fixed">
          <SidebarContent pathname={pathname} />
        </aside>

        {/* Drawer mobile — overlay + slide */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <aside className="relative flex flex-col w-72 max-w-[85vw] bg-[#0a0a0a] border-r border-zinc-800/80 h-full overflow-y-auto">
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                aria-label="Fechar menu"
              >
                <X size={16} />
              </button>
              <SidebarContent pathname={pathname} onNav={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-60 min-w-0 overflow-x-hidden">
          {/* Mobile header */}
          <div className="lg:hidden sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800/80 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                aria-label="Abrir menu"
              >
                <Menu size={19} />
              </button>
              <div className="flex items-center gap-2">
                <Shield className="text-red-400" size={16} />
                <span className="font-bold text-white text-sm">{title}</span>
              </div>
            </div>
            <Link href="/" className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1">
              <ChevronLeft size={13} />
              Site
            </Link>
          </div>

          {/* Page content */}
          <div className="p-4 sm:p-5 lg:p-8">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white mb-5 lg:mb-7">{title}</h1>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
