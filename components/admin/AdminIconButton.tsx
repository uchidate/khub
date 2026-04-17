'use client'

import React from 'react'
import Link from 'next/link'

/**
 * AdminIconButton — Botão de ação com ícone, sem label visível.
 *
 * Uso:
 *   <AdminIconButton onClick={handleEdit} title="Editar">
 *     <Pencil size={14} />
 *   </AdminIconButton>
 *
 *   <AdminIconButton variant="danger" onClick={handleDelete} title="Remover">
 *     <Trash size={14} />
 *   </AdminIconButton>
 *
 *   <AdminIconButton href="/admin/artists/123" title="Ver artista">
 *     <ExternalLink size={14} />
 *   </AdminIconButton>
 */

export type AdminIconButtonVariant = 'default' | 'danger' | 'warning' | 'success' | 'accent'
export type AdminIconButtonSize = 'sm' | 'md' | 'lg'

const VARIANT: Record<AdminIconButtonVariant, string> = {
  default: 'text-muted hover:text-foreground hover:bg-surface-hover',
  danger:  'text-muted hover:text-red-500 hover:bg-red-500/10',
  warning: 'text-muted hover:text-amber-500 hover:bg-amber-500/10',
  success: 'text-muted hover:text-emerald-500 hover:bg-emerald-500/10',
  accent:  'text-muted hover:text-accent hover:bg-accent/10',
}

const SIZE: Record<AdminIconButtonSize, string> = {
  sm: 'p-1 rounded',
  md: 'p-1.5 rounded',
  lg: 'p-2 rounded-lg',
}

function base(variant: AdminIconButtonVariant, size: AdminIconButtonSize) {
  return `inline-flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${VARIANT[variant]} ${SIZE[size]}`
}

// ─── Button ──────────────────────────────────────────────────────────────────

interface AdminIconButtonProps {
  variant?: AdminIconButtonVariant
  size?: AdminIconButtonSize
  children: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  title?: string
  type?: 'button' | 'submit'
  className?: string
}

export function AdminIconButton({
  variant = 'default',
  size = 'md',
  children,
  onClick,
  disabled,
  title,
  type = 'button',
  className,
}: AdminIconButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${base(variant, size)} ${className ?? ''}`}
    >
      {children}
    </button>
  )
}

// ─── Link ─────────────────────────────────────────────────────────────────────

interface AdminIconLinkProps {
  variant?: AdminIconButtonVariant
  size?: AdminIconButtonSize
  children: React.ReactNode
  href: string
  target?: string
  title?: string
  className?: string
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}

export function AdminIconLink({
  variant = 'default',
  size = 'md',
  children,
  href,
  target,
  title,
  className,
  onClick,
}: AdminIconLinkProps) {
  return (
    <Link
      href={href}
      target={target}
      title={title}
      onClick={onClick}
      className={`${base(variant, size)} ${className ?? ''}`}
    >
      {children}
    </Link>
  )
}
