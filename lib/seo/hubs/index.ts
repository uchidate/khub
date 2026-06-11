import { artistsAgenciesHubs } from './artists-agencies'
import { artistsCategoriesHubs } from './artists-categories'
import { artistsSoloHubs } from './artists-solo'
import { groupsCategoriesHubs } from './groups-categories'
import { groupsAgenciesHubs } from './groups-agencies'
import { groupsMembersHubs } from './groups-members'
import { enHubs } from './i18n/en'
import { esHubs } from './i18n/es'
import { idHubs } from './i18n/id'
import { thHubs } from './i18n/th'
import { productionsGenreHubs } from './productions-genre'
import { productionsPlatformHubs } from './productions-platform'
import { productionsYearHubs } from './productions-year'
import type { ArchiveHub } from './types'

export const archiveHubCollections: Record<string, ArchiveHub[]> = {
    artistsCategories: artistsCategoriesHubs,
    artistsSolo: artistsSoloHubs,
    artistsAgencies: artistsAgenciesHubs,
    groupsCategories: groupsCategoriesHubs,
    groupsAgencies: groupsAgenciesHubs,
    groupsMembers: groupsMembersHubs,
    productionsPlatform: productionsPlatformHubs,
    productionsGenre: productionsGenreHubs,
    productionsYear: productionsYearHubs,
    en: enHubs,
    es: esHubs,
    th: thHubs,
    id: idHubs,
}

export const archiveHubs: ArchiveHub[] = Object.values(archiveHubCollections).flat()
