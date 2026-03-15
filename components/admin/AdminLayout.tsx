'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import {
  Shield, Users, Music2, Building2, Film, Newspaper, Disc3, Tag, Activity,
  Settings, ChevronLeft, ChevronDown, Share2, GitMerge, Instagram, AlertTriangle, Link2,
  UsersRound, RefreshCw, Clapperboard, MessageSquare, Flag, Sparkles, EyeOff, Languages,
  Mail, FileText, Bot, Menu, X, Download, RotateCcw, Search, ExternalLink,
  PanelLeftClose, PanelLeftOpen, Home, LayoutDashboard, Workflow, Mic2,
} from 'lucide-react'
import type { PendingCounts } from '@/app/api/admin/pending-counts/route'
import { AdminSearch } from './AdminSearch'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type SubItem = {
  href: string
  label: string
  icon: React.ElementType
  badgeKey?: keyof PendingCounts
}

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
  badgeKey?: keyof PendingCounts
  subItems?: SubItem[]
  isNew?: boolean
}

type NavSection = {
  label: string | null
  fixed?: boolean   // se true, não colapsa
  items: NavItem[]
}

// ─── Definição da nav (3 grupos) ──────────────────────────────────────────────

const navSections: NavSection[] = [
  // ── TRABALHO ──
  {
    label: 'Trabalho',
    fixed: true,
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      {
        href: '/admin/pipeline', label: 'Pipeline', icon: Workflow, isNew: true,
      },
      {
        href: '/admin/news', label: 'Notícias', icon: Newspaper,
        subItems: [
          { href: '/admin/news/import',     label: 'Importar',    icon: Download },
          { href: '/admin/news/reprocess',  label: 'Reprocessar', icon: RotateCcw },
        ],
      },
      {
        href: '/admin/artists', label: 'Artistas', icon: Mic2, exact: true,
        subItems: [
          { href: '/admin/artists/fix-names',    label: 'Enriq. TMDB',  icon: Sparkles },
          { href: '/admin/artists/duplicates',   label: 'Enriq. MB',    icon: GitMerge },
          { href: '/admin/artists/social-links', label: 'Redes Sociais', icon: Share2 },
          { href: '/admin/artists/moderation',   label: 'Moderação',    icon: AlertTriangle },
        ],
      },
      {
        href: '/admin/groups', label: 'Grupos', icon: UsersRound, exact: true,
        subItems: [
          { href: '/admin/artists/groups', label: 'Sync Artista↔Grupo', icon: RefreshCw },
          { href: '/admin/kpopping',       label: 'Curadoria Kpopping', icon: Link2 },
        ],
      },
      {
        href: '/admin/productions', label: 'Produções', icon: Film, exact: true,
        subItems: [
          { href: '/admin/filmography',            label: 'Filmografias', icon: Clapperboard },
          { href: '/admin/productions/moderation', label: 'Moderação',    icon: AlertTriangle },
        ],
      },
      { href: '/admin/blog', label: 'Blog', icon: FileText, isNew: true },
    ],
  },

  // ── AUTOMAÇÃO ──
  {
    label: 'Automação',
    fixed: true,
    items: [
      { href: '/admin/translations',  label: 'Traduções',      icon: Languages },
      { href: '/admin/enrichment',    label: 'Enriquecimento', icon: Sparkles },
      {
        href: '/admin/ai', label: 'IA', icon: Bot, exact: true,
        subItems: [
          { href: '/admin/ai/config', label: 'Config Providers', icon: Settings },
        ],
      },
    ],
  },

  // ── PLATAFORMA ──
  {
    label: 'Plataforma',
    fixed: true,
    items: [
      { href: '/admin/users', label: 'Usuários', icon: Users },
      {
        href: '/admin/reports', label: 'Reportes', icon: Flag, badgeKey: 'reports',
      },
      {
        href: '/admin/comments', label: 'Comentários', icon: MessageSquare, badgeKey: 'comments',
      },
      {
        href: '/admin/settings', label: 'Sistema', icon: Settings,
        subItems: [
          { href: '/admin/albums',      label: 'Álbuns',       icon: Disc3 },
          { href: '/admin/tags',        label: 'Tags',         icon: Tag },
          { href: '/admin/agencies',    label: 'Agências',     icon: Building2 },
          { href: '/admin/hidden',      label: 'Ocultos',      icon: EyeOff },
          { href: '/admin/instagram',   label: 'Instagram',    icon: Instagram },
          { href: '/admin/activity',    label: 'Atividade',    icon: Activity },
          { href: '/admin/bot-logs',    label: 'Robôs',        icon: Bot },
          { href: '/admin/server-logs', label: 'Server Logs',  icon: AlertTriangle },
          { href: '/admin/cron',        label: 'Cron Jobs',    icon: RefreshCw },
          { href: '/admin/emails',      label: 'Emails',       icon: Mail },
        ],
      },
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
  artists: 'Artistas', groups: 'Grupos', productions: 'Produções', news: 'Notícias',
  translations: 'Traduções', enrichment: 'Enriquecimento', albums: 'Álbuns', tags: 'Tags',
  comments: 'Comentários', reports: 'Reportes', emails: 'Emails', ai: 'IA', users: 'Usuários',
  hidden: 'Ocultos', agencies: 'Agências', instagram: 'Instagram', activity: 'Atividade',
  'bot-logs': 'Robôs', 'server-logs': 'Server Logs', cron: 'Cron Jobs', settings: 'Sistema',
  kpopping: 'Kpopping', filmography: 'Filmografias', blog: 'Blog', database: 'Database',
  analytics: 'Analytics', 'fix-names': 'Enriq. TMDB', duplicates: 'Enriq. MB',
  'social-links': 'Redes Sociais', moderation: 'Moderação', import: 'Importar',
  reprocess: 'Reprocessar', templates: 'Templates', config: 'Config', sync: 'Sync',
  discography: 'Discografia', log: 'Log', pipeline: 'Pipeline',
}

function isIdSegment(s: string) {
  return (s.startsWith('cm') && s.length >= 20) || (s.length >= 24 && /^[a-z0-9]+$/i.test(s))
}

function buildBreadcrumbs(pathname: string): Array<{ label: string; href: string }> {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length <= 2) return []
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

function NewBadge() {
  return (
    <span className="ml-auto text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex-shrink-0">
      novo
    </span>
  )
}

// ─── NavLink (item principal) ──────────────────────────────────────────────────

function NavLink({
  item, pathname, onNav, badge = 0, compact = false,
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

  const hasActiveSub = item.subItems?.some(s => pathname?.startsWith(s.href))
  const highlighted = isActive || !!hasActiveSub

  if (compact) {
    return (
      <Link
        href={item.href}
        onClick={onNav}
        title={item.label}
        className={`relative flex items-center justify-center w-9 h-9 rounded-lg mx-auto transition-all duration-150 ${
          highlighted
            ? 'bg-blue-500/15 text-blue-300 shadow-[0_0_0_1px_rgba(59,130,246,0.25)]'
            : 'text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/60'
        }`}
      >
        <item.icon size={16} className={highlighted ? 'text-blue-400' : ''} />
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
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 ${
        highlighted
          ? 'bg-blue-500/10 text-blue-100 font-semibold shadow-[0_0_0_1px_rgba(59,130,246,0.2)]'
          : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 font-medium'
      }`}
    >
      <item.icon size={14} className={highlighted ? 'text-blue-400' : 'text-zinc-600'} />
      <span className="truncate flex-1">{item.label}</span>
      {badge > 0 ? (
        <NavBadge count={badge} />
      ) : item.isNew ? (
        <NewBadge />
      ) : highlighted && !hasActiveSub ? (
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
      ) : null}
    </Link>
  )
}

// ─── SubNavLink ────────────────────────────────────────────────────────────────

function SubNavLink({
  item, pathname, onNav, badge = 0,
}: {
  item: SubItem
  pathname: string | null
  onNav?: () => void
  badge?: number
}) {
  const isActive = pathname?.startsWith(item.href) ?? false

  return (
    <Link
      href={item.href}
      onClick={onNav}
      className={`flex items-center gap-2 pl-8 pr-3 py-1.5 rounded-lg text-[12px] transition-all duration-150 ${
        isActive
          ? 'text-blue-300 bg-blue-500/8 font-medium'
          : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40 font-normal'
      }`}
    >
      <item.icon size={12} className={isActive ? 'text-blue-400' : 'text-zinc-700'} />
      <span className="truncate flex-1">{item.label}</span>
      {badge > 0 && <NavBadge count={badge} />}
    </Link>
  )
}

// ─── NavItemBlock ─────────────────────────────────────────────────────────────

function NavItemBlock({
  item, pathname, onNav, counts, compact,
}: {
  item: NavItem
  pathname: string | null
  onNav?: () => void
  counts: PendingCounts
  compact: boolean
}) {
  const isActive    = item.exact ? pathname === item.href : pathname?.startsWith(item.href) ?? false
  const hasActiveSub = item.subItems?.some(s => pathname?.startsWith(s.href)) ?? false
  const showSubs    = !compact && item.subItems && (isActive || hasActiveSub)

  const badge = item.badgeKey ? (counts[item.badgeKey] ?? 0) : 0

  return (
    <div>
      <NavLink item={item} pathname={pathname} onNav={onNav} badge={badge} compact={compact} />
      {showSubs && (
        <div className="mt-0.5 space-y-0.5">
          {item.subItems!.map(sub => (
            <SubNavLink
              key={sub.href}
              item={sub}
              pathname={pathname}
              onNav={onNav}
              badge={sub.badgeKey ? (counts[sub.badgeKey] ?? 0) : 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── NavSectionBlock ──────────────────────────────────────────────────────────

function NavSectionBlock({
  section, pathname, onNav, counts, compact,
}: {
  section: NavSection
  pathname: string | null
  onNav?: () => void
  counts: PendingCounts
  compact: boolean
}) {
  // Seção sem label (legado / inline)
  if (!section.label) {
    return (
      <div className="space-y-0.5">
        {section.items.map(item => (
          <NavItemBlock key={item.href} item={item} pathname={pathname} onNav={onNav} counts={counts} compact={compact} />
        ))}
      </div>
    )
  }

  // Modo compacto: sem labels, items empilhados com separador
  if (compact) {
    return (
      <div className="py-1.5 border-b border-zinc-800/40 last:border-0 space-y-0.5">
        {section.items.map(item => (
          <NavItemBlock key={item.href} item={item} pathname={pathname} onNav={onNav} counts={counts} compact />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      {/* Label de seção */}
      <p className="px-3 pt-3 pb-1 text-[9px] font-black uppercase tracking-widest text-zinc-700 select-none">
        {section.label}
      </p>
      {section.items.map(item => (
        <NavItemBlock key={item.href} item={item} pathname={pathname} onNav={onNav} counts={counts} compact={false} />
      ))}
    </div>
  )
}

// ─── SidebarContent ───────────────────────────────────────────────────────────

function SidebarContent({
  pathname, onNav, counts, compact, onToggleCompact,
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
      <div className={`border-b border-zinc-800/60 flex-shrink-0 ${compact ? 'p-2' : 'p-4'}`}>
        {compact ? (
          <Link
            href="/admin"
            onClick={onNav}
            title="HallyuHub Admin"
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600/20 to-blue-500/10 border border-blue-500/20 mx-auto hover:border-blue-500/40 transition-colors"
          >
            <Shield className="text-blue-400" size={16} />
          </Link>
        ) : (
          <>
            <Link href="/admin" className="flex items-center gap-2.5 mb-3 group" onClick={onNav}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600/20 to-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:border-blue-500/40 transition-colors">
                <Shield className="text-blue-400" size={15} />
              </div>
              <div>
                <span className="text-sm font-black text-white tracking-tight block leading-none">HallyuHub</span>
                <span className="text-[9px] text-zinc-600 font-medium">Admin Panel</span>
              </div>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-lg transition-all w-full"
              onClick={onNav}
            >
              <ChevronLeft size={12} />
              Voltar ao site
            </Link>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto ${compact ? 'p-2 space-y-0' : 'px-2 py-1 space-y-0'}`}>
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

      {/* Footer */}
      <div className={`border-t border-zinc-800/60 flex-shrink-0 ${compact ? 'p-2' : 'p-3'}`}>
        <button
          onClick={onToggleCompact}
          title={compact ? 'Expandir menu' : 'Compactar menu'}
          className={`flex items-center gap-2 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60 rounded-lg transition-colors ${
            compact ? 'w-9 h-9 justify-center mx-auto' : 'w-full px-3 py-2 text-xs font-medium'
          }`}
        >
          {compact ? <PanelLeftOpen size={15} /> : <><PanelLeftClose size={15} /><span>Compactar</span></>}
        </button>
      </div>
    </div>
  )
}

// ─── TopBar ───────────────────────────────────────────────────────────────────

function TopBar({ pathname, title, onSearchClick }: {
  pathname: string | null
  title: string
  onSearchClick: () => void
}) {
  const breadcrumbs = buildBreadcrumbs(pathname ?? '')

  return (
    <div className="hidden lg:flex sticky top-0 z-40 h-11 items-center gap-3 px-6 bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800/60">
      <div className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
        <Link href="/admin" className="flex items-center gap-1 text-zinc-700 hover:text-zinc-300 transition-colors flex-shrink-0">
          <Home size={12} />
        </Link>
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-zinc-800">/</span>
            <Link href={crumb.href} className="text-zinc-500 hover:text-zinc-200 transition-colors truncate max-w-[140px] text-xs">
              {crumb.label}
            </Link>
          </span>
        ))}
        <span className="flex items-center gap-1.5 min-w-0">
          <span className="text-zinc-800">/</span>
          <span className="text-zinc-300 font-medium truncate text-xs">{title}</span>
        </span>
      </div>

      <button
        onClick={onSearchClick}
        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 transition-all flex-shrink-0"
      >
        <Search size={12} />
        <span className="hidden xl:inline">Buscar...</span>
        <kbd className="hidden xl:inline text-[10px] bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
      </button>

      <Link
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs text-zinc-700 hover:text-zinc-300 transition-colors flex-shrink-0"
        title="Ver site"
      >
        <ExternalLink size={12} />
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
  const pathname  = usePathname()
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [compact,     setCompact]     = useState(false)
  const [searchOpen,  setSearchOpen]  = useState(false)
  const counts = usePendingCounts()

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

  // Atalhos de teclado
  useEffect(() => {
    let gPressed = false
    let gTimeout: ReturnType<typeof setTimeout> | null = null

    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(o => !o)
        return
      }

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
          d: '/admin', p: '/admin/pipeline', n: '/admin/news',
          a: '/admin/artists', g: '/admin/groups', r: '/admin/productions',
          t: '/admin/translations', u: '/admin/users', i: '/admin/ai',
          b: '/admin/blog',
        }
        const route = routes[e.key]
        if (route) { e.preventDefault(); window.location.href = route }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  const sidebarWidth = compact ? 'lg:w-16' : 'lg:w-56'
  const mainMargin   = compact ? 'lg:ml-16' : 'lg:ml-56'

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="flex">

        {/* Sidebar desktop */}
        <aside className={`hidden lg:flex flex-col min-h-screen bg-[#080c14] border-r border-zinc-800/60 fixed top-0 bottom-0 transition-all duration-200 ${sidebarWidth}`}>
          <SidebarContent pathname={pathname} counts={counts} compact={compact} onToggleCompact={toggleCompact} />
        </aside>

        {/* Drawer mobile */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <aside className="relative flex flex-col w-64 max-w-[85vw] bg-[#080c14] border-r border-zinc-800/60 h-full overflow-y-auto">
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X size={16} />
              </button>
              <SidebarContent pathname={pathname} onNav={() => setMobileOpen(false)} counts={counts} compact={false} onToggleCompact={() => {}} />
            </aside>
          </div>
        )}

        {/* Main */}
        <main className={`flex-1 ${mainMargin} min-w-0 overflow-x-hidden transition-all duration-200`}>

          {/* Top bar desktop */}
          <TopBar pathname={pathname} title={title} onSearchClick={() => setSearchOpen(true)} />

          {/* Header mobile */}
          <div className="lg:hidden sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800/60 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <Menu size={19} />
              </button>
              <div className="flex items-center gap-2">
                <Shield className="text-blue-400" size={15} />
                <span className="font-bold text-white text-sm">{title}</span>
              </div>
            </div>
            <Link href="/" className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1">
              <ChevronLeft size={13} />Site
            </Link>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-5 lg:p-8">
            <div className={`flex items-start justify-between gap-4 ${subtitle || actions ? 'mb-6' : 'mb-5 lg:mb-7'}`}>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>}
              </div>
              {actions && (
                <div className="flex items-center gap-2 flex-shrink-0 mt-1">{actions}</div>
              )}
            </div>
            {children}
          </div>
        </main>
      </div>

      <AdminSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
