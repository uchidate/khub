'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Pencil } from 'lucide-react'

interface AdminQuickEditProps {
    href: string
    label?: string
}

export function AdminQuickEdit({ href, label = 'Editar no Admin' }: AdminQuickEditProps) {
    const { data: session } = useSession()

    if (session?.user?.role?.toLowerCase() !== 'admin') return null

    return (
        <Link
            href={href}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-400 hover:bg-amber-500/25 hover:border-amber-500/70 transition-all text-xs font-bold backdrop-blur-sm"
            title={label}
        >
            <Pencil className="w-3 h-3" />
            {label}
        </Link>
    )
}
