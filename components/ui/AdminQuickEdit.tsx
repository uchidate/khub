'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'

interface AdminQuickEditProps {
    href: string
    label?: string
}

export function AdminQuickEdit({ href, label = 'Editar no Admin' }: AdminQuickEditProps) {
    const { data: session } = useSession()
    const router = useRouter()

    if (session?.user?.role?.toLowerCase() !== 'admin') return null

    return (
        <button
            onClick={() => router.push(href)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-border bg-surface text-muted hover:border-foreground hover:text-foreground transition-colors text-xs font-mono font-bold"
            title={label}
            type="button"
        >
            <Pencil className="w-3 h-3" />
            {label}
        </button>
    )
}
