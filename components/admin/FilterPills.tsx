'use client'

import React from 'react'

export interface FilterPill<T extends string = string> {
  value: T
  label: string
  count?: number | null
  /** Tailwind color class for the category dot, e.g. 'bg-purple-400' */
  dot?: string
  icon?: React.ReactNode
}

interface FilterPillsProps<T extends string = string> {
  pills: FilterPill<T>[]
  active: T
  onChange: (value: T) => void
  className?: string
}

/**
 * Horizontal row of rounded-full filter pills.
 * Matches the public /productions page filter style.
 * Active pill: bg-accent text-white. Inactive: bg-surface text-muted.
 */
export function FilterPills<T extends string = string>({
  pills,
  active,
  onChange,
  className,
}: FilterPillsProps<T>) {
  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className ?? ''}`}>
      {pills.map(pill => (
        <button
          key={pill.value}
          type="button"
          onClick={() => onChange(pill.value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            active === pill.value
              ? 'bg-accent text-white'
              : 'bg-surface text-muted hover:bg-surface-hover hover:text-foreground'
          }`}
        >
          {pill.dot && (
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                active === pill.value ? 'bg-white/60' : pill.dot
              }`}
            />
          )}
          {pill.icon}
          {pill.label}
          {pill.count != null && (
            <span className="font-mono tabular-nums opacity-60 font-normal ml-0.5">
              {pill.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
