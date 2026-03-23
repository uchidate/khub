interface BulkActionBarProps {
  count: number
  children: React.ReactNode
  onClear?: () => void
  className?: string
}

/**
 * BulkActionBar
 *
 * Contextual bar shown when items are selected in a list.
 * Uses accent tokens instead of raw purple.
 *
 * @example
 * {selected.size > 0 && (
 *   <BulkActionBar count={selected.size} onClear={clear}>
 *     <AdminButton variant="danger" size="sm" onClick={handleDelete}>Excluir</AdminButton>
 *   </BulkActionBar>
 * )}
 */
export function BulkActionBar({ count, children, onClear, className = '' }: BulkActionBarProps) {
  return (
    <div className={`flex items-center gap-3 flex-wrap px-4 py-2.5 bg-accent/8 border border-accent/20 rounded-xl ${className}`}>
      <span className="text-sm font-bold text-accent">
        {count} selecionado{count !== 1 ? 's' : ''}
      </span>
      <div className="flex gap-2 ml-auto flex-wrap items-center">
        {children}
        {onClear && (
          <button
            onClick={onClear}
            className="text-xs text-muted hover:text-foreground transition-colors px-2 py-1"
          >
            Limpar
          </button>
        )}
      </div>
    </div>
  )
}
