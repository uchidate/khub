import prisma from '../prisma'
import { AIOrchestrator } from '../ai/orchestrator';

export interface AlbumData {
    title: string;
    type: 'ALBUM' | 'EP' | 'SINGLE';
    releaseDate?: Date;
    coverUrl?: string;
    spotifyUrl?: string;
    appleMusicUrl?: string;
    youtubeUrl?: string;
}

export class DiscographySyncService {
    private orchestrator: AIOrchestrator;

    constructor() {
        this.orchestrator = new AIOrchestrator({
            geminiApiKey: process.env.GEMINI_API_KEY,
            openaiApiKey: process.env.OPENAI_API_KEY,
            claudeApiKey: process.env.ANTHROPIC_API_KEY,
            ollamaBaseUrl: process.env.OLLAMA_BASE_URL,
        });
    }

    /**
     * Sync discography for a single artist using AI
     */
    async syncArtistDiscography(artistId: string): Promise<{ success: boolean; addedCount: number; errors: string[] }> {
        const result = { success: false, addedCount: 0, errors: [] as string[] };

        try {
            const artist = await prisma.artist.findUnique({
                where: { id: artistId },
                select: { id: true, nameRomanized: true, nameHangul: true }
            });

            if (!artist) {
                throw new Error(`Artist not found: ${artistId}`);
            }

            console.log(`🎵 Syncing discography for: ${artist.nameRomanized}...`);

            const prompt = `Gere uma lista da discografia oficial (Álbuns, EPs e Singles principais) do artista coreano "${artist.nameRomanized}" (${artist.nameHangul || ''}).
      
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

            const aiResult = await this.orchestrator.generateStructured<{ albums: AlbumData[] }>(
                prompt,
                schema,
                { preferredProvider: 'gemini' }
            );

            if (!aiResult.albums || aiResult.albums.length === 0) {
                console.warn(`⚠️  No discography found for ${artist.nameRomanized}`);
                return { ...result, success: true };
            }

            for (const albumData of aiResult.albums) {
                try {
                    // Check for existing album for this artist to avoid duplicates
                    const existing = await prisma.album.findFirst({
                        where: {
                            artistId: artist.id,
                            title: { equals: albumData.title, mode: 'insensitive' }
                        }
                    });

                    if (!existing) {
                        await prisma.album.create({
                            data: {
                                title: albumData.title,
                                type: albumData.type,
                                releaseDate: albumData.releaseDate ? new Date(albumData.releaseDate) : null,
                                spotifyUrl: albumData.spotifyUrl || null,
                                appleMusicUrl: albumData.appleMusicUrl || null,
                                youtubeUrl: albumData.youtubeUrl || null,
                                artistId: artist.id,
                                // AI usually doesn't give cover URLs easily, so we leave it null for now
                                // Future enhancement: Add a cover search service
                            }
                        });
                        result.addedCount++;
                    }
                } catch (error: any) {
                    console.error(`   ❌ Failed to save album "${albumData.title}": ${error.message}`);
                    result.errors.push(error.message);
                }
            }

            result.success = true;
            console.log(`✅ Discography sync complete for ${artist.nameRomanized}: ${result.addedCount} added.`);

        } catch (error: any) {
            console.error(`❌ Discography sync global error: ${error.message}`);
            result.errors.push(error.message);
        }

        return result;
    }

    /**
     * Batch sync for multiple artists
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

let instance: DiscographySyncService | null = null;

export function getDiscographySyncService(): DiscographySyncService {
    if (!instance) {
        instance = new DiscographySyncService();
    }
    return instance;
}
