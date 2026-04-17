import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

/**
 * PageHeader
 *
 * Componente opcional para páginas que precisam de cabeçalhos mais ricos
 * do que o título simples do AdminLayout.
 *
 * Uso:
 *   <AdminLayout title="Artista: Lisa" actions={<PageHeader.Actions>...</PageHeader.Actions>}>
 *     ...
 *   </AdminLayout>
 *
 * Ou standalone dentro do conteúdo da página (não substitui o title do AdminLayout):
 *   <PageHeader
 *     title="Lisa"
 *     subtitle="Artista · BLACKPINK · Visível"
 *     backHref="/admin/artists"
 *     backLabel="Artistas"
 *   />
 */

interface PageHeaderProps {
  title: string
  subtitle?: React.ReactNode
  backHref?: string
  backLabel?: string
  badge?: React.ReactNode
  children?: React.ReactNode // actions / buttons
}

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel,
  badge,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2 mb-6">
      {/* Back link */}
      {backHref && (
        <Link
          href={backHref}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground w-fit transition-colors"
        >
          <ArrowLeft size={13} />
          {backLabel ?? 'Voltar'}
        </Link>
      )}

      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl lg:text-3xl font-black text-foreground leading-tight">{title}</h1>
            {badge}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
          )}
        </div>

        {children && (
          <div className="flex items-center gap-2 flex-shrink-0 mt-1">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

/** Slot para botões de ação — usado dentro de AdminLayout.actions */
PageHeader.Actions = function Actions({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2">{children}</div>
}

/** Badge de status para usar no título */
PageHeader.Badge = function Badge({
  label,
  variant = 'default',
}: {
  label: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'accent'
}) {
  const styles = {
    default: 'bg-surface text-muted border-border',
    success: 'bg-green-900/40 text-green-400 border-green-700/30',
    warning: 'bg-yellow-900/40 text-yellow-400 border-yellow-700/30',
    danger: 'bg-red-900/40 text-red-400 border-red-700/30',
    accent: 'bg-accent/10 text-accent border-accent/30',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles[variant]}`}>
      {label}
    </span>
  )
}
