'use client'

import React, { useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * AdminModalOverlay — Container modal padronizado para o admin.
 *
 * Fornece o overlay escuro, container centralizado, header e body.
 * Para confirmações destrutivas, use ConfirmDialog.
 * Para formulários genéricos, use FormModal.
 * Para modais custom, use AdminModalOverlay.
 *
 * Uso:
 *   <AdminModalOverlay
 *     open={isOpen}
 *     onClose={() => setIsOpen(false)}
 *     title="Mesclar Tags"
 *     maxWidth="md"
 *   >
 *     <p>Conteúdo do modal...</p>
 *     <div className="flex gap-2 mt-4 pt-4 border-t border-border">
 *       <AdminButton onClick={() => setIsOpen(false)}>Cancelar</AdminButton>
 *       <AdminButton variant="primary" onClick={handleSubmit}>Confirmar</AdminButton>
 *     </div>
 *   </AdminModalOverlay>
 */

const MAX_WIDTH = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
}

interface AdminModalOverlayProps {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  /** Ícone decorativo no header */
  icon?: React.ReactNode
  maxWidth?: keyof typeof MAX_WIDTH
  /** Mostra botão X no header */
  showClose?: boolean
  /** z-index do overlay */
  zIndex?: number
  children: React.ReactNode
  className?: string
}

export function AdminModalOverlay({
  open,
  onClose,
  title,
  subtitle,
  icon,
  maxWidth = 'md',
  showClose = true,
  zIndex = 50,
  children,
  className,
}: AdminModalOverlayProps) {
  // Fecha com Esc
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Trava scroll do body
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      style={{ zIndex }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${MAX_WIDTH[maxWidth]} bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden ${className ?? ''}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            {icon && (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-hover flex-shrink-0 text-muted" aria-hidden="true">
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {title && <h2 className="text-sm font-bold text-foreground">{title}</h2>}
              {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
            </div>
            {showClose && (
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="p-1.5 rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors flex-shrink-0"
              >
                <X size={15} aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  )
}
