import prisma from '../prisma'
import { getOrchestrator } from '../ai/orchestrator-factory';
import { getMusicBrainzService, MBRelease } from './musicbrainz-service';

export interface AlbumData {
    title: string;
    type: 'ALBUM' | 'EP' | 'SINGLE';
    releaseDate?: Date;
    coverUrl?: string;
    spotifyUrl?: string;
    appleMusicUrl?: string;
    youtubeUrl?: string;
    mbid?: string;
}

/**
 * Discography Sync Service
 *
 * Strategy: MusicBrainz first (free, authoritative) → AI fallback (Gemini).
 * MusicBrainz provides reliable metadata without hallucination risk.
 * AI is used only when the artist is not found in MusicBrainz.
 */
export class DiscographySyncService {
    private getOrchestrator() {
        return getOrchestrator();
    }

    /**
     * Save albums from any source, deduplicating by mbid (if present) or title.
     * Returns count of newly added albums.
     */
    private async saveAlbums(artistId: string, albums: AlbumData[]): Promise<number> {
        let addedCount = 0;

        for (const albumData of albums) {
            try {
                let existing = null;

                // Deduplicate by MusicBrainz release-group ID first (most reliable)
                if (albumData.mbid) {
                    existing = await prisma.album.findFirst({
                        where: { artistId, mbid: albumData.mbid },
                    });
                }

                // Fall back to title deduplication
                if (!existing) {
                    existing = await prisma.album.findFirst({
                        where: {
                            artistId,
                            title: { equals: albumData.title, mode: 'insensitive' },
                        },
                    });
                }

                if (!existing) {
                    await prisma.album.create({
                        data: {
                            title: albumData.title,
                            type: albumData.type,
                            releaseDate: albumData.releaseDate ? new Date(albumData.releaseDate) : null,
                            coverUrl: albumData.coverUrl || null,
                            spotifyUrl: albumData.spotifyUrl || null,
                            appleMusicUrl: albumData.appleMusicUrl || null,
                            youtubeUrl: albumData.youtubeUrl || null,
                            mbid: albumData.mbid || null,
                            artistId,
                        },
                    });
                    addedCount++;
                } else if (albumData.mbid && !existing.mbid) {
                    // Update mbid on existing record if it was missing
                    await prisma.album.update({
                        where: { id: existing.id },
                        data: { mbid: albumData.mbid, coverUrl: albumData.coverUrl || existing.coverUrl },
                    });
                }
            } catch (error: any) {
                console.error(`   ❌ Failed to save album "${albumData.title}": ${error.message}`);
            }
        }

        return addedCount;
    }

    /**
     * Sync discography via MusicBrainz (primary source).
     * Returns null if artist not found in MusicBrainz.
     */
    private async syncViaMusicBrainz(
        artistId: string,
        nameRomanized: string
    ): Promise<{ addedCount: number; mbid: string } | null> {
        const mb = getMusicBrainzService();

        const result = await mb.getDiscography(nameRomanized);
        if (!result) return null;

        const albums: AlbumData[] = result.releases.map((release: MBRelease) => ({
            title: release.title,
            type: release.type,
            releaseDate: release.firstReleaseDate ? parseReleaseDate(release.firstReleaseDate) : undefined,
            coverUrl: release.coverUrl || undefined,
            mbid: release.mbid,
        }));

        const addedCount = await this.saveAlbums(artistId, albums);
        return { addedCount, mbid: result.mbid };
    }

    /**
     * Sync discography via AI (fallback when MusicBrainz has no data).
     */
    private async syncViaAI(
        artistId: string,
        nameRomanized: string,
        nameHangul: string | null
    ): Promise<number> {
        const prompt = `Gere uma lista da discografia oficial (Álbuns, EPs e Singles principais) do artista coreano "${nameRomanized}" (${nameHangul || ''}).

      Para cada item, forneça:
      - title: Título do álbum/single
      - type: "ALBUM", "EP" ou "SINGLE"
      - releaseDate: Data de lançamento (formato YYYY-MM-DD)
      - spotifyUrl: Link oficial do Spotify (se disponível)
      - appleMusicUrl: Link oficial do Apple Music (se disponível)
      - youtubeUrl: Link oficial do YouTube Music ou MV (se disponível)

      Foque nos lançamentos mais importantes e recentes.`;

        const schema = `{
        "albums": [
          {
            "title": "string",
            "type": "ALBUM | EP | SINGLE",
            "releaseDate": "string (YYYY-MM-DD)",
            "spotifyUrl": "string",
            "appleMusicUrl": "string",
            "youtubeUrl": "string"
          }
        ]
      }`;

        const aiResult = await this.getOrchestrator().generateStructured<{ albums: AlbumData[] }>(
            prompt,
            schema,
            { preferredProvider: 'gemini' }
        );

        if (!aiResult.albums || aiResult.albums.length === 0) {
            return 0;
        }

        return await this.saveAlbums(artistId, aiResult.albums);
    }

    /**
     * Sync discography for a single artist.
     * Strategy: MusicBrainz → AI fallback.
     */
    async syncArtistDiscography(artistId: string): Promise<{ success: boolean; addedCount: number; source: string; errors: string[] }> {
        const result = { success: false, addedCount: 0, source: 'none', errors: [] as string[] };

        try {
            const artist = await prisma.artist.findUnique({
                where: { id: artistId },
                select: { id: true, nameRomanized: true, nameHangul: true, mbid: true },
            });

            if (!artist) {
                throw new Error(`Artist not found: ${artistId}`);
            }

            console.log(`🎵 Syncing discography for: ${artist.nameRomanized}...`);

            // Try MusicBrainz first
            const mbResult = await this.syncViaMusicBrainz(artist.id, artist.nameRomanized);

            if (mbResult) {
                result.addedCount = mbResult.addedCount;
                result.source = 'musicbrainz';

                // Persist mbid on artist for future use
                if (!artist.mbid || artist.mbid !== mbResult.mbid) {
                    await prisma.artist.update({
                        where: { id: artist.id },
                        data: { mbid: mbResult.mbid },
                    });
                }

                console.log(`✅ [MusicBrainz] Discography sync for ${artist.nameRomanized}: ${result.addedCount} added.`);
            } else {
                // Fallback to AI
                console.log(`ℹ️  [MusicBrainz] Artist not found — using AI fallback for ${artist.nameRomanized}`);
                result.addedCount = await this.syncViaAI(artist.id, artist.nameRomanized, artist.nameHangul);
                result.source = 'ai';
                console.log(`✅ [AI] Discography sync for ${artist.nameRomanized}: ${result.addedCount} added.`);
            }

            // Always update sync timestamp
            await prisma.artist.update({
                where: { id: artist.id },
                data: { discographySyncAt: new Date() },
            });

            result.success = true;

        } catch (error: any) {
            console.error(`❌ Discography sync global error: ${error.message}`);
            result.errors.push(error.message);
        }

        return result;
    }

    /**
     * Sync discography for artists without data or with stale data.
     */
    async syncPendingArtistDiscographies(limit: number = 5): Promise<{
        processed: number
        successCount: number
        failureCount: number
        totalAdded: number
    }> {
        const staleDays = 30;
        const staleThreshold = new Date();
        staleThreshold.setDate(staleThreshold.getDate() - staleDays);

        const artists = await prisma.artist.findMany({
            where: {
                OR: [
                    { discographySyncAt: null },
                    { discographySyncAt: { lt: staleThreshold } },
                ],
            },
            select: { id: true, nameRomanized: true },
            take: limit,
            orderBy: { createdAt: 'asc' },
        });

        const stats = { processed: artists.length, successCount: 0, failureCount: 0, totalAdded: 0 };

        for (const artist of artists) {
            const res = await this.syncArtistDiscography(artist.id);
            if (res.success) {
                stats.successCount++;
                stats.totalAdded += res.addedCount;
            } else {
                stats.failureCount++;
            }
        }

        return stats;
    }

    /**
     * Batch sync for multiple artists (legacy, kept for compatibility)
     */
    async syncMultipleArtists(artistIds: string[]): Promise<{ total: number; successCount: number; failureCount: number }> {
        const stats = { total: artistIds.length, successCount: 0, failureCount: 0 };

        for (const id of artistIds) {
            const res = await this.syncArtistDiscography(id);
            if (res.success) stats.successCount++;
            else stats.failureCount++;
        }

        return stats;
    }
}

/**
 * Parse MusicBrainz date strings: 'YYYY-MM-DD', 'YYYY-MM', 'YYYY'
 */
function parseReleaseDate(dateStr: string): Date | undefined {
    if (!dateStr) return undefined;
    // Normalize partial dates to first of month/year
    const parts = dateStr.split('-');
    const normalized = parts.length === 1
        ? `${parts[0]}-01-01`
        : parts.length === 2
        ? `${parts[0]}-${parts[1]}-01`
        : dateStr;

    const date = new Date(normalized);
    return isNaN(date.getTime()) ? undefined : date;
}

let instance: DiscographySyncService | null = null;

export function getDiscographySyncService(): DiscographySyncService {
    if (!instance) {
        instance = new DiscographySyncService();
    }
    return instance;
}
