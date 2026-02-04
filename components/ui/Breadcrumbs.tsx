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
}

export function Breadcrumbs({ items, homeLabel = 'Início' }: BreadcrumbsProps) {
  const pathname = usePathname()

  // Auto-generate breadcrumbs from pathname if not provided
  const breadcrumbs = items || generateBreadcrumbs(pathname)

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-2 text-sm flex-wrap">
        {/* Home */}
        <li>
          <Link
            href=""
            className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:text-white focus-visible:underline focus-visible:underline-offset-4"
          >
            <Home size={16} />
            <span className="sr-only sm:not-sr-only">{homeLabel}</span>
          </Link>
        </li>

        {/* Breadcrumb items */}
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1

          return (
            <li key={index} className="flex items-center gap-2">
              <ChevronRight size={16} className="text-zinc-600" aria-hidden="true" />

              {isLast || !crumb.href ? (
                <span className="text-white font-medium" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-zinc-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:text-white focus-visible:underline focus-visible:underline-offset-4"
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

// Helper function to generate breadcrumbs from pathname
function generateBreadcrumbs(pathname: string): Breadcrumb[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: Breadcrumb[] = []

  // Skip v1 prefix
  const startIndex = segments[0] === 'v1' ? 1 : 0

  for (let i = startIndex; i < segments.length; i++) {
    const segment = segments[i]
    const href = '/' + segments.slice(0, i + 1).join('/')

    // Skip if it's an ID (uuid pattern or just numbers)
    if (isId(segment)) {
      continue
    }

    breadcrumbs.push({
      label: formatLabel(segment),
      href: i < segments.length - 1 ? href : undefined, // Last item has no href
    })
  }

  return breadcrumbs
}

// Check if segment is likely an ID
function isId(segment: string): boolean {
  // UUID pattern or numeric ID
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) ||
    /^\d+$/.test(segment)
}

// Format segment into readable label
function formatLabel(segment: string): string {
  // Replace hyphens with spaces and capitalize
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
