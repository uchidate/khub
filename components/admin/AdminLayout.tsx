'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { Shield, Users, Building2, Film, Newspaper, Disc3, Tag, Activity, Settings, ChevronLeft, Share2, GitMerge, AlertTriangle, Link2, UsersRound, RefreshCw, MessageSquare, Flag, Sparkles, EyeOff, Languages, Mail, FileText, Bot, Menu, X, Download, RotateCcw, Search, ExternalLink, PanelLeftClose, PanelLeftOpen, Home, LayoutDashboard, Workflow, Mic2, ShieldAlert, TrendingUp, BarChart3, Layers, Tv, Globe, FolderOpen, ServerIcon, ChevronDown, ShoppingBag, Image as ImageIcon, BookOpen, Inbox, ClipboardList } from 'lucide-react'
import { Instagram } from '@/components/ui/BrandIcons'
import type { PendingCounts } from '@/app/api/admin/pending-counts/route'
import { AdminSearch } from './AdminSearch'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

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
  collapsible?: boolean  // se true, seção pode ser recolhida
  items: NavItem[]
}

// ─── Navegação por fluxo de trabalho ──────────────────────────────────────────

const navSections: NavSection[] = [
  {
    label: 'Operação',
    items: [
      { href: '/admin',          label: 'Dashboard', icon: LayoutDashboard, exact: true },
      {
        href: '/admin/inbox', label: 'Caixa de trabalho', icon: Inbox, exact: true, badgeKey: 'attention',
        subItems: [
          { href: '/admin/reports',  label: 'Reportes',    icon: Flag,          badgeKey: 'reports' },
          { href: '/admin/comments', label: 'Comentários', icon: MessageSquare, badgeKey: 'comments' },
        ],
      },
      { href: '/admin/processes', label: 'Processos e melhorias', icon: ClipboardList, isNew: true },
      { href: '/admin/ops-metrics', label: 'Métricas Operacionais', icon: BarChart3, isNew: true },
      { href: '/admin/pipeline', label: 'Pipeline',  icon: Workflow },
      { href: '/admin/cron',     label: 'Central de Automação', icon: RefreshCw, badgeKey: 'automation' },
      { href: '/admin/enrichment', label: 'Curadoria Gemini', icon: Sparkles },
      {
        href: '/admin/translations', label: 'Traduções', icon: Languages, exact: true,
        subItems: [
          { href: '/admin/translations/log', label: 'Histórico', icon: FileText },
        ],
      },
    ],
  },

  {
    label: 'Editorial',
    items: [
      {
        href: '/admin/blog', label: 'Blog', icon: FileText, exact: true,
        subItems: [
          { href: '/admin/blog/inspiration', label: 'Inspiração',        icon: Sparkles },
          { href: '/admin/blog/homepage',    label: 'Homepage Editorial', icon: Layers   },
          { href: '/admin/blog/categories',  label: 'Categorias',        icon: Tag       },
          { href: '/admin/blog/import',      label: 'Importar post',     icon: Download  },
          { href: '/admin/blog/blocks-demo', label: 'Guia de blocos',    icon: BookOpen },
        ],
      },
      {
        href: '/admin/news', label: 'Notícias', icon: Newspaper,
        subItems: [
          { href: '/admin/news/import',    label: 'Importar',    icon: Download },
          { href: '/admin/news/reprocess', label: 'Reprocessar', icon: RotateCcw },
        ],
      },
      { href: '/admin/trending',      label: 'Trending',       icon: TrendingUp },
      { href: '/admin/home-clusters', label: 'Home Editorial', icon: Layers     },
      {
        href: '/admin/seo', label: 'SEO', icon: Globe, exact: true,
        subItems: [
          { href: '/admin/seo/content-quality', label: 'Auditoria de conteúdo', icon: AlertTriangle },
        ],
      },
      { href: '/admin/tags',          label: 'Tags',           icon: Tag        },
    ],
  },

  {
    label: 'Catálogo',
    items: [
      {
        href: '/admin/artists', label: 'Artistas', icon: Mic2, exact: true,
        subItems: [
          { href: '/admin/artists/enrich',       label: 'Curadoria Gemini', icon: Sparkles },
          { href: '/admin/artists/social-links', label: 'Redes Sociais',  icon: Share2   },
          { href: '/admin/artists/visibility',   label: 'Visibilidade',   icon: EyeOff   },
          { href: '/admin/artists/groups',       label: 'Vínculos com grupos', icon: RefreshCw },
          { href: '/admin/artists/duplicates',   label: 'Duplicados',     icon: GitMerge },
          { href: '/admin/artists/moderation',   label: 'Moderação',      icon: AlertTriangle },
        ],
      },
      {
        href: '/admin/groups', label: 'Grupos', icon: UsersRound, exact: true,
        subItems: [
          { href: '/admin/groups/enrich', label: 'Curadoria Gemini', icon: Sparkles },
          { href: '/admin/kpopping',      label: 'Kpopping',       icon: Link2 },
        ],
      },
      {
        href: '/admin/productions', label: 'Produções', icon: Film, exact: true,
        subItems: [
          { href: '/admin/productions/enrich', label: 'Curadoria Gemini', icon: Sparkles  },
          { href: '/admin/productions/moderation', label: 'Moderação',  icon: AlertTriangle },
          { href: '/admin/productions/takedowns',  label: 'Takedowns',  icon: ShieldAlert },
        ],
      },
      { href: '/admin/albums',         label: 'Álbuns',           icon: Disc3      },
      { href: '/admin/music-catalog',  label: 'Catálogo Musical', icon: Disc3      },
      { href: '/admin/agencies',       label: 'Agências',         icon: Building2  },
      { href: '/admin/streaming',label: 'Streaming', icon: Tv         },
    ],
  },

  {
    label: 'Negócio',
    items: [
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      {
        href: '/admin/loja', label: 'Loja', icon: ShoppingBag, exact: true,
        subItems: [
          { href: '/admin/loja/import',   label: 'Importar Shopee',        icon: Download },
          { href: '/admin/loja/importar', label: 'Importar Mercado Livre', icon: Download },
          { href: '/admin/loja/cupons',   label: 'Cupons',                 icon: Tag },
        ],
      },
      { href: '/admin/users',     label: 'Usuários',  icon: Users },
      {
        href: '/admin/emails', label: 'Emails', icon: Mail,
        subItems: [
          { href: '/admin/emails/templates', label: 'Templates', icon: FolderOpen },
        ],
      },
    ],
  },

  {
    label: 'Automação',
    collapsible: true,
    items: [
      {
        href: '/admin/ai', label: 'IA', icon: Bot, exact: true,
        subItems: [
          { href: '/admin/ai/config', label: 'Configuração', icon: Settings },
        ],
      },
      { href: '/admin/instagram',     label: 'Instagram Sync',  icon: Instagram  },
      { href: '/admin/image-audit',   label: 'Auditoria Imagens', icon: ImageIcon },
      { href: '/admin/hidden',        label: 'Central de Visibilidade', icon: EyeOff },
      { href: '/admin/blog/agent',    label: 'Agente de Blog',  icon: Bot        },
      { href: '/admin/artists/fix-names',  label: 'Nomes via TMDB',  icon: Sparkles     },
      { href: '/admin/artists/mb-import',  label: 'Import MB',       icon: Download     },
    ],
  },

  {
    label: 'Sistema',
    collapsible: true,
    items: [
      { href: '/admin/activity', label: 'Atividade', icon: Activity },
      {
        href: '/admin/settings', label: 'Configurações', icon: Settings,
        subItems: [
          { href: '/admin/bot-logs',       label: 'Robôs',          icon: Bot           },
          { href: '/admin/server-logs',    label: 'Server Logs',    icon: AlertTriangle },
          { href: '/admin/infrastructure', label: 'Infraestrutura', icon: ServerIcon    },
        ],
      },
    ],
  },
]

// ─── Pending counts ───────────────────────────────────────────────────────────

function usePendingCounts(): PendingCounts {
  const [counts, setCounts] = useState<PendingCounts>({ reports: 0, comments: 0, attention: 0, automation: 0 })

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/pending-counts')
      if (res.ok) setCounts(await res.json())
    } catch { /* ignore */ }
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
  translations: 'Traduções', enrichment: 'Curadoria Gemini', enrich: 'Curar no Gemini', albums: 'Álbuns', tags: 'Tags',
  inbox: 'Caixa de trabalho', processes: 'Processos e melhorias', comments: 'Comentários', reports: 'Reportes', emails: 'Emails', ai: 'IA', users: 'Usuários',
  hidden: 'Central de Visibilidade', agencies: 'Agências', instagram: 'Instagram Sync', activity: 'Atividade',
  'bot-logs': 'Robôs', 'server-logs': 'Server Logs', cron: 'Central de Automação', infrastructure: 'Infraestrutura', settings: 'Configurações',
  kpopping: 'Kpopping', filmography: 'Filmografias', blog: 'Blog', database: 'Database',
  analytics: 'Analytics', trending: 'Trending', 'fix-names': 'Nomes via TMDB', duplicates: 'MusicBrainz',
  'social-links': 'Redes Sociais', moderation: 'Moderação', import: 'Importar',
  reprocess: 'Reprocessar', templates: 'Templates', config: 'Configuração', sync: 'Sync TMDB', status: 'Status',
  discography: 'Discografia', log: 'Log', pipeline: 'Pipeline', takedowns: 'Takedowns',
  streaming: 'Streaming', seo: 'SEO', categories: 'Categorias', homepage: 'Homepage Editorial',
  visibility: 'Visibilidade', 'mb-import': 'Import MB', 'music-catalog': 'Catálogo Musical',
  'home-clusters': 'Home Clusters', loja: 'Loja',
  agent: 'Agente de Blog', 'image-audit': 'Auditoria Imagens',
  ga4: 'Google Analytics 4', inspiration: 'Inspiração',
  cupons: 'Cupons', importar: 'Importar',
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
    <span className="ml-auto text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30 flex-shrink-0">
      novo
    </span>
  )
}

// ─── NavLink (item principal) ──────────────────────────────────────────────────

function NavLink({
  item, pathname, onNav, badge = 0, compact = false, isSubOpen = false, onToggleSub,
}: {
  item: NavItem
  pathname: string | null
  onNav?: () => void
  badge?: number
  compact?: boolean
  isSubOpen?: boolean
  onToggleSub?: () => void
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
            ? 'bg-accent-soft text-accent shadow-[0_0_0_1px_var(--color-accent)]'
            : 'text-muted hover:text-foreground hover:bg-surface-hover'
        }`}
      >
        <item.icon size={16} className={highlighted ? 'text-accent' : ''} />
        {badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-red-500 text-white text-[8px] font-black px-0.5">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 ${
        highlighted
          ? 'bg-accent-soft text-foreground font-semibold shadow-[0_0_0_1px_var(--color-accent)]'
          : 'text-muted hover:text-foreground hover:bg-surface-hover font-medium'
      }`}
    >
      <Link href={item.href} onClick={onNav} className="flex items-center gap-2.5 flex-1 min-w-0">
        <item.icon size={14} className={highlighted ? 'text-accent' : 'text-muted'} />
        <span className="truncate">{item.label}</span>
      </Link>

      {badge > 0 ? (
        <NavBadge count={badge} />
      ) : item.isNew ? (
        <NewBadge />
      ) : highlighted && !hasActiveSub && !item.subItems ? (
        <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
      ) : null}

      {item.subItems && onToggleSub && (
        <button
          type="button"
          onClick={onToggleSub}
          title={isSubOpen ? 'Recolher submenu' : 'Expandir submenu'}
          className="p-0.5 rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
        >
          <ChevronDown size={14} className={`transition-transform ${isSubOpen ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
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
          ? 'text-accent bg-accent-soft font-medium'
          : 'text-muted hover:text-foreground hover:bg-surface-hover font-normal'
      }`}
    >
      <item.icon size={12} className={isActive ? 'text-accent' : 'text-muted'} />
      <span className="truncate flex-1">{item.label}</span>
      {badge > 0 && <NavBadge count={badge} />}
    </Link>
  )
}

// ─── NavItemBlock ─────────────────────────────────────────────────────────────

function NavItemBlock({
  item, pathname, onNav, counts, compact, expandedSubnav, onToggleSubnav,
}: {
  item: NavItem
  pathname: string | null
  onNav?: () => void
  counts: PendingCounts
  compact: boolean
  expandedSubnav: Set<string>
  onToggleSubnav: (href: string) => void
}) {
  const isActive    = item.exact ? pathname === item.href : pathname?.startsWith(item.href) ?? false
  const hasActiveSub = item.subItems?.some(s => pathname?.startsWith(s.href)) ?? false
  const prefOpen = expandedSubnav.has(item.href)
  const showSubs    = !compact && item.subItems && (isActive || hasActiveSub || prefOpen)

  const badge = item.badgeKey ? (counts[item.badgeKey] ?? 0) : 0

  return (
    <div>
      <NavLink
        item={item}
        pathname={pathname}
        onNav={onNav}
        badge={badge}
        compact={compact}
        isSubOpen={showSubs}
        onToggleSub={item.subItems ? () => onToggleSubnav(item.href) : undefined}
      />
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
  section, pathname, onNav, counts, compact, expandedSubnav, onToggleSubnav,
  sectionCollapsed, onToggleSectionCollapsed,
}: {
  section: NavSection
  pathname: string | null
  onNav?: () => void
  counts: PendingCounts
  compact: boolean
  expandedSubnav: Set<string>
  onToggleSubnav: (href: string) => void
  sectionCollapsed?: boolean
  onToggleSectionCollapsed?: () => void
}) {
  // Seção sem label (legado / inline)
  if (!section.label) {
    return (
      <div className="space-y-0.5">
        {section.items.map(item => (
          <NavItemBlock
            key={item.href}
            item={item}
            pathname={pathname}
            onNav={onNav}
            counts={counts}
            compact={compact}
            expandedSubnav={expandedSubnav}
            onToggleSubnav={onToggleSubnav}
          />
        ))}
      </div>
    )
  }

  // Modo compacto: sem labels, items empilhados com separador
  if (compact) {
    return (
      <div className="py-1.5 border-b border-border last:border-0 space-y-0.5">
        {section.items.map(item => (
          <NavItemBlock
            key={item.href}
            item={item}
            pathname={pathname}
            onNav={onNav}
            counts={counts}
            compact
            expandedSubnav={expandedSubnav}
            onToggleSubnav={onToggleSubnav}
          />
        ))}
      </div>
    )
  }

  const isCollapsible = !!section.collapsible
  const isCollapsed   = isCollapsible && !!sectionCollapsed

  return (
    <div className="space-y-0.5">
      {/* Label de seção */}
      {isCollapsible ? (
        <button
          type="button"
          onClick={onToggleSectionCollapsed}
          className="w-full flex items-center justify-between px-3 pt-3 pb-1 group"
        >
          <span className="text-[9px] font-black uppercase tracking-widest text-muted group-hover:text-foreground transition-colors select-none">
            {section.label}
          </span>
          <ChevronDown
            size={11}
            className={`text-muted group-hover:text-foreground transition-all duration-200 ${isCollapsed ? '' : 'rotate-180'}`}
          />
        </button>
      ) : (
        <p className="px-3 pt-3 pb-1 text-[9px] font-black uppercase tracking-widest text-muted select-none">
          {section.label}
        </p>
      )}

      {!isCollapsed && section.items.map(item => (
        <NavItemBlock
          key={item.href}
          item={item}
          pathname={pathname}
          onNav={onNav}
          counts={counts}
          compact={false}
          expandedSubnav={expandedSubnav}
          onToggleSubnav={onToggleSubnav}
        />
      ))}
    </div>
  )
}

// ─── SidebarContent ───────────────────────────────────────────────────────────

function SidebarContent({
  pathname, onNav, counts, compact, onToggleCompact, expandedSubnav, onToggleSubnav,
  collapsedSections, onToggleSectionCollapsed,
}: {
  pathname: string | null
  onNav?: () => void
  counts: PendingCounts
  compact: boolean
  onToggleCompact: () => void
  expandedSubnav: Set<string>
  onToggleSubnav: (href: string) => void
  collapsedSections: Set<string>
  onToggleSectionCollapsed: (label: string) => void
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`border-b border-border flex-shrink-0 ${compact ? 'p-2' : 'p-4'}`}>
        {compact ? (
          <Link
            href="/admin"
            onClick={onNav}
            title="HallyuHub Admin"
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-accent-soft border border-accent/20 mx-auto hover:border-accent/40 transition-colors"
          >
            <Shield className="text-accent" size={16} />
          </Link>
        ) : (
          <>
            <Link href="/admin" className="flex items-center gap-2.5 mb-3 group" onClick={onNav}>
              <div className="w-8 h-8 rounded-xl bg-accent-soft border border-accent/20 flex items-center justify-center flex-shrink-0 group-hover:border-accent/40 transition-colors">
                <Shield className="text-accent" size={15} />
              </div>
              <div>
                <span className="text-sm font-black text-foreground tracking-tight block leading-none">HallyuHub</span>
                <span className="text-[9px] text-muted font-medium">Admin Panel</span>
              </div>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground bg-surface hover:bg-surface-hover border border-border px-3 py-1.5 rounded-lg transition-all w-full"
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
            expandedSubnav={expandedSubnav}
            onToggleSubnav={onToggleSubnav}
            sectionCollapsed={section.label ? collapsedSections.has(section.label) : false}
            onToggleSectionCollapsed={section.label ? () => onToggleSectionCollapsed(section.label!) : undefined}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className={`border-t border-border flex-shrink-0 ${compact ? 'p-2 space-y-1' : 'p-3 space-y-1'}`}>
        {compact ? (
          <>
            <div className="flex justify-center"><ThemeToggle /></div>
            <button
              onClick={onToggleCompact}
              title="Expandir menu"
              className="flex items-center justify-center w-9 h-9 mx-auto text-muted hover:text-foreground hover:bg-surface-hover rounded-lg transition-colors"
            >
              <PanelLeftOpen size={15} />
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between px-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted">Tema</span>
              <ThemeToggle />
            </div>
            <button
              onClick={onToggleCompact}
              title="Compactar menu"
              className="flex items-center gap-2 text-muted hover:text-foreground hover:bg-surface-hover rounded-lg transition-colors w-full px-3 py-2 text-xs font-medium"
            >
              <PanelLeftClose size={15} /><span>Compactar</span>
            </button>
            <div className="px-3 py-1.5 border border-border rounded-lg bg-surface/70">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-1">Atalhos</p>
              <p className="text-[10px] text-muted">`g d` Dashboard · `g x` Trabalho · `g c` Automação</p>
            </div>
          </>
        )}
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
    <div className="hidden lg:flex sticky top-0 z-40 h-11 items-center gap-3 px-6 bg-background/90 backdrop-blur-sm border-b border-border">
      <div className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
        <Link href="/admin" className="flex items-center gap-1 text-border hover:text-muted transition-colors flex-shrink-0">
          <Home size={12} />
        </Link>
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-border">/</span>
            <Link href={crumb.href} className="text-muted hover:text-foreground transition-colors truncate max-w-[140px] text-xs">
              {crumb.label}
            </Link>
          </span>
        ))}
        <span className="flex items-center gap-1.5 min-w-0">
          <span className="text-border">/</span>
          <span className="text-foreground font-medium truncate text-xs">{title}</span>
        </span>
      </div>

      <button
        onClick={onSearchClick}
        className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-xl text-sm text-muted hover:text-foreground hover:border-accent/50 transition-all flex-shrink-0 min-w-[160px] xl:min-w-[220px]"
      >
        <Search size={14} className="opacity-50 flex-shrink-0" />
        <span className="flex-1 text-left">Buscar no admin…</span>
        <kbd className="hidden xl:inline text-[10px] bg-surface border border-border px-1.5 py-0.5 rounded font-mono flex-shrink-0">⌘K</kbd>
      </button>

      <Link
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors flex-shrink-0"
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
  /** Oculta o <h1> padrão quando a página gerencia seu próprio cabeçalho (ex: PageHeader) */
  hideTitle?: boolean
}

export function AdminLayout({ children, title, subtitle, actions, hideTitle }: AdminLayoutProps) {
  const pathname  = usePathname()
  const router = useRouter()
  const [mobileOpen,    setMobileOpen]    = useState(false)
  const [compact,       setCompact]       = useState(false)
  const [searchOpen,    setSearchOpen]    = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [expandedSubnav,    setExpandedSubnav]    = useState<Set<string>>(new Set())
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set(['Automação', 'Sistema']))
  const counts = usePendingCounts()

  useEffect(() => {
    const saved = localStorage.getItem('admin-compact')
    if (saved === 'true') setCompact(true)

    const savedSubnav = localStorage.getItem('admin-expanded-subnav')
    if (savedSubnav) {
      try {
        const arr = JSON.parse(savedSubnav) as string[]
        if (Array.isArray(arr)) setExpandedSubnav(new Set(arr))
      } catch { /* ignore */ }
    }

    const savedCollapsed = localStorage.getItem('admin-collapsed-sections')
    if (savedCollapsed) {
      try {
        const arr = JSON.parse(savedCollapsed) as string[]
        if (Array.isArray(arr)) setCollapsedSections(new Set(arr))
      } catch { /* ignore */ }
    }
  }, [])

  const toggleCompact = useCallback(() => {
    setCompact(c => {
      const next = !c
      localStorage.setItem('admin-compact', String(next))
      return next
    })
  }, [])

  const toggleSubnav = useCallback((href: string) => {
    setExpandedSubnav(prev => {
      const next = new Set(prev)
      if (next.has(href)) next.delete(href)
      else next.add(href)
      localStorage.setItem('admin-expanded-subnav', JSON.stringify(Array.from(next)))
      return next
    })
  }, [])

  const toggleSectionCollapsed = useCallback((label: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      localStorage.setItem('admin-collapsed-sections', JSON.stringify(Array.from(next)))
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

      if (e.key === 'Escape') {
        setSearchOpen(false)
        setMobileOpen(false)
        setShortcutsOpen(false)
        return
      }

      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setShortcutsOpen(o => !o)
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
          d: '/admin', x: '/admin/inbox', p: '/admin/pipeline', c: '/admin/cron', n: '/admin/news',
          a: '/admin/artists', g: '/admin/groups', r: '/admin/productions',
          t: '/admin/translations', u: '/admin/users', i: '/admin/ai',
          b: '/admin/blog',
        }
        const route = routes[e.key]
        if (route) { e.preventDefault(); router.push(route) }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [router])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    if (!mobileOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [mobileOpen])

  const sidebarWidth = compact ? 'lg:w-16' : 'lg:w-60'
  const mainMargin   = compact ? 'lg:ml-16' : 'lg:ml-60'

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">

        {/* Sidebar desktop */}
        <aside className={`hidden lg:flex flex-col min-h-screen bg-surface border-r border-border fixed top-0 bottom-0 transition-all duration-200 ${sidebarWidth}`}>
          <SidebarContent
            pathname={pathname}
            counts={counts}
            compact={compact}
            onToggleCompact={toggleCompact}
            expandedSubnav={expandedSubnav}
            onToggleSubnav={toggleSubnav}
            collapsedSections={collapsedSections}
            onToggleSectionCollapsed={toggleSectionCollapsed}
          />
        </aside>

        {/* Drawer mobile */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <aside className="relative flex flex-col w-64 max-w-[85vw] bg-surface border-r border-border h-full overflow-y-auto">
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar menu"
                className="absolute top-3 right-3 p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              >
                <X size={16} />
              </button>
              <SidebarContent
                pathname={pathname}
                onNav={() => setMobileOpen(false)}
                counts={counts}
                compact={false}
                onToggleCompact={() => {}}
                expandedSubnav={expandedSubnav}
                onToggleSubnav={toggleSubnav}
                collapsedSections={collapsedSections}
                onToggleSectionCollapsed={toggleSectionCollapsed}
              />
            </aside>
          </div>
        )}

        {/* Main */}
        <main className={`flex-1 ${mainMargin} min-w-0 overflow-x-hidden transition-all duration-200`}>

          {/* Top bar desktop */}
          <TopBar pathname={pathname} title={title} onSearchClick={() => setSearchOpen(true)} />

          {/* Header mobile */}
          <div className="lg:hidden sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Abrir menu"
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors"
              >
                <Menu size={19} />
              </button>
              <div className="flex items-center gap-2">
                <Shield className="text-accent" size={15} />
                <span className="font-bold text-foreground text-sm">{title}</span>
              </div>
            </div>
            <Link href="/" className="text-xs text-muted hover:text-foreground transition-colors flex items-center gap-1">
              <ChevronLeft size={13} />Site
            </Link>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-5 lg:p-8">
            {!hideTitle && (
              <div className={`flex items-start justify-between gap-4 ${subtitle || actions ? 'mb-6' : 'mb-5 lg:mb-7'}`}>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-foreground leading-tight">{title}</h1>
                  {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
                </div>
                {actions && (
                  <div className="flex items-center gap-2 flex-shrink-0 mt-1">{actions}</div>
                )}
              </div>
            )}
            {children}
          </div>
        </main>
      </div>

      <AdminSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Keyboard shortcuts overlay */}
      {shortcutsOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShortcutsOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Atalhos de teclado"
            className="w-full max-w-lg bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <h2 className="text-sm font-black text-foreground">Atalhos de teclado</h2>
              <button onClick={() => setShortcutsOpen(false)} aria-label="Fechar" className="text-muted hover:text-foreground transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="p-5 grid sm:grid-cols-2 gap-x-8 gap-y-1.5">
              {[
                { section: 'Global' },
                { key: '⌘K', label: 'Abrir busca' },
                { key: '?',  label: 'Atalhos' },
                { key: 'Esc', label: 'Fechar modal' },
                { section: 'Navegação (g → ...)' },
                { key: 'g d', label: 'Dashboard' },
                { key: 'g x', label: 'Caixa de trabalho' },
                { key: 'g p', label: 'Pipeline' },
                { key: 'g c', label: 'Central de Automação' },
                { key: 'g n', label: 'Notícias' },
                { key: 'g b', label: 'Blog' },
                { key: 'g a', label: 'Artistas' },
                { key: 'g g', label: 'Grupos' },
                { key: 'g r', label: 'Produções' },
                { key: 'g u', label: 'Usuários' },
                { key: 'g i', label: 'IA' },
                { section: 'Busca' },
                { key: '↑↓', label: 'Navegar resultados' },
                { key: '↵',  label: 'Abrir selecionado' },
                { key: '>',  label: 'Modo comandos' },
              ].map((item, i) => (
                'section' in item ? (
                  <p key={i} className="col-span-full text-[9px] font-black uppercase tracking-widest text-muted pt-3 first:pt-0">{item.section}</p>
                ) : (
                  <div key={i} className="flex items-center justify-between gap-3 py-1">
                    <span className="text-xs text-muted">{item.label}</span>
                    <kbd className="text-[10px] font-mono bg-surface border border-border px-2 py-0.5 rounded text-foreground whitespace-nowrap">{item.key}</kbd>
                  </div>
                )
              ))}
            </div>
            <div className="px-5 py-3 border-t border-border">
              <p className="text-[10px] text-muted text-center">Pressione <kbd className="font-mono bg-surface border border-border px-1 rounded text-foreground">?</kbd> para fechar</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
