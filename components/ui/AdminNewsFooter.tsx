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
                className="group flex items-center justify-between gap-4 px-6 py-5 rounded-2xl bg-[#080808]/60 border border-white/8 hover:border-[#ff2d78]/30 hover:bg-[#080808] transition-all"
            >
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#444] mb-1">Fonte original</p>
                    <p className="text-base font-bold text-[#ccc] group-hover:text-[#ff2d78] transition-colors">{source || hostname}</p>
                    <p className="text-xs text-[#444] mt-0.5">{hostname}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 px-4 py-2 rounded-full border border-white/10 group-hover:border-[#ff2d78]/40 transition-all text-xs font-semibold text-[#999] group-hover:text-[#ff2d78]">
                    Ler original
                    <ExternalLink className="w-3.5 h-3.5" />
                </div>
            </a>
        </footer>
    )
}
