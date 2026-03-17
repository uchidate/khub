import { PrismaClient } from '@prisma/client';
import { getOrchestrator } from '../ai/orchestrator-factory';
import { detectLanguage } from './language-detection-service';

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
        onProgress?: (p: { current: number; total: number; name: string; status: 'processing' | 'translated' | 'skipped' | 'failed' }) => void,
        isHidden?: boolean
    ): Promise<{
        translated: number;
        failed: number;
        skipped: number;
        totalCostUsd: number;
    }> {
        console.log(`🌐 Starting group translation batch (limit: ${limit})...`);

        // Usa ContentTranslation como fonte de verdade; filtra no banco com limite
        const existingCTs = await this.prisma.contentTranslation.findMany({
            where: { entityType: 'group', field: 'bio', locale: 'pt-BR' },
            select: { entityId: true },
        });
        const translatedIds = existingCTs.map(t => t.entityId);

        const pending = await this.prisma.musicalGroup.findMany({
            where: {
                bio: { not: null },
                isHidden: isHidden ?? false,
                id: { notIn: translatedIds },
            },
            orderBy: { createdAt: 'asc' },
            take: limit,
            select: { id: true, name: true, nameHangul: true, bio: true },
        });

        console.log(`📊 Found ${pending.length} groups pending translation`);

        let translated = 0;
        let failed = 0;
        let skipped = 0;
        let totalCostUsd = 0;
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

                // TMDB sempre retorna bios em inglês; detectLanguage resolve casos de bio manual/coreana
                const detectedLang = detectLanguage(group.bio || '')
                // Se não reconhecível (texto muito curto), assume inglês
                const sourceLang = detectedLang === 'unknown' ? 'en' : detectedLang;

                // Notifica início do processamento ANTES da chamada de IA
                onProgress?.({ current: i + 1, total, name: group.name, status: 'processing' });
                console.log(`  🔄 Translating [${sourceLang}]: ${group.name}...`);

                const { text: translatedBio, cost } = await this.translateBioToPortuguese(
                    group.name,
                    group.bio || '',
                    sourceLang
                );
                totalCostUsd += cost;

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
                        sourceLang,
                    },
                    update: {
                        value: translatedBio,
                        status: 'draft',
                        sourceLang,
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

        console.log(`✅ Group translation batch complete: ${translated} translated, ${failed} failed, ${skipped} skipped, $${totalCostUsd.toFixed(5)}`);
        return { translated, failed, skipped, totalCostUsd };
    }

    private isAlreadyInPortuguese(text: string): boolean {
        const ptWords = ['é', 'são', 'grupo', 'formado', 'composto', 'lançou', 'debutou', 'conhecido', 'do', 'da'];
        const lowerText = text.toLowerCase();
        const matchCount = ptWords.filter(word => new RegExp(`\\b${word}\\b`).test(lowerText)).length;
        return matchCount >= 2;
    }

    private async translateBioToPortuguese(
        groupName: string,
        biography: string,
        sourceLang: string = 'en'
    ): Promise<{ text: string; cost: number }> {
        if (!biography || biography.trim().length === 0) {
            return { text: `${groupName} é um grupo musical sul-coreano da indústria do K-pop.`, cost: 0 };
        }

        if (biography.length < 100) {
            return this.enrichAndTranslate(groupName, biography);
        }

        return this.translateWithAI(groupName, biography, sourceLang);
    }

    private async enrichAndTranslate(
        groupName: string,
        biography: string
    ): Promise<{ text: string; cost: number }> {
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
                { preferredProvider: 'deepseek', feature: 'group_translation' }
            );

            return { text: result.parsed.bio, cost: result.cost ?? 0 };
        } catch (error: any) {
            console.warn(`⚠️  Enrichment failed: ${error.message}`);
            return { text: `${groupName} é um grupo de K-pop de destaque na indústria do entretenimento sul-coreano.`, cost: 0 };
        }
    }

    private async translateWithAI(
        groupName: string,
        text: string,
        sourceLang: string = 'en'
    ): Promise<{ text: string; cost: number }> {
        try {
            // DeepSeek para todas as traduções — melhor qualidade e suporte a KO/EN
            const langLabel = sourceLang === 'ko' ? 'coreano' : 'inglês';

            const prompt = `Traduza a seguinte biografia de grupo musical de ${langLabel} para português brasileiro de forma natural e profissional:

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
                { preferredProvider: 'deepseek', feature: 'group_translation' }
            );

            return { text: result.parsed.translation, cost: result.cost ?? 0 };
        } catch (error: any) {
            console.warn(`⚠️  Translation failed: ${error.message}`);
            return { text, cost: 0 };
        }
    }

    async translateSingle(id: string): Promise<{ name: string; status: 'translated' | 'skipped' | 'failed'; cost: number }> {
        const group = await this.prisma.musicalGroup.findUnique({
            where: { id },
            select: { id: true, name: true, bio: true },
        })
        if (!group || !group.bio) {
            return { name: group?.name ?? id, status: 'skipped', cost: 0 }
        }
        try {
            if (this.isAlreadyInPortuguese(group.bio)) {
                return { name: group.name, status: 'skipped', cost: 0 }
            }
            const detectedLang = detectLanguage(group.bio)
            const sourceLang = detectedLang === 'unknown' ? 'en' : detectedLang
            const { text: translatedBio, cost } = await this.translateBioToPortuguese(group.name, group.bio, sourceLang)
            await this.prisma.contentTranslation.upsert({
                where: { entityType_entityId_field_locale: { entityType: 'group', entityId: group.id, field: 'bio', locale: 'pt-BR' } },
                create: { entityType: 'group', entityId: group.id, field: 'bio', locale: 'pt-BR', value: translatedBio, status: 'draft', sourceLang },
                update: { value: translatedBio, status: 'draft', sourceLang },
            })
            return { name: group.name, status: 'translated', cost }
        } catch {
            return { name: group.name, status: 'failed', cost: 0 }
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
