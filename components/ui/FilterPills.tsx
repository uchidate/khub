interface FilterOption {
    value: string
    label: string
}

interface FilterPillsProps {
    options: FilterOption[]
    value: string
    onChange: (value: string) => void
    className?: string
}

export function FilterPills({ options, value, onChange, className = '' }: FilterPillsProps) {
    return (
        <div className={`flex flex-wrap gap-1 p-1 bg-surface border border-border rounded-xl ${className}`}>
            {options.map(opt => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all flex-shrink-0 ${
                        value === opt.value ? 'bg-accent text-white' : 'text-muted hover:text-foreground'
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    )
}
