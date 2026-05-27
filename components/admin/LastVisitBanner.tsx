'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

const LS_KEY = 'admin_last_visit'

function formatRelative(date: Date): string {
    const diff = Date.now() - date.getTime()
    const min  = Math.floor(diff / 60_000)
    const hr   = Math.floor(diff / 3_600_000)
    const day  = Math.floor(diff / 86_400_000)

    if (min < 2)  return 'há menos de 2 minutos'
    if (hr  < 1)  return `há ${min} minutos`
    if (hr  < 24) return `há ${hr} hora${hr > 1 ? 's' : ''}`
    if (day < 7)  return `há ${day} dia${day > 1 ? 's' : ''}`
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function LastVisitBanner() {
    const [lastVisit, setLastVisit] = useState<Date | null>(null)

    useEffect(() => {
        const stored = localStorage.getItem(LS_KEY)
        if (stored) setLastVisit(new Date(stored))
        localStorage.setItem(LS_KEY, new Date().toISOString())
    }, [])

    if (!lastVisit) return null

    return (
        <div className="flex items-center gap-2 text-[11px] text-muted">
            <Clock className="w-3 h-3 shrink-0" />
            <span>Última visita {formatRelative(lastVisit)}</span>
        </div>
    )
}
