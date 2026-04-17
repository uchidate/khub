'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
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

export function Breadcrumbs({ items, homeLabel = 'Início', onDark = false, className = 'mb-6' }: BreadcrumbsProps) {
  const pathname = usePathname()

  const breadcrumbs = items || generateBreadcrumbs(pathname)

  const chevronColor = onDark ? 'text-white/25' : 'text-border'
  const linkColor    = onDark ? 'text-white/60 hover:text-white' : 'text-muted hover:text-foreground'
  const currentColor = onDark ? 'text-white'   : 'text-foreground'

  return (
    <nav aria-label="Breadcrumb" className={`min-w-0 ${className}`}>
      <ol className="flex items-center gap-2 text-sm overflow-hidden">
        {/* Home */}
        <li className="flex-shrink-0">
          <Link
            href="/"
            className={`flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4 ${linkColor}`}
          >
            <Home size={16} />
            <span className="sr-only sm:not-sr-only">{homeLabel}</span>
          </Link>
        </li>

        {/* Breadcrumb items */}
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1

          return (
            <li key={index} className={`flex items-center gap-2 ${isLast ? 'min-w-0' : 'flex-shrink-0'}`}>
              <ChevronRight size={16} className={`flex-shrink-0 ${chevronColor}`} aria-hidden="true" />

              {isLast || !crumb.href ? (
                <span className={`font-medium truncate ${currentColor}`} aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className={`transition-colors focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4 ${linkColor}`}
                >
                  {crumb.label}
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
