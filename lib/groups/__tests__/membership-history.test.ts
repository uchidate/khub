import { describe, expect, it } from 'vitest'
import { buildGroupMembershipHistory, type GroupMembershipRecord } from '../membership-history'

function member(overrides: Partial<GroupMembershipRecord> & {
    id: string
    name: string
}): GroupMembershipRecord {
    return {
        id: overrides.id,
        role: overrides.role ?? null,
        joinDate: overrides.joinDate ?? null,
        leaveDate: overrides.leaveDate ?? null,
        isActive: overrides.isActive ?? true,
        position: overrides.position ?? null,
        artist: {
            id: `artist-${overrides.id}`,
            slug: overrides.name.toLowerCase().replace(/\s+/g, '-'),
            nameRomanized: overrides.name,
            nameHangul: null,
            primaryImageUrl: null,
            roles: ['CANTOR'],
        },
    }
}

describe('buildGroupMembershipHistory', () => {
    it('separates current and former members in display order', () => {
        const history = buildGroupMembershipHistory([
            member({ id: 'former', name: 'Former Member', isActive: false, position: 1 }),
            member({ id: 'current-2', name: 'Second Current', isActive: true, position: 2 }),
            member({ id: 'current-1', name: 'First Current', isActive: true, position: 1 }),
        ], 2018)

        expect(history.currentMembers.map((m) => m.artist.nameRomanized)).toEqual([
            'First Current',
            'Second Current',
        ])
        expect(history.formerMembers.map((m) => m.artist.nameRomanized)).toEqual(['Former Member'])
        expect(history.allMembers.map((m) => m.artist.nameRomanized)).toEqual([
            'First Current',
            'Second Current',
            'Former Member',
        ])
    })

    it('builds dated join and leave events newest first', () => {
        const history = buildGroupMembershipHistory([
            member({
                id: 'saerom',
                name: 'Lee Saerom',
                isActive: false,
                joinDate: new Date('2017-09-29T00:00:00.000Z'),
                leaveDate: new Date('2024-12-31T00:00:00.000Z'),
            }),
            member({
                id: 'hayoung',
                name: 'Song Hayoung',
                isActive: true,
                joinDate: new Date('2017-09-29T00:00:00.000Z'),
            }),
        ], 2018)

        expect(history.hasKnownDates).toBe(true)
        expect(history.firstKnownYear).toBe(2017)
        expect(history.events.map((event) => `${event.type}:${event.artistName}:${event.year}`)).toEqual([
            'leave:Lee Saerom:2024',
            'join:Lee Saerom:2017',
            'join:Song Hayoung:2017',
        ])
    })

    it('falls back to debut year when no membership dates are known', () => {
        const history = buildGroupMembershipHistory([
            member({ id: 'current', name: 'Current Member' }),
        ], 2020)

        expect(history.hasKnownDates).toBe(false)
        expect(history.firstKnownYear).toBe(2020)
        expect(history.events).toEqual([])
    })
})
