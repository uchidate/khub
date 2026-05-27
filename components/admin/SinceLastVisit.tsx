'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

const LS_KEY = 'admin_last_visit'

interface Delta {
    artists: number
    groups: number
    productions: number
    blogPosts: number
    news: number
    since: string
}

function formatRelative(date: Date): string {
    const diff = Date.now() - date.getTime()
    const min  = Math.floor(diff / 60_000)
    const hr   = Math.floor(diff / 3_600_000)
    const day  = Math.floor(diff / 86_400_000)
    if (min < 2)  return 'menos de 2 min'
    if (hr  < 1)  return `${min} min`
    if (hr  < 24) return `${hr}h`
    if (day === 1) return '1 dia'
    return `${day} dias`
}

const ITEMS: Array<{ key: keyof Omit<Delta, 'since'>; label: string; href: string }> = [
    { key: 'artists',     label: 'artista',    href: '/admin/artists' },
    { key: 'groups',      label: 'grupo',      href: '/admin/groups' },
    { key: 'productions', label: 'produção',   href: '/admin/productions' },
    { key: 'blogPosts',   label: 'post',       href: '/admin/blog' },
    { key: 'news',        label: 'notícia',    href: '/admin/news' },
]

export function SinceLastVisit() {
    const [delta, setDelta] = useState<Delta | null>(null)
    const [lastVisit, setLastVisit] = useState<Date | null>(null)

    useEffect(() => {
        const stored = localStorage.getItem(LS_KEY)
        if (!stored) return
        const date = new Date(stored)
        setLastVisit(date)
        fetch(`/api/admin/since-last-visit?since=${encodeURIComponent(stored)}`)
            .then(r => r.json())
            .then(setDelta)
            .catch(() => {})
    }, [])

    if (!delta || !lastVisit) return null

    const items = ITEMS.filter(i => delta[i.key] > 0)
    if (items.length === 0) return null

    return (
        <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-3.5 h-3.5 text-accent" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted">
                    Desde sua última visita · há {formatRelative(lastVisit)}
                </p>
            </div>
            <div className="flex flex-wrap gap-2">
                {items.map(item => {
                    const n = delta[item.key]
                    const s = n !== 1
                    const label = item.key === 'productions' ? (s ? 'produções' : 'produção')
                        : item.key === 'blogPosts' ? (s ? 'posts' : 'post')
                        : item.key === 'news' ? (s ? 'notícias' : 'notícia')
                        : `${item.label}${s ? 's' : ''}`
                    return (
                        <Link key={item.key} href={item.href}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-accent/10 border border-accent/20 rounded-lg text-xs font-bold text-accent hover:bg-accent/20 transition-colors">
                            <span className="text-sm font-black">+{n}</span>
                            {label}
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
