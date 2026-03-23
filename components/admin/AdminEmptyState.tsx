import React from 'react'
import { SearchX } from 'lucide-react'

/**
 * AdminEmptyState — Estado vazio padronizado para listas e tabelas do admin.
 *
 * Uso:
 *   <AdminEmptyState title="Nenhuma tag encontrada" />
 *
 *   <AdminEmptyState
 *     icon={<Tag className="w-8 h-8" />}
 *     title="Nenhuma tag encontrada"
 *     description="Tente ajustar os filtros ou criar uma nova tag."
 *     action={<AdminButton variant="primary" onClick={...}>Nova Tag</AdminButton>}
 *   />
 *
 *   // Compacto (dentro de cards)
 *   <AdminEmptyState size="sm" title="Sem resultados" />
 */

interface AdminEmptyStateProps {
  /** Ícone opcional. Padrão: SearchX */
  icon?: React.ReactNode
  /** Texto principal */
  title: string
  /** Texto secundário */
  description?: string
  /** Botão ou link de ação */
  action?: React.ReactNode
  /** Tamanho do padding vertical */
  size?: 'sm' | 'md' | 'lg'
  /** Borda tracejada (destaque visual) */
  bordered?: boolean
  className?: string
}

const SIZE_CLASSES = {
  sm: 'py-8',
  md: 'py-14',
  lg: 'py-20',
}

export function AdminEmptyState({
  icon,
  title,
  description,
  action,
  size = 'md',
  bordered = false,
  className,
}: AdminEmptyStateProps) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center
        ${SIZE_CLASSES[size]}
        ${bordered ? 'border border-dashed border-border rounded-xl' : ''}
        ${className ?? ''}
      `}
    >
      <div className="text-muted/40 mb-3">
        {icon ?? <SearchX className="w-8 h-8" />}
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted mt-1 max-w-xs">{description}</p>
      )}
      {action && (
        <div className="mt-4">{action}</div>
      )}
    </div>
  )
}
