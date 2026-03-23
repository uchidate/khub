import React from 'react'

/**
 * AdminTableRow — Linha de lista/tabela padronizada do admin.
 *
 * Suporta:
 * - Barra de fundo proporcional (ex: uso de uma tag)
 * - Ações que aparecem no hover (desktop) ou sempre (mobile)
 * - Destaque de seleção
 *
 * Uso:
 *   <AdminTableRow
 *     backgroundBar={{ width: 75, color: 'bg-purple-500/5' }}
 *     actions={
 *       <>
 *         <AdminIconButton onClick={handleEdit} title="Editar"><Pencil size={14} /></AdminIconButton>
 *         <AdminIconButton variant="danger" onClick={handleDelete} title="Remover"><Trash size={14} /></AdminIconButton>
 *       </>
 *     }
 *   >
 *     <span>Conteúdo da linha</span>
 *   </AdminTableRow>
 */

interface AdminTableRowProps {
  /** Barra de fundo proporcional (ex: contagem relativa) */
  backgroundBar?: {
    /** 0–100 */
    width: number
    color?: string
  }
  /** Ações reveladas no hover (ficam invisíveis em desktop, sempre visíveis em mobile) */
  actions?: React.ReactNode
  /** Destaque ativo (ex: item selecionado) */
  selected?: boolean
  /** Callback ao clicar na linha */
  onClick?: () => void
  className?: string
  children: React.ReactNode
}

export function AdminTableRow({
  backgroundBar,
  actions,
  selected,
  onClick,
  className,
  children,
}: AdminTableRowProps) {
  return (
    <div
      onClick={onClick}
      className={`
        relative group
        flex items-center gap-3 px-4 py-3
        border-b border-border last:border-0
        transition-colors
        ${onClick ? 'cursor-pointer' : ''}
        ${selected ? 'bg-accent/5' : 'hover:bg-surface-hover'}
        ${className ?? ''}
      `}
    >
      {/* Background bar (uso/proporção) */}
      {backgroundBar && (
        <div
          className={`absolute left-0 top-0 bottom-0 pointer-events-none transition-all duration-500 ${backgroundBar.color ?? 'bg-accent/5'}`}
          style={{ width: `${Math.min(100, backgroundBar.width)}%` }}
        />
      )}

      {/* Conteúdo */}
      <div className="relative flex-1 min-w-0">
        {children}
      </div>

      {/* Ações — ocultas em desktop, visíveis no hover ou sempre em mobile */}
      {actions && (
        <div className="relative flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity sm:flex">
          {actions}
        </div>
      )}
    </div>
  )
}
