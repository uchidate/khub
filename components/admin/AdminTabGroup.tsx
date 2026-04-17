import React from 'react'

interface AdminTab {
    key: string
    label: string
    icon?: React.ReactNode
    badge?: number
}

interface AdminTabGroupProps {
    tabs: AdminTab[]
    active: string
    onChange: (key: string) => void
    /** Tailwind classes for the active button, e.g. 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' */
    activeClass?: string
    className?: string
}

export function AdminTabGroup({
    tabs,
    active,
    onChange,
    activeClass = 'bg-accent text-white',
    className = '',
}: AdminTabGroupProps) {
    return (
        <div className={`flex items-center gap-1 bg-surface border border-border rounded-xl p-1 w-fit flex-wrap ${className}`}>
            {tabs.map(tab => (
                <button
                    key={tab.key}
                    onClick={() => onChange(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        active === tab.key
                            ? activeClass
                            : 'text-muted hover:text-foreground hover:bg-surface-hover'
                    }`}
                >
                    {tab.icon}
                    {tab.label}
                    {tab.badge !== undefined && tab.badge > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                            active === tab.key ? 'bg-white/20' : 'bg-surface-hover text-muted'
                        }`}>
                            {tab.badge}
                        </span>
                    )}
                </button>
            ))}
        </div>
    )
}
