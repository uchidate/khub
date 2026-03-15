import { PrismaClient } from '@prisma/client';
import { getOrchestrator } from '../ai/orchestrator-factory';
import { detectLanguage } from './language-detection-service';

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
     * Traduz biografias de artistas pendentes, um por vez.
     * onProgress é chamado após cada item para streaming de progresso.
     */
    async translatePendingArtists(
        limit: number = 5,
        onProgress?: (p: { current: number; total: number; name: string; status: 'processing' | 'translated' | 'skipped' | 'failed' }) => void,
        isHidden?: boolean
    ): Promise<{
        translated: number;
        failed: number;
        skipped: number;
    }> {
        console.log(`🌐 Starting batch translation (limit: ${limit})...`);

        // Usa ContentTranslation como fonte de verdade (não o campo legado translationStatus)
        const existingCTs = await this.prisma.contentTranslation.findMany({
            where: { entityType: 'artist', field: 'bio', locale: 'pt-BR' },
            select: { entityId: true },
        });
        const translatedIds = existingCTs.map(t => t.entityId);

        const pendingArtists = await this.prisma.artist.findMany({
            where: {
                bio: { not: null },
                isHidden: isHidden ?? false,
                id: { notIn: translatedIds },
                // Exclui artistas com bio já em pt-BR do TMDB (não precisam de tradução)
                NOT: { fieldSources: { path: ['bio', 'source'], equals: 'tmdb_pt' } },
            },
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
        const total = pendingArtists.length;

        for (let i = 0; i < pendingArtists.length; i++) {
            const artist = pendingArtists[i];
            try {
                if (this.isAlreadyInPortuguese(artist.bio || '')) {
                    console.log(`  ⏭️  ${artist.nameRomanized} - Already in Portuguese`);
                    await this.markAsCompleted(artist.id);
                    skipped++;
                    onProgress?.({ current: i + 1, total, name: artist.nameRomanized, status: 'skipped' });
                    continue;
                }

                // TMDB sempre retorna bios em inglês; detectLanguage resolve casos de bio manual/coreana
                const detectedLang = detectLanguage(artist.bio || '')
                // Se não reconhecível (texto muito curto, ex: nome apenas), assume inglês
                const sourceLang = detectedLang === 'unknown' ? 'en' : detectedLang;

                // Notifica início do processamento ANTES da chamada de IA
                onProgress?.({ current: i + 1, total, name: artist.nameRomanized, status: 'processing' });
                console.log(`  🔄 Translating [${sourceLang}]: ${artist.nameRomanized}...`);

                const translatedBio = await this.translateBioToPortuguese(
                    artist.nameRomanized,
                    artist.bio || '',
                    artist.roles[0] || 'Artista',
                    sourceLang
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
                        sourceLang,
                    },
                    update: {
                        value: translatedBio,
                        status: 'draft',
                        sourceLang,
                    },
                });

                await this.markAsCompleted(artist.id);

                console.log(`  ✅ ${artist.nameRomanized} - Translated successfully`);
                translated++;
                onProgress?.({ current: i + 1, total, name: artist.nameRomanized, status: 'translated' });

            } catch (error: any) {
                console.error(`  ❌ ${artist.nameRomanized} - Translation failed: ${error.message}`);

                await this.prisma.artist.update({
                    where: { id: artist.id },
                    data: { translationStatus: 'failed' }
                }).catch(() => {});

                failed++;
                onProgress?.({ current: i + 1, total, name: artist.nameRomanized, status: 'failed' });
            }
        }

        console.log(`✅ Translation batch complete: ${translated} translated, ${failed} failed, ${skipped} skipped`);
        return { translated, failed, skipped };
    }

    private isAlreadyInPortuguese(text: string): boolean {
        const ptWords = ['é', 'conhecido', 'conhecida', 'brasileiro', 'brasileira', 'artista', 'na', 'do', 'da'];
        const lowerText = text.toLowerCase();
        const matchCount = ptWords.filter(word => new RegExp(`\\b${word}\\b`).test(lowerText)).length;
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
        role: string,
        sourceLang: string = 'en'
    ): Promise<string> {
        if (!biography || biography.trim().length === 0) {
            return `${artistName} é ${role} conhecido(a) na indústria do entretenimento coreano.`;
        }

        if (biography.length < 100) {
            return this.enrichAndTranslate(artistName, biography, role);
        }

        return this.translateWithAI(artistName, biography, sourceLang);
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
        text: string,
        sourceLang: string = 'en'
    ): Promise<string> {
        try {
            // Coreano → DeepSeek (melhor suporte); inglês/unknown → Ollama
            const provider = sourceLang === 'ko' ? 'deepseek' : 'ollama';
            const langLabel = sourceLang === 'ko' ? 'coreano' : 'inglês';

            const prompt = `Traduza a seguinte biografia de ${langLabel} para português brasileiro de forma natural e profissional:

${text}

Artista: ${artistName}

Requisitos:
- Manter 2-3 frases principais
- Tom profissional mas acessível
- Tradução precisa e natural`;

            const result = await this.getOrchestrator().generateStructured<{ translation: string }>(
                prompt,
                '{ "translation": "string (biografia traduzida para português)" }',
                { preferredProvider: provider }
            );

            return result.translation;
        } catch (error: any) {
            console.warn(`⚠️  Translation failed: ${error.message}`);
            return text;
        }
    }

    async translateSingle(id: string): Promise<{ name: string; status: 'translated' | 'skipped' | 'failed' }> {
        const artist = await this.prisma.artist.findUnique({
            where: { id },
            select: { id: true, nameRomanized: true, bio: true, roles: true },
        })
        if (!artist || !artist.bio) {
            return { name: artist?.nameRomanized ?? id, status: 'skipped' }
        }
        try {
            if (this.isAlreadyInPortuguese(artist.bio)) {
                await this.markAsCompleted(artist.id)
                return { name: artist.nameRomanized, status: 'skipped' }
            }
            const detectedLang = detectLanguage(artist.bio)
            const sourceLang = detectedLang === 'unknown' ? 'en' : detectedLang
            const translatedBio = await this.translateBioToPortuguese(
                artist.nameRomanized, artist.bio, artist.roles[0] || 'Artista', sourceLang
            )
            await this.prisma.contentTranslation.upsert({
                where: { entityType_entityId_field_locale: { entityType: 'artist', entityId: artist.id, field: 'bio', locale: 'pt-BR' } },
                create: { entityType: 'artist', entityId: artist.id, field: 'bio', locale: 'pt-BR', value: translatedBio, status: 'draft', sourceLang },
                update: { value: translatedBio, status: 'draft', sourceLang },
            })
            await this.markAsCompleted(artist.id)
            return { name: artist.nameRomanized, status: 'translated' }
        } catch {
            await this.prisma.artist.update({ where: { id }, data: { translationStatus: 'failed' } }).catch(() => {})
            return { name: artist.nameRomanized, status: 'failed' }
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
