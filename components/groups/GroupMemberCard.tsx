'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { nameToGradient } from '@/lib/utils'
import { getRoleLabel } from '@/lib/utils/role-labels'

function toRgba(hex: string, alpha: number) {
    const h = hex.replace('#', '')
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return `rgba(${r},${g},${b},${alpha})`
}

function getZodiac(date: Date): { sign: string; emoji: string } {
    const m = date.getUTCMonth() + 1
    const d = date.getUTCDate()
    if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return { sign: 'Áries', emoji: '♈' }
    if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return { sign: 'Touro', emoji: '♉' }
    if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return { sign: 'Gêmeos', emoji: '♊' }
    if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return { sign: 'Câncer', emoji: '♋' }
    if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return { sign: 'Leão', emoji: '♌' }
    if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return { sign: 'Virgem', emoji: '♍' }
    if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return { sign: 'Libra', emoji: '♎' }
    if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return { sign: 'Escorpião', emoji: '♏' }
    if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return { sign: 'Sagitário', emoji: '♐' }
    if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return { sign: 'Capricórnio', emoji: '♑' }
    if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) return { sign: 'Aquário', emoji: '♒' }
    return { sign: 'Peixes', emoji: '♓' }
}

function getNationalityFlag(nationality: string | null, birthName: string | null): string {
    if (!nationality && !birthName) return '🇰🇷'
    const n = (nationality ?? '').toLowerCase()
    const b = birthName ?? ''
    if (n.includes('thai') || n.includes('tailand') || /[฀-๿]/.test(b)) return '🇹🇭'
    if (n.includes('chinese') || n.includes('china')) return '🇨🇳'
    if (n.includes('japan')) return '🇯🇵'
    if (n.includes('australian') || n.includes('austrália')) return '🇦🇺'
    if (n.includes('new zealand') || n.includes('nova zelândia')) return '🇳🇿'
    return '🇰🇷'
}

interface MemberCardProps {
    member: {
        id: string
        role: string | null
        joinDate: Date | null
        leaveDate: Date | null
        artist: {
            id: string
            slug?: string | null
            nameRomanized: string
            nameHangul: string | null
            primaryImageUrl: string | null
            roles: string[]
            gender?: number | null
            birthDate?: Date | null
            height?: string | null
            birthName?: string | null
            nationality?: string | null
        }
    }
    faded?: boolean
    accent?: string
    isLeader?: boolean
}

export function GroupMemberCard({ member, faded = false, accent = '#9333ea', isLeader }: MemberCardProps) {
    const [hovered, setHovered] = useState(false)
    const { artist } = member
    const zodiac = artist.birthDate ? getZodiac(new Date(artist.birthDate)) : null
    const flag = getNationalityFlag(artist.nationality ?? null, artist.birthName ?? null)
    const MUSIC_ROLES = ['CANTOR', 'CANTORA', 'IDOL', 'RAPPER', 'VOCALIST', 'DANCER', 'DANÇARINO', 'DANÇARINA', 'COMPOSITOR', 'COMPOSITORA']
    const allRoles = artist.roles ?? []
    const musicRoles = allRoles.filter(r => MUSIC_ROLES.includes(r.toUpperCase()))
    const displayRoles = (musicRoles.length > 0 ? musicRoles : allRoles).slice(0, 2)
    const soloRoles = displayRoles.map(r => getRoleLabel(r, artist.gender))
    const age = artist.birthDate
        ? Math.floor((Date.now() - new Date(artist.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
        : null

    return (
        <Link
            href={`/artists/${artist.slug ?? artist.id}`}
            className={`group block ${faded ? 'opacity-50 hover:opacity-90 transition-opacity' : ''}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Foto */}
            <div className="member-card-border relative mb-3 aspect-[3/4] overflow-hidden border border-border bg-surface transition-all duration-300"
                style={isLeader ? { borderColor: toRgba(accent, 0.5) } : undefined}>
                {artist.primaryImageUrl ? (
                    <Image
                        src={artist.primaryImageUrl}
                        alt={artist.nameRomanized}
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center"
                        style={{ background: nameToGradient(artist.nameRomanized) }}>
                        <span className="text-4xl font-black text-white/80 drop-shadow select-none">
                            {artist.nameRomanized[0]}
                        </span>
                    </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-70 group-hover:opacity-95 transition-opacity" />

                {/* Flags + zodiac — topo esquerdo */}
                <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span className="text-base leading-none drop-shadow">{flag}</span>
                    {zodiac && (
                        <span className="text-sm leading-none drop-shadow" title={zodiac.sign}>{zodiac.emoji}</span>
                    )}
                </div>

                {/* Líder badge */}
                {isLeader && (
                    <div className="absolute top-2 right-2">
                        <span className="px-1.5 py-0.5 font-mono text-[8px] font-black uppercase tracking-[0.1em] text-white"
                            style={{ background: toRgba(accent, 0.9) }}>LÍDER</span>
                    </div>
                )}

                {/* Role badge */}
                {member.role && (
                    <div className="absolute bottom-2 left-2 right-2">
                        <span className="group-accent-badge px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-[0.08em] text-white/80 transition-colors group-hover:text-white">
                            {member.role.replace(/,?\s*l[íi]der/i, '').trim() || member.role}
                        </span>
                    </div>
                )}

                {/* Hover overlay: detalhes extras */}
                <div className={`absolute inset-0 flex flex-col justify-end p-3 transition-all duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`}
                    style={{ background: `linear-gradient(to top, ${toRgba(accent, 0.85)} 0%, ${toRgba(accent, 0.4)} 50%, transparent 100%)` }}>
                    <div className="space-y-1 mt-auto">
                        {age && (
                            <p className="font-mono text-[10px] text-white/90 font-bold">
                                {age} anos
                                {artist.height ? ` · ${artist.height.replace('cm', '').trim()} cm` : ''}
                            </p>
                        )}
                        {zodiac && (
                            <p className="font-mono text-[10px] text-white/80">
                                {zodiac.emoji} {zodiac.sign}
                            </p>
                        )}
                        {artist.birthDate && (
                            <p className="font-mono text-[9px] text-white/70">
                                {new Date(artist.birthDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Info abaixo da foto */}
            <div>
                <h3 className="font-bold text-foreground text-sm leading-tight group-hover:text-accent transition-colors">
                    {artist.nameRomanized}
                </h3>
                {artist.nameHangul && (
                    <p className="text-[11px] text-muted mt-0.5">{artist.nameHangul}</p>
                )}
                {soloRoles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                        {soloRoles.map(r => (
                            <span key={r} className="px-1.5 py-0.5 border border-border text-[9px] font-bold uppercase tracking-wider text-muted bg-surface">
                                {r}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </Link>
    )
}
