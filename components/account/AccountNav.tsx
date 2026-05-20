'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { accountNavGroups, getAccountNavItemForPath } from '@/lib/config/account-navigation'

export function AccountNav() {
  const pathname = usePathname()
  const activeItem = getAccountNavItemForPath(pathname)

  return (
    <nav aria-label="Área da conta" className="rounded-2xl border border-border bg-surface/95 px-2 py-2 shadow-sm">
      <div className="flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {accountNavGroups.map((group, groupIndex) => (
          <div key={group.label} className="flex min-w-max items-center gap-1">
            {groupIndex > 0 && <span className="mx-1 h-5 w-px bg-border" aria-hidden />}
            <span className="hidden px-2 text-[9px] font-black uppercase tracking-[0.16em] text-muted lg:inline">
              {group.label}
            </span>
            {group.items.map(({ key, label, shortLabel, href, icon: Icon }) => {
              const isActive = activeItem.key === key
              return (
                <Link
                  key={key}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  title={label}
                  className={`inline-flex h-9 items-center justify-center gap-2 rounded-xl px-3 text-xs font-black transition-colors ${
                    isActive
                      ? 'bg-foreground text-background shadow-sm'
                      : 'text-muted hover:bg-background hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="whitespace-nowrap sm:hidden">{shortLabel}</span>
                  <span className="hidden whitespace-nowrap sm:inline">{label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </div>
    </nav>
  )
}
