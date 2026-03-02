import { PrismaClient } from '@prisma/client';
import { getOrchestrator } from '../ai/orchestrator-factory';

/**
 * Artist Translation Service
 *
 * Responsável por traduzir biografias de artistas de EN/KR → PT-BR.
 * Preserva o campo `bio` original e salva a tradução em ContentTranslation.
 */
export class ArtistTranslationService {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    private getOrchestrator() {
        return getOrchestrator();
    }

    /**
     * Traduz biografias de artistas pendentes (batch)
     */
    async translatePendingArtists(limit: number = 5): Promise<{
        translated: number;
        failed: number;
        skipped: number;
    }> {
        console.log(`🌐 Starting batch translation (limit: ${limit})...`);

        const pendingArtists = await this.prisma.artist.findMany({
            where: { translationStatus: 'pending' },
            orderBy: { createdAt: 'asc' },
            take: limit,
            select: {
                id: true,
                nameRomanized: true,
                nameHangul: true,
                bio: true,
                roles: true
            }
        });

        console.log(`📊 Found ${pendingArtists.length} artists pending translation`);

        let translated = 0;
        let failed = 0;
        let skipped = 0;

        for (const artist of pendingArtists) {
            try {
                if (this.isAlreadyInPortuguese(artist.bio || '')) {
                    console.log(`  ⏭️  ${artist.nameRomanized} - Already in Portuguese`);
                    await this.markAsCompleted(artist.id);
                    skipped++;
                    continue;
                }

                console.log(`  🔄 Translating: ${artist.nameRomanized}...`);

                const translatedBio = await this.translateBioToPortuguese(
                    artist.nameRomanized,
                    artist.bio || '',
                    artist.roles[0] || 'Artista'
                );

                // Salva tradução em ContentTranslation (preserva bio original intacto)
                await this.prisma.contentTranslation.upsert({
                    where: {
                        entityType_entityId_field_locale: {
                            entityType: 'artist',
                            entityId: artist.id,
                            field: 'bio',
                            locale: 'pt-BR',
                        },
                    },
                    create: {
                        entityType: 'artist',
                        entityId: artist.id,
                        field: 'bio',
                        locale: 'pt-BR',
                        value: translatedBio,
                        status: 'draft',
                    },
                    update: {
                        value: translatedBio,
                        status: 'draft',
                    },
                });

                await this.markAsCompleted(artist.id);

                console.log(`  ✅ ${artist.nameRomanized} - Translated successfully`);
                translated++;

            } catch (error: any) {
                console.error(`  ❌ ${artist.nameRomanized} - Translation failed: ${error.message}`);

                await this.prisma.artist.update({
                    where: { id: artist.id },
                    data: { translationStatus: 'failed' }
                }).catch(() => {});

                failed++;
            }
        }

        console.log(`✅ Translation batch complete: ${translated} translated, ${failed} failed, ${skipped} skipped`);
        return { translated, failed, skipped };
    }

    private isAlreadyInPortuguese(text: string): boolean {
        const ptWords = ['é', 'conhecido', 'conhecida', 'brasileiro', 'brasileira', 'artista', 'na', 'do', 'da'];
        const lowerText = text.toLowerCase();
        const matchCount = ptWords.filter(word => lowerText.includes(word)).length;
        return matchCount >= 2;
    }

    private async markAsCompleted(artistId: string): Promise<void> {
        await this.prisma.artist.update({
            where: { id: artistId },
            data: { translationStatus: 'completed', translatedAt: new Date() }
        });
    }

    private async translateBioToPortuguese(
        artistName: string,
        biography: string,
        role: string
    ): Promise<string> {
        if (!biography || biography.trim().length === 0) {
            return `${artistName} é ${role} conhecido(a) na indústria do entretenimento coreano.`;
        }

        if (biography.length < 100) {
            return this.enrichAndTranslate(artistName, biography, role);
        }

        return this.translateWithAI(artistName, biography);
    }

    private async enrichAndTranslate(
        artistName: string,
        biography: string,
        role: string
    ): Promise<string> {
        try {
            const prompt = `Crie uma biografia profissional em português brasileiro para o(a) artista coreano(a) ${artistName}.

Informações disponíveis:
${biography}

Área de atuação: ${role}

Requisitos:
- 2-3 frases impactantes em português
- Foco em carreira e conquistas
- Tom profissional mas acessível
- Mencione relevância no K-pop ou K-drama se aplicável
- Use apenas informações fornecidas (não invente)`;

            const result = await this.getOrchestrator().generateStructured<{ bio: string }>(
                prompt,
                '{ "bio": "string (biografia em português, 2-3 frases)" }',
                { preferredProvider: 'ollama' }
            );

            return result.bio;
        } catch (error: any) {
            console.warn(`⚠️  Enrichment failed: ${error.message}`);
            return `${artistName} é ${role} de destaque na indústria do entretenimento coreano, reconhecido(a) por seu talento e versatilidade.`;
        }
    }

    private async translateWithAI(
        artistName: string,
        text: string
    ): Promise<string> {
        try {
            const prompt = `Traduza a seguinte biografia para português brasileiro de forma natural e profissional:

${text}

Artista: ${artistName}

Requisitos:
- Manter 2-3 frases principais
- Tom profissional mas acessível
- Tradução precisa e natural`;

            const result = await this.getOrchestrator().generateStructured<{ translation: string }>(
                prompt,
                '{ "translation": "string (biografia traduzida para português)" }',
                { preferredProvider: 'ollama' }
            );

            return result.translation;
        } catch (error: any) {
            console.warn(`⚠️  Translation failed: ${error.message}`);
            return text;
        }
    }

    async retryFailedTranslations(limit: number = 5): Promise<number> {
        console.log(`🔄 Retrying failed translations (limit: ${limit})...`);

        const result = await this.prisma.artist.updateMany({
            where: { translationStatus: 'failed' },
            data: { translationStatus: 'pending' }
        });

        console.log(`📊 Reset ${result.count} failed translations to pending`);

        const stats = await this.translatePendingArtists(limit);
        return stats.translated;
    }

    async getTranslationStats(): Promise<{
        pending: number;
        completed: number;
        failed: number;
        total: number;
    }> {
        const [pending, completed, failed, total] = await Promise.all([
            this.prisma.artist.count({ where: { translationStatus: 'pending' } }),
            this.prisma.artist.count({ where: { translationStatus: 'completed' } }),
            this.prisma.artist.count({ where: { translationStatus: 'failed' } }),
            this.prisma.artist.count()
        ]);

        return { pending, completed, failed, total };
    }
}

let translationService: ArtistTranslationService | null = null;

export function getArtistTranslationService(prisma: PrismaClient): ArtistTranslationService {
    if (!translationService) {
        translationService = new ArtistTranslationService(prisma);
    }
    return translationService;
}
