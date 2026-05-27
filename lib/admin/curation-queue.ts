import { Prisma } from '@prisma/client'

export const ARTIST_CURATION_MISSING_FIELDS: Prisma.ArtistWhereInput[] = [
  { bio: null },
  { analiseEditorial: null },
  { curiosidades: { isEmpty: true } },
  { height: null },
  { bloodType: null },
  { fanInfo: { equals: Prisma.JsonNull } },
  { awards: { equals: Prisma.JsonNull } },
]

export const GROUP_CURATION_MISSING_FIELDS: Prisma.MusicalGroupWhereInput[] = [
  { bio: null },
  { analiseEditorial: null },
  { curiosidades: { isEmpty: true } },
  { fanClubName: null },
  { officialColor: null },
  { socialLinks: { equals: Prisma.JsonNull } },
]

export const PRODUCTION_CURATION_MISSING_FIELDS: Prisma.ProductionWhereInput[] = [
  { synopsis: null },
  { tagline: null },
  { whyWatch: null },
  { editorialReview: null },
  { editorialRating: null },
  { curiosidades: { isEmpty: true } },
]

export const ARTIST_CURATION_PENDING_WHERE: Prisma.ArtistWhereInput = {
  isHidden: false,
  flaggedAsNonKorean: false,
  OR: ARTIST_CURATION_MISSING_FIELDS,
}

export const GROUP_CURATION_PENDING_WHERE: Prisma.MusicalGroupWhereInput = {
  isHidden: false,
  OR: GROUP_CURATION_MISSING_FIELDS,
}

export const PRODUCTION_CURATION_PENDING_WHERE: Prisma.ProductionWhereInput = {
  isHidden: false,
  flaggedAsNonKorean: false,
  OR: PRODUCTION_CURATION_MISSING_FIELDS,
}
