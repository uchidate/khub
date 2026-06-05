import Image from 'next/image'
import Link from 'next/link'
import { CalendarDays, History, UserCheck, UserMinus } from 'lucide-react'
import type { GroupMembershipHistory as GroupMembershipHistoryModel, GroupMembershipRecord, MembershipHistoryEvent } from '@/lib/groups/membership-history'

function toRgba(hex: string, alpha: number) {
    const h = hex.replace('#', '')
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return `rgba(${r},${g},${b},${alpha})`
}

function formatMonthYear(date: Date | null) {
    if (!date) return null
    return new Date(date).toLocaleDateString('pt-BR', {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
    }).replace('.', '')
}

function formatFullDate(date: Date) {
    return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
    }).replace('.', '')
}

function periodLabel(member: GroupMembershipRecord) {
    const joinDate = formatMonthYear(member.joinDate)
    const leaveDate = formatMonthYear(member.leaveDate)
    if (member.isActive) return joinDate ? `Desde ${joinDate}` : 'Integrante atual'
    if (joinDate && leaveDate) return `${joinDate} - ${leaveDate}`
    if (leaveDate) return `Até ${leaveDate}`
    return 'Ex-integrante'
}

function roleLabel(member: GroupMembershipRecord) {
    return member.role?.trim() || member.artist.roles?.slice(0, 2).join(' / ') || 'Membro'
}

function HistoryStat({ label, value, accent }: { label: string; value: string | number; accent: string }) {
    return (
        <div className="border-r border-border px-4 py-3 last:border-r-0">
            <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">{label}</p>
            <p className="mt-1 text-2xl font-black leading-none" style={{ color: accent }}>{value}</p>
        </div>
    )
}

function MemberAvatar({ member, accent }: { member: GroupMembershipRecord; accent: string }) {
    const { artist } = member
    return (
        <div className="relative h-11 w-11 shrink-0 overflow-hidden border border-border bg-surface">
            {artist.primaryImageUrl ? (
                <Image
                    src={artist.primaryImageUrl}
                    alt={artist.nameRomanized}
                    fill
                    sizes="44px"
                    className="object-cover"
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-black text-white"
                    style={{ background: accent }}>
                    {artist.nameRomanized[0]}
                </div>
            )}
        </div>
    )
}

function MembershipHistoryRow({ member, accent }: { member: GroupMembershipRecord; accent: string }) {
    const { artist } = member

    return (
        <Link
            href={`/artists/${artist.slug ?? artist.id}`}
            className="grid gap-3 px-4 py-3 transition-colors hover:bg-surface sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
        >
            <div className="flex min-w-0 items-center gap-3">
                <MemberAvatar member={member} accent={accent} />
                <div className="min-w-0">
                    <p className="truncate text-sm font-black text-foreground">{artist.nameRomanized}</p>
                    {artist.nameHangul && <p className="truncate text-xs text-muted">{artist.nameHangul}</p>}
                </div>
            </div>
            <p className="text-xs font-semibold text-muted sm:text-right">{roleLabel(member)}</p>
            <div className="flex items-center gap-2 sm:justify-end">
                <span
                    className="inline-flex items-center gap-1 border px-2 py-1 font-mono text-[9px] font-black uppercase tracking-[0.12em]"
                    style={{
                        borderColor: member.isActive ? toRgba(accent, 0.45) : 'var(--color-border)',
                        color: member.isActive ? accent : 'var(--color-muted)',
                    }}
                >
                    {member.isActive ? <UserCheck className="h-3 w-3" /> : <UserMinus className="h-3 w-3" />}
                    {member.isActive ? 'Atual' : 'Histórico'}
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted">{periodLabel(member)}</span>
            </div>
        </Link>
    )
}

function MembershipEventRow({ event, accent }: { event: MembershipHistoryEvent; accent: string }) {
    return (
        <Link
            href={`/artists/${event.artistSlug ?? event.artistId}`}
            className="grid grid-cols-[56px_1fr] gap-3 px-4 py-3 transition-colors hover:bg-surface sm:grid-cols-[72px_1fr_auto]"
        >
            <p className="font-display text-sm font-black" style={{ color: accent }}>{event.year}</p>
            <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">{event.artistName}</p>
                <p className="text-xs text-muted">
                    {event.type === 'join' ? 'Entrou na formação' : 'Saiu da formação'}
                </p>
            </div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted sm:text-right">
                {formatFullDate(event.date)}
            </p>
        </Link>
    )
}

export function GroupMembershipHistory({ history, accent }: {
    history: GroupMembershipHistoryModel
    accent: string
}) {
    if (history.allMembers.length === 0) return null

    const recentEvents = history.events.slice(0, 8)

    return (
        <section id="historico-integrantes">
            <div className="mb-5 flex items-end justify-between gap-4 border-b border-foreground pb-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center border border-border bg-background">
                        <History className="h-5 w-5" style={{ color: accent }} />
                    </div>
                    <div className="min-w-0">
                        <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">Dossiê</p>
                        <h2 className="text-xl font-black tracking-[-0.03em] text-foreground">Histórico de integrantes</h2>
                    </div>
                </div>
                <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                    {history.allMembers.length} {history.allMembers.length === 1 ? 'registro' : 'registros'}
                </p>
            </div>

            <div className="overflow-hidden border border-border bg-background">
                <div className="grid grid-cols-2 border-b border-border bg-surface/50 sm:grid-cols-4">
                    <HistoryStat label="Formação atual" value={history.currentMembers.length} accent={accent} />
                    <HistoryStat label="Ex-integrantes" value={history.formerMembers.length} accent={accent} />
                    <HistoryStat label="Total histórico" value={history.allMembers.length} accent={accent} />
                    <HistoryStat label="Desde" value={history.firstKnownYear ?? '—'} accent={accent} />
                </div>

                <div className="divide-y divide-border">
                    {history.allMembers.map((member) => (
                        <MembershipHistoryRow key={member.id} member={member} accent={accent} />
                    ))}
                </div>

                {recentEvents.length > 0 && (
                    <div className="border-t border-border">
                        <div className="flex items-center gap-2 px-4 py-3">
                            <CalendarDays className="h-4 w-4" style={{ color: accent }} />
                            <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">Mudanças registradas</p>
                        </div>
                        <div className="divide-y divide-border">
                            {recentEvents.map((event) => (
                                <MembershipEventRow key={event.id} event={event} accent={accent} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {history.formerMembers.length > 0 && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {history.formerMembers.map((member) => (
                        <Link
                            key={member.id}
                            href={`/artists/${member.artist.slug ?? member.artist.id}`}
                            className="flex items-center gap-3 border border-border bg-background p-3 opacity-80 transition-opacity hover:opacity-100"
                        >
                            <MemberAvatar member={member} accent={accent} />
                            <div className="min-w-0">
                                <p className="truncate text-sm font-black text-foreground">{member.artist.nameRomanized}</p>
                                <p className="truncate text-[10px] font-mono uppercase tracking-[0.08em] text-muted">{periodLabel(member)}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </section>
    )
}
