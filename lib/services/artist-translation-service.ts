import { PrismaClient } from '@prisma/client';
import { getOrchestrator } from '../ai/orchestrator-factory';

/**
 * Artist Translation Service
 *
 * Responsável por traduzir biografias de artistas de EN/KR → PT
 * Processo separado do discovery para melhor performance
 */
export class ArtistTranslationService {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    /**
     * Retorna o orchestrator singleton
     */
    private getOrchestrator() {
        return getOrchestrator();
    }

    /**
     * Traduz biografias de artistas pendentes (batch)
     *
     * @param limit Número máximo de artistas a traduzir
     * @returns Número de artistas traduzidos com sucesso
     */
    async translatePendingArtists(limit: number = 5): Promise<{
        translated: number;
        failed: number;
        skipped: number;
    }> {
        console.log(`🌐 Starting batch translation (limit: ${limit})...`);

        // Buscar artistas com status 'pending'
        const pendingArtists = await this.prisma.artist.findMany({
            where: {
                translationStatus: 'pending'
            },
            orderBy: {
                createdAt: 'asc' // Mais antigos primeiro
            },
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
                // Verificar se bio já está em português (skip)
                if (this.isAlreadyInPortuguese(artist.bio || '')) {
                    console.log(`  ⏭️  ${artist.nameRomanized} - Already in Portuguese`);
                    await this.markAsCompleted(artist.id);
                    skipped++;
                    continue;
                }

                console.log(`  🔄 Translating: ${artist.nameRomanized}...`);

                // Traduzir biografia
                const translatedBio = await this.translateBioToPortuguese(
                    artist.nameRomanized,
                    artist.bio || '',
                    artist.roles[0] || 'Artista'
                );

                // Atualizar no banco
                await this.prisma.artist.update({
                    where: { id: artist.id },
                    data: {
                        bio: translatedBio,
                        translationStatus: 'completed',
                        translatedAt: new Date()
                    }
                });

                console.log(`  ✅ ${artist.nameRomanized} - Translated successfully`);
                translated++;

            } catch (error: any) {
                console.error(`  ❌ ${artist.nameRomanized} - Translation failed: ${error.message}`);

                // Marcar como falha
                await this.prisma.artist.update({
                    where: { id: artist.id },
                    data: {
                        translationStatus: 'failed'
                    }
                }).catch(() => {});

                failed++;
            }
        }

        console.log(`✅ Translation batch complete: ${translated} translated, ${failed} failed, ${skipped} skipped`);

        return { translated, failed, skipped };
    }

    /**
     * Verifica se o texto já está em português
     */
    private isAlreadyInPortuguese(text: string): boolean {
        // Palavras comuns em português brasileiro
        const ptWords = ['é', 'conhecido', 'conhecida', 'brasileiro', 'brasileira', 'artista', 'na', 'do', 'da'];
        const lowerText = text.toLowerCase();

        // Se contém pelo menos 2 palavras em português, assume que já está traduzido
        const matchCount = ptWords.filter(word => lowerText.includes(word)).length;
        return matchCount >= 2;
    }

    /**
     * Marca artista como traduzido (sem modificar bio)
     */
    private async markAsCompleted(artistId: string): Promise<void> {
        await this.prisma.artist.update({
            where: { id: artistId },
            data: {
                translationStatus: 'completed',
                translatedAt: new Date()
            }
        });
    }

    /**
     * Traduz biografia para português usando Ollama
     */
    private async translateBioToPortuguese(
        artistName: string,
        biography: string,
        role: string
    ): Promise<string> {
        // Se não tem biografia, criar uma simples
        if (!biography || biography.trim().length === 0) {
            return `${artistName} é ${role} conhecido(a) na indústria do entretenimento coreano.`;
        }

        // Se bio é muito curta, enriquecer com AI
        if (biography.length < 100) {
            return this.enrichAndTranslate(artistName, biography, role);
        }

        // Tradução direta para biografias normais
        return this.translateWithAI(artistName, biography);
    }

    /**
     * Enriquece e traduz bio curta
     */
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
                {
                    preferredProvider: 'ollama', // Gratuito, local
                }
            );

            return result.bio;
        } catch (error: any) {
            console.warn(`⚠️  Enrichment failed: ${error.message}`);
            // Fallback simples
            return `${artistName} é ${role} de destaque na indústria do entretenimento coreano, reconhecido(a) por seu talento e versatilidade.`;
        }
    }

    /**
     * Traduz texto diretamente com AI
     */
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
            // Fallback: retornar texto original
            return text;
        }
    }

    /**
     * Reprocessa artistas com status 'failed'
     */
    async retryFailedTranslations(limit: number = 5): Promise<number> {
        console.log(`🔄 Retrying failed translations (limit: ${limit})...`);

        // Resetar status de 'failed' para 'pending'
        const result = await this.prisma.artist.updateMany({
            where: {
                translationStatus: 'failed'
            },
            data: {
                translationStatus: 'pending'
            }
        });

        console.log(`📊 Reset ${result.count} failed translations to pending`);

        // Processar
        const stats = await this.translatePendingArtists(limit);
        return stats.translated;
    }

    /**
     * Retorna estatísticas de tradução
     */
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

/**
 * Singleton instance
 */
let translationService: ArtistTranslationService | null = null;

export function getArtistTranslationService(prisma: PrismaClient): ArtistTranslationService {
    if (!translationService) {
        translationService = new ArtistTranslationService(prisma);
    }
    return translationService;
}
