'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { accountNavItems, getAccountNavItemForPath } from '@/lib/config/account-navigation'

export function AccountNav() {
  const pathname = usePathname()
  const activeItem = getAccountNavItemForPath(pathname)

  return (
    <nav aria-label="Área da conta" className="rounded-2xl border border-border bg-surface/95 p-2 shadow-sm">
      <div className="flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {accountNavItems.map(({ key, label, href, icon: Icon }) => {
          const isActive = activeItem.key === key
          return (
            <Link
              key={key}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              title={label}
              className={`inline-flex h-9 min-w-max items-center justify-center gap-2 rounded-xl px-3 text-xs font-black transition-colors ${
                isActive
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted hover:bg-background hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
