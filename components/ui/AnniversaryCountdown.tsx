'use client'

import { useEffect, useState } from 'react'
import { Cake } from 'lucide-react'

interface Props {
    debutDate: string // ISO date string
    groupName: string
}

export function AnniversaryCountdown({ debutDate, groupName }: Props) {
    const [info, setInfo] = useState<{ daysUntil: number; yearsCompleting: number; isToday: boolean } | null>(null)

    useEffect(() => {
        const debut = new Date(debutDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const thisYear = today.getFullYear()
        const yearsCompleting = thisYear - debut.getFullYear() + 1

        const nextAnniv = new Date(thisYear, debut.getMonth(), debut.getDate())
        if (nextAnniv < today) {
            nextAnniv.setFullYear(thisYear + 1)
        }

        const isToday = nextAnniv.getTime() === today.getTime()
        const daysUntil = Math.round((nextAnniv.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        setInfo({ daysUntil, yearsCompleting, isToday })
    }, [debutDate])

    if (!info) return null

    const { daysUntil, yearsCompleting, isToday } = info

    if (isToday) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-400 text-xs font-black">
                <Cake className="w-3.5 h-3.5" />
                {yearsCompleting}º Aniversário — Hoje!
            </div>
        )
    }

    const label = daysUntil === 1
        ? 'amanhã'
        : daysUntil <= 30
            ? `em ${daysUntil} dias`
            : null

    if (!label) return null

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-bold" title={`${groupName} completa ${yearsCompleting} anos`}>
            <Cake className="w-3.5 h-3.5" />
            {yearsCompleting}º aniversário {label}
        </div>
    )
}
