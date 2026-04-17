interface SectionHeaderProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

/**
 * SectionHeader
 *
 * Consistent heading for content sections within a page.
 * Replaces raw <h2> tags with varying class combinations.
 *
 * @example
 * <SectionHeader icon={<Music2 size={14} />} title="Top Artistas" />
 * <SectionHeader title="Configurações" subtitle="3 itens" actions={<AdminButton>Editar</AdminButton>} />
 */
export function SectionHeader({ title, subtitle, icon, actions, className = '' }: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between gap-3 mb-4 ${className}`}>
      <div className="flex items-center gap-2 min-w-0">
        {icon && (
          <span className="text-muted shrink-0">{icon}</span>
        )}
        <div className="min-w-0">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted leading-none">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[11px] text-muted/60 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  )
}
