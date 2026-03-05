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
    label: 'Plataforma',
    items: [
      { href: '/admin/users', label: 'Usuários', icon: Users },
      { href: '/admin/hidden', label: 'Itens Ocultos', icon: EyeOff },
      { href: '/admin/agencies', label: 'Agências', icon: Building2 },
      { href: '/admin/instagram', label: 'Instagram Feeds', icon: Instagram },
      { href: '/admin/activity', label: 'Atividade', icon: Activity },
      { href: '/admin/bot-logs', label: 'Robôs de Busca', icon: Bot },
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

function NavSectionBlock({
  section,
  pathname,
}: {
  section: NavSection
  pathname: string | null
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
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-zinc-300 transition-colors rounded"
      >
        <span>{section.label}</span>
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="mt-0.5 space-y-0.5">
          {section.items.map(item => (
            <NavLink key={item.href} item={item} pathname={pathname} />
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
      <div className="p-4 border-b border-zinc-800 space-y-3">
        <Link href="/admin" className="flex items-center gap-2" onClick={onNav}>
          <Shield className="text-red-500" size={22} />
          <span className="text-base font-black text-white">HallyuHub Admin</span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 px-3 py-1.5 rounded-md transition-colors w-full"
          onClick={onNav}
        >
          <ChevronLeft size={13} />
          Voltar ao site
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto" onClick={onNav}>
        {navSections.map((section, i) => (
          <NavSectionBlock key={i} section={section} pathname={pathname} />
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
    <div className="min-h-screen bg-black">
      <div className="flex">

        {/* Sidebar desktop */}
        <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-zinc-950 border-r border-zinc-800 fixed">
          <SidebarContent pathname={pathname} />
        </aside>

        {/* Drawer mobile — overlay + slide */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <aside className="relative flex flex-col w-72 max-w-[85vw] bg-zinc-950 border-r border-zinc-800 h-full overflow-y-auto">
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                aria-label="Fechar menu"
              >
                <X size={18} />
              </button>
              <SidebarContent pathname={pathname} onNav={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-60">
          {/* Mobile header */}
          <div className="lg:hidden sticky top-0 z-40 bg-zinc-950 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                aria-label="Abrir menu"
              >
                <Menu size={20} />
              </button>
              <div className="flex items-center gap-2">
                <Shield className="text-red-500" size={18} />
                <span className="font-bold text-white text-sm">{title}</span>
              </div>
            </div>
            <Link href="/" className="text-xs text-zinc-500 hover:text-white transition-colors">
              ← Site
            </Link>
          </div>

          <div className="p-4 lg:p-8">
            <h1 className="text-2xl lg:text-3xl font-black text-white mb-6 lg:mb-8">{title}</h1>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
