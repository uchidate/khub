import {
  Bell,
  BookmarkCheck,
  Heart,
  KeyRound,
  LayoutDashboard,
  Settings,
  Shield,
  User,
  type LucideIcon,
} from 'lucide-react'

export type AccountNavKey =
  | 'dashboard'
  | 'profile'
  | 'favorites'
  | 'watchlist'
  | 'notifications'
  | 'content'
  | 'security'
  | 'settings'

export type AccountNavItem = {
  key: AccountNavKey
  label: string
  shortLabel: string
  href: string
  icon: LucideIcon
  description: string
}

export type AccountNavGroup = {
  label: string
  items: AccountNavItem[]
}

export const accountNavGroups: AccountNavGroup[] = [
  {
    label: 'Conta',
    items: [
      {
        key: 'dashboard',
        label: 'Painel',
        shortLabel: 'Painel',
        href: '/dashboard',
        icon: LayoutDashboard,
        description: 'Resumo da sua atividade e recomendações.',
      },
      {
        key: 'profile',
        label: 'Perfil',
        shortLabel: 'Perfil',
        href: '/profile',
        icon: User,
        description: 'Bio, presença e curadoria.',
      },
    ],
  },
  {
    label: 'Biblioteca',
    items: [
      {
        key: 'favorites',
        label: 'Favoritos',
        shortLabel: 'Favoritos',
        href: '/favorites',
        icon: Heart,
        description: 'Artistas, grupos, notícias e produções favoritas.',
      },
      {
        key: 'watchlist',
        label: 'Lista',
        shortLabel: 'Lista',
        href: '/watchlist',
        icon: BookmarkCheck,
        description: 'Dramas e filmes para assistir ou continuar.',
      },
    ],
  },
  {
    label: 'Preferências',
    items: [
      {
        key: 'notifications',
        label: 'Alertas',
        shortLabel: 'Alertas',
        href: '/settings/notifications',
        icon: Bell,
        description: 'Emails, digest e alertas sobre favoritos.',
      },
      {
        key: 'content',
        label: 'Conteúdo',
        shortLabel: 'Conteúdo',
        href: '/settings/content-preferences',
        icon: Shield,
        description: 'Classificação etária e filtros de conteúdo.',
      },
      {
        key: 'security',
        label: 'Acesso',
        shortLabel: 'Acesso',
        href: '/auth/forgot-password',
        icon: KeyRound,
        description: 'Recuperação de senha e acesso à conta.',
      },
      {
        key: 'settings',
        label: 'Ajustes',
        shortLabel: 'Ajustes',
        href: '/settings',
        icon: Settings,
        description: 'Central de controle da conta.',
      },
    ],
  },
]

export const accountNavItems = accountNavGroups.flatMap(group => group.items)

export function getAccountNavItemForPath(pathname: string | null | undefined) {
  if (!pathname) return accountNavItems[0]

  return (
    accountNavItems
      .filter(item => pathname === item.href || pathname.startsWith(`${item.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0] ?? accountNavItems[0]
  )
}
