'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { nameToGradient } from '@/lib/utils'

interface PollMember {
    id: string
    slug?: string | null
    nameRomanized: string
    nameHangul: string | null
    primaryImageUrl: string | null
    role?: string | null
}

interface GroupMemberPollProps {
    members: PollMember[]
    accent: string
    groupName: string
}

function toRgba(hex: string, alpha: number) {
    const h = hex.replace('#', '')
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return `rgba(${r},${g},${b},${alpha})`
}

// Seed determinístico para distribuição inicial de votos
function seedVotes(members: PollMember[]): number[] {
    return members.map((m, i) => {
        const seed = m.nameRomanized.charCodeAt(0) + m.nameRomanized.length * 7 + i * 13
        return 80 + (seed % 120)
    })
}

export function GroupMemberPoll({ members, accent, groupName }: GroupMemberPollProps) {
    const storageKey = `poll_${groupName.toLowerCase().replace(/\s+/g, '_')}`
    const [voted, setVoted] = useState<string | null>(null)
    const [votes, setVotes] = useState<number[]>([])
    const [revealed, setRevealed] = useState(false)
    const [animating, setAnimating] = useState(false)

    useEffect(() => {
        setVotes(seedVotes(members))
        const saved = localStorage.getItem(storageKey)
        if (saved) {
            setVoted(saved)
            setRevealed(true)
        }
    }, [members, storageKey])

    if (members.length < 2) return null

    const total = votes.reduce((s, v) => s + v, 0)

    const handleVote = (memberId: string, idx: number) => {
        if (voted) return
        const next = [...votes]
        next[idx] += 1
        setVotes(next)
        setVoted(memberId)
        setAnimating(true)
        localStorage.setItem(storageKey, memberId)
        setTimeout(() => { setRevealed(true); setAnimating(false) }, 150)
    }

    const winner = revealed
        ? members[votes.indexOf(Math.max(...votes))]
        : null

    return (
        <section id="poll" className="border border-border overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-border flex items-center justify-between"
                style={{ background: toRgba(accent, 0.04) }}>
                <div>
                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">Comunidade</p>
                    <h2 className="text-lg font-black tracking-tight text-foreground">
                        Seu membro favorito do {groupName}?
                    </h2>
                </div>
                {revealed && winner && (
                    <div className="text-right hidden sm:block">
                        <p className="font-mono text-[9px] uppercase tracking-widest text-muted">Em destaque</p>
                        <p className="text-sm font-black" style={{ color: accent }}>{winner.nameRomanized}</p>
                    </div>
                )}
            </div>

            {/* Grid de membros */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-x divide-border">
                {members.map((m, i) => {
                    const pct = total > 0 ? Math.round((votes[i] / total) * 100) : 0
                    const isVoted = voted === m.id
                    const isWinner = revealed && winner?.id === m.id

                    return (
                        <button
                            key={m.id}
                            onClick={() => handleVote(m.id, i)}
                            disabled={!!voted}
                            className={`group relative flex flex-col items-center gap-3 p-4 transition-all duration-200 text-left w-full
                                ${!voted ? 'hover:bg-surface cursor-pointer' : 'cursor-default'}
                                ${isWinner ? 'bg-surface/60' : ''}
                            `}
                        >
                            {/* Foto */}
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 overflow-hidden border-2 transition-all duration-300"
                                style={{
                                    borderColor: isVoted ? accent : isWinner ? toRgba(accent, 0.5) : 'transparent',
                                    boxShadow: isVoted ? `0 0 0 2px ${toRgba(accent, 0.3)}` : 'none',
                                }}>
                                {m.primaryImageUrl ? (
                                    <Image
                                        src={m.primaryImageUrl}
                                        alt={m.nameRomanized}
                                        fill
                                        sizes="80px"
                                        className={`object-cover object-top transition-all duration-300 ${!voted && !isVoted ? 'group-hover:scale-105' : ''} ${revealed && !isVoted && !isWinner ? 'opacity-50 grayscale' : ''}`}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white"
                                        style={{ background: nameToGradient(m.nameRomanized) }}>
                                        {m.nameRomanized[0]}
                                    </div>
                                )}
                                {isVoted && (
                                    <div className="absolute inset-0 flex items-center justify-center"
                                        style={{ background: toRgba(accent, 0.3) }}>
                                        <span className="text-white font-black text-xl drop-shadow">✓</span>
                                    </div>
                                )}
                            </div>

                            {/* Nome */}
                            <div className="text-center min-w-0 w-full">
                                <p className={`text-[13px] font-black leading-tight truncate transition-colors
                                    ${isWinner ? '' : revealed && !isVoted ? 'text-muted' : 'text-foreground'}`}
                                    style={isWinner ? { color: accent } : undefined}>
                                    {m.nameRomanized}
                                </p>
                                {m.nameHangul && (
                                    <p className="font-mono text-[10px] text-muted mt-0.5 truncate">{m.nameHangul}</p>
                                )}
                            </div>

                            {/* Barra de resultado */}
                            <div className="w-full">
                                {revealed ? (
                                    <div className="space-y-1">
                                        <div className="h-1.5 overflow-hidden rounded-full bg-border">
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{
                                                    width: animating ? '0%' : `${pct}%`,
                                                    background: isWinner ? accent : toRgba(accent, 0.4),
                                                }}
                                            />
                                        </div>
                                        <p className={`font-mono text-[11px] font-black text-center ${isWinner ? '' : 'text-muted'}`}
                                            style={isWinner ? { color: accent } : undefined}>
                                            {pct}%
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <span className="font-mono text-[10px] font-bold text-accent border border-accent/30 px-2.5 py-0.5 inline-block"
                                            style={{ borderColor: toRgba(accent, 0.4), color: accent }}>
                                            Votar
                                        </span>
                                    </div>
                                )}
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 border-t border-border flex items-center justify-between">
                <p className="font-mono text-[9px] text-muted">
                    {voted ? `${total.toLocaleString('pt-BR')} votos · voto salvo` : 'Clique para votar · resultado instantâneo'}
                </p>
                {revealed && (
                    <p className="font-mono text-[9px]" style={{ color: accent }}>
                        {winner?.nameRomanized} lidera com {total > 0 ? Math.round((Math.max(...votes) / total) * 100) : 0}%
                    </p>
                )}
            </div>
        </section>
    )
}
