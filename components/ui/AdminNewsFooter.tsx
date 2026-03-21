'use client'

import { useSession } from 'next-auth/react'
import { ExternalLink } from 'lucide-react'

interface AdminNewsFooterProps {
    sourceUrl: string
    source: string | null
}

export function AdminNewsFooter({ sourceUrl, source }: AdminNewsFooterProps) {
    const { data: session } = useSession()
    if (session?.user?.role?.toLowerCase() !== 'admin') return null

    let hostname = sourceUrl
    try { hostname = new URL(sourceUrl).hostname.replace(/^www\./, '') } catch { /* keep raw */ }

    return (
        <footer className="mt-12">
            <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-4 px-6 py-5 rounded-2xl bg-zinc-900/60 border border-white/8 hover:border-purple-500/30 hover:bg-zinc-900 transition-all"
            >
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Fonte original</p>
                    <p className="text-base font-bold text-zinc-200 group-hover:text-purple-300 transition-colors">{source || hostname}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">{hostname}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 px-4 py-2 rounded-full border border-white/10 group-hover:border-purple-500/40 transition-all text-xs font-semibold text-zinc-400 group-hover:text-purple-300">
                    Ler original
                    <ExternalLink className="w-3.5 h-3.5" />
                </div>
            </a>
        </footer>
    )
}
