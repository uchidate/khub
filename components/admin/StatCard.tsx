interface StatCardProps {
    label: string
    value?: number | string
    color?: string
    icon?: React.ReactNode
    sub?: string
    onClick?: () => void
    active?: boolean
    className?: string
}

export function StatCard({ label, value, color = 'text-foreground', icon, sub, onClick, active, className = '' }: StatCardProps) {
    const formatted =
        value === undefined || value === null
            ? '—'
            : typeof value === 'number'
            ? value.toLocaleString('pt-BR')
            : value

    const base = `bg-surface border rounded-xl p-4 transition-colors ${className}`
    const activeState = active
        ? 'border-accent/40 bg-accent/5'
        : 'border-border'

    // Icon variant — horizontal layout
    if (icon) {
        const Wrapper = onClick ? 'button' : 'div'
        return (
            <Wrapper
                {...(onClick ? { onClick } : {})}
                className={`${base} ${onClick ? activeState + ' cursor-pointer hover:border-border' : 'border-border'} flex items-center gap-3`}
            >
                <div className={`p-2 rounded-lg bg-surface-hover shrink-0 ${color}`}>{icon}</div>
                <div className="min-w-0">
                    <div className={`text-xl font-bold tabular-nums ${color}`}>{formatted}</div>
                    <div className="text-xs text-muted">{label}</div>
                    {sub && <div className="text-[11px] text-muted/70 mt-0.5">{sub}</div>}
                </div>
            </Wrapper>
        )
    }

    // Default / button variant — centered
    if (onClick) {
        return (
            <button onClick={onClick} className={`${base} ${activeState} cursor-pointer text-center`}>
                <div className={`text-2xl font-black tabular-nums ${color}`}>{formatted}</div>
                <div className="text-xs text-muted font-semibold mt-0.5">{label}</div>
                {sub && <div className="text-[11px] text-muted/70 mt-0.5">{sub}</div>}
            </button>
        )
    }

    return (
        <div className={`${base} border-border text-center`}>
            <div className={`text-2xl font-black tabular-nums ${color}`}>{formatted}</div>
            <div className="text-xs text-muted font-bold uppercase tracking-wider mt-0.5">{label}</div>
            {sub && <div className="text-[11px] text-muted/70 mt-0.5">{sub}</div>}
        </div>
    )
}
