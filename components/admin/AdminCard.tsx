import React from 'react'

/**
 * AdminCard — Container padrão das seções do admin.
 *
 * Compound component com Header, Body e Footer.
 *
 * Uso:
 *   <AdminCard>
 *     <AdminCard.Header title="Notícias" actions={<AdminButton>Nova</AdminButton>} />
 *     <AdminCard.Body>conteúdo</AdminCard.Body>
 *     <AdminCard.Footer>paginação</AdminCard.Footer>
 *   </AdminCard>
 *
 * Ou sem subdivisão:
 *   <AdminCard className="p-5">conteúdo direto</AdminCard>
 */

// ─── Root ─────────────────────────────────────────────────────────────────────

function Root({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`bg-surface border border-border rounded-xl overflow-hidden ${className ?? ''}`}>
      {children}
    </div>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div className={`flex items-center justify-between gap-4 px-5 py-4 border-b border-border ${className ?? ''}`}>
      <div className="min-w-0">
        {title && <h2 className="text-sm font-semibold text-foreground">{title}</h2>}
        {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  )
}

// ─── Body ─────────────────────────────────────────────────────────────────────

function Body({
  children,
  className,
  noPadding,
}: {
  children: React.ReactNode
  className?: string
  noPadding?: boolean
}) {
  return (
    <div className={`${noPadding ? '' : 'p-5'} ${className ?? ''}`}>
      {children}
    </div>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`px-5 py-3 border-t border-border ${className ?? ''}`}>
      {children}
    </div>
  )
}

// ─── Section (divisor dentro do card) ─────────────────────────────────────────

function Section({
  children,
  className,
  title,
}: {
  children: React.ReactNode
  className?: string
  title?: string
}) {
  return (
    <div className={`border-t border-border ${className ?? ''}`}>
      {title && (
        <div className="px-5 py-2.5 bg-background/50">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{title}</span>
        </div>
      )}
      {children}
    </div>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export const AdminCard = Object.assign(Root, { Header, Body, Footer, Section })
