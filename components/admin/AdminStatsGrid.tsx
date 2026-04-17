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
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flashEnabledRef = useRef(false)
  const flashDisableTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [deltas, setDeltas] = useState<Record<StatIconKey, number>>({
    users: 0,
    artists: 0,
    productions: 0,
    news: 0,
    groups: 0,
  })
  const [flashByKey, setFlashByKey] = useState<Record<StatIconKey, 'up' | 'down' | null>>({
    users: null,
    artists: null,
    productions: null,
    news: null,
    groups: null,
  })

  const statsSignature = useMemo(
    () => stats.map(s => `${s.key}:${s.value}`).join('|'),
    [stats]
  )

  useEffect(() => {
    function onRefreshSignal() {
      flashEnabledRef.current = true
      if (flashDisableTimerRef.current) clearTimeout(flashDisableTimerRef.current)
      flashDisableTimerRef.current = setTimeout(() => {
        flashEnabledRef.current = false
      }, 10_000)
    }

    window.addEventListener('admin-dashboard-refresh', onRefreshSignal)
    return () => {
      window.removeEventListener('admin-dashboard-refresh', onRefreshSignal)
      if (flashDisableTimerRef.current) clearTimeout(flashDisableTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const nextDeltas: Record<StatIconKey, number> = {
      users: 0,
      artists: 0,
      productions: 0,
      news: 0,
      groups: 0,
    }
    const nextFlash: Record<StatIconKey, 'up' | 'down' | null> = {
      users: null,
      artists: null,
      productions: null,
      news: null,
      groups: null,
    }

    for (const stat of stats) {
      const prev = prevValuesRef.current.get(stat.key)
      if (prev != null) {
        const diff = stat.value - prev
        nextDeltas[stat.key] = diff
        if (diff > 0) nextFlash[stat.key] = 'up'
        if (diff < 0) nextFlash[stat.key] = 'down'
      }
      prevValuesRef.current.set(stat.key, stat.value)
    }

    setDeltas(nextDeltas)

    const hasFlash = flashEnabledRef.current && Object.values(nextFlash).some(Boolean)
    if (hasFlash) {
      setFlashByKey(nextFlash)
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
      flashTimerRef.current = setTimeout(() => {
        setFlashByKey({ users: null, artists: null, productions: null, news: null, groups: null })
      }, 1200)
    }

    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    }
  }, [stats, statsSignature])

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {stats.map(stat => {
          const Icon = ICON_BY_KEY[stat.key]
          const delta = deltas[stat.key]
          const flash = flashByKey[stat.key]
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className={[
                'bg-surface border border-border rounded-xl p-3 hover:border-border hover:shadow-[0_0_0_1px_rgba(59,130,246,0.12)] transition-all group flex flex-col gap-1',
                flash === 'up' ? 'stat-flash-up' : '',
                flash === 'down' ? 'stat-flash-down' : '',
              ].filter(Boolean).join(' ')}
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

      <style jsx>{`
        @keyframes statFlashUp {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.35); background: rgba(16, 185, 129, 0.06); }
          100% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); background: transparent; }
        }
        @keyframes statFlashDown {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.06); }
          100% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); background: transparent; }
        }
        .stat-flash-up { animation: statFlashUp 1.1s ease-out; }
        .stat-flash-down { animation: statFlashDown 1.1s ease-out; }
      `}</style>
    </>
  )
}
