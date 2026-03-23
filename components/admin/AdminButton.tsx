'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

/**
 * AdminButton / AdminLinkButton
 *
 * Componente padronizado para botões de ação no admin.
 *
 * Variantes:
 *   primary   — CTA principal: gradient purple→pink
 *   secondary — Ação secundária: surface + borda + hover neutro
 *   danger    — Ação destrutiva: vermelho semântico
 *   warning   — Ação de atenção: âmbar semântico
 *   ghost     — Ação de baixo contraste: sem borda, apenas hover de fundo
 *
 * Tamanhos: sm | md | lg
 *
 * Uso:
 *   <AdminButton variant="primary" onClick={...}>Nova notícia</AdminButton>
 *   <AdminButton variant="secondary" loading={saving}>Salvar</AdminButton>
 *   <AdminLinkButton href="/admin/news/import" variant="secondary">Importar</AdminLinkButton>
 *   <AdminButton variant="danger" size="sm">Remover</AdminButton>
 */

export type AdminButtonVariant = 'primary' | 'secondary' | 'danger' | 'warning' | 'ghost'
export type AdminButtonSize = 'sm' | 'md' | 'lg'

const VARIANT: Record<AdminButtonVariant, string> = {
  primary:   'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:from-purple-500 hover:to-pink-500',
  secondary: 'bg-surface border border-border text-foreground hover:bg-surface-hover',
  danger:    'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/20',
  warning:   'bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20',
  ghost:     'text-muted hover:text-foreground hover:bg-surface-hover',
}

const SIZE: Record<AdminButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
}

function base(variant: AdminButtonVariant, size: AdminButtonSize) {
  return `inline-flex items-center gap-1.5 font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${VARIANT[variant]} ${SIZE[size]}`
}

// ─── Button ──────────────────────────────────────────────────────────────────

interface AdminButtonProps {
  variant?: AdminButtonVariant
  size?: AdminButtonSize
  loading?: boolean
  disabled?: boolean
  className?: string
  children: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  type?: 'button' | 'submit' | 'reset'
  title?: string
}

export function AdminButton({
  variant = 'secondary',
  size = 'md',
  loading,
  disabled,
  className,
  children,
  onClick,
  type = 'button',
  title,
}: AdminButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className={`${base(variant, size)} ${className ?? ''}`}
    >
      {loading && <Loader2 size={14} className="animate-spin shrink-0" />}
      {children}
    </button>
  )
}

// ─── Link que parece botão ────────────────────────────────────────────────────

interface AdminLinkButtonProps {
  variant?: AdminButtonVariant
  size?: AdminButtonSize
  loading?: boolean
  disabled?: boolean
  className?: string
  children: React.ReactNode
  href: string
  target?: string
  title?: string
}

export function AdminLinkButton({
  variant = 'secondary',
  size = 'md',
  loading,
  disabled,
  className,
  children,
  href,
  target,
  title,
}: AdminLinkButtonProps) {
  return (
    <Link
      href={href}
      target={target}
      title={title}
      className={`${base(variant, size)} ${disabled ? 'opacity-40 pointer-events-none' : ''} ${className ?? ''}`}
    >
      {loading && <Loader2 size={14} className="animate-spin shrink-0" />}
      {children}
    </Link>
  )
}
