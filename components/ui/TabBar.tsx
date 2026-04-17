interface TabItem {
    value: string
    label: string
}

interface TabBarProps {
    tabs: TabItem[]
    value: string
    onChange: (value: string) => void
    className?: string
}

export function TabBar({ tabs, value, onChange, className = '' }: TabBarProps) {
    return (
        <div className={`flex border-b border-border ${className}`}>
            {tabs.map(tab => (
                <button
                    key={tab.value}
                    onClick={() => onChange(tab.value)}
                    className={`px-6 py-3 text-sm font-bold transition-all border-b-2 -mb-[2px] ${
                        value === tab.value
                            ? 'border-accent text-foreground'
                            : 'border-transparent text-muted hover:text-foreground'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    )
}
