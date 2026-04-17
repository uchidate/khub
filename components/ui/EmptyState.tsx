import React from 'react'

interface EmptyStateAction {
    label: string
    onClick?: () => void
    href?: string
}

interface EmptyStateProps {
    icon?: React.ReactNode
    title: string
    description?: string
    action?: EmptyStateAction
    bordered?: boolean
    className?: string
}

export function EmptyState({ icon, title, description, action, bordered = false, className = '' }: EmptyStateProps) {
    const wrapClass = bordered
        ? 'text-center py-20 border border-border rounded-2xl'
        : 'text-center py-20'

    return (
        <div className={`${wrapClass} ${className}`}>
            {icon && (
                <div className="flex justify-center mb-4 text-border">
                    {icon}
                </div>
            )}
            <p className="text-foreground font-bold text-lg mb-1">{title}</p>
            {description && (
                <p className="text-muted text-sm mb-4">{description}</p>
            )}
            {action && (
                action.href ? (
                    <a href={action.href} className="text-xs text-accent hover:text-accent/70 transition-colors">
                        {action.label}
                    </a>
                ) : (
                    <button onClick={action.onClick} className="text-xs text-accent hover:text-accent/70 transition-colors">
                        {action.label}
                    </button>
                )
            )}
        </div>
    )
}
