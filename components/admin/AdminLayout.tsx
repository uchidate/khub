'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState, useEffect, useCallback } from 'react'
import {
  Shield, Users, Music2, Building2, Film, Newspaper, Disc3, Tag, Activity,
  Settings, ChevronLeft, ChevronDown, Share2, GitMerge, Instagram, AlertTriangle, Link2,
  UsersRound, RefreshCw, Clapperboard, MessageSquare, Flag, Sparkles, EyeOff, Languages,
  Mail, FileText, Bot, Menu, X, Download, RotateCcw, Search, ExternalLink,
  PanelLeftClose, PanelLeftOpen, Home,
} from 'lucide-react'
import type { PendingCounts } from '@/app/api/admin/pending-counts/route'
import { AdminSearch } from './AdminSearch'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
  badgeKey?: keyof PendingCounts
}

type NavSection = {
  label: string | null
  items: NavItem[]
}

// ─── Definição da nav ─────────────────────────────────────────────────────────

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
    label: 'Notícias',
    items: [
      { href: '/admin/news', label: 'Gerenciar', icon: Newspaper, exact: true },
      { href: '/admin/news/import', label: 'Importar', icon: Download },
      { href: '/admin/news/reprocess', label: 'Reprocessar', icon: RotateCcw },
    ],
  },
  {
    label: 'Conteúdo',
    items: [
      { href: '/admin/albums', label: 'Álbuns', icon: Disc3 },
      { href: '/admin/tags', label: 'Tags', icon: Tag },
      { href: '/admin/comments', label: 'Comentários', icon: MessageSquare, badgeKey: 'comments' },
      { href: '/admin/reports', label: 'Reportes', icon: Flag, badgeKey: 'reports' },
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

// ─── Pending counts ───────────────────────────────────────────────────────────

function usePendingCounts(): PendingCounts {
  const [counts, setCounts] = useState<PendingCounts>({ reports: 0, comments: 0 })

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/pending-counts')
      if (res.ok) setCounts(await res.json())
    } catch {}
  }, [])

  useEffect(() => {
    fetchCounts()
    const t = setInterval(fetchCounts, 60_000)
    return () => clearInterval(t)
  }, [fetchCounts])

  return counts
}

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  artists: 'Artistas',
  groups: 'Grupos',
  productions: 'Produções',
  news: 'Notícias',
  translations: 'Traduções',
  albums: 'Álbuns',
  tags: 'Tags',
  comments: 'Comentários',
  reports: 'Reportes',
  emails: 'Emails',
  ai: 'IA',
  users: 'Usuários',
  hidden: 'Ocultos',
  agencies: 'Agências',
  instagram: 'Instagram',
  activity: 'Atividade',
  'bot-logs': 'Robôs',
  'server-logs': 'Server Logs',
  cron: 'Cron Jobs',
  settings: 'Configurações',
  kpopping: 'Kpopping',
  filmography: 'Filmografias',
  blog: 'Blog',
  database: 'Database',
  analytics: 'Analytics',
  'fix-names': 'Enriquecimento TMDB',
  duplicates: 'Enriquecimento MB',
  'social-links': 'Redes Sociais',
  moderation: 'Moderação',
  import: 'Importar',
  reprocess: 'Reprocessar',
  templates: 'Templates',
  config: 'Config',
  sync: 'Sync',
  discography: 'Discografia',
  log: 'Log',
}

function isIdSegment(segment: string): boolean {
  // Cuid2/ObjectId: começa com 'cm' e tem 20+ chars, ou é UUID
  return (
    (segment.startsWith('cm') && segment.length >= 20) ||
    (segment.length >= 24 && /^[a-z0-9]+$/i.test(segment))
  )
}

/** Retorna apenas os crumbs *pai* — o título atual é mostrado como h1 separado */
function buildBreadcrumbs(pathname: string): Array<{ label: string; href: string }> {
  const segments = pathname.split('/').filter(Boolean) // ['admin', 'artists', 'abc123']
  if (segments.length <= 2) return [] // top-level: sem breadcrumb pai

  const crumbs: Array<{ label: string; href: string }> = []
  let path = ''

  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i]
    path += '/' + seg
    if (seg === 'admin') continue
    if (isIdSegment(seg)) continue
    const label = SECTION_LABELS[seg]
    if (label) crumbs.push({ label, href: path })
  }

  return crumbs
}

// ─── Badge ────────────────────────────────────────────────────────────────────

function NavBadge({ count }: { count: number }) {
  if (!count) return null
  return (
    <span className="ml-auto min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-black px-1 flex-shrink-0">
      {count > 99 ? '99+' : count}
    </span>
  )
}

// ─── NavLink ──────────────────────────────────────────────────────────────────

function NavLink({
  item,
  pathname,
  onNav,
  badge = 0,
  compact = false,
}: {
  item: NavItem
  pathname: string | null
  onNav?: () => void
  badge?: number
  compact?: boolean
}) {
  const isActive = item.exact
    ? pathname === item.href
    : pathname?.startsWith(item.href) ?? false

  if (compact) {
    return (
      <Link
        href={item.href}
        onClick={onNav}
        title={item.label}
        className={`relative flex items-center justify-center w-9 h-9 rounded-lg mx-auto transition-all duration-150 ${
          isActive
            ? 'bg-purple-500/15 text-purple-300'
            : 'text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/60'
        }`}
      >
        <item.icon size={16} className={isActive ? 'text-purple-400' : ''} />
        {badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-red-500 text-white text-[8px] font-black px-0.5">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </Link>
    )
  }

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
      <item.icon size={15} className={isActive ? 'text-purple-400' : 'text-zinc-600'} />
      <span className="truncate flex-1">{item.label}</span>
      {badge > 0 ? (
        <NavBadge count={badge} />
      ) : isActive ? (
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
      ) : null}
    </Link>
  )
}

// ─── NavSectionBlock ──────────────────────────────────────────────────────────

function NavSectionBlock({
  section,
  pathname,
  onNav,
  counts,
  compact = false,
}: {
  section: NavSection
  pathname: string | null
  onNav?: () => void
  counts: PendingCounts
  compact?: boolean
}) {
  const active = section.items.some(item =>
    item.exact ? pathname === item.href : pathname?.startsWith(item.href)
  )
  const [open, setOpen] = useState(active)

  useEffect(() => {
    if (active) setOpen(true)
  }, [active])

  const getBadge = (item: NavItem) =>
    item.badgeKey ? (counts[item.badgeKey] ?? 0) : 0

  // Seção sem label (Dashboard)
  if (!section.label) {
    return (
      <div className={compact ? 'space-y-1 pb-2 border-b border-zinc-800/60' : 'space-y-0.5'}>
        {section.items.map(item => (
          <NavLink
            key={item.href}
            item={item}
            pathname={pathname}
            onNav={onNav}
            badge={getBadge(item)}
            compact={compact}
          />
        ))}
      </div>
    )
  }

  // Modo compacto: sem label, sem collapse
  if (compact) {
    return (
      <div className="space-y-1 py-2 border-b border-zinc-800/40 last:border-0">
        {section.items.map(item => (
          <NavLink
            key={item.href}
            item={item}
            pathname={pathname}
            onNav={onNav}
            badge={getBadge(item)}
            compact
          />
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
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              onNav={onNav}
              badge={getBadge(item)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── SidebarContent ───────────────────────────────────────────────────────────

function SidebarContent({
  pathname,
  onNav,
  counts,
  compact,
  onToggleCompact,
}: {
  pathname: string | null
  onNav?: () => void
  counts: PendingCounts
  compact: boolean
  onToggleCompact: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`border-b border-zinc-800/80 flex-shrink-0 ${compact ? 'p-2' : 'p-4'}`}>
        {compact ? (
          <Link
            href="/admin"
            onClick={onNav}
            title="HallyuHub Admin"
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-500/15 border border-red-500/20 mx-auto hover:bg-red-500/25 transition-colors"
          >
            <Shield className="text-red-400" size={16} />
          </Link>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto space-y-1 ${compact ? 'p-2' : 'p-3'}`}>
        {navSections.map((section, i) => (
          <NavSectionBlock
            key={i}
            section={section}
            pathname={pathname}
            onNav={onNav}
            counts={counts}
            compact={compact}
          />
        ))}
      </nav>

      {/* Footer: toggle compacto + usuário */}
      <div className={`border-t border-zinc-800/80 flex-shrink-0 ${compact ? 'p-2 space-y-1' : 'p-3 space-y-1'}`}>
        <button
          onClick={onToggleCompact}
          title={compact ? 'Expandir menu' : 'Compactar menu'}
          className={`flex items-center gap-2 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60 rounded-lg transition-colors ${
            compact ? 'w-9 h-9 justify-center mx-auto' : 'w-full px-3 py-2 text-xs font-medium'
          }`}
        >
          {compact ? (
            <PanelLeftOpen size={15} />
          ) : (
            <>
              <PanelLeftClose size={15} />
              <span>Compactar</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ─── TopBar (desktop) ─────────────────────────────────────────────────────────

function TopBar({
  pathname,
  title,
  onSearchClick,
}: {
  pathname: string | null
  title: string
  onSearchClick: () => void
}) {
  const breadcrumbs = buildBreadcrumbs(pathname ?? '')

  return (
    <div className="hidden lg:flex sticky top-0 z-40 h-12 items-center gap-3 px-6 bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800/80">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
        <Link href="/admin" className="flex items-center gap-1 text-zinc-600 hover:text-zinc-300 transition-colors flex-shrink-0">
          <Home size={13} />
        </Link>
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-zinc-700">/</span>
            <Link href={crumb.href} className="text-zinc-500 hover:text-zinc-200 transition-colors truncate max-w-[140px]">
              {crumb.label}
            </Link>
          </span>
        ))}
        {/* Página atual */}
        <span className="flex items-center gap-1.5 min-w-0">
          <span className="text-zinc-700">/</span>
          <span className="text-zinc-300 font-medium truncate">{title}</span>
        </span>
      </div>

      {/* Busca global */}
      <button
        onClick={onSearchClick}
        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 transition-all flex-shrink-0"
      >
        <Search size={13} />
        <span className="hidden xl:inline">Buscar...</span>
        <kbd className="hidden xl:inline text-[10px] bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
      </button>

      {/* Link para o site */}
      <Link
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-300 transition-colors flex-shrink-0"
        title="Ver site"
      >
        <ExternalLink size={13} />
        <span className="hidden xl:inline">Site</span>
      </Link>
    </div>
  )
}

// ─── AdminLayout ──────────────────────────────────────────────────────────────

export interface AdminLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function AdminLayout({ children, title, subtitle, actions }: AdminLayoutProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [compact, setCompact] = useState(false) // SSR: always expanded
  const [searchOpen, setSearchOpen] = useState(false)
  const counts = usePendingCounts()

  // Hydrate compact mode from localStorage (client only)
  useEffect(() => {
    const saved = localStorage.getItem('admin-compact')
    if (saved === 'true') setCompact(true)
  }, [])

  const toggleCompact = useCallback(() => {
    setCompact(c => {
      const next = !c
      localStorage.setItem('admin-compact', String(next))
      return next
    })
  }, [])

  // Atalhos de teclado globais
  useEffect(() => {
    let gPressed = false
    let gTimeout: ReturnType<typeof setTimeout> | null = null

    const handler = (e: KeyboardEvent) => {
      // Ignora quando está em inputs/textarea
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      // ⌘K ou Ctrl+K: abre busca
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(o => !o)
        return
      }

      // Atalhos chord "G → seção" (estilo Gmail)
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey) {
        gPressed = true
        if (gTimeout) clearTimeout(gTimeout)
        gTimeout = setTimeout(() => { gPressed = false }, 1000)
        return
      }

      if (gPressed) {
        gPressed = false
        if (gTimeout) clearTimeout(gTimeout)
        const routes: Record<string, string> = {
          d: '/admin',
          a: '/admin/artists',
          g: '/admin/groups',
          p: '/admin/productions',
          n: '/admin/news',
          t: '/admin/translations',
          u: '/admin/users',
          i: '/admin/ai',
        }
        const route = routes[e.key]
        if (route) {
          e.preventDefault()
          window.location.href = route
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Fecha drawer ao navegar
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const sidebarWidth = compact ? 'lg:w-16' : 'lg:w-60'
  const mainMargin = compact ? 'lg:ml-16' : 'lg:ml-60'

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="flex">

        {/* ── Sidebar desktop ── */}
        <aside
          className={`hidden lg:flex flex-col min-h-screen bg-[#0a0a0a] border-r border-zinc-800/80 fixed top-0 bottom-0 transition-all duration-200 ${sidebarWidth}`}
        >
          <SidebarContent
            pathname={pathname}
            counts={counts}
            compact={compact}
            onToggleCompact={toggleCompact}
          />
        </aside>

        {/* ── Drawer mobile ── */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="relative flex flex-col w-72 max-w-[85vw] bg-[#0a0a0a] border-r border-zinc-800/80 h-full overflow-y-auto">
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                aria-label="Fechar menu"
              >
                <X size={16} />
              </button>
              <SidebarContent
                pathname={pathname}
                onNav={() => setMobileOpen(false)}
                counts={counts}
                compact={false}
                onToggleCompact={() => {}}
              />
            </aside>
          </div>
        )}

        {/* ── Main ── */}
        <main className={`flex-1 ${mainMargin} min-w-0 overflow-x-hidden transition-all duration-200`}>

          {/* Top bar desktop */}
          <TopBar
            pathname={pathname}
            title={title}
            onSearchClick={() => setSearchOpen(true)}
          />

          {/* Header mobile */}
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
            {/* Page header */}
            <div className={`flex items-start justify-between gap-4 ${subtitle || actions ? 'mb-6' : 'mb-5 lg:mb-7'}`}>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
                )}
              </div>
              {actions && (
                <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                  {actions}
                </div>
              )}
            </div>

            {children}
          </div>
        </main>
      </div>

      {/* ── Busca global ⌘K ── */}
      <AdminSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
