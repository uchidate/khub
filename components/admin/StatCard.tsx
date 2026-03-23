interface StatCardProps {
    label: string
    value: number
    color: string // e.g. 'text-green-400'
    onClick?: () => void
    active?: boolean
}

export function StatCard({ label, value, color, onClick, active }: StatCardProps) {
    const base = 'bg-surface border rounded-xl p-3 text-center transition-colors'
    const stateClass = active
        ? 'border-purple-500/50 bg-purple-500/5'
        : 'border-border hover:border-border'

    if (onClick) {
        return (
            <button onClick={onClick} className={`${base} ${stateClass} cursor-pointer`}>
                <div className={`text-2xl font-bold ${color}`}>{value.toLocaleString('pt-BR')}</div>
                <div className="text-xs text-muted mt-0.5">{label}</div>
            </button>
        )
    }

    return (
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
            <div className={`text-2xl font-black ${color}`}>{value.toLocaleString('pt-BR')}</div>
            <div className="text-xs text-muted font-bold uppercase tracking-wider mt-0.5">{label}</div>
        </div>
    )
}
