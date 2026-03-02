import { PrismaClient } from '@prisma/client';
import { getOrchestrator } from '../ai/orchestrator-factory';

/**
 * Group Translation Service
 *
 * Responsável por traduzir biografias de grupos musicais de EN/KR → PT-BR.
 * Preserva o campo `bio` original e salva a tradução em ContentTranslation.
 */
export class GroupTranslationService {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    private getOrchestrator() {
        return getOrchestrator();
    }

    /**
     * Traduz biografias de grupos pendentes, um por vez.
     * onProgress é chamado após cada item para streaming de progresso.
     */
    async translatePendingGroups(
        limit: number = 5,
        onProgress?: (p: { current: number; total: number; name: string; status: 'translated' | 'skipped' | 'failed' }) => void
    ): Promise<{
        translated: number;
        failed: number;
        skipped: number;
    }> {
        console.log(`🌐 Starting group translation batch (limit: ${limit})...`);

        // Buscar grupos com bio mas sem ContentTranslation pt-BR
        const existingTranslations = await this.prisma.contentTranslation.findMany({
            where: { entityType: 'group', field: 'bio', locale: 'pt-BR' },
            select: { entityId: true },
        });
        const translatedIds = new Set(existingTranslations.map(t => t.entityId));

        const groups = await this.prisma.musicalGroup.findMany({
            where: {
                bio: { not: null },
                isHidden: false,
            },
            orderBy: { createdAt: 'asc' },
            select: { id: true, name: true, nameHangul: true, bio: true },
        });

        const pending = groups
            .filter(g => !translatedIds.has(g.id))
            .slice(0, limit);

        console.log(`📊 Found ${pending.length} groups pending translation`);

        let translated = 0;
        let failed = 0;
        let skipped = 0;
        const total = pending.length;

        for (let i = 0; i < pending.length; i++) {
            const group = pending[i];
            try {
                if (this.isAlreadyInPortuguese(group.bio || '')) {
                    console.log(`  ⏭️  ${group.name} - Already in Portuguese`);
                    skipped++;
                    onProgress?.({ current: i + 1, total, name: group.name, status: 'skipped' });
                    continue;
                }

                console.log(`  🔄 Translating: ${group.name}...`);

                const translatedBio = await this.translateBioToPortuguese(
                    group.name,
                    group.bio || ''
                );

                // Salva tradução em ContentTranslation (preserva bio original intacto)
                await this.prisma.contentTranslation.upsert({
                    where: {
                        entityType_entityId_field_locale: {
                            entityType: 'group',
                            entityId: group.id,
                            field: 'bio',
                            locale: 'pt-BR',
                        },
                    },
                    create: {
                        entityType: 'group',
                        entityId: group.id,
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

                console.log(`  ✅ ${group.name} - Translated successfully`);
                translated++;
                onProgress?.({ current: i + 1, total, name: group.name, status: 'translated' });

            } catch (error: any) {
                console.error(`  ❌ ${group.name} - Translation failed: ${error.message}`);
                failed++;
                onProgress?.({ current: i + 1, total, name: group.name, status: 'failed' });
            }
        }

        console.log(`✅ Group translation batch complete: ${translated} translated, ${failed} failed, ${skipped} skipped`);
        return { translated, failed, skipped };
    }

    private isAlreadyInPortuguese(text: string): boolean {
        const ptWords = ['é', 'são', 'grupo', 'formado', 'composto', 'lançou', 'debutou', 'conhecido', 'do', 'da'];
        const lowerText = text.toLowerCase();
        const matchCount = ptWords.filter(word => lowerText.includes(word)).length;
        return matchCount >= 2;
    }

    private async translateBioToPortuguese(
        groupName: string,
        biography: string
    ): Promise<string> {
        if (!biography || biography.trim().length === 0) {
            return `${groupName} é um grupo musical sul-coreano da indústria do K-pop.`;
        }

        if (biography.length < 100) {
            return this.enrichAndTranslate(groupName, biography);
        }

        return this.translateWithAI(groupName, biography);
    }

    private async enrichAndTranslate(
        groupName: string,
        biography: string
    ): Promise<string> {
        try {
            const prompt = `Crie uma biografia profissional em português brasileiro para o grupo de K-pop ${groupName}.

Informações disponíveis:
${biography}

Requisitos:
- 2-3 frases impactantes em português
- Mencione geração, agência, fandom ou conquistas relevantes se disponível
- Tom profissional mas acessível para fãs brasileiros
- Use apenas informações fornecidas (não invente)`;

            const result = await this.getOrchestrator().generateStructured<{ bio: string }>(
                prompt,
                '{ "bio": "string (biografia em português, 2-3 frases)" }',
                { preferredProvider: 'ollama' }
            );

            return result.bio;
        } catch (error: any) {
            console.warn(`⚠️  Enrichment failed: ${error.message}`);
            return `${groupName} é um grupo de K-pop de destaque na indústria do entretenimento sul-coreano.`;
        }
    }

    private async translateWithAI(
        groupName: string,
        text: string
    ): Promise<string> {
        try {
            const prompt = `Traduza a seguinte biografia de grupo musical para português brasileiro de forma natural e profissional:

${text}

Grupo: ${groupName}

Requisitos:
- Manter as informações principais
- Tom profissional mas acessível para fãs brasileiros
- Tradução precisa e natural
- Preservar nomes de álbuns, músicas e programas em inglês/coreano`;

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

    async getTranslationStats(): Promise<{
        pending: number;
        translated: number;
        total: number;
    }> {
        const [total, translated] = await Promise.all([
            this.prisma.musicalGroup.count({ where: { bio: { not: null }, isHidden: false } }),
            this.prisma.contentTranslation.count({ where: { entityType: 'group', field: 'bio', locale: 'pt-BR' } }),
        ]);

        return { pending: total - translated, translated, total };
    }
}

let groupTranslationService: GroupTranslationService | null = null;

export function getGroupTranslationService(prisma: PrismaClient): GroupTranslationService {
    if (!groupTranslationService) {
        groupTranslationService = new GroupTranslationService(prisma);
    }
    return groupTranslationService;
}
