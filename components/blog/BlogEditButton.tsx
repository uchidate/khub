'use client'

import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { useSession } from 'next-auth/react'

export function BlogEditButton({ postId }: { postId: string }) {
    const { data: session } = useSession()
    const role = session?.user?.role?.toLowerCase()
    if (role !== 'admin' && role !== 'editor') return null

    return (
        <Link
            href={`/write?edit=${postId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#ff2d78]/10 text-[#ff2d78] hover:bg-[#ff2d78]/20 transition-colors"
        >
            <Pencil size={12} />
            Editar
        </Link>
    )
}
