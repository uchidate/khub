import { artistsAgenciesHubs } from './artists-agencies'
import { artistsCategoriesHubs } from './artists-categories'
import { artistsSoloHubs } from './artists-solo'
import { groupsCategoriesHubs } from './groups-categories'
import { groupsAgenciesHubs } from './groups-agencies'
import { groupsMembersHubs } from './groups-members'
import { enHubs } from './i18n/en'
import { esHubs } from './i18n/es'
import { filHubs } from './i18n/fil'
import { frHubs } from './i18n/fr'
import { idHubs } from './i18n/id'
import { itHubs } from './i18n/it'
import { jaHubs } from './i18n/ja'
import { thHubs } from './i18n/th'
import { viHubs } from './i18n/vi'
import { productionsGenreHubs } from './productions-genre'
import { productionsNetworkHubs } from './productions-network'
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
    productionsNetwork: productionsNetworkHubs,
    productionsGenre: productionsGenreHubs,
    productionsYear: productionsYearHubs,
    en: enHubs,
    es: esHubs,
    fr: frHubs,
    th: thHubs,
    id: idHubs,
    ja: jaHubs,
    vi: viHubs,
    fil: filHubs,
    it: itHubs,
}

export const archiveHubs: ArchiveHub[] = Object.values(archiveHubCollections).flat()
