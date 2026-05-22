'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export interface Breadcrumb {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items?: Breadcrumb[]
  homeLabel?: string
  /** Use em seções hero com fundo escuro/imagem. Usa cores brancas com opacidade. */
  onDark?: boolean
  className?: string
}

export function Breadcrumbs({ items, homeLabel = 'Início', onDark = false, className = '' }: BreadcrumbsProps) {
  const pathname = usePathname()

  const generatedItems = items || generateBreadcrumbs(pathname)
  const breadcrumbs = pathname === '/'
    ? generatedItems
    : [{ label: homeLabel, href: '/' }, ...generatedItems]

  const separatorColor = onDark ? 'text-white/35' : 'text-muted/45'
  const linkColor = onDark ? 'text-white/65 hover:text-white' : 'text-muted hover:text-foreground'
  const currentColor = onDark ? 'text-white' : 'text-foreground'

  return (
    <nav aria-label="Breadcrumb" className={`min-w-0 ${className}`}>
      <ol className="flex min-w-0 items-center gap-2 overflow-hidden font-mono text-[11px] tracking-[0.02em]">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1
          const label = crumb.label

          return (
            <li key={index} className={`flex items-center gap-2 ${isLast ? 'min-w-0' : 'shrink-0'}`}>
              {index > 0 && <span className={`shrink-0 ${separatorColor}`} aria-hidden="true">/</span>}
              {isLast || !crumb.href ? (
                <span className={`truncate ${currentColor}`} aria-current="page">
                  {label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className={`shrink-0 transition-colors focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4 ${linkColor}`}
                >
                  {label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function generateBreadcrumbs(pathname: string): Breadcrumb[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: Breadcrumb[] = []

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    const href = '/' + segments.slice(0, i + 1).join('/')

    if (isId(segment)) continue

    breadcrumbs.push({
      label: formatLabel(segment),
      href: i < segments.length - 1 ? href : undefined,
    })
  }

  return breadcrumbs
}

function isId(segment: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) ||
    /^\d+$/.test(segment)
}

function formatLabel(segment: string): string {
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
