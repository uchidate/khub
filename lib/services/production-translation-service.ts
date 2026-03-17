import { PrismaClient } from '@prisma/client'
import { getOrchestrator } from '../ai/orchestrator-factory'
import { detectLanguage, type DetectedLang } from './language-detection-service'

/**
 * Production Translation Service
 *
 * Traduz sinopses de produções (EN/KO → PT-BR) de forma não-destrutiva:
 * preserva o campo `synopsis` original e salva a tradução em ContentTranslation.
 *
 * Roteamento por idioma de origem:
 *   - 'ko' → DeepSeek (melhor suporte ao coreano)
 *   - 'en' | 'unknown' → Ollama (rápido, suficiente para inglês)
 */
export class ProductionTranslationService {
    private prisma: PrismaClient

    constructor(prisma: PrismaClient) {
        this.prisma = prisma
    }

    private getOrchestrator() {
        return getOrchestrator()
    }

    async translatePendingProductions(
        limit = 5,
        onProgress?: (p: { current: number; total: number; name: string; status: 'processing' | 'translated' | 'skipped' | 'failed' }) => void,
        isHidden?: boolean
    ): Promise<{ translated: number; failed: number; skipped: number; totalCostUsd: number }> {
        console.log(`🌐 Starting production translation batch (limit: ${limit})...`)

        // Usa ContentTranslation como fonte de verdade (não o campo legado translationStatus)
        const existingCTs = await this.prisma.contentTranslation.findMany({
            where: { entityType: 'production', field: 'synopsis', locale: 'pt-BR' },
            select: { entityId: true },
        })
        const translatedIds = existingCTs.map(t => t.entityId)

        const pending = await this.prisma.production.findMany({
            where: {
                synopsis: { not: null },
                synopsisSource: { notIn: ['tmdb_pt', 'manual', 'ai'] }, // já em pt-BR, não precisa traduzir
                isHidden: isHidden ?? false,
                id: { notIn: translatedIds },
            },
            orderBy: { createdAt: 'asc' },
            take: limit,
            select: { id: true, titlePt: true, synopsis: true, synopsisSource: true },
        })

        console.log(`📊 Found ${pending.length} productions pending translation`)

        let translated = 0, failed = 0, skipped = 0, totalCostUsd = 0
        const total = pending.length

        for (let i = 0; i < pending.length; i++) {
            const prod = pending[i]
            try {
                const synopsis = prod.synopsis!

                // Usa synopsisSource como hint confiável antes de correr detecção
                const langHint: DetectedLang | null =
                    prod.synopsisSource === 'tmdb_pt' ? 'pt'
                    : prod.synopsisSource === 'tmdb_en' ? 'en'
                    : null
                const lang: DetectedLang = langHint ?? detectLanguage(synopsis)

                // Já em português (TMDB PT ou detectado como PT)
                if (lang === 'pt') {
                    console.log(`  ⏭️  ${prod.titlePt} - Already in Portuguese`)
                    await this.markCompleted(prod.id)
                    skipped++
                    onProgress?.({ current: i + 1, total, name: prod.titlePt, status: 'skipped' })
                    continue
                }

                onProgress?.({ current: i + 1, total, name: prod.titlePt, status: 'processing' })
                console.log(`  🔄 Translating [${lang}]: ${prod.titlePt}...`)

                const { text: translatedSynopsis, cost } = await this.translateSynopsis(prod.titlePt, synopsis, lang)
                totalCostUsd += cost

                await this.prisma.contentTranslation.upsert({
                    where: {
                        entityType_entityId_field_locale: {
                            entityType: 'production',
                            entityId: prod.id,
                            field: 'synopsis',
                            locale: 'pt-BR',
                        },
                    },
                    create: {
                        entityType: 'production',
                        entityId: prod.id,
                        field: 'synopsis',
                        locale: 'pt-BR',
                        value: translatedSynopsis,
                        status: 'draft',
                        sourceLang: lang,
                    },
                    update: {
                        value: translatedSynopsis,
                        status: 'draft',
                        sourceLang: lang,
                    },
                })

                await this.markCompleted(prod.id)
                translated++
                console.log(`  ✅ ${prod.titlePt} - Translated successfully`)
                onProgress?.({ current: i + 1, total, name: prod.titlePt, status: 'translated' })

            } catch (err: any) {
                console.error(`  ❌ ${prod.titlePt} - Translation failed: ${err.message}`)
                await this.prisma.production.update({
                    where: { id: prod.id },
                    data: { translationStatus: 'failed' },
                }).catch(() => {})
                failed++
                onProgress?.({ current: i + 1, total, name: prod.titlePt, status: 'failed' })
            }
        }

        console.log(`✅ Production translation batch complete: ${translated} translated, ${failed} failed, ${skipped} skipped, $${totalCostUsd.toFixed(5)}`)
        return { translated, failed, skipped, totalCostUsd }
    }

    private async markCompleted(productionId: string): Promise<void> {
        await this.prisma.production.update({
            where: { id: productionId },
            data: { translationStatus: 'completed', translatedAt: new Date() },
        })
    }

    private async translateSynopsis(title: string, synopsis: string, lang: DetectedLang): Promise<{ text: string; cost: number }> {
        // Coreano → DeepSeek (melhor suporte); inglês/unknown → Ollama
        const provider = lang === 'ko' ? 'deepseek' : 'ollama'
        const langLabel = lang === 'ko' ? 'coreano' : 'inglês'

        const result = await this.getOrchestrator().generateStructured<{ synopsis: string }>(
            `Traduza a seguinte sinopse de ${langLabel} para português brasileiro de forma natural. Preserve nomes próprios (artistas, personagens, locais). Máximo 3 frases concisas:\n\nProdução: ${title}\n\n${synopsis}`,
            '{ "synopsis": "string (sinopse em português brasileiro, máx. 3 frases)" }',
            { preferredProvider: provider, feature: 'production_translation' }
        )

        return { text: result.parsed.synopsis, cost: result.cost ?? 0 }
    }

    async translateSingle(id: string): Promise<{ name: string; status: 'translated' | 'skipped' | 'failed'; cost: number }> {
        const prod = await this.prisma.production.findUnique({
            where: { id },
            select: { id: true, titlePt: true, synopsis: true, synopsisSource: true },
        })
        if (!prod || !prod.synopsis) {
            return { name: prod?.titlePt ?? id, status: 'skipped', cost: 0 }
        }
        try {
            const langHint: DetectedLang | null =
                prod.synopsisSource === 'tmdb_pt' ? 'pt'
                : prod.synopsisSource === 'tmdb_en' ? 'en'
                : null
            const lang: DetectedLang = langHint ?? detectLanguage(prod.synopsis)
            if (lang === 'pt') {
                await this.markCompleted(prod.id)
                return { name: prod.titlePt, status: 'skipped', cost: 0 }
            }
            const { text: translatedSynopsis, cost } = await this.translateSynopsis(prod.titlePt, prod.synopsis, lang)
            await this.prisma.contentTranslation.upsert({
                where: { entityType_entityId_field_locale: { entityType: 'production', entityId: prod.id, field: 'synopsis', locale: 'pt-BR' } },
                create: { entityType: 'production', entityId: prod.id, field: 'synopsis', locale: 'pt-BR', value: translatedSynopsis, status: 'draft', sourceLang: lang },
                update: { value: translatedSynopsis, status: 'draft', sourceLang: lang },
            })
            await this.markCompleted(prod.id)
            return { name: prod.titlePt, status: 'translated', cost }
        } catch {
            await this.prisma.production.update({ where: { id }, data: { translationStatus: 'failed' } }).catch(() => {})
            return { name: prod.titlePt, status: 'failed', cost: 0 }
        }
    }

    async retryFailedTranslations(limit = 5): Promise<{ translated: number; failed: number; skipped: number }> {
        console.log(`🔄 Retrying failed production translations (limit: ${limit})...`)
        await this.prisma.production.updateMany({
            where: { translationStatus: 'failed' },
            data: { translationStatus: 'pending' },
        })
        return this.translatePendingProductions(limit)
    }

    async getTranslationStats(): Promise<{
        pending: number
        completed: number
        failed: number
        total: number
        noSynopsis: number
    }> {
        const [pending, completed, failed, total, noSynopsis] = await Promise.all([
            this.prisma.production.count({ where: { translationStatus: 'pending', synopsis: { not: null }, isHidden: false } }),
            this.prisma.production.count({ where: { translationStatus: 'completed', isHidden: false } }),
            this.prisma.production.count({ where: { translationStatus: 'failed', isHidden: false } }),
            this.prisma.production.count({ where: { isHidden: false } }),
            this.prisma.production.count({ where: { synopsis: null, isHidden: false } }),
        ])
        return { pending, completed, failed, total, noSynopsis }
    }
}

let productionTranslationService: ProductionTranslationService | null = null

export function getProductionTranslationService(prisma: PrismaClient): ProductionTranslationService {
    if (!productionTranslationService) {
        productionTranslationService = new ProductionTranslationService(prisma)
    }
    return productionTranslationService
}
