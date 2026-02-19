'use client'

import { useEffect, useState } from 'react'
import { Cake } from 'lucide-react'

interface Props {
    date: string       // ISO date string (debut date or birthday)
    label?: string     // ex: "aniversário" ou "aniversário de debut"
    groupName?: string // used in tooltip only (optional)
    /** @deprecated use date instead */
    debutDate?: string
    /** @deprecated use label instead */
    groupName_old?: string
}

export function AnniversaryCountdown({ date, debutDate, label = 'aniversário', groupName }: Props) {
    // Support legacy prop
    const targetDate = date ?? debutDate
    const [info, setInfo] = useState<{ daysUntil: number; yearsCompleting: number; isToday: boolean } | null>(null)

    useEffect(() => {
        if (!targetDate) return
        const d = new Date(targetDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const thisYear = today.getFullYear()
        const yearsCompleting = thisYear - d.getFullYear() + (
            // If anniversary already passed this year, count next year
            new Date(thisYear, d.getMonth(), d.getDate()) < today ? 1 : 0
        )

        const nextAnniv = new Date(thisYear, d.getMonth(), d.getDate())
        if (nextAnniv < today) nextAnniv.setFullYear(thisYear + 1)

        const isToday = nextAnniv.getTime() === today.getTime()
        const daysUntil = Math.round((nextAnniv.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        setInfo({ daysUntil, yearsCompleting, isToday })
    }, [targetDate])

    if (!info) return null

    const { daysUntil, yearsCompleting, isToday } = info

    if (isToday) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-400 text-xs font-black" title={groupName}>
                <Cake className="w-3.5 h-3.5" />
                {yearsCompleting} {yearsCompleting === 1 ? 'ano' : 'anos'} — Hoje!
            </div>
        )
    }

    const dayLabel = daysUntil === 1 ? 'amanhã' : daysUntil <= 30 ? `em ${daysUntil} dias` : null
    if (!dayLabel) return null

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-bold" title={groupName}>
            <Cake className="w-3.5 h-3.5" />
            {label} {dayLabel}
        </div>
    )
}
