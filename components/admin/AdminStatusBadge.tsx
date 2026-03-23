import React from 'react'

interface AdminStatusBadgeProps {
    label: string
    /** Full Tailwind class string, e.g. 'bg-green-500/20 text-green-400 border-green-500/20' */
    color: string
    icon?: React.ReactNode
    /** 'default' = rounded, 'pill' = rounded-full */
    variant?: 'default' | 'pill'
    className?: string
}

export function AdminStatusBadge({ label, color, icon, variant = 'default', className = '' }: AdminStatusBadgeProps) {
    const rounded = variant === 'pill' ? 'rounded-full' : 'rounded'
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${rounded} text-xs font-bold border border-transparent ${color} ${className}`}>
            {icon}
            {label}
        </span>
    )
}
