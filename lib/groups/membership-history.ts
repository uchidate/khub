export type GroupMembershipArtist = {
    id: string
    slug?: string | null
    nameRomanized: string
    nameHangul: string | null
    primaryImageUrl: string | null
    roles: string[]
}

export type GroupMembershipRecord = {
    id: string
    role: string | null
    joinDate: Date | null
    leaveDate: Date | null
    isActive: boolean
    position: number | null
    artist: GroupMembershipArtist
}

export type MembershipHistoryEvent = {
    id: string
    type: 'join' | 'leave'
    date: Date
    year: number
    artistId: string
    artistName: string
    artistSlug?: string | null
}

export type GroupMembershipHistory = {
    currentMembers: GroupMembershipRecord[]
    formerMembers: GroupMembershipRecord[]
    allMembers: GroupMembershipRecord[]
    events: MembershipHistoryEvent[]
    hasKnownDates: boolean
    firstKnownYear: number | null
}

function sortByLineup(a: GroupMembershipRecord, b: GroupMembershipRecord) {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
    return (a.position ?? 999) - (b.position ?? 999)
        || (a.joinDate?.getTime() ?? 0) - (b.joinDate?.getTime() ?? 0)
        || a.artist.nameRomanized.localeCompare(b.artist.nameRomanized)
}

function sortByDateDesc(a: MembershipHistoryEvent, b: MembershipHistoryEvent) {
    return b.date.getTime() - a.date.getTime()
        || a.artistName.localeCompare(b.artistName)
}

export function buildGroupMembershipHistory(
    memberships: GroupMembershipRecord[],
    debutYear: number | null,
): GroupMembershipHistory {
    const allMembers = [...memberships].sort(sortByLineup)
    const currentMembers = allMembers.filter((member) => member.isActive)
    const formerMembers = allMembers.filter((member) => !member.isActive)

    const events = allMembers.flatMap((member): MembershipHistoryEvent[] => {
        const memberEvents: MembershipHistoryEvent[] = []
        if (member.joinDate) {
            memberEvents.push({
                id: `${member.id}-join`,
                type: 'join',
                date: member.joinDate,
                year: member.joinDate.getUTCFullYear(),
                artistId: member.artist.id,
                artistName: member.artist.nameRomanized,
                artistSlug: member.artist.slug,
            })
        }
        if (member.leaveDate) {
            memberEvents.push({
                id: `${member.id}-leave`,
                type: 'leave',
                date: member.leaveDate,
                year: member.leaveDate.getUTCFullYear(),
                artistId: member.artist.id,
                artistName: member.artist.nameRomanized,
                artistSlug: member.artist.slug,
            })
        }
        return memberEvents
    }).sort(sortByDateDesc)

    const firstKnownEventYear = events.length > 0 ? Math.min(...events.map((event) => event.year)) : null

    return {
        currentMembers,
        formerMembers,
        allMembers,
        events,
        hasKnownDates: events.length > 0,
        firstKnownYear: firstKnownEventYear ?? debutYear,
    }
}
