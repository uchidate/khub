-- CreateEnum
CREATE TYPE "MusicCatalogArtistKind" AS ENUM ('PERSON', 'GROUP');

-- CreateEnum
CREATE TYPE "MusicReleaseType" AS ENUM ('ALBUM', 'EP', 'SINGLE', 'MINI_ALBUM', 'FULL_ALBUM', 'OST', 'REPACKAGE', 'COMPILATION');

-- CreateEnum
CREATE TYPE "MusicCreditRole" AS ENUM ('PRIMARY', 'FEATURED', 'PRODUCER', 'COMPOSER');

-- CreateEnum
CREATE TYPE "ExternalMusicEntityType" AS ENUM ('ARTIST', 'RELEASE', 'TRACK');

-- CreateEnum
CREATE TYPE "ExternalMusicMatchStatus" AS ENUM ('UNVERIFIED', 'AUTO_MATCHED', 'MANUAL_VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "MusicCatalogArtist" (
    "id" TEXT NOT NULL,
    "kind" "MusicCatalogArtistKind" NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "artistId" TEXT,
    "groupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MusicCatalogArtist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicRelease" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "releaseType" "MusicReleaseType" NOT NULL,
    "releaseDate" TIMESTAMP(3),
    "coverUrl" TEXT,
    "legacyAlbumId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MusicRelease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicTrack" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "trackNumber" INTEGER,
    "discNumber" INTEGER,
    "durationMs" INTEGER,
    "isrc" TEXT,
    "releaseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MusicTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicReleaseCredit" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "musicCatalogArtistId" TEXT NOT NULL,
    "role" "MusicCreditRole" NOT NULL DEFAULT 'PRIMARY',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MusicReleaseCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicTrackCredit" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "musicCatalogArtistId" TEXT NOT NULL,
    "role" "MusicCreditRole" NOT NULL DEFAULT 'PRIMARY',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MusicTrackCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StreamingPlatform" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StreamingPlatform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalMusicEntity" (
    "id" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "entityType" "ExternalMusicEntityType" NOT NULL,
    "externalId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "musicCatalogArtistId" TEXT,
    "releaseId" TEXT,
    "trackId" TEXT,
    "confidence" DOUBLE PRECISION,
    "matchStatus" "ExternalMusicMatchStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "source" TEXT NOT NULL,
    "matchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalMusicEntity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MusicCatalogArtist_artistId_key" ON "MusicCatalogArtist"("artistId");

-- CreateIndex
CREATE UNIQUE INDEX "MusicCatalogArtist_groupId_key" ON "MusicCatalogArtist"("groupId");

-- CreateIndex
CREATE INDEX "MusicCatalogArtist_kind_idx" ON "MusicCatalogArtist"("kind");

-- CreateIndex
CREATE INDEX "MusicCatalogArtist_canonicalName_idx" ON "MusicCatalogArtist"("canonicalName");

-- CreateIndex
CREATE UNIQUE INDEX "MusicRelease_legacyAlbumId_key" ON "MusicRelease"("legacyAlbumId");

-- CreateIndex
CREATE INDEX "MusicRelease_releaseDate_idx" ON "MusicRelease"("releaseDate");

-- CreateIndex
CREATE INDEX "MusicRelease_releaseType_idx" ON "MusicRelease"("releaseType");

-- CreateIndex
CREATE INDEX "MusicRelease_title_idx" ON "MusicRelease"("title");

-- CreateIndex
CREATE INDEX "MusicTrack_releaseId_idx" ON "MusicTrack"("releaseId");

-- CreateIndex
CREATE INDEX "MusicTrack_isrc_idx" ON "MusicTrack"("isrc");

-- CreateIndex
CREATE UNIQUE INDEX "MusicReleaseCredit_releaseId_musicCatalogArtistId_role_key" ON "MusicReleaseCredit"("releaseId", "musicCatalogArtistId", "role");

-- CreateIndex
CREATE INDEX "MusicReleaseCredit_musicCatalogArtistId_idx" ON "MusicReleaseCredit"("musicCatalogArtistId");

-- CreateIndex
CREATE UNIQUE INDEX "MusicTrackCredit_trackId_musicCatalogArtistId_role_key" ON "MusicTrackCredit"("trackId", "musicCatalogArtistId", "role");

-- CreateIndex
CREATE INDEX "MusicTrackCredit_musicCatalogArtistId_idx" ON "MusicTrackCredit"("musicCatalogArtistId");

-- CreateIndex
CREATE UNIQUE INDEX "StreamingPlatform_slug_key" ON "StreamingPlatform"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalMusicEntity_platformId_entityType_externalId_key" ON "ExternalMusicEntity"("platformId", "entityType", "externalId");

-- CreateIndex
CREATE INDEX "ExternalMusicEntity_musicCatalogArtistId_idx" ON "ExternalMusicEntity"("musicCatalogArtistId");

-- CreateIndex
CREATE INDEX "ExternalMusicEntity_releaseId_idx" ON "ExternalMusicEntity"("releaseId");

-- CreateIndex
CREATE INDEX "ExternalMusicEntity_trackId_idx" ON "ExternalMusicEntity"("trackId");

-- CreateIndex
CREATE INDEX "ExternalMusicEntity_matchStatus_idx" ON "ExternalMusicEntity"("matchStatus");

-- AddForeignKey
ALTER TABLE "MusicCatalogArtist" ADD CONSTRAINT "MusicCatalogArtist_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicCatalogArtist" ADD CONSTRAINT "MusicCatalogArtist_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "MusicalGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicRelease" ADD CONSTRAINT "MusicRelease_legacyAlbumId_fkey" FOREIGN KEY ("legacyAlbumId") REFERENCES "Album"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicTrack" ADD CONSTRAINT "MusicTrack_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "MusicRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicReleaseCredit" ADD CONSTRAINT "MusicReleaseCredit_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "MusicRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicReleaseCredit" ADD CONSTRAINT "MusicReleaseCredit_musicCatalogArtistId_fkey" FOREIGN KEY ("musicCatalogArtistId") REFERENCES "MusicCatalogArtist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicTrackCredit" ADD CONSTRAINT "MusicTrackCredit_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "MusicTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicTrackCredit" ADD CONSTRAINT "MusicTrackCredit_musicCatalogArtistId_fkey" FOREIGN KEY ("musicCatalogArtistId") REFERENCES "MusicCatalogArtist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalMusicEntity" ADD CONSTRAINT "ExternalMusicEntity_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "StreamingPlatform"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalMusicEntity" ADD CONSTRAINT "ExternalMusicEntity_musicCatalogArtistId_fkey" FOREIGN KEY ("musicCatalogArtistId") REFERENCES "MusicCatalogArtist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalMusicEntity" ADD CONSTRAINT "ExternalMusicEntity_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "MusicRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalMusicEntity" ADD CONSTRAINT "ExternalMusicEntity_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "MusicTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
