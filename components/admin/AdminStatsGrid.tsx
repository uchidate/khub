'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Film, Mic2, Newspaper, TrendingUp, Users } from 'lucide-react'
import { Sparkline } from '@/components/admin/Sparkline'

type StatIconKey = 'users' | 'artists' | 'productions' | 'news' | 'groups'

interface StatItem {
  key: StatIconKey
  label: string
  value: number
  new: number
  href: string
  sub: string | null
  spark: number[]
  sparkColor: string
}

interface AdminStatsGridProps {
  stats: StatItem[]
}

const ICON_BY_KEY: Record<StatIconKey, React.ElementType> = {
  users: Users,
  artists: Mic2,
  productions: Film,
  news: Newspaper,
  groups: Users,
}

export function AdminStatsGrid({ stats }: AdminStatsGridProps) {
  const prevValuesRef = useRef<Map<StatIconKey, number>>(new Map())
  const [deltas, setDeltas] = useState<Record<StatIconKey, number>>({
    users: 0,
    artists: 0,
    productions: 0,
    news: 0,
    groups: 0,
  })

  const statsSignature = useMemo(
    () => stats.map(s => `${s.key}:${s.value}`).join('|'),
    [stats]
  )

  useEffect(() => {
    const nextDeltas: Record<StatIconKey, number> = {
      users: 0,
      artists: 0,
      productions: 0,
      news: 0,
      groups: 0,
    }

    for (const stat of stats) {
      const prev = prevValuesRef.current.get(stat.key)
      if (prev != null) nextDeltas[stat.key] = stat.value - prev
      prevValuesRef.current.set(stat.key, stat.value)
    }

    setDeltas(nextDeltas)
  }, [stats, statsSignature])

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
      {stats.map(stat => {
        const Icon = ICON_BY_KEY[stat.key]
        const delta = deltas[stat.key]
        return (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-surface border border-border rounded-xl p-3 hover:border-border hover:shadow-[0_0_0_1px_rgba(59,130,246,0.12)] transition-all group flex flex-col gap-1"
          >
            <div className="flex items-center justify-between">
              <Icon className="w-3.5 h-3.5 text-muted group-hover:text-muted transition-colors" />
              <div className="flex items-center gap-1">
                {stat.new > 0 && (
                  <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full">
                    +{stat.new}
                  </span>
                )}
                {delta !== 0 && (
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                      delta > 0
                        ? 'text-emerald-400 bg-emerald-400/10'
                        : 'text-red-400 bg-red-500/10'
                    }`}
                    title="Mudança desde a última atualização"
                  >
                    {delta > 0 ? `+${delta}` : delta}
                  </span>
                )}
              </div>
            </div>
            <p className="text-xl font-black text-foreground tabular-nums mt-0.5">{stat.value.toLocaleString('pt-BR')}</p>
            <div className="flex items-end justify-between mt-auto pt-1">
              <div>
                <p className="text-[11px] text-muted font-medium">{stat.label}</p>
                {stat.sub && (
                  <p className="text-[9px] text-muted flex items-center gap-0.5 mt-0.5">
                    <TrendingUp className="w-2.5 h-2.5" />{stat.sub}
                  </p>
                )}
              </div>
              <Sparkline data={stat.spark} color={stat.sparkColor} width={44} height={18} className="opacity-80 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        )
      })}
    </div>
  )
}
