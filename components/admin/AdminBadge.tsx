import React from 'react'

/**
 * AdminBadge — Badge semântico para status, tipo e contagem no admin.
 *
 * Variantes predefinidas cobrem os status mais comuns.
 * Suporta ícone, dot e shape redondo ou pill.
 *
 * Uso:
 *   <AdminBadge variant="published"><Eye size={10} /> Visível</AdminBadge>
 *   <AdminBadge variant="draft" dot>Rascunho</AdminBadge>
 *   <AdminBadge variant="error" shape="pill">Oculto</AdminBadge>
 *   <AdminBadge variant="custom" color="bg-teal-500/15 text-teal-400">Custom</AdminBadge>
 */

export type AdminBadgeVariant =
  | 'published'   // emerald
  | 'draft'       // gray/muted
  | 'pending'     // blue
  | 'review'      // amber
  | 'error'       // red
  | 'hidden'      // red / strikethrough feel
  | 'warning'     // amber
  | 'info'        // blue
  | 'success'     // emerald
  | 'neutral'     // gray
  | 'accent'      // pink/accent
  | 'custom'      // use color prop

const VARIANT_CLASSES: Record<Exclude<AdminBadgeVariant, 'custom'>, string> = {
  published: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  draft:     'bg-surface text-muted border-border',
  pending:   'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20',
  review:    'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
  error:     'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20',
  hidden:    'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20',
  warning:   'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
  info:      'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20',
  success:   'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  neutral:   'bg-surface text-muted border-border',
  accent:    'bg-accent/10 text-accent border-accent/20',
}

interface AdminBadgeProps {
  variant?: AdminBadgeVariant
  /** Custom color string when variant="custom" */
  color?: string
  /** Show a dot indicator instead of text (or alongside it) */
  dot?: boolean
  /** Fully rounded pill shape (default: slight rounding) */
  shape?: 'default' | 'pill' | 'square'
  className?: string
  children?: React.ReactNode
}

export function AdminBadge({
  variant = 'neutral',
  color,
  dot,
  shape = 'default',
  className,
  children,
}: AdminBadgeProps) {
  const colorClass = variant === 'custom' ? (color ?? '') : VARIANT_CLASSES[variant]
  const shapeClass = shape === 'pill' ? 'rounded-full' : shape === 'square' ? 'rounded' : 'rounded'

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold border ${shapeClass} ${colorClass} ${className ?? ''}`}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
      )}
      {children}
    </span>
  )
}

/**
 * AdminBadge.Count — Pill com número (ex: quantidade de itens)
 */
export function AdminBadgeCount({
  count,
  variant = 'neutral',
  className,
}: {
  count: number
  variant?: AdminBadgeVariant
  className?: string
}) {
  const colorClass = variant === 'custom' ? '' : VARIANT_CLASSES[variant]
  return (
    <span className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-[10px] font-bold rounded-full border ${colorClass} ${className ?? ''}`}>
      {count > 999 ? '999+' : count}
    </span>
  )
}
