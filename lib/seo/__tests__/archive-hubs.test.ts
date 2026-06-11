import { describe, expect, it } from 'vitest'
import {
    ARCHIVE_HUBS,
    getArchiveHubsByLocale,
    getRelatedGroupHubs,
    getRelatedProductionHubs,
    getTranslatedHub,
} from '../archive-hubs'
import { archiveHubCollections } from '../hubs'

describe('archive hubs', () => {
    it('keeps every hub slug unique after collection merge', () => {
        const slugs = ARCHIVE_HUBS.map(hub => hub.slug)

        expect(new Set(slugs).size).toBe(slugs.length)
    })

    it('keeps the exported hub list in sync with the modular collections', () => {
        const collectionTotal = Object.values(archiveHubCollections).reduce((total, hubs) => total + hubs.length, 0)

        expect(ARCHIVE_HUBS).toHaveLength(collectionTotal)
    })

    it('filters hubs by locale without leaking translated hubs into pt', () => {
        expect(getArchiveHubsByLocale('pt').every(hub => !hub.locale || hub.locale === 'pt')).toBe(true)
        expect(getArchiveHubsByLocale('en').every(hub => hub.locale === 'en')).toBe(true)
        expect(getArchiveHubsByLocale('es').every(hub => hub.locale === 'es')).toBe(true)
        expect(getArchiveHubsByLocale('th').every(hub => hub.locale === 'th')).toBe(true)
        expect(getArchiveHubsByLocale('id').every(hub => hub.locale === 'id')).toBe(true)
    })

    it('finds translated versions through a shared i18n key', () => {
        const ptHub = ARCHIVE_HUBS.find(hub => hub.slug === 'integrantes-do-bts')

        expect(ptHub).toBeDefined()
        expect(ptHub ? getTranslatedHub(ptHub, 'en')?.slug : undefined).toBe('bts-members')
        expect(ptHub ? getTranslatedHub(ptHub, 'es')?.slug : undefined).toBe('bts-integrantes')
        expect(ptHub ? getTranslatedHub(ptHub, 'th')?.slug : undefined).toBe('bts-members-th')
        expect(ptHub ? getTranslatedHub(ptHub, 'id')?.slug : undefined).toBe('bts-members-id')
    })

    it('relates group pages to member and category hubs', () => {
        expect(getRelatedGroupHubs({ slug: 'blackpink', femaleMembers: 4, maleMembers: 0 }).map(hub => hub.slug)).toEqual([
            'integrantes-do-blackpink',
            'grupos-femininos-kpop',
        ])
    })

    it('relates production pages to platform and genre hubs', () => {
        expect(getRelatedProductionHubs({
            streamingPlatforms: ['Disney+'],
            tags: ['medical', 'revenge'],
        }).map(hub => hub.slug)).toEqual([
            'doramas-disney-plus',
            'doramas-medicos-coreanos',
            'doramas-de-vinganca-coreanos',
        ])
    })
})
